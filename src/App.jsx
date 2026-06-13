import React, { useEffect, useMemo, useState } from 'react';
import { BottomNav } from './components/BottomNav.jsx';
import { StatCard } from './components/StatCard.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { beginnerLessons } from './data/lessons.js';
import { beginnerProjects } from './data/projects.js';
import { beginnerChallenges, getChallengeStarterCode } from './data/challenges.js';
import { DAILY_REVIEW_GOAL, DAILY_REVIEW_XP_REWARD, reviewCards } from './data/reviewCards.js';
import {
  AI_HELPER_XP_REWARD,
  aiPromptCategories,
  buildAiPrompt,
  emptyAiHelperDraft,
  readyMadePromptTemplates,
} from './data/aiPrompts.js';
import { dailyChecklist } from './data/sampleData.js';
import {
  DAILY_GOAL_COUNT,
  completeChecklistItem,
  getCompletedChecklistCount,
  getDeviceLocalDate,
  getLevelFromXp,
  getReviewProgress,
  loadProgress,
  prepareImportedProgress,
  recordReviewAnswer,
  saveProgress,
  setChecklistItemCompletion,
} from './utils/progress.js';
import { checkChallengeCode } from './utils/challengeChecker.js';
import { AI_EVALUATION_TYPES, createMockEvaluation } from './utils/aiEvaluation.js';

const openAppChecklistItem = dailyChecklist.find((item) => item.id === 'open-app');
const readLessonChecklistItem = dailyChecklist.find((item) => item.id === 'read-lesson');
const practiceChecklistItem = dailyChecklist.find((item) => item.id === 'solve-challenge');
const PLAYGROUND_STORAGE_KEY = 'codequest-playground-code';
const AI_HELPER_STORAGE_KEY = 'codequest-ai-helper-draft';
const BACKUP_SCHEMA_VERSION = 1;
const starterPlaygroundCode = {
  html: `<section class="mini-page">
  <h1>Hello, CodeQuest!</h1>
  <p>HTML adds the words and parts you see on a web page.</p>
  <button id="quest-button">Click me</button>
  <p id="message" aria-live="polite"></p>
</section>`,
  css: `.mini-page {
  font-family: Consolas, "Courier New", monospace;
  text-align: center;
  padding: 24px;
  color: #7CFF6B;
  background: #050807;
  border: 1px solid rgba(124, 255, 107, 0.35);
  border-radius: 18px;
}

button {
  border: 0;
  border-radius: 14px;
  padding: 12px 18px;
  color: #041007;
  background: #7CFF6B;
  font-weight: bold;
}

#message {
  color: #D9B76E;
  font-weight: bold;
}`,
  js: `const button = document.querySelector('#quest-button');
const message = document.querySelector('#message');

button.addEventListener('click', () => {
  message.textContent = 'Great job! JavaScript made this message appear.';
});`,
};

function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [activeNavItem, setActiveNavItem] = useState('home');
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);
  const [challengeFeedback, setChallengeFeedback] = useState(null);
  const [xpFeedback, setXpFeedback] = useState('');
  const [playgroundCode, setPlaygroundCode] = useLocalStorage(PLAYGROUND_STORAGE_KEY, starterPlaygroundCode);
  const [aiHelperDraft, setAiHelperDraft] = useLocalStorage(AI_HELPER_STORAGE_KEY, emptyAiHelperDraft);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [backupFeedback, setBackupFeedback] = useState('');
  const [aiBuddyOpen, setAiBuddyOpen] = useState(false);
  const [aiBuddyPrompt, setAiBuddyPrompt] = useState('');
  const [aiBuddyCopyFeedback, setAiBuddyCopyFeedback] = useState('');

  const level = getLevelFromXp(progress.totalXp);
  const completedChecklistCount = getCompletedChecklistCount(progress, dailyChecklist);
  const checklistIsComplete = completedChecklistCount === dailyChecklist.length;
  const dailyGoalIsComplete = completedChecklistCount >= DAILY_GOAL_COUNT;
  const completedBeginnerLessonsCount = beginnerLessons.filter((lesson) => progress.completedLessons.includes(lesson.id)).length;
  const nextLesson = getFirstUnlockedIncompleteLesson(progress.completedLessons);
  const selectedLesson = selectedLessonId ? beginnerLessons.find((lesson) => lesson.id === selectedLessonId) : null;
  const selectedProject = selectedProjectId ? beginnerProjects.find((project) => project.id === selectedProjectId) : null;
  const completedProjectsCount = beginnerProjects.filter((project) => progress.projects?.[project.id]?.status === 'completed').length;
  const nextProject = getFirstUnlockedIncompleteProject(progress.projects);
  const completedChallengesCount = beginnerChallenges.filter((challenge) => getChallengeStatus(challenge.id, progress.challenges) === 'completed').length;
  const nextChallenge = getFirstUnlockedIncompleteChallenge(progress.challenges);
  const selectedChallenge = selectedChallengeId ? beginnerChallenges.find((challenge) => challenge.id === selectedChallengeId) : null;
  const reviewProgress = getReviewProgress(progress);
  const weakSkills = getWeakSkills(reviewProgress, progress.weakChallengeSkills);
  const dailyReviewCompletedCount = Math.min(reviewProgress.todayCompletedCount, DAILY_REVIEW_GOAL);
  const dailyReviewIsComplete = dailyReviewCompletedCount >= DAILY_REVIEW_GOAL;
  const todaysReviewCards = getPrioritizedReviewCards(reviewProgress);
  const badges = useMemo(() => getEarnedBadges(progress, dailyGoalIsComplete, completedBeginnerLessonsCount, completedProjectsCount), [dailyGoalIsComplete, progress, completedBeginnerLessonsCount, completedProjectsCount]);

  const aiBuddyContext = useMemo(() => getAiBuddyContext({
    activeNavItem,
    selectedLesson,
    selectedChallenge,
    selectedProject,
    playgroundCode,
    challengeFeedback,
    progress,
    weakSkills,
  }), [activeNavItem, selectedLesson, selectedChallenge, selectedProject, playgroundCode, challengeFeedback, progress, weakSkills]);


  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    if (!openAppChecklistItem) return;

    // Opening CodeQuest is a daily checklist item. The helper checks localStorage-backed state
    // first, so refreshes and React re-renders cannot award this XP more than once per local day.
    setProgress((currentProgress) => {
      const result = completeChecklistItem(currentProgress, openAppChecklistItem, dailyChecklist);
      if (result.xpEarned > 0) {
        setXpFeedback(`Welcome back! +${result.xpEarned} XP for opening CodeQuest.`);
      }
      return result.progress;
    });
  }, []);

  function completeItem(item, message) {
    setProgress((currentProgress) => {
      const result = completeChecklistItem(currentProgress, item, dailyChecklist);
      const goalMessage = result.goalCompletedNow ? ' Daily goal complete — streak updated!' : '';

      if (result.xpEarned > 0) {
        setXpFeedback(`${message} +${result.xpEarned} XP.${goalMessage}`);
      } else if (result.itemWasAlreadyComplete) {
        setXpFeedback(`${item.label} is already done for today. Nice consistency!`);
      } else {
        setXpFeedback(`${item.label} is complete for today.${goalMessage}`);
      }

      return result.progress;
    });
  }

  function toggleChecklistItem(item) {
    if (!progress.todayChecklist[item.id]) {
      completeItem(item, `${item.label} complete!`);
      return;
    }

    // Unchecking only changes today's checklist state. XP stays safe because each item has a
    // separate “already awarded today” flag, so re-checking it cannot duplicate XP.
    setProgress((currentProgress) => setChecklistItemCompletion(currentProgress, item.id, false));
    setXpFeedback(`${item.label} unchecked. XP already earned today stays saved.`);
  }

  function openLesson(lesson) {
    if (!isLessonUnlocked(lesson.id, progress.completedLessons)) {
      setXpFeedback('That lesson is locked for now. Finish the lesson before it to unlock it!');
      return;
    }

    setSelectedLessonId(lesson.id);
    setActiveNavItem('learn');
  }

  function openTodaysLesson() {
    if (nextLesson) openLesson(nextLesson);
  }

  function completeLesson(lesson) {
    if (progress.completedLessons.includes(lesson.id)) {
      setXpFeedback(`${lesson.title} is already complete. Your XP is safely saved!`);
      return;
    }

    setProgress((currentProgress) => {
      if (currentProgress.completedLessons.includes(lesson.id)) {
        return currentProgress;
      }

      const lessonProgress = {
        ...currentProgress,
        totalXp: currentProgress.totalXp + lesson.xpReward,
        completedLessons: [...currentProgress.completedLessons, lesson.id],
      };
      const result = readLessonChecklistItem
        ? completeChecklistItem(lessonProgress, readLessonChecklistItem, dailyChecklist)
        : { progress: lessonProgress, xpEarned: 0, goalCompletedNow: false };
      const checklistXp = result.xpEarned > 0 ? ` +${result.xpEarned} checklist XP.` : '';
      const goalMessage = result.goalCompletedNow ? ' Daily goal complete — streak updated!' : '';

      setXpFeedback(`Great questing! ${lesson.title} complete. +${lesson.xpReward} XP.${checklistXp}${goalMessage}`);
      return result.progress;
    });
  }

  function completePracticeChallenge() {
    if (!practiceChecklistItem) return;

    setProgress((currentProgress) => {
      const result = completeChecklistItem(currentProgress, practiceChecklistItem, dailyChecklist);
      const goalMessage = result.goalCompletedNow ? ' Daily goal complete — streak updated!' : '';

      if (result.xpEarned > 0) {
        setXpFeedback(`Practice complete! You earned +${result.xpEarned} XP for coding today.${goalMessage}`);
        return {
          ...result.progress,
          practiceCompletions: (result.progress.practiceCompletions ?? 0) + 1,
        };
      }

      setXpFeedback('Practice is already complete for today. Your XP is safely saved!');
      return result.progress;
    });
  }

  function updatePlaygroundCode(language, value) {
    // Each textarea updates one part of the playground, then the preview rebuilds from all three parts.
    setPlaygroundCode((currentCode) => ({
      ...starterPlaygroundCode,
      ...currentCode,
      [language]: value,
    }));
  }

  function resetPlaygroundCode() {
    // Reset keeps the saved local-first draft, but changes it back to the beginner starter project.
    setPlaygroundCode(starterPlaygroundCode);
    setXpFeedback('Playground reset to the starter challenge. Try changing the heading or button colour!');
  }

  function clearSavedPlaygroundCode() {
    // Clear Saved Code removes the localStorage draft, then shows the same starter code again.
    try {
      window.localStorage.removeItem(PLAYGROUND_STORAGE_KEY);
    } catch (error) {
      console.warn('CodeQuest could not clear playground code from localStorage.', error);
    }

    setPlaygroundCode(starterPlaygroundCode);
    setXpFeedback('Saved playground code cleared. The starter challenge is ready again.');
  }

  function exportProgressBackup() {
    const backup = {
      app: 'CodeQuest',
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      progress,
      playgroundCode,
      aiHelperDraft,
    };
    const backupBlob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const backupUrl = URL.createObjectURL(backupBlob);
    const downloadLink = document.createElement('a');

    downloadLink.href = backupUrl;
    downloadLink.download = `codequest-progress-${getDeviceLocalDate()}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(backupUrl);

    setBackupFeedback('Progress backup downloaded. Keep the JSON file somewhere safe.');
  }

  async function importProgressBackup(file) {
    if (!file) return;

    try {
      const backupText = await file.text();
      const backup = JSON.parse(backupText);

      if (!backup || backup.app !== 'CodeQuest' || !backup.progress || typeof backup.progress !== 'object') {
        throw new Error('Invalid CodeQuest backup file.');
      }

      setProgress(prepareImportedProgress(backup.progress));

      if (backup.playgroundCode && typeof backup.playgroundCode === 'object') {
        setPlaygroundCode({ ...starterPlaygroundCode, ...backup.playgroundCode });
      }

      if (backup.aiHelperDraft && typeof backup.aiHelperDraft === 'object') {
        setAiHelperDraft({ ...emptyAiHelperDraft, ...backup.aiHelperDraft });
      }

      setBackupFeedback('Progress restored! Your XP, streak, lessons, projects, prompts, and playground draft were imported.');
    } catch (error) {
      console.warn('CodeQuest could not import the progress backup.', error);
      setBackupFeedback('Import failed. Please choose a CodeQuest JSON backup file.');
    }
  }

  function updateAiHelperDraft(updates) {
    // The helper draft stays on this device so learners can safely return to a prompt later.
    setAiHelperDraft((currentDraft) => ({
      ...emptyAiHelperDraft,
      ...currentDraft,
      ...updates,
    }));
  }

  function awardAiHelperXp() {
    const today = getDeviceLocalDate();

    setProgress((currentProgress) => {
      if (currentProgress.lastAiHelperRewardDate === today) {
        setXpFeedback('AI Helper XP is already collected today. Copy as many prompts as you want!');
        return currentProgress;
      }

      setXpFeedback(`AI Helper used! +${AI_HELPER_XP_REWARD} XP for asking a clearer coding question.`);
      return {
        ...currentProgress,
        totalXp: currentProgress.totalXp + AI_HELPER_XP_REWARD,
        aiHelperUses: (currentProgress.aiHelperUses ?? 0) + 1,
        lastAiHelperRewardDate: today,
      };
    });
  }

  function openAiHelperWithDraft(updates) {
    const nextDraft = {
      ...emptyAiHelperDraft,
      ...aiHelperDraft,
      ...updates,
    };

    updateAiHelperDraft({
      ...updates,
      generatedPrompt: buildAiPrompt(nextDraft),
    });
    setCopyFeedback('Prompt draft filled in. Review it, then copy when you are ready.');
    setActiveNavItem('ai-helper');
    setSelectedLessonId(null);
    setSelectedProjectId(null);
    setSelectedChallengeId(null);
  }

  function openAiHelperFromPlayground() {
    const safeCode = {
      ...starterPlaygroundCode,
      ...playgroundCode,
    };

    openAiHelperWithDraft({
      categoryId: 'review-playground',
      fileName: 'CodeQuest Code Playground',
      buildGoal: 'I am practising a tiny HTML, CSS, and JavaScript project in CodeQuest.',
      confusion: 'Please explain what is working, what might break, and one small improvement I can try next.',
      code: `HTML:
${safeCode.html}

CSS:
${safeCode.css}

JavaScript:
${safeCode.js}`,
      errorMessage: '',
    });
  }

  function answerReviewCard(reviewCard, result) {
    setProgress((currentProgress) => {
      const reviewResult = recordReviewAnswer(currentProgress, reviewCard, result, {
        dailyGoal: DAILY_REVIEW_GOAL,
        xpReward: DAILY_REVIEW_XP_REWARD,
      });
      const resultMessage = result === 'practice'
        ? `${reviewCard.skill} saved as a weak skill. It will show up more often.`
        : `${reviewCard.skill} marked as known. Great reviewing!`;
      const xpMessage = reviewResult.xpEarned > 0 ? ` Daily review goal complete! +${reviewResult.xpEarned} XP.` : '';

      setXpFeedback(`${resultMessage}${xpMessage}`);
      return reviewResult.progress;
    });
  }

  function openAiHelperForWeakSkill(skill, mode = 'explain') {
    openAiHelperWithDraft({
      categoryId: mode === 'challenge' ? 'practice-challenge' : 'lesson-help',
      fileName: skill,
      buildGoal: mode === 'challenge'
        ? `I want a small beginner practice challenge for this weak skill: ${skill}.`
        : `I want to understand this weak skill: ${skill}.`,
      confusion: mode === 'challenge'
        ? 'Please create one tiny challenge I can try in the CodeQuest Playground. Do not solve it immediately unless I ask.'
        : 'Please explain this weak skill to me like I am a beginner. Use a simple example and one quick check question.',
      code: '',
      errorMessage: '',
    });
  }

  function openAiHelperFromLesson(lesson) {
    openAiHelperWithDraft({
      categoryId: 'lesson-help',
      fileName: lesson.title,
      buildGoal: `I am learning this CodeQuest lesson: ${lesson.title}.`,
      confusion: `Topic tags: ${lesson.tags.join(', ')}. Mini task: ${lesson.miniTask}`,
      code: lesson.codeExample ?? '',
      errorMessage: '',
    });
  }

  function openProject(project) {
    const status = getProjectStatus(project.id, progress.projects);

    if (status === 'locked') {
      setXpFeedback('That project is locked for now. Complete the project before it to unlock this build!');
      return;
    }

    setSelectedProjectId(project.id);
    setActiveNavItem('projects');
  }

  function toggleProjectChecklistItem(project, checklistIndex) {
    setProgress((currentProgress) => {
      const currentProjectProgress = currentProgress.projects?.[project.id] ?? {};
      const checkedSteps = currentProjectProgress.checkedSteps ?? {};
      const isCompleted = currentProjectProgress.status === 'completed';
      const nextCheckedSteps = {
        ...checkedSteps,
        [checklistIndex]: !checkedSteps[checklistIndex],
      };

      return {
        ...currentProgress,
        projects: {
          ...currentProgress.projects,
          [project.id]: {
            ...currentProjectProgress,
            status: isCompleted ? 'completed' : 'in-progress',
            checkedSteps: nextCheckedSteps,
          },
        },
      };
    });
  }

  function completeProject(project) {
    const currentProjectProgress = progress.projects?.[project.id] ?? {};
    const allChecklistItemsDone = project.completionChecklist.every((_, index) => currentProjectProgress.checkedSteps?.[index]);

    if (!allChecklistItemsDone) {
      setXpFeedback('Almost there! Tick every project checklist item before completing this project.');
      return;
    }

    if (currentProjectProgress.status === 'completed') {
      setXpFeedback(`${project.title} is already complete. Your project XP is safely saved!`);
      return;
    }

    setProgress((currentProgress) => {
      const latestProjectProgress = currentProgress.projects?.[project.id] ?? {};
      if (latestProjectProgress.status === 'completed') {
        return currentProgress;
      }

      const nextProject = getNextProject(project.id);
      const nextProjects = {
        ...currentProgress.projects,
        [project.id]: {
          ...latestProjectProgress,
          status: 'completed',
          checkedSteps: project.completionChecklist.reduce((steps, _, index) => ({ ...steps, [index]: true }), latestProjectProgress.checkedSteps ?? {}),
          completedAt: new Date().toISOString(),
          xpAwarded: true,
        },
      };

      if (nextProject && !nextProjects[nextProject.id]) {
        nextProjects[nextProject.id] = {
          status: 'unlocked',
          checkedSteps: {},
        };
      }

      return {
        ...currentProgress,
        totalXp: currentProgress.totalXp + project.xpReward,
        projects: nextProjects,
      };
    });

    setXpFeedback(`Project complete! ${project.title} is finished. +${project.xpReward} XP earned, and the next project is unlocked. 🎉`);
  }

  function loadProjectIntoPlayground(project) {
    setPlaygroundCode(project.starterCode);
    setActiveNavItem('practice');
    setXpFeedback(`${project.title} starter code loaded into Practice. Edit it in the Playground when you are ready!`);
  }

  function openAiHelperFromProject(project) {
    openAiHelperWithDraft({
      categoryId: 'project-help',
      fileName: project.title,
      buildGoal: `I am building the CodeQuest beginner project called ${project.title}. Project goal: ${project.goal}`,
      confusion: `Please help me understand the steps, fix my project code if I paste it, and suggest one small improvement. Steps: ${project.steps.join(' ')}`,
      code: `Starter HTML:
${project.starterCode.html}

Starter CSS:
${project.starterCode.css}

Starter JavaScript:
${project.starterCode.js}`,
      errorMessage: '',
    });
  }

  function openChallenge(challenge) {
    const status = getChallengeStatus(challenge.id, progress.challenges);

    if (status === 'locked') {
      setXpFeedback('That challenge is locked for now. Complete the challenge before it to unlock this one!');
      return;
    }

    setSelectedChallengeId(challenge.id);
    setChallengeFeedback(null);
    setActiveNavItem('practice');
  }

  function updateChallengeCode(challenge, language, value) {
    setProgress((currentProgress) => {
      const currentChallenge = currentProgress.challenges?.[challenge.id] ?? {};
      const currentCode = currentChallenge.code ?? getChallengeStarterCode(challenge);
      const isCompleted = currentChallenge.status === 'completed';

      return {
        ...currentProgress,
        challenges: {
          ...currentProgress.challenges,
          [challenge.id]: {
            ...currentChallenge,
            status: isCompleted ? 'completed' : 'in-progress',
            code: {
              ...getChallengeStarterCode(challenge),
              ...currentCode,
              [language]: value,
            },
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  }

  function resetChallengeCode(challenge) {
    setProgress((currentProgress) => ({
      ...currentProgress,
      challenges: {
        ...currentProgress.challenges,
        [challenge.id]: {
          ...(currentProgress.challenges?.[challenge.id] ?? {}),
          status: getChallengeStatus(challenge.id, currentProgress.challenges) === 'completed' ? 'completed' : 'unlocked',
          code: getChallengeStarterCode(challenge),
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    setChallengeFeedback(null);
    setXpFeedback(`${challenge.title} reset to its starter code.`);
  }

  function checkChallenge(challenge) {
    const savedChallenge = progress.challenges?.[challenge.id] ?? {};
    const code = savedChallenge.code ?? getChallengeStarterCode(challenge);
    const result = checkChallengeCode(challenge, code);
    setChallengeFeedback(result);

    setProgress((currentProgress) => {
      const currentChallenge = currentProgress.challenges?.[challenge.id] ?? {};
      const wasCompleted = currentChallenge.status === 'completed';
      const currentFailedChecks = currentChallenge.failedChecks ?? 0;
      const nextChallengeProgress = {
        ...currentChallenge,
        status: result.allPassed ? 'completed' : 'in-progress',
        code,
        attempts: (currentChallenge.attempts ?? 0) + 1,
        failedChecks: result.allPassed ? currentFailedChecks : currentFailedChecks + 1,
        completedAt: result.allPassed ? (currentChallenge.completedAt ?? new Date().toISOString()) : currentChallenge.completedAt,
      };
      const nextChallenges = {
        ...currentProgress.challenges,
        [challenge.id]: nextChallengeProgress,
      };
      const nextChallenge = getNextChallenge(challenge.id);

      if (result.allPassed && nextChallenge && !nextChallenges[nextChallenge.id]) {
        nextChallenges[nextChallenge.id] = { status: 'unlocked' };
      }

      const shouldMarkWeakSkills = !result.allPassed && nextChallengeProgress.failedChecks >= 2;
      const nextWeakChallengeSkills = shouldMarkWeakSkills
        ? addWeakChallengeSkills(currentProgress.weakChallengeSkills, challenge.skillTags)
        : currentProgress.weakChallengeSkills;

      return {
        ...currentProgress,
        totalXp: result.allPassed && !wasCompleted ? currentProgress.totalXp + challenge.xpReward : currentProgress.totalXp,
        challenges: nextChallenges,
        weakChallengeSkills: nextWeakChallengeSkills,
      };
    });

    if (result.allPassed) {
      const alreadyCompleted = savedChallenge.status === 'completed';
      setXpFeedback(alreadyCompleted
        ? `${challenge.title} is still complete. XP is safely saved and will not duplicate.`
        : `Challenge complete! ${challenge.title} passed. +${challenge.xpReward} XP earned. 🎉`);
    } else {
      setXpFeedback('Good attempt! The checker found a few next steps. Use the feedback and try again.');
    }
  }

  function loadChallengeIntoPlayground(challenge) {
    const savedChallenge = progress.challenges?.[challenge.id] ?? {};
    const code = savedChallenge.code ?? getChallengeStarterCode(challenge);
    const shouldLoad = window.confirm('Load this challenge into the regular Playground? This replaces the current saved Playground draft, but your separate challenge code stays saved.');

    if (!shouldLoad) {
      setXpFeedback('No problem — your Playground draft was not changed.');
      return;
    }

    setPlaygroundCode(code);
    setSelectedChallengeId(null);
    setActiveNavItem('practice');
    setXpFeedback(`${challenge.title} loaded into the Playground. Return to Challenges when you are ready to check it.`);
  }

  function openAiHelperFromChallenge(challenge, mode = 'not-passing') {
    const savedChallenge = progress.challenges?.[challenge.id] ?? {};
    const code = savedChallenge.code ?? getChallengeStarterCode(challenge);
    const feedbackLines = challengeFeedback
      ? [
          `Passed: ${challengeFeedback.passed.map((item) => item.label).join('; ') || 'Nothing yet'}`,
          `Needs work: ${challengeFeedback.needsWork.map((item) => item.label).join('; ') || 'Nothing'}`,
          `Hint shown: ${challengeFeedback.nextHint}`,
        ].join('\n')
      : 'I have not checked this attempt yet.';
    const modeText = {
      hint: 'Give me a hint without giving me the full answer.',
      explain: 'Explain the solution like I am a beginner.',
      similar: 'Create a similar practice challenge.',
      'not-passing': 'Explain why my challenge is not passing.',
    }[mode];

    openAiHelperWithDraft({
      categoryId: mode === 'similar' ? 'practice-challenge' : 'challenge-help',
      fileName: challenge.title,
      buildGoal: `I am working on this CodeQuest challenge: ${challenge.instructions}`,
      confusion: modeText,
      code: `Checker feedback:\n${feedbackLines}\n\nHTML:\n${code.html}\n\nCSS:\n${code.css}\n\nJavaScript:\n${code.js}`,
      errorMessage: '',
    });
  }

  async function copyAiPrompt(prompt) {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyFeedback('Copied! Paste this prompt into ChatGPT, Codex, or another AI assistant.');
      awardAiHelperXp();
    } catch (error) {
      console.warn('CodeQuest could not copy the AI prompt automatically.', error);
      setCopyFeedback('Copy did not work automatically. Select the prompt text and copy it manually.');
    }
  }

  function completeReflection() {
    const reflectionItem = dailyChecklist.find((item) => item.id === 'reflect');
    if (reflectionItem) completeItem(reflectionItem, 'Reflection saved!');
  }


  function recordAiBuddyUse() {
    const today = getDeviceLocalDate();

    setProgress((currentProgress) => {
      const usageCount = (currentProgress.aiBuddyUses ?? 0) + 1;

      if (currentProgress.lastAiBuddyRewardDate === today) {
        return {
          ...currentProgress,
          aiBuddyUses: usageCount,
        };
      }

      setXpFeedback(`AI Buddy used! +${AI_HELPER_XP_REWARD} XP for asking for help today.`);
      return {
        ...currentProgress,
        totalXp: currentProgress.totalXp + AI_HELPER_XP_REWARD,
        aiBuddyUses: usageCount,
        lastAiBuddyRewardDate: today,
      };
    });
  }

  function openAiBuddyPanel() {
    setAiBuddyOpen(true);
    recordAiBuddyUse();
  }

  function buildAiBuddyPrompt(action) {
    const prompt = buildContextPrompt(action, aiBuddyContext);
    setAiBuddyPrompt(prompt);
    setAiBuddyCopyFeedback('Prompt ready. Review it, then copy when you are ready.');
  }

  async function copyAiBuddyPrompt() {
    try {
      await navigator.clipboard.writeText(aiBuddyPrompt);
      setAiBuddyCopyFeedback('Copied! Paste this prompt into ChatGPT or Codex.');
    } catch (error) {
      console.warn('CodeQuest could not copy the AI Buddy prompt automatically.', error);
      setAiBuddyCopyFeedback('Copy did not work automatically. Select the prompt text and copy it manually.');
    }
  }

  function selectNavItem(navItem) {
    setActiveNavItem(navItem);
    if (navItem !== 'learn') {
      setSelectedLessonId(null);
    }
    if (navItem !== 'projects') {
      setSelectedProjectId(null);
    }
    if (navItem !== 'practice') {
      setSelectedChallengeId(null);
      setChallengeFeedback(null);
    }
  }

  return (
    <div className="app-shell">
      <main className="dashboard" aria-labelledby="app-title">
        <header className="hero-card">
          <div>
            <p className="eyebrow">Beginner coding tutor</p>
            <h1 id="app-title">CodeQuest</h1>
            <p className="hero-copy">Build a daily coding habit with tiny lessons, XP, and friendly quests.</p>
          </div>
          <div className="hero-badge" aria-label={`${level} current level`}>
            <span>Lvl</span>
            <strong>{level}</strong>
          </div>
        </header>

        <section className="stats-grid" aria-label="Your learning stats">
          <StatCard label="XP total" value={progress.totalXp.toLocaleString()} helper="Keep collecting stars" />
          <StatCard label="Level" value={level} helper={`${100 - (progress.totalXp % 100)} XP to next`} />
          <StatCard label="Streak" value={`${progress.streak} days`} helper="Complete the daily goal" />
        </section>

        {xpFeedback && <p className="celebration" role="status">{xpFeedback}</p>}

        {activeNavItem === 'home' && (
          <>
            <HomeLessonCard nextLesson={nextLesson} onOpenLesson={openTodaysLesson} />
            <HomeProjectCard nextProject={nextProject} onOpenProject={openProject} completedProjectsCount={completedProjectsCount} />
            <HomeChallengeCard completedChallengesCount={completedChallengesCount} nextChallenge={nextChallenge} onOpenChallenge={openChallenge} />
            <HomeReviewCard
              dailyReviewCompletedCount={dailyReviewCompletedCount}
              dailyReviewIsComplete={dailyReviewIsComplete}
              onOpenReview={() => setActiveNavItem('review')}
              weakSkillsCount={weakSkills.length}
            />
            {renderChecklistCard({ checklistIsComplete, completedChecklistCount, toggleChecklistItem, progress, dailyGoalIsComplete })}
          </>
        )}

        {activeNavItem === 'learn' && (
          selectedLesson
            ? (
              <LessonScreen
                lesson={selectedLesson}
                completedLessonIds={progress.completedLessons}
                onAskAiHelp={openAiHelperFromLesson}
                onBack={() => setSelectedLessonId(null)}
                onComplete={completeLesson}
              />
            )
            : <LearningPath completedLessonIds={progress.completedLessons} onOpenLesson={openLesson} />
        )}

        {activeNavItem === 'practice' && (
          selectedChallenge
            ? (
              <ChallengeDetail
                challenge={selectedChallenge}
                challengeFeedback={challengeFeedback}
                challengeProgress={progress.challenges?.[selectedChallenge.id]}
                onAskAiHelp={openAiHelperFromChallenge}
                onBack={() => { setSelectedChallengeId(null); setChallengeFeedback(null); }}
                onChangeCode={updateChallengeCode}
                onCheck={checkChallenge}
                onLoadIntoPlayground={loadChallengeIntoPlayground}
                onResetCode={resetChallengeCode}
              />
            )
            : (
              <PracticeScreen
                code={playgroundCode}
                completedChallengesCount={completedChallengesCount}
                nextChallenge={nextChallenge}
                onAskAiHelp={openAiHelperFromPlayground}
                onChangeCode={updatePlaygroundCode}
                onClearSavedCode={clearSavedPlaygroundCode}
                onCompletePractice={completePracticeChallenge}
                onOpenChallenge={openChallenge}
                onResetCode={resetPlaygroundCode}
                progress={progress}
              />
            )
        )}

        {activeNavItem === 'review' && (
          <ReviewScreen
            dailyReviewCompletedCount={dailyReviewCompletedCount}
            dailyReviewIsComplete={dailyReviewIsComplete}
            onAnswerReviewCard={answerReviewCard}
            onAskAiHelp={openAiHelperForWeakSkill}
            reviewProgress={reviewProgress}
            todaysReviewCards={todaysReviewCards}
            weakSkills={weakSkills}
          />
        )}

        {activeNavItem === 'ai-helper' && (
          <AiPromptHelper
            copyFeedback={copyFeedback}
            draft={aiHelperDraft}
            onCopyPrompt={copyAiPrompt}
            onUpdateDraft={updateAiHelperDraft}
          />
        )}

        {activeNavItem === 'projects' && (
          selectedProject
            ? (
              <ProjectDetail
                project={selectedProject}
                projectProgress={progress.projects?.[selectedProject.id]}
                onAskAiHelp={openAiHelperFromProject}
                onBack={() => setSelectedProjectId(null)}
                onComplete={completeProject}
                onLoadStarterCode={loadProjectIntoPlayground}
                onToggleChecklistItem={toggleProjectChecklistItem}
              />
            )
            : (
              <ProjectsScreen
                completedProjectsCount={completedProjectsCount}
                onOpenProject={openProject}
                onReflect={completeReflection}
                projectProgress={progress.projects}
              />
            )
        )}

        {activeNavItem === 'profile' && (
          <ProfileScreen
            badges={badges}
            completedBeginnerLessonsCount={completedBeginnerLessonsCount}
            completedChecklistCount={completedChecklistCount}
            completedProjectsCount={completedProjectsCount}
            completedChallengesCount={completedChallengesCount}
            dailyReviewCompletedCount={dailyReviewCompletedCount}
            level={level}
            backupFeedback={backupFeedback}
            onExportProgress={exportProgressBackup}
            onImportProgress={importProgressBackup}
            progress={progress}
            weakSkills={weakSkills}
          />
        )}
      </main>

      <AiBuddy
        context={aiBuddyContext}
        copyFeedback={aiBuddyCopyFeedback}
        isOpen={aiBuddyOpen}
        onBuildPrompt={buildAiBuddyPrompt}
        onClose={() => setAiBuddyOpen(false)}
        onCopyPrompt={copyAiBuddyPrompt}
        onOpen={openAiBuddyPanel}
        prompt={aiBuddyPrompt}
      />

      <BottomNav activeItem={activeNavItem} onSelect={selectNavItem} />
    </div>
  );
}


function AiBuddy({ context, copyFeedback, isOpen, onBuildPrompt, onClose, onCopyPrompt, onOpen, prompt }) {
  return (
    <aside className="ai-buddy-shell" aria-label="AI Buddy tutor shell">
      {isOpen && (
        <div className="ai-buddy-panel" role="dialog" aria-modal="false" aria-labelledby="ai-buddy-title">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">AI Buddy</p>
              <h2 id="ai-buddy-title">Tutor prompt shell</h2>
            </div>
            <button className="icon-button" type="button" onClick={onClose} aria-label="Close AI Buddy">×</button>
          </div>
          <p className="ai-buddy-note">This does not send anything automatically. It creates a prompt you can paste into ChatGPT or Codex.</p>
          <div className="ai-buddy-context">
            <strong>Current context</strong>
            <span>{context.screen}</span>
            {context.title && <small>{context.title}</small>}
            {context.skill && <small>{context.skill}</small>}
          </div>
          <div className="ai-buddy-actions" aria-label="Context-aware helper options">
            {context.actions.map((action) => (
              <button className="prompt-chip" key={action.id} type="button" onClick={() => onBuildPrompt(action)}>
                <strong>{action.label}</strong>
                <small>{action.helper}</small>
              </button>
            ))}
          </div>
          <label className="generated-prompt ai-buddy-generated">
            <span>Generated AI Buddy prompt</span>
            <textarea readOnly value={prompt || 'Choose a helper option to generate a context-aware prompt.'} />
          </label>
          <button className="primary-button" disabled={!prompt} type="button" onClick={onCopyPrompt}>Copy Prompt</button>
          {copyFeedback && <p className="celebration compact-celebration" role="status">{copyFeedback}</p>}
        </div>
      )}
      <button className="ai-buddy-button" type="button" onClick={onOpen} aria-expanded={isOpen}>
        <span aria-hidden="true">{'>'}_</span>
        <strong>AI Buddy</strong>
      </button>
    </aside>
  );
}

function getAiBuddyContext({ activeNavItem, selectedLesson, selectedChallenge, selectedProject, playgroundCode, challengeFeedback, progress, weakSkills }) {
  const baseActions = [
    { id: 'explain-screen', label: 'Explain what I should do on this screen', helper: 'Get a beginner-friendly orientation.' },
    { id: 'hint', label: 'Give me a hint', helper: 'One nudge without the full answer.' },
    { id: 'beginner-concept', label: 'Explain this concept like I’m a beginner', helper: 'Slow explanation with an example.' },
    { id: 'practice-task', label: 'Create a practice task for this skill', helper: 'Make one tiny exercise.' },
    { id: 'next-step', label: 'Tell me what to do next', helper: 'Pick the next safe action.' },
  ];
  const context = { screen: 'Home', title: '', skill: '', code: '', feedback: '', actions: baseActions };

  if (activeNavItem === 'learn' && selectedLesson) {
    return { ...context, screen: 'Lesson detail', title: selectedLesson.title, skill: selectedLesson.tags.join(', '), code: selectedLesson.codeExample ?? '', feedback: selectedLesson.miniTask, actions: [
      { id: 'explain-lesson', label: 'Explain this lesson', helper: 'Include concept, example, and mini task.' },
      ...baseActions,
    ] };
  }
  if (activeNavItem === 'learn') return { ...context, screen: 'Learn', title: 'Learn roadmap', skill: 'Beginner web development' };
  if (activeNavItem === 'practice' && selectedChallenge) {
    const savedChallenge = progress.challenges?.[selectedChallenge.id] ?? {};
    const code = savedChallenge.code ?? getChallengeStarterCode(selectedChallenge);
    const feedback = challengeFeedback ? `Passed: ${challengeFeedback.passed.map((item) => item.label).join('; ') || 'None yet'}\nNeeds work: ${challengeFeedback.needsWork.map((item) => item.label).join('; ') || 'Nothing'}\nNext hint: ${challengeFeedback.nextHint}` : 'Challenge has not been checked yet.';
    return { ...context, screen: 'Challenge', title: selectedChallenge.title, skill: selectedChallenge.skillTags.join(', '), feedback, code: `HTML:\n${code.html}\n\nCSS:\n${code.css}\n\nJavaScript:\n${code.js}`, actions: [
      { id: 'challenge-debug', label: 'Help me understand why my challenge is not passing', helper: 'Use checker feedback and my code.' },
      ...baseActions,
    ] };
  }
  if (activeNavItem === 'practice') {
    const code = { ...starterPlaygroundCode, ...playgroundCode };
    return { ...context, screen: 'Practice', title: 'Code Playground', skill: 'HTML, CSS, JavaScript', code: `HTML:\n${code.html}\n\nCSS:\n${code.css}\n\nJavaScript:\n${code.js}`, actions: [
      { id: 'debug-playground', label: 'Help me debug my playground code', helper: 'Include current HTML/CSS/JS.' },
      ...baseActions,
    ] };
  }
  if (activeNavItem === 'projects' && selectedProject) return { ...context, screen: 'Project', title: selectedProject.title, skill: selectedProject.goal, code: JSON.stringify(selectedProject.starterCode, null, 2), actions: [
    { id: 'project-step', label: 'Explain this project step', helper: 'Break down the guided project.' },
    ...baseActions,
  ] };
  if (activeNavItem === 'projects') return { ...context, screen: 'Project', title: 'Projects list', skill: 'Guided beginner builds' };
  if (activeNavItem === 'review') return { ...context, screen: 'Review', title: 'Review cards', skill: weakSkills[0]?.name ?? 'Beginner concepts' };
  if (activeNavItem === 'profile') return { ...context, screen: 'Profile', title: 'Progress and backup', skill: `${progress.totalXp} XP, ${progress.streak} day streak` };
  if (activeNavItem === 'ai-helper') return { ...context, screen: 'AI Helper', title: 'Copyable coding prompts', skill: 'Prompt writing' };
  return context;
}

function buildContextPrompt(action, context) {
  const mockEvaluation = createMockEvaluation({
    type: action.id.includes('challenge') ? AI_EVALUATION_TYPES.challengeCode : AI_EVALUATION_TYPES.projectQuestion,
    screen: context.screen,
    title: context.title,
    skill: context.skill,
    code: context.code,
    feedback: context.feedback,
  });

  return [
    'You are AI Buddy, a patient beginner coding tutor for CodeQuest.',
    `User request: ${action.label}`,
    `Current screen: ${context.screen}`,
    context.title ? `Current title: ${context.title}` : '',
    context.skill ? `Skill/topic: ${context.skill}` : '',
    context.feedback ? `Current feedback or task:\n${context.feedback}` : '',
    context.code ? `Current code/context:\n${context.code}` : '',
    'Please answer with: what I should do, one hint, one beginner explanation, and one tiny next step. If code is included, point to the likely issue before showing any full solution.',
    'Local AI-ready evaluation template for future backend use:',
    mockEvaluation.prompt,
  ].filter(Boolean).join('\n\n');
}


function ProfileScreen({ badges, backupFeedback, completedBeginnerLessonsCount, completedChecklistCount, completedProjectsCount, completedChallengesCount, dailyReviewCompletedCount, level, onExportProgress, onImportProgress, progress, weakSkills }) {
  return (
    <section className="checklist-card profile-screen" aria-labelledby="profile-title">
      <div className="section-heading profile-heading">
        <div>
          <p className="eyebrow">Profile</p>
          <h2 id="profile-title">Your CodeQuest progress</h2>
        </div>
        <strong>{completedChecklistCount}/{dailyChecklist.length}</strong>
      </div>
      <div className="profile-grid">
        <ProfileRow label="Total XP" value={progress.totalXp.toLocaleString()} />
        <ProfileRow label="Level" value={level} />
        <ProfileRow label="Streak" value={`${progress.streak} days`} />
        <ProfileRow label="Completed lessons" value={`${completedBeginnerLessonsCount}/${beginnerLessons.length}`} />
        <ProfileRow label="Completed projects" value={`${completedProjectsCount}/${beginnerProjects.length}`} />
        <ProfileRow label="Completed challenges" value={`${completedChallengesCount}/${beginnerChallenges.length}`} />
        <ProfileRow label="Practice completions" value={progress.practiceCompletions ?? 0} />
        <ProfileRow label="AI Helper uses" value={progress.aiHelperUses ?? 0} />
        <ProfileRow label="AI Buddy uses" value={progress.aiBuddyUses ?? 0} />
        <ProfileRow label="Review cards completed" value={progress.review?.totalCompleted ?? 0} />
        <ProfileRow label="Weak skills count" value={weakSkills.length} />
        <ProfileRow label="Daily review progress" value={`${dailyReviewCompletedCount}/${DAILY_REVIEW_GOAL} cards`} />
        <ProfileRow label="AI Helper XP today" value={progress.lastAiHelperRewardDate === getDeviceLocalDate() ? 'Collected' : `+${AI_HELPER_XP_REWARD} available`} />
        <ProfileRow label="AI Buddy XP today" value={progress.lastAiBuddyRewardDate === getDeviceLocalDate() ? 'Collected' : `+${AI_HELPER_XP_REWARD} available`} />
        <ProfileRow label="Badges earned" value={badges.length ? badges.join(', ') : 'None yet'} />
        <ProfileRow label="Today’s checklist" value={`${completedChecklistCount}/${dailyChecklist.length} done`} />
      </div>
      <WeakSkillsPanel weakSkills={weakSkills} />
      <BackupRestoreCard backupFeedback={backupFeedback} onExportProgress={onExportProgress} onImportProgress={onImportProgress} />
      <InstallGuide />
    </section>
  );
}

function WeakSkillsPanel({ onAskAiHelp, weakSkills }) {
  if (!weakSkills.length) {
    return (
      <aside className="weak-skills-card" aria-labelledby="weak-skills-title">
        <div>
          <p className="eyebrow">Weak skills</p>
          <h3 id="weak-skills-title">No weak skills saved yet</h3>
          <p>When a review card feels tricky, tap “I need practice” and CodeQuest will recommend next steps here.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="weak-skills-card" aria-labelledby="weak-skills-title">
      <div>
        <p className="eyebrow">Weak skills</p>
        <h3 id="weak-skills-title">Skills to revisit</h3>
        <p>These are not failures — they are helpful signs for what to practise next.</p>
      </div>
      <div className="weak-skill-list">
        {weakSkills.slice(0, 5).map((skill) => (
          <div className="weak-skill-item" key={skill.name}>
            <strong>{skill.name}</strong>
            <small>Marked for practice {skill.count} {skill.count === 1 ? 'time' : 'times'}</small>
            <ul>
              <li>Review this skill in the Review tab.</li>
              <li>Practise a tiny example in the Playground.</li>
              <li>Ask AI Helper to explain it in beginner-friendly words.</li>
            </ul>
            {onAskAiHelp && (
              <div className="weak-skill-actions">
                <button className="secondary-button" type="button" onClick={() => onAskAiHelp(skill.name, 'explain')}>
                  Explain with AI Helper
                </button>
                <button className="secondary-button" type="button" onClick={() => onAskAiHelp(skill.name, 'challenge')}>
                  Make a practice challenge
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

function ReviewScreen({ dailyReviewCompletedCount, dailyReviewIsComplete, onAnswerReviewCard, onAskAiHelp, reviewProgress, todaysReviewCards, weakSkills }) {
  return (
    <section className="lesson-card review-screen" aria-labelledby="review-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Review</p>
          <h2 id="review-title">Revise weak concepts</h2>
        </div>
        <span>{dailyReviewCompletedCount}/{DAILY_REVIEW_GOAL} today</span>
      </div>
      <p>Answer a few tiny review cards. Cards you mark “I need practice” move up the list so you see them more often.</p>

      <div className="starter-challenge review-goal-card">
        <strong>Daily review goal</strong>
        <p>Complete {DAILY_REVIEW_GOAL} review cards for +{DAILY_REVIEW_XP_REWARD} XP once per day. Refreshing will not duplicate this reward.</p>
        <div className="progress-track" aria-label={`${dailyReviewCompletedCount} of ${DAILY_REVIEW_GOAL} review cards complete`}>
          <span style={{ width: `${Math.min((dailyReviewCompletedCount / DAILY_REVIEW_GOAL) * 100, 100)}%` }} />
        </div>
        {dailyReviewIsComplete && <p className="celebration compact-celebration">Daily review complete! Come back tomorrow for another XP reward. 🧠</p>}
      </div>

      <div className="review-card-grid">
        {todaysReviewCards.map((card) => {
          const savedCard = reviewProgress.cards?.[card.id] ?? {};
          const needsPractice = savedCard.lastResult === 'practice';

          return (
            <article className={needsPractice ? 'review-card needs-practice' : 'review-card'} key={card.id}>
              <div className="section-heading compact-heading">
                <strong>{card.skill}</strong>
                <span>{card.difficulty}</span>
              </div>
              <h3>{card.question}</h3>
              <details className="hint-card">
                <summary>Show hint</summary>
                <p>{card.hint}</p>
              </details>
              <details className="quiz-card">
                <summary>Show simple answer</summary>
                <p>{card.answer}</p>
              </details>
              <div className="review-card-footer">
                <small>{savedCard.attempts ? `Reviewed ${savedCard.attempts} ${savedCard.attempts === 1 ? 'time' : 'times'}` : 'New review card'}</small>
                {needsPractice && <small>Showing sooner because it needs practice</small>}
              </div>
              <div className="review-actions">
                <button className="primary-button" type="button" onClick={() => onAnswerReviewCard(card, 'knew')}>
                  I knew this
                </button>
                <button className="secondary-button" type="button" onClick={() => onAnswerReviewCard(card, 'practice')}>
                  I need practice
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <WeakSkillsPanel onAskAiHelp={onAskAiHelp} weakSkills={weakSkills} />
    </section>
  );
}

function HomeChallengeCard({ completedChallengesCount, nextChallenge, onOpenChallenge }) {
  if (!nextChallenge) {
    return (
      <section className="lesson-card current-project-card" aria-labelledby="next-challenge-title">
        <div className="section-heading">
          <p className="eyebrow">Next challenge</p>
          <span>{completedChallengesCount}/{beginnerChallenges.length}</span>
        </div>
        <h2 id="next-challenge-title">All challenges complete!</h2>
        <p>You finished every beginner challenge. Revisit Practice to redo one or ask AI Helper for a similar challenge.</p>
      </section>
    );
  }

  return (
    <section className="lesson-card current-project-card" aria-labelledby="next-challenge-title">
      <div className="section-heading">
        <p className="eyebrow">Next challenge</p>
        <span>+{nextChallenge.xpReward} XP</span>
      </div>
      <h2 id="next-challenge-title">{nextChallenge.title}</h2>
      <p>{nextChallenge.instructions}</p>
      <div className="lesson-meta">
        <span>{nextChallenge.difficulty}</span>
        <span>{nextChallenge.estimatedTime}</span>
      </div>
      <button className="primary-button" type="button" onClick={() => onOpenChallenge(nextChallenge)}>
        Start challenge
      </button>
    </section>
  );
}

function HomeReviewCard({ dailyReviewCompletedCount, dailyReviewIsComplete, onOpenReview, weakSkillsCount }) {
  return (
    <section className="lesson-card daily-review-card" aria-labelledby="daily-review-title">
      <div className="section-heading">
        <p className="eyebrow">Daily review</p>
        <span>{dailyReviewCompletedCount}/{DAILY_REVIEW_GOAL}</span>
      </div>
      <h2 id="daily-review-title">Keep concepts fresh</h2>
      <p>{weakSkillsCount > 0 ? `${weakSkillsCount} weak ${weakSkillsCount === 1 ? 'skill is' : 'skills are'} ready for practice.` : 'Review tiny questions to remember what you learned.'}</p>
      <button className="secondary-button" type="button" onClick={onOpenReview}>
        {dailyReviewIsComplete ? 'Review again' : 'Start daily review'}
      </button>
    </section>
  );
}

function BackupRestoreCard({ backupFeedback, onExportProgress, onImportProgress }) {
  return (
    <aside className="backup-card" aria-labelledby="backup-title">
      <div>
        <p className="eyebrow">Backup</p>
        <h3 id="backup-title">Move your progress safely</h3>
        <p>
          Export a JSON backup before switching browsers or moving between localhost and the GitHub Pages site.
          Those locations can have separate browser storage, so one may not automatically see the other’s XP.
        </p>
      </div>
      <div className="backup-actions">
        <button className="secondary-button" type="button" onClick={onExportProgress}>
          Export progress JSON
        </button>
        <label className="import-button" htmlFor="progress-backup-file">
          Import progress JSON
          <input
            accept="application/json,.json"
            id="progress-backup-file"
            onChange={(event) => {
              onImportProgress(event.target.files?.[0]);
              event.target.value = '';
            }}
            type="file"
          />
        </label>
      </div>
      {backupFeedback && <p className="backup-feedback" role="status">{backupFeedback}</p>}
    </aside>
  );
}

function InstallGuide() {
  return (
    <aside className="install-card" aria-labelledby="install-title">
      <div>
        <p className="eyebrow">Install</p>
        <h3 id="install-title">Add CodeQuest to your Home Screen</h3>
        <p>Install once, then reopen CodeQuest like an app. Your XP, streak, lessons, projects, prompts, and playground code stay saved on this device.</p>
      </div>
      <ol>
        <li>On iPhone, open CodeQuest in Safari.</li>
        <li>Tap Share.</li>
        <li>Tap Add to Home Screen.</li>
        <li>Open CodeQuest from the Home Screen.</li>
      </ol>
    </aside>
  );
}

function AiPromptHelper({ copyFeedback, draft, onCopyPrompt, onUpdateDraft }) {
  const safeDraft = {
    ...emptyAiHelperDraft,
    ...draft,
  };
  const generatedPrompt = buildAiPrompt(safeDraft);

  function handleFieldChange(field, value) {
    const nextDraft = {
      ...safeDraft,
      [field]: value,
    };

    onUpdateDraft({
      [field]: value,
      generatedPrompt: buildAiPrompt(nextDraft),
    });
  }

  function applyTemplate(template) {
    const nextDraft = {
      ...safeDraft,
      categoryId: template.categoryId,
      ...template.draft,
    };

    onUpdateDraft({
      categoryId: template.categoryId,
      ...template.draft,
      generatedPrompt: buildAiPrompt(nextDraft),
    });
  }

  return (
    <section className="lesson-card ai-helper-card" aria-labelledby="ai-helper-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">AI Helper</p>
          <h2 id="ai-helper-title">Copyable coding prompts</h2>
        </div>
        <span>+{AI_HELPER_XP_REWARD} XP daily</span>
      </div>

      <div className="starter-challenge ai-helper-note">
        <strong>No API key needed</strong>
        <p>
          CodeQuest does not send anything automatically. It only builds a prompt you can copy and
          paste into ChatGPT, Codex, or another AI assistant when you choose.
        </p>
      </div>

      <div className="prompt-category-grid" aria-label="Prompt categories">
        {aiPromptCategories.map((category) => (
          <button
            className={category.id === safeDraft.categoryId ? 'prompt-chip active' : 'prompt-chip'}
            key={category.id}
            onClick={() => handleFieldChange('categoryId', category.id)}
            type="button"
          >
            <strong>{category.label}</strong>
            <small>{category.helper}</small>
          </button>
        ))}
      </div>

      <div className="template-list" aria-label="Ready-made prompt templates">
        <div className="section-heading compact-heading">
          <strong>Ready-made templates</strong>
          <span>Beginner shortcuts</span>
        </div>
        {readyMadePromptTemplates.map((template) => (
          <button className="template-card" key={template.id} onClick={() => applyTemplate(template)} type="button">
            <span>
              <strong>{template.title}</strong>
              <small>{template.description}</small>
            </span>
            <span aria-hidden="true">✨</span>
          </button>
        ))}
      </div>

      <div className="ai-helper-form">
        <PromptInput
          helper="Example: src/App.jsx, Code Playground, or the lesson title."
          label="File name, lesson, or topic"
          onChange={(value) => handleFieldChange('fileName', value)}
          value={safeDraft.fileName}
        />
        <PromptInput
          helper="Example: I am trying to make a button show a message."
          label="What are you trying to build?"
          onChange={(value) => handleFieldChange('buildGoal', value)}
          value={safeDraft.buildGoal}
        />
        <PromptInput
          helper="Example: I do not understand why useState updates the screen."
          label="What do you not understand?"
          onChange={(value) => handleFieldChange('confusion', value)}
          value={safeDraft.confusion}
        />
        <PromptInput
          helper="Paste the exact red error text if you have one."
          label="Error message"
          onChange={(value) => handleFieldChange('errorMessage', value)}
          value={safeDraft.errorMessage}
          isLarge
        />
        <PromptInput
          helper="Paste code, playground HTML/CSS/JS, or notes. Nothing leaves this device from CodeQuest."
          label="Code or notes"
          onChange={(value) => handleFieldChange('code', value)}
          value={safeDraft.code}
          isCode
          isLarge
        />
      </div>

      <label className="generated-prompt">
        <span>Generated prompt</span>
        <textarea readOnly value={generatedPrompt} />
      </label>

      <button className="primary-button" type="button" onClick={() => onCopyPrompt(generatedPrompt)}>
        Copy Prompt
      </button>
      {copyFeedback && <p className="celebration" role="status">{copyFeedback}</p>}
    </section>
  );
}

function PromptInput({ helper, isCode = false, isLarge = false, label, onChange, value }) {
  return (
    <label className={isCode ? 'code-editor prompt-input' : 'prompt-input'}>
      <span>{label}</span>
      <small>{helper}</small>
      <textarea
        autoCapitalize={isCode ? 'off' : 'sentences'}
        autoCorrect={isCode ? 'off' : 'on'}
        className={isLarge ? 'large-input' : undefined}
        spellCheck={isCode ? 'false' : 'true'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}


function PracticeScreen({ code, completedChallengesCount, nextChallenge, onAskAiHelp, onChangeCode, onClearSavedCode, onCompletePractice, onOpenChallenge, onResetCode, progress }) {
  return (
    <>
      <ChallengesPanel
        completedChallengesCount={completedChallengesCount}
        nextChallenge={nextChallenge}
        onOpenChallenge={onOpenChallenge}
        progress={progress}
      />
      <CodePlayground
        code={code}
        onAskAiHelp={onAskAiHelp}
        onChangeCode={onChangeCode}
        onClearSavedCode={onClearSavedCode}
        onCompletePractice={onCompletePractice}
        onResetCode={onResetCode}
      />
    </>
  );
}

function ChallengesPanel({ completedChallengesCount, nextChallenge, onOpenChallenge, progress }) {
  return (
    <section className="lesson-card challenges-screen" aria-labelledby="challenges-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Challenges</p>
          <h2 id="challenges-title">Beginner coding challenges</h2>
        </div>
        <span>{completedChallengesCount}/{beginnerChallenges.length}</span>
      </div>
      <p>Practise tiny tasks with instant, friendly auto-checking. Challenge work is saved separately from the regular Playground.</p>
      {nextChallenge && (
        <div className="starter-challenge challenge-next-card">
          <strong>Next up: {nextChallenge.title}</strong>
          <p>{nextChallenge.instructions}</p>
          <button className="secondary-button" type="button" onClick={() => onOpenChallenge(nextChallenge)}>
            Open next challenge
          </button>
        </div>
      )}
      <div className="challenge-grid">
        {beginnerChallenges.map((challenge, index) => {
          const status = getChallengeStatus(challenge.id, progress.challenges);
          const savedChallenge = progress.challenges?.[challenge.id] ?? {};

          return (
            <button
              className={`challenge-card ${status}`}
              disabled={status === 'locked'}
              key={challenge.id}
              onClick={() => onOpenChallenge(challenge)}
              type="button"
            >
              <span className="project-card-topline">
                <strong>{index + 1}. {challenge.title}</strong>
                <small>{getChallengeStatusLabel(status)}</small>
              </span>
              <span>{challenge.instructions}</span>
              <span className="project-meta lesson-meta">
                <small>{challenge.difficulty}</small>
                <small>{challenge.estimatedTime}</small>
                <small>+{challenge.xpReward} XP</small>
              </span>
              <span className="challenge-tags">{challenge.skillTags.join(' • ')}</span>
              {savedChallenge.attempts > 0 && <span className="challenge-attempts">Checked {savedChallenge.attempts} {savedChallenge.attempts === 1 ? 'time' : 'times'}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ChallengeDetail({ challenge, challengeFeedback, challengeProgress = {}, onAskAiHelp, onBack, onChangeCode, onCheck, onLoadIntoPlayground, onResetCode }) {
  const code = {
    ...getChallengeStarterCode(challenge),
    ...(challengeProgress.code ?? {}),
  };
  const previewDocument = buildPreviewDocument(code);
  const isCompleted = challengeProgress.status === 'completed';

  return (
    <article className="lesson-card challenge-detail" aria-labelledby="challenge-detail-title">
      <button className="back-button" type="button" onClick={onBack}>← Back to Practice</button>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Challenge</p>
          <h2 id="challenge-detail-title">{challenge.title}</h2>
        </div>
        <span>{getChallengeStatusLabel(isCompleted ? 'completed' : challengeProgress.status ?? 'unlocked')}</span>
      </div>
      <p>{challenge.instructions}</p>
      <div className="lesson-meta">
        <span>{challenge.difficulty}</span>
        <span>{challenge.estimatedTime}</span>
        <span>+{challenge.xpReward} XP</span>
        {challenge.skillTags.map((tag) => <span key={tag}>{tag}</span>)}
      </div>

      <div className="starter-challenge">
        <strong>Success criteria</strong>
        <ul className="challenge-criteria-list">
          {challenge.successCriteria.map((criterion) => <li key={criterion.id}>{criterion.label}</li>)}
        </ul>
      </div>

      <div className="playground-grid">
        <div className="editor-stack" aria-label="Challenge code editors">
          <CodeEditor helper="HTML is the structure for this challenge." label="HTML" language="html" onChangeCode={(language, value) => onChangeCode(challenge, language, value)} value={code.html} />
          <CodeEditor helper="CSS adds colours, spacing, and layout." label="CSS" language="css" onChangeCode={(language, value) => onChangeCode(challenge, language, value)} value={code.css} />
          <CodeEditor helper="JavaScript adds behaviour and events." label="JavaScript" language="js" onChangeCode={(language, value) => onChangeCode(challenge, language, value)} value={code.js} />
        </div>
        <div className="preview-panel">
          <div className="preview-header">
            <strong>Challenge preview</strong>
            <span>Runs in a sandbox</span>
          </div>
          <iframe className="preview-frame" sandbox="allow-scripts" srcDoc={previewDocument} title={`${challenge.title} preview`} />
        </div>
      </div>

      {challengeFeedback && <ChallengeFeedback feedback={challengeFeedback} explanation={challenge.explanation} onAskAiHelp={() => onAskAiHelp(challenge, 'not-passing')} />}

      <details className="hint-card playground-hints">
        <summary>Need a hint?</summary>
        <ul>{challenge.hints.map((hint) => <li key={hint}>{hint}</li>)}</ul>
      </details>

      {isCompleted && (
        <div className="starter-challenge challenge-complete-note">
          <strong>Completed explanation</strong>
          <p>{challenge.explanation}</p>
        </div>
      )}

      <div className="playground-actions challenge-actions">
        <button className="primary-button" type="button" onClick={() => onCheck(challenge)}>
          Check my code
        </button>
        <button className="secondary-button" type="button" onClick={() => onAskAiHelp(challenge, 'not-passing')}>
          Explain why it is not passing
        </button>
        <button className="secondary-button" type="button" onClick={() => onAskAiHelp(challenge, 'hint')}>
          Hint only
        </button>
        <button className="secondary-button" type="button" onClick={() => onAskAiHelp(challenge, 'explain')}>
          Explain solution
        </button>
        <button className="secondary-button" type="button" onClick={() => onAskAiHelp(challenge, 'similar')}>
          Similar challenge prompt
        </button>
        <button className="secondary-button" type="button" onClick={() => onLoadIntoPlayground(challenge)}>
          Load into Playground
        </button>
        <button className="secondary-button danger-button" type="button" onClick={() => onResetCode(challenge)}>
          Reset challenge code
        </button>
      </div>
    </article>
  );
}

function ChallengeFeedback({ feedback, explanation, onAskAiHelp }) {
  return (
    <aside className={feedback.allPassed ? 'challenge-feedback passed' : 'challenge-feedback'} role="status">
      <strong>{feedback.allPassed ? 'All checks passed! Great work.' : 'Nice try — here is what to improve next.'}</strong>
      <div className="feedback-columns">
        <div>
          <h3>Passed</h3>
          {feedback.passed.length ? <ul>{feedback.passed.map((item) => <li key={item.id}>{item.label}</li>)}</ul> : <p>No checks have passed yet, and that is okay. Start with the first hint.</p>}
        </div>
        <div>
          <h3>Still needs work</h3>
          {feedback.needsWork.length ? <ul>{feedback.needsWork.map((item) => <li key={item.id}>{item.label}</li>)}</ul> : <p>Nothing left to fix for this challenge.</p>}
        </div>
      </div>
      <p><strong>Next hint:</strong> {feedback.nextHint}</p>
      {feedback.allPassed && <p>{explanation}</p>}
      {!feedback.allPassed && onAskAiHelp && <button className="secondary-button" type="button" onClick={onAskAiHelp}>Ask AI Buddy for help</button>}
    </aside>
  );
}

function CodePlayground({ code, onAskAiHelp, onChangeCode, onClearSavedCode, onCompletePractice, onResetCode }) {
  const safeCode = {
    ...starterPlaygroundCode,
    ...code,
  };
  const previewDocument = buildPreviewDocument(safeCode);

  return (
    <section className="lesson-card playground-card" aria-labelledby="practice-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Practice</p>
          <h2 id="practice-title">Code Playground</h2>
        </div>
        <span>+20 XP today</span>
      </div>
      <p>
        Practise HTML, CSS, and JavaScript in tiny steps. Your code saves on this device as you type,
        so refreshing the page keeps your work.
      </p>

      <div className="starter-challenge" aria-labelledby="starter-challenge-title">
        <strong id="starter-challenge-title">Starter challenge</strong>
        <p>Change the heading text, change the button colour, and make the button show your own message.</p>
      </div>

      <div className="playground-grid">
        <div className="editor-stack" aria-label="Code editors">
          <CodeEditor
            helper="HTML is the structure: headings, paragraphs, buttons, and other page pieces."
            label="HTML"
            language="html"
            onChangeCode={onChangeCode}
            value={safeCode.html}
          />
          <CodeEditor
            helper="CSS is the style: colours, spacing, fonts, and layout."
            label="CSS"
            language="css"
            onChangeCode={onChangeCode}
            value={safeCode.css}
          />
          <CodeEditor
            helper="JavaScript is the action: it can react when someone clicks or types."
            label="JavaScript"
            language="js"
            onChangeCode={onChangeCode}
            value={safeCode.js}
          />
        </div>

        <div className="preview-panel">
          <div className="preview-header">
            <strong>Live preview</strong>
            <span>Updates as you type</span>
          </div>
          <iframe
            className="preview-frame"
            sandbox="allow-scripts"
            srcDoc={previewDocument}
            title="Code playground live preview"
          />
        </div>
      </div>

      <details className="hint-card playground-hints">
        <summary>Need a hint?</summary>
        <ul>
          <li>Heading text lives between <code>&lt;h1&gt;</code> and <code>&lt;/h1&gt;</code>.</li>
          <li>The button colour is the <code>background</code> value in CSS.</li>
          <li>The click message is the text inside <code>message.textContent</code>.</li>
        </ul>
      </details>

      <div className="playground-actions">
        <button className="primary-button" type="button" onClick={onCompletePractice}>
          Complete practice
        </button>
        <button className="secondary-button" type="button" onClick={onAskAiHelp}>
          Get AI help with this code
        </button>
        <button className="secondary-button" type="button" onClick={onResetCode}>
          Reset starter code
        </button>
        <button className="secondary-button danger-button" type="button" onClick={onClearSavedCode}>
          Clear saved code
        </button>
      </div>
    </section>
  );
}

function CodeEditor({ helper, label, language, onChangeCode, value }) {
  return (
    <label className="code-editor">
      <span>{label}</span>
      <small>{helper}</small>
      <textarea
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
        value={value}
        onChange={(event) => onChangeCode(language, event.target.value)}
      />
    </label>
  );
}

function buildPreviewDocument({ html, css, js }) {
  // The iframe uses srcDoc so the learner's HTML, CSS, and JavaScript run inside a separate preview.
  // The sandbox allows scripts for button practice, but does not allow same-origin access to CodeQuest.
  const safeCss = css.replace(/<\/style/gi, '<\\/style');
  const safeJs = js.replace(/<\/script/gi, '<\\/script');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { margin: 0; background: #ffffff; }
      ${safeCss}
    </style>
  </head>
  <body>
    ${html}
    <script>
      try {
        ${safeJs}
      } catch (error) {
        document.body.insertAdjacentHTML('beforeend', '<pre style="white-space: pre-wrap; color: #b42318; padding: 12px;">JavaScript error: ' + error.message + '</pre>');
      }
    </script>
  </body>
</html>`;
}


function HomeProjectCard({ completedProjectsCount, nextProject, onOpenProject }) {
  if (!nextProject) {
    return (
      <section className="lesson-card current-project-card" aria-labelledby="current-project-title">
        <div className="section-heading">
          <p className="eyebrow">Current project</p>
          <span>{completedProjectsCount}/{beginnerProjects.length}</span>
        </div>
        <h2 id="current-project-title">All projects complete!</h2>
        <p>You have built every beginner project. Reopen Projects to review your starter code and ideas.</p>
      </section>
    );
  }

  return (
    <section className="lesson-card current-project-card" aria-labelledby="current-project-title">
      <div className="section-heading">
        <p className="eyebrow">Current project</p>
        <span>+{nextProject.xpReward} XP</span>
      </div>
      <h2 id="current-project-title">{nextProject.title}</h2>
      <p>{nextProject.description}</p>
      <div className="lesson-meta">
        <span>{nextProject.difficulty}</span>
        <span>{nextProject.estimatedTime}</span>
      </div>
      <button className="primary-button" type="button" onClick={() => onOpenProject(nextProject)}>
        Open current project
      </button>
    </section>
  );
}

function ProjectsScreen({ completedProjectsCount, onOpenProject, onReflect, projectProgress }) {
  return (
    <section className="lesson-card projects-screen" aria-labelledby="projects-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Projects</p>
          <h2 id="projects-title">Guided beginner builds</h2>
        </div>
        <span>{completedProjectsCount}/{beginnerProjects.length} done</span>
      </div>
      <p>Pick a real project, follow the tiny steps, load the starter code into Practice, and mark it complete when your checklist is done.</p>

      <div className="project-grid">
        {beginnerProjects.map((project) => {
          const status = getProjectStatus(project.id, projectProgress);

          return (
            <button
              className={`project-card ${status}`}
              disabled={status === 'locked'}
              key={project.id}
              onClick={() => onOpenProject(project)}
              type="button"
            >
              <span className="project-card-topline">
                <strong>{project.title}</strong>
                <small>{getProjectStatusLabel(status)}</small>
              </span>
              <span>{project.description}</span>
              <span className="lesson-meta project-meta">
                <small>{project.difficulty}</small>
                <small>{project.estimatedTime}</small>
                <small>+{project.xpReward} XP</small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="starter-challenge">
        <strong>Reflection still counts</strong>
        <p>After building, write one thing you learned to finish the daily reflection checklist item.</p>
      </div>
      <button className="secondary-button" type="button" onClick={onReflect}>
        Mark reflection complete
      </button>
    </section>
  );
}

function ProjectDetail({ project, projectProgress, onAskAiHelp, onBack, onComplete, onLoadStarterCode, onToggleChecklistItem }) {
  const safeProjectProgress = projectProgress ?? { checkedSteps: {} };
  const status = getProjectStatus(project.id, { [project.id]: safeProjectProgress });
  const checkedCount = project.completionChecklist.filter((_, index) => safeProjectProgress.checkedSteps?.[index]).length;
  const allChecklistItemsDone = checkedCount === project.completionChecklist.length;

  return (
    <article className="lesson-card project-detail" aria-labelledby="project-detail-title">
      <button className="back-button" type="button" onClick={onBack}>← Back to projects</button>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Guided project</p>
          <h2 id="project-detail-title">{project.title}</h2>
        </div>
        <span>{getProjectStatusLabel(status)}</span>
      </div>
      <p>{project.description}</p>
      <div className="lesson-meta">
        <span>{project.difficulty}</span>
        <span>{project.estimatedTime}</span>
        <span>+{project.xpReward} XP</span>
      </div>

      <div className="mini-task">
        <strong>Project goal</strong>
        <p>{project.goal}</p>
      </div>

      <div className="project-section">
        <h3>Steps to follow</h3>
        <ol>
          {project.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </div>

      <details className="hint-card" open>
        <summary>Beginner hints</summary>
        <ul>
          {project.hints.map((hint) => <li key={hint}>{hint}</li>)}
        </ul>
      </details>

      <div className="project-section">
        <div className="section-heading compact-heading">
          <strong>Completion checklist</strong>
          <span>{checkedCount}/{project.completionChecklist.length}</span>
        </div>
        <div className="checklist-items">
          {project.completionChecklist.map((item, index) => (
            <label className="checklist-item" key={item}>
              <input
                checked={Boolean(safeProjectProgress.checkedSteps?.[index])}
                onChange={() => onToggleChecklistItem(project, index)}
                type="checkbox"
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
        {!allChecklistItemsDone && <p className="friendly-warning">Tick each checklist item when you have tried it in Practice. Then you can complete the project.</p>}
      </div>

      <div className="code-example">
        <strong>Starter code preview</strong>
        <pre><code>{`HTML:\n${project.starterCode.html}\n\nCSS:\n${project.starterCode.css}\n\nJavaScript:\n${project.starterCode.js}`}</code></pre>
      </div>

      <div className="lesson-actions project-actions">
        <button className="primary-button" type="button" onClick={() => onComplete(project)}>
          {status === 'completed' ? 'Project complete ✓' : `Complete Project for ${project.xpReward} XP`}
        </button>
        <button className="secondary-button" type="button" onClick={() => onLoadStarterCode(project)}>
          Load starter code into Playground
        </button>
        <button className="secondary-button" type="button" onClick={() => onAskAiHelp(project)}>
          Get AI help with this project
        </button>
      </div>
    </article>
  );
}

function HomeLessonCard({ nextLesson, onOpenLesson }) {
  if (!nextLesson) {
    return (
      <section className="lesson-card" aria-labelledby="lesson-title">
        <div className="section-heading">
          <p className="eyebrow">Today&apos;s lesson</p>
          <span>All caught up</span>
        </div>
        <h2 id="lesson-title">You finished the beginner path!</h2>
        <p>Fantastic work. Review any lesson in the Learn tab, or keep your streak alive with today&apos;s checklist.</p>
      </section>
    );
  }

  return (
    <section className="lesson-card" aria-labelledby="lesson-title">
      <div className="section-heading">
        <p className="eyebrow">Today&apos;s lesson</p>
        <span>{nextLesson.minutes} min</span>
      </div>
      <h2 id="lesson-title">{nextLesson.title}</h2>
      <p>{nextLesson.explanation}</p>
      <div className="lesson-meta">
        {nextLesson.tags.map((tag) => <span key={tag}>{tag}</span>)}
        <span>+{nextLesson.xpReward} XP</span>
      </div>
      <div className="progress-track" aria-label="0% lesson progress">
        <span style={{ width: '0%' }} />
      </div>
      <button className="primary-button" type="button" onClick={onOpenLesson}>
        Start today&apos;s lesson
      </button>
    </section>
  );
}

function LearningPath({ completedLessonIds, onOpenLesson }) {
  const completedCount = completedLessonIds.filter((lessonId) => beginnerLessons.some((lesson) => lesson.id === lessonId)).length;
  const currentLesson = getFirstUnlockedIncompleteLesson(completedLessonIds);
  const completionPercent = Math.round((completedCount / beginnerLessons.length) * 100);
  const careerPaceMinutes = Math.max(6, Math.round(beginnerLessons.reduce((total, lesson) => total + lesson.minutes, 0) / beginnerLessons.length));
  const estimatedCompletionDate = getEstimatedCompletionDate(beginnerLessons.length - completedCount);

  return (
    <section className="lesson-card learning-path career-roadmap" aria-labelledby="learn-title">
      <div className="career-path-panel" aria-labelledby="career-title">
        <div className="career-path-header">
          <div>
            <p className="eyebrow">Career path</p>
            <h2 id="career-title">Full-Stack Developer</h2>
          </div>
          <span className="career-switch-icon" aria-hidden="true">⇄</span>
        </div>
        <div className="certificate-card">
          <span className="certificate-badge" aria-hidden="true">✺</span>
          <div>
            <strong>Certificate of completion</strong>
            <div className="progress-track career-progress" aria-label={`${completedCount} of ${beginnerLessons.length} lessons complete`}>
              <span style={{ width: `${completionPercent}%` }} />
            </div>
            <div className="career-progress-meta">
              <small>{completionPercent}% complete</small>
              <small>{completedCount}/{beginnerLessons.length}</small>
            </div>
          </div>
        </div>
        <div className="career-stats-row">
          <div>
            <small>Est. completion</small>
            <strong>{estimatedCompletionDate}</strong>
          </div>
          <div>
            <small>Your pace</small>
            <strong>{careerPaceMinutes}m/day</strong>
          </div>
        </div>
      </div>

      <div className="section-heading roadmap-intro-heading">
        <div>
          <p className="eyebrow">Learn roadmap</p>
          <h2 id="learn-title">Tap a level to reveal the lesson details</h2>
        </div>
        <span>{completedCount}/{beginnerLessons.length}</span>
      </div>
      <p>Follow a gamified path from absolute basics to small app-building skills. Unlocked levels open lessons; locked levels preview what is coming next.</p>

      <div className="roadmap-map" aria-label="Interactive beginner roadmap">
        {beginnerLessons.map((lesson, index) => {
          const isCompleted = completedLessonIds.includes(lesson.id);
          const isUnlocked = isLessonUnlocked(lesson.id, completedLessonIds);
          const isCurrent = currentLesson?.id === lesson.id;
          const status = isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked';
          const project = beginnerProjects[index % beginnerProjects.length];

          return (
            <details className={`roadmap-level ${status} ${isCurrent ? 'current' : ''}`} key={lesson.id} open={isCurrent}>
              <summary>
                <span className="level-node" aria-hidden="true">{isCompleted ? '✓' : isUnlocked ? '⚡' : '🔒'}</span>
                <span className="level-summary-copy">
                  <small>{lesson.roadmapSection}</small>
                  <strong>{lesson.order}. {lesson.title}</strong>
                </span>
                <span className="level-status">{isCurrent ? 'Recommended' : getLessonStatusLabel(status)}</span>
              </summary>
              <div className="level-reveal-card">
                <p>{lesson.concept}</p>
                <div className="level-meta-grid">
                  <span>{lesson.minutes} min</span>
                  <span>+{lesson.xpReward} XP</span>
                  <span>{lesson.tags.slice(0, 2).join(' • ')}</span>
                </div>
                <div className="section-project-preview">
                  <div>
                    <small>Section project</small>
                    <strong>{project.title}</strong>
                  </div>
                  <div className="mini-preview" aria-hidden="true">
                    <span className="mini-preview-bar">Preview</span>
                    <span className="mini-preview-avatar" />
                    <span className="mini-preview-line" />
                    <span className="mini-preview-line short" />
                  </div>
                </div>
                <button className="primary-button" disabled={!isUnlocked} type="button" onClick={() => onOpenLesson(lesson)}>
                  {isUnlocked ? 'Open this level' : 'Complete the previous level to unlock'}
                </button>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

function getEstimatedCompletionDate(remainingLessonCount) {
  const daysToFinish = Math.max(1, remainingLessonCount);
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + daysToFinish);
  return estimatedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function LessonScreen({ lesson, completedLessonIds, onAskAiHelp, onBack, onComplete }) {
  const isComplete = completedLessonIds.includes(lesson.id);
  const [activityAnswer, setActivityAnswer] = useState('');
  const [activityFeedback, setActivityFeedback] = useState(isComplete ? 'Already complete — you can review the activity any time.' : '');
  const [hasPassedActivity, setHasPassedActivity] = useState(isComplete);
  const activity = lesson.activity;

  useEffect(() => {
    setActivityAnswer('');
    setActivityFeedback(isComplete ? 'Already complete — you can review the activity any time.' : '');
    setHasPassedActivity(isComplete);
  }, [lesson.id, isComplete]);

  function checkActivity() {
    const result = validateLessonActivity(activity, activityAnswer);
    setHasPassedActivity(result.passed);
    const mockEvaluation = createMockEvaluation({
      type: AI_EVALUATION_TYPES.lessonAnswer,
      screen: 'Lesson detail',
      title: lesson.title,
      skill: lesson.tags.join(', '),
      question: activity.prompt,
      answer: activityAnswer,
    });
    setActivityFeedback(result.passed
      ? `What was correct: your answer matched the activity goal. Still needs work: nothing required for this check. Next hint: ${mockEvaluation.nextHint}`
      : `What was correct: you made an attempt and can compare it with the lesson concept. Still needs work: match the expected idea more closely. Next hint: ${lesson.hint}`);
  }

  function revealAnswer() {
    setActivityAnswer(activity.sampleAnswer ?? activity.expectedAnswer);
    setHasPassedActivity(true);
    setActivityFeedback('Example revealed. Read it carefully, then complete the lesson when it makes sense.');
  }

  return (
    <article className="lesson-card lesson-screen" aria-labelledby="lesson-screen-title">
      <button className="back-button" type="button" onClick={onBack}>← Back to roadmap</button>
      <div className="section-heading">
        <p className="eyebrow">{lesson.roadmapSection}</p>
        <span>{lesson.minutes} min</span>
      </div>
      <h2 id="lesson-screen-title">{lesson.title}</h2>
      <div className="lesson-meta">
        {lesson.tags.map((tag) => <span key={tag}>{tag}</span>)}
        <span>+{lesson.xpReward} XP</span>
      </div>
      <div className="concept-card">
        <strong>Concept</strong>
        <p>{lesson.concept}</p>
      </div>
      <p>{lesson.explanation}</p>

      {lesson.codeExample && (
        <div className="code-example">
          <strong>Example</strong>
          <pre><code>{lesson.codeExample}</code></pre>
        </div>
      )}

      <div className="mini-task">
        <strong>Try it yourself</strong>
        <p>{lesson.miniTask}</p>
      </div>

      <div className="activity-card">
        <div>
          <strong>Interactive check</strong>
          <p>{activity.prompt}</p>
        </div>
        {activity.type === 'choice' ? (
          <div className="activity-choices">
            {activity.choices.map((choice) => (
              <label className="activity-choice" key={choice}>
                <input checked={activityAnswer === choice} onChange={() => setActivityAnswer(choice)} type="radio" name={`activity-${lesson.id}`} />
                <span>{choice}</span>
              </label>
            ))}
          </div>
        ) : (
          <textarea
            aria-label="Lesson activity answer"
            onChange={(event) => setActivityAnswer(event.target.value)}
            placeholder="Type your answer here..."
            value={activityAnswer}
          />
        )}
        <details className="hint-card inline-hint">
          <summary>Need a hint?</summary>
          <p>{lesson.hint}</p>
        </details>
        {activityFeedback && <p className={`activity-feedback ${hasPassedActivity ? 'passed' : 'needs-work'}`} role="status">{activityFeedback}</p>}
        {!hasPassedActivity && activityFeedback && (
          <button className="secondary-button" type="button" onClick={() => onAskAiHelp(lesson)}>Ask AI Buddy for help</button>
        )}
        <div className="lesson-actions compact-actions">
          <button className="secondary-button" type="button" onClick={checkActivity}>Check my answer</button>
          <button className="secondary-button" type="button" onClick={revealAnswer}>Reveal example</button>
        </div>
      </div>

      <div className="lesson-actions">
        <button className="primary-button" disabled={!hasPassedActivity} type="button" onClick={() => onComplete(lesson)}>
          {isComplete ? 'Lesson complete ✓' : hasPassedActivity ? `Complete lesson for ${lesson.xpReward} XP` : 'Complete unlocks after the activity'}
        </button>
        <button className="secondary-button" type="button" onClick={() => onAskAiHelp(lesson)}>
          Ask AI to explain this lesson
        </button>
      </div>
    </article>
  );
}

function validateLessonActivity(activity, answer) {
  const normalizedAnswer = String(answer ?? '').trim().toLowerCase();
  const expected = String(activity.expectedAnswer ?? '').trim().toLowerCase();

  if (activity.validation === 'non-empty') return { passed: normalizedAnswer.length >= 3 };
  if (activity.validation === 'contains') return { passed: normalizedAnswer.includes(expected) };
  return { passed: normalizedAnswer === expected };
}

function renderChecklistCard({ checklistIsComplete, completedChecklistCount, toggleChecklistItem, progress, dailyGoalIsComplete }) {
  return (
    <section className="checklist-card" aria-labelledby="checklist-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Daily checklist</p>
          <h2 id="checklist-title">Small wins for today</h2>
        </div>
        <strong>{completedChecklistCount}/{dailyChecklist.length}</strong>
      </div>
      <p>Daily goal: complete {DAILY_GOAL_COUNT} checklist items to grow your streak.</p>
      <div className="checklist-items">
        {dailyChecklist.map((item) => (
          <label className="checklist-item" key={item.id}>
            <input
              checked={Boolean(progress.todayChecklist[item.id])}
              onChange={() => toggleChecklistItem(item)}
              type="checkbox"
            />
            <span>{item.label}</span>
            <small>+{item.xp} XP</small>
          </label>
        ))}
      </div>
      {dailyGoalIsComplete && <p className="celebration">Daily goal complete! Your streak is safe today. ⭐</p>}
      {checklistIsComplete && <p className="celebration">Quest complete! Your future self says thanks. 🎉</p>}
    </section>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="checklist-item">
      <span>{label}</span>
      <small>{value}</small>
    </div>
  );
}

function getProjectStatus(projectId, projectProgress = {}) {
  const projectIndex = beginnerProjects.findIndex((project) => project.id === projectId);
  const savedStatus = projectProgress?.[projectId]?.status;

  if (savedStatus === 'completed') return 'completed';
  if (savedStatus === 'in-progress') return 'in-progress';
  if (projectIndex === 0) return 'unlocked';

  const previousProject = beginnerProjects[projectIndex - 1];
  if (previousProject && projectProgress?.[previousProject.id]?.status === 'completed') {
    return savedStatus === 'unlocked' ? 'unlocked' : 'unlocked';
  }

  return 'locked';
}

function getProjectStatusLabel(status) {
  if (status === 'completed') return 'Completed ✓';
  if (status === 'in-progress') return 'In progress';
  if (status === 'unlocked') return 'Unlocked';
  return 'Locked 🔒';
}

function getFirstUnlockedIncompleteProject(projectProgress = {}) {
  return beginnerProjects.find((project) => {
    const status = getProjectStatus(project.id, projectProgress);
    return status !== 'locked' && status !== 'completed';
  });
}

function getNextProject(projectId) {
  const projectIndex = beginnerProjects.findIndex((project) => project.id === projectId);
  return beginnerProjects[projectIndex + 1] ?? null;
}

function getChallengeStatus(challengeId, challengeProgress = {}) {
  const challengeIndex = beginnerChallenges.findIndex((challenge) => challenge.id === challengeId);
  const savedStatus = challengeProgress?.[challengeId]?.status;

  if (savedStatus === 'completed') return 'completed';
  if (savedStatus === 'in-progress') return 'in-progress';
  if (challengeIndex === 0) return savedStatus === 'in-progress' ? 'in-progress' : 'unlocked';

  const previousChallenge = beginnerChallenges[challengeIndex - 1];
  if (previousChallenge && challengeProgress?.[previousChallenge.id]?.status === 'completed') {
    return savedStatus === 'in-progress' ? 'in-progress' : 'unlocked';
  }

  return 'locked';
}

function getChallengeStatusLabel(status) {
  if (status === 'completed') return 'Completed ✓';
  if (status === 'in-progress') return 'In progress';
  if (status === 'unlocked') return 'Unlocked';
  return 'Locked 🔒';
}

function getFirstUnlockedIncompleteChallenge(challengeProgress = {}) {
  return beginnerChallenges.find((challenge) => {
    const status = getChallengeStatus(challenge.id, challengeProgress);
    return status !== 'locked' && status !== 'completed';
  });
}

function getNextChallenge(challengeId) {
  const challengeIndex = beginnerChallenges.findIndex((challenge) => challenge.id === challengeId);
  return beginnerChallenges[challengeIndex + 1] ?? null;
}

function addWeakChallengeSkills(currentWeakSkills = {}, skillTags = []) {
  return skillTags.reduce((weakSkills, skill) => ({
    ...weakSkills,
    [skill]: {
      count: (weakSkills[skill]?.count ?? 0) + 1,
      lastMarkedAt: new Date().toISOString(),
      source: 'challenge',
    },
  }), currentWeakSkills ?? {});
}

function getFirstUnlockedIncompleteLesson(completedLessonIds) {
  return beginnerLessons.find((lesson) => isLessonUnlocked(lesson.id, completedLessonIds) && !completedLessonIds.includes(lesson.id));
}

function isLessonUnlocked(lessonId, completedLessonIds) {
  const lessonIndex = beginnerLessons.findIndex((lesson) => lesson.id === lessonId);
  if (lessonIndex === -1) return false;
  if (lessonIndex === 0) return true;

  return completedLessonIds.includes(beginnerLessons[lessonIndex - 1].id);
}

function getLessonStatusLabel(status) {
  if (status === 'completed') return 'Completed ✓';
  if (status === 'unlocked') return 'Unlocked';
  return 'Locked 🔒';
}

function getWeakSkills(reviewProgress, weakChallengeSkills = {}) {
  const combinedWeakSkills = { ...reviewProgress.weakSkills };

  Object.entries(weakChallengeSkills ?? {}).forEach(([skill, value]) => {
    combinedWeakSkills[skill] = {
      count: (combinedWeakSkills[skill]?.count ?? 0) + (value.count ?? 0),
      lastMarkedAt: value.lastMarkedAt ?? combinedWeakSkills[skill]?.lastMarkedAt ?? null,
    };
  });

  return Object.entries(combinedWeakSkills ?? {})
    .map(([name, details]) => ({
      name,
      count: details.count ?? 0,
      lastMarkedAt: details.lastMarkedAt ?? null,
    }))
    .filter((skill) => skill.count > 0)
    .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name));
}

function getPrioritizedReviewCards(reviewProgress) {
  return [...reviewCards]
    .sort((first, second) => {
      const firstProgress = reviewProgress.cards?.[first.id] ?? {};
      const secondProgress = reviewProgress.cards?.[second.id] ?? {};
      const firstWeakCount = reviewProgress.weakSkills?.[first.skill]?.count ?? 0;
      const secondWeakCount = reviewProgress.weakSkills?.[second.skill]?.count ?? 0;
      const firstNeedsPractice = firstProgress.lastResult === 'practice' ? 1 : 0;
      const secondNeedsPractice = secondProgress.lastResult === 'practice' ? 1 : 0;
      const firstAttempts = firstProgress.attempts ?? 0;
      const secondAttempts = secondProgress.attempts ?? 0;

      return secondWeakCount - firstWeakCount
        || secondNeedsPractice - firstNeedsPractice
        || firstAttempts - secondAttempts
        || reviewCards.findIndex((card) => card.id === first.id) - reviewCards.findIndex((card) => card.id === second.id);
    })
    .slice(0, 6);
}

function getEarnedBadges(progress, dailyGoalIsComplete, completedBeginnerLessonsCount, completedProjectsCount) {
  return [
    completedBeginnerLessonsCount > 0 && 'First Lesson',
    completedBeginnerLessonsCount === beginnerLessons.length && 'Path Explorer',
    completedProjectsCount > 0 && 'Builder',
    completedProjectsCount === beginnerProjects.length && 'Project Finisher',
    progress.totalXp >= 100 && '100 XP Club',
    dailyGoalIsComplete && 'Daily Goal',
    progress.streak >= 3 && 'Streak Starter',
  ].filter(Boolean);
}

export default App;
