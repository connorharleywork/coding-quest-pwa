import { badges, dailyChecklist, dailyGoal } from '../data/sampleData.js';

const XP_PER_LEVEL = 100;
const OPEN_APP_ITEM_ID = 'open-app';

export const initialProgress = {
  totalXp: 0,
  level: 1,
  currentStreak: 0,
  lastActiveDate: null,
  lastGoalDate: null,
  completedChecklistByDate: {},
  completedLessons: [],
  earnedBadges: [],
};

export function getLocalDateKey(date = new Date()) {
  // Use the learner's device date instead of UTC so daily quests reset at
  // local midnight, which feels natural on iPhone and Mac.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLevelFromXp(totalXp) {
  return Math.max(1, Math.floor(totalXp / XP_PER_LEVEL) + 1);
}

export function getXpToNextLevel(totalXp) {
  const remainder = totalXp % XP_PER_LEVEL;
  return remainder === 0 ? XP_PER_LEVEL : XP_PER_LEVEL - remainder;
}

export function getTodayChecklist(progress, todayKey) {
  return progress.completedChecklistByDate[todayKey] || [];
}

export function isDailyGoalComplete(progress, todayKey) {
  return getTodayChecklist(progress, todayKey).length >= dailyGoal.targetCompletedItems;
}

function getDaysBetween(startDateKey, endDateKey) {
  if (!startDateKey || !endDateKey) return 0;

  const start = new Date(`${startDateKey}T00:00:00`);
  const end = new Date(`${endDateKey}T00:00:00`);
  return Math.round((end - start) / 86_400_000);
}

function getChecklistXp(itemId) {
  return dailyChecklist.find((item) => item.id === itemId)?.xp || 0;
}

function toSafeNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function addBadge(progress, badgeId) {
  if (progress.earnedBadges.includes(badgeId)) return progress;

  return {
    ...progress,
    earnedBadges: [...progress.earnedBadges, badgeId],
  };
}

function applyEarnedBadges(progress) {
  let nextProgress = progress;

  if (nextProgress.lastActiveDate) nextProgress = addBadge(nextProgress, 'first-open');
  if (nextProgress.completedLessons.length > 0) nextProgress = addBadge(nextProgress, 'first-lesson');
  if (nextProgress.totalXp >= 100) nextProgress = addBadge(nextProgress, 'xp-100');
  if (nextProgress.currentStreak >= 3) nextProgress = addBadge(nextProgress, 'streak-3');

  return nextProgress;
}

function finishProgressUpdate(progress) {
  const safeTotalXp = Number.isFinite(progress.totalXp) ? progress.totalXp : 0;
  const withLevel = {
    ...progress,
    totalXp: Math.max(0, safeTotalXp),
    level: getLevelFromXp(safeTotalXp),
    completedLessons: [...new Set(progress.completedLessons)],
    earnedBadges: [...new Set(progress.earnedBadges)],
  };

  return applyEarnedBadges(withLevel);
}

export function normalizeProgress(savedProgress, todayKey = getLocalDateKey()) {
  // This migration keeps Milestone 1 users safe by reading the old field names
  // (`xp`, `streak`, and `checklist`) and copying them into the Milestone 2 shape.
  const migratedChecklist = Object.fromEntries(
    Object.entries(savedProgress?.completedChecklistByDate || {}).map(([dateKey, itemIds]) => [
      dateKey,
      Array.isArray(itemIds) ? [...itemIds] : [],
    ])
  );
  const oldChecklistIds = savedProgress?.checklist
    ? Object.keys(savedProgress.checklist).filter((itemId) => savedProgress.checklist[itemId])
    : [];

  if (oldChecklistIds.length > 0 && !migratedChecklist[todayKey]) {
    migratedChecklist[todayKey] = oldChecklistIds;
  }

  return finishProgressUpdate({
    ...initialProgress,
    ...savedProgress,
    totalXp: toSafeNumber(savedProgress?.totalXp ?? savedProgress?.xp, initialProgress.totalXp),
    currentStreak: toSafeNumber(savedProgress?.currentStreak ?? savedProgress?.streak, initialProgress.currentStreak),
    completedChecklistByDate: migratedChecklist,
    completedLessons: Array.isArray(savedProgress?.completedLessons) ? savedProgress.completedLessons : [],
    earnedBadges: Array.isArray(savedProgress?.earnedBadges) ? savedProgress.earnedBadges : [],
  });
}

export function startDailySession(savedProgress, todayKey = getLocalDateKey()) {
  const progress = normalizeProgress(savedProgress, todayKey);
  const completedToday = new Set(getTodayChecklist(progress, todayKey));
  const daysSinceGoal = getDaysBetween(progress.lastGoalDate, todayKey);
  let nextProgress = {
    ...progress,
    // If the learner did not complete yesterday's goal, the streak is reset.
    currentStreak: daysSinceGoal > 1 ? 0 : progress.currentStreak,
    lastActiveDate: todayKey,
    completedChecklistByDate: {
      ...progress.completedChecklistByDate,
      [todayKey]: [...completedToday],
    },
  };
  let xpEarned = 0;

  // Opening CodeQuest is a daily checklist item. Because we store completed
  // item ids per date, this XP is awarded once per day and never on refresh.
  if (!completedToday.has(OPEN_APP_ITEM_ID)) {
    completedToday.add(OPEN_APP_ITEM_ID);
    xpEarned = getChecklistXp(OPEN_APP_ITEM_ID);
    nextProgress = {
      ...nextProgress,
      totalXp: nextProgress.totalXp + xpEarned,
      completedChecklistByDate: {
        ...nextProgress.completedChecklistByDate,
        [todayKey]: [...completedToday],
      },
    };
  }

  return {
    progress: finishProgressUpdate(nextProgress),
    xpEarned,
    message: xpEarned > 0 ? `Welcome back! +${xpEarned} XP for opening CodeQuest.` : '',
  };
}

function applyDailyGoal(progress, todayKey) {
  if (!isDailyGoalComplete(progress, todayKey) || progress.lastGoalDate === todayKey) {
    return { progress, goalCompletedNow: false };
  }

  const goalWasYesterday = getDaysBetween(progress.lastGoalDate, todayKey) === 1;

  return {
    progress: finishProgressUpdate({
      ...progress,
      currentStreak: goalWasYesterday ? progress.currentStreak + 1 : 1,
      lastGoalDate: todayKey,
    }),
    goalCompletedNow: true,
  };
}

export function completeChecklistItem(savedProgress, itemId, todayKey = getLocalDateKey()) {
  const progress = normalizeProgress(savedProgress, todayKey);
  const completedToday = new Set(getTodayChecklist(progress, todayKey));

  if (completedToday.has(itemId)) {
    return { progress, xpEarned: 0, message: 'Already completed today — XP is safe from duplicates.' };
  }

  completedToday.add(itemId);
  const xpEarned = getChecklistXp(itemId);
  const updatedProgress = finishProgressUpdate({
    ...progress,
    totalXp: progress.totalXp + xpEarned,
    lastActiveDate: todayKey,
    completedChecklistByDate: {
      ...progress.completedChecklistByDate,
      [todayKey]: [...completedToday],
    },
  });
  const goalResult = applyDailyGoal(updatedProgress, todayKey);

  return {
    progress: goalResult.progress,
    xpEarned,
    message: goalResult.goalCompletedNow
      ? `Daily goal complete! +${xpEarned} XP and your streak is now ${goalResult.progress.currentStreak}.`
      : `Nice quest! +${xpEarned} XP earned.`,
  };
}

export function completeLesson(savedProgress, lesson, todayKey = getLocalDateKey()) {
  const progress = normalizeProgress(savedProgress, todayKey);

  if (progress.completedLessons.includes(lesson.id)) {
    return { progress, xpEarned: 0, message: 'Lesson already completed — XP was already awarded.' };
  }

  const lessonProgress = finishProgressUpdate({
    ...progress,
    totalXp: progress.totalXp + lesson.xpReward,
    lastActiveDate: todayKey,
    completedLessons: [...progress.completedLessons, lesson.id],
  });
  const checklistResult = completeChecklistItem(lessonProgress, 'read-lesson', todayKey);
  const totalXpEarned = lesson.xpReward + checklistResult.xpEarned;

  return {
    progress: checklistResult.progress,
    xpEarned: totalXpEarned,
    message: `Lesson complete! +${totalXpEarned} XP earned.`,
  };
}

export function getEarnedBadgeDetails(progress) {
  return progress.earnedBadges
    .map((badgeId) => badges.find((badge) => badge.id === badgeId))
    .filter(Boolean);
}
