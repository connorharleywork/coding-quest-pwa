const STORAGE_KEY = 'codequest-progress';
export const DAILY_GOAL_COUNT = 2;

const starterProgress = {
  totalXp: 120,
  streak: 0,
  completedLessons: ['lesson-web-basics'],
  projects: {},
  practiceCompletions: 0,
  aiHelperUses: 0,
  lastAiHelperRewardDate: null,
  lastGoalDate: null,
  todayDate: null,
  todayChecklist: {},
  todayAwardedChecklist: {},
};

export function getDeviceLocalDate(date = new Date()) {
  // This uses the learner's device timezone instead of UTC so the checklist resets at their local midnight.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPreviousLocalDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  localDate.setDate(localDate.getDate() - 1);
  return getDeviceLocalDate(localDate);
}

function readSavedProgress() {
  try {
    const savedProgress = window.localStorage.getItem(STORAGE_KEY);
    return savedProgress ? JSON.parse(savedProgress) : null;
  } catch (error) {
    console.warn('CodeQuest could not read progress from localStorage.', error);
    return null;
  }
}

export function saveProgress(progress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.warn('CodeQuest could not save progress to localStorage.', error);
  }
}

function migrateProgress(savedProgress) {
  if (!savedProgress || typeof savedProgress !== 'object') {
    return starterProgress;
  }

  return {
    ...starterProgress,
    ...savedProgress,
    // Milestone 1 stored XP as `xp`; Milestone 2 stores the same total as `totalXp`.
    totalXp: Number.isFinite(savedProgress.totalXp) ? savedProgress.totalXp : savedProgress.xp ?? starterProgress.totalXp,
    completedLessons: Array.isArray(savedProgress.completedLessons)
      ? savedProgress.completedLessons
      : starterProgress.completedLessons,
    todayChecklist: savedProgress.todayChecklist ?? savedProgress.checklist ?? starterProgress.todayChecklist,
    projects: savedProgress.projects && typeof savedProgress.projects === 'object' ? savedProgress.projects : starterProgress.projects,
    todayAwardedChecklist: savedProgress.todayAwardedChecklist ?? {},
    practiceCompletions: Number.isFinite(savedProgress.practiceCompletions)
      ? savedProgress.practiceCompletions
      : starterProgress.practiceCompletions,
    aiHelperUses: Number.isFinite(savedProgress.aiHelperUses)
      ? savedProgress.aiHelperUses
      : starterProgress.aiHelperUses,
    lastAiHelperRewardDate: savedProgress.lastAiHelperRewardDate ?? starterProgress.lastAiHelperRewardDate,
  };
}

export function normalizeProgressForToday(progress, today = getDeviceLocalDate()) {
  const previousDay = getPreviousLocalDate(today);
  const hadDailyGoalYesterday = progress.lastGoalDate === previousDay;
  const hadDailyGoalToday = progress.lastGoalDate === today;
  const missedADay = (progress.streak > 0 && !progress.lastGoalDate) || (progress.lastGoalDate && !hadDailyGoalYesterday && !hadDailyGoalToday);
  const isNewDay = progress.todayDate !== today;

  return {
    ...progress,
    // A new local day starts with a fresh checklist and fresh one-time checklist XP awards.
    todayDate: today,
    todayChecklist: isNewDay ? {} : progress.todayChecklist ?? {},
    todayAwardedChecklist: isNewDay ? {} : progress.todayAwardedChecklist ?? {},
    streak: missedADay ? 0 : progress.streak ?? 0,
  };
}

export function prepareImportedProgress(progressObject) {
  return normalizeProgressForToday(migrateProgress(progressObject));
}

export function loadProgress() {
  return normalizeProgressForToday(migrateProgress(readSavedProgress()));
}

export function getCompletedChecklistCount(progress, checklistItems) {
  return checklistItems.filter((item) => progress.todayChecklist?.[item.id]).length;
}

export function getLevelFromXp(xp) {
  // Every 100 XP moves the learner up one level in this friendly first version.
  return Math.max(1, Math.floor(xp / 100) + 1);
}

export function completeChecklistItem(progress, item, checklistItems, today = getDeviceLocalDate()) {
  const safeProgress = normalizeProgressForToday(progress, today);
  const itemWasComplete = Boolean(safeProgress.todayChecklist?.[item.id]);
  const xpWasAwarded = Boolean(safeProgress.todayAwardedChecklist?.[item.id]);
  const nextChecklist = {
    ...safeProgress.todayChecklist,
    [item.id]: true,
  };
  const nextAwardedChecklist = {
    ...safeProgress.todayAwardedChecklist,
    [item.id]: true,
  };
  const xpEarned = xpWasAwarded ? 0 : item.xp;
  const nextProgressBeforeGoal = {
    ...safeProgress,
    totalXp: safeProgress.totalXp + xpEarned,
    todayChecklist: nextChecklist,
    todayAwardedChecklist: nextAwardedChecklist,
  };
  const completedCount = getCompletedChecklistCount(nextProgressBeforeGoal, checklistItems);
  const goalCompletedNow = completedCount >= DAILY_GOAL_COUNT && safeProgress.lastGoalDate !== today;

  return {
    progress: goalCompletedNow
      ? {
          ...nextProgressBeforeGoal,
          lastGoalDate: today,
          streak: safeProgress.lastGoalDate === getPreviousLocalDate(today) ? safeProgress.streak + 1 : 1,
        }
      : nextProgressBeforeGoal,
    xpEarned,
    itemWasAlreadyComplete: itemWasComplete,
    goalCompletedNow,
  };
}

export function setChecklistItemCompletion(progress, itemId, checked) {
  return {
    ...progress,
    todayChecklist: {
      ...progress.todayChecklist,
      [itemId]: checked,
    },
  };
}
