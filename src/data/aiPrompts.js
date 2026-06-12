// Milestone 5 keeps AI help local-first: these templates only build text the learner can copy.
export const AI_HELPER_XP_REWARD = 10;

export const aiPromptCategories = [
  {
    id: 'explain-code',
    label: 'Explain this code',
    shortLabel: 'Explain code',
    helper: 'Ask for a plain-language walkthrough of pasted code.',
  },
  {
    id: 'fix-error',
    label: 'Fix this error',
    shortLabel: 'Fix error',
    helper: 'Share code plus the exact error message you see.',
  },
  {
    id: 'improve-code',
    label: 'Improve this code',
    shortLabel: 'Improve code',
    helper: 'Ask for small beginner-friendly improvements without a rewrite.',
  },
  {
    id: 'explain-file',
    label: 'Explain this file like I am a beginner',
    shortLabel: 'Explain file',
    helper: 'Understand one file, its imports, exports, and job in the app.',
  },
  {
    id: 'practice-challenge',
    label: 'Create a practice challenge',
    shortLabel: 'Practice challenge',
    helper: 'Turn your goal into a small coding exercise with hints.',
  },
  {
    id: 'lesson-help',
    label: 'Help me understand this lesson',
    shortLabel: 'Lesson help',
    helper: 'Ask for a lesson explanation, examples, and a tiny quiz.',
  },
  {
    id: 'review-playground',
    label: 'Review my playground code',
    shortLabel: 'Review code',
    helper: 'Get feedback on your HTML, CSS, and JavaScript practice code.',
  },
  {
    id: 'challenge-help',
    label: 'Get challenge help',
    shortLabel: 'Challenge help',
    helper: 'Ask for hints or explanations for a CodeQuest challenge without auto-sending anything.',
  },
  {
    id: 'project-help',
    label: 'Get project help',
    shortLabel: 'Project help',
    helper: 'Ask for steps, bug fixes, improvements, or simpler explanations for a beginner project.',
  },
  {
    id: 'codex-safe-edit',
    label: 'Ask Codex to safely edit the project',
    shortLabel: 'Codex safe edit',
    helper: 'Use safety rules before asking Codex to change a project.',
  },
];

export const readyMadePromptTemplates = [
  {
    id: 'bug-hunt',
    title: 'Bug hunt without overwhelm',
    categoryId: 'fix-error',
    description: 'Great when the app shows an error and you do not know where to start.',
    draft: {
      errorMessage: 'Paste the exact error message here.',
      buildGoal: 'I am trying to make my page work again without changing the whole app.',
      confusion: 'I do not understand what the error means or which file to check first.',
    },
  },
  {
    id: 'tiny-next-step',
    title: 'Tiny next step challenge',
    categoryId: 'practice-challenge',
    description: 'Ask AI to create a short exercise instead of a huge project.',
    draft: {
      buildGoal: 'I want to practise HTML, CSS, and JavaScript with one tiny feature.',
      confusion: 'Please keep it beginner-friendly and give hints before the answer.',
    },
  },
  {
    id: 'vibe-coded-app',
    title: 'Explain vibe-coded app',
    categoryId: 'explain-file',
    description: 'Use this to understand how an AI-assisted app is put together.',
    draft: {
      fileName: 'My React + Vite app',
      buildGoal: 'I want to understand the whole app before I edit it.',
      confusion: 'Please explain the folder structure, important files, imports and exports, state, localStorage, and how data flows through the app.',
    },
  },
  {
    id: 'project-coach',
    title: 'Project coach',
    categoryId: 'project-help',
    description: 'Use this when you are building one of the guided beginner projects.',
    draft: {
      fileName: 'CodeQuest guided project',
      buildGoal: 'I am building a beginner HTML, CSS, and JavaScript project.',
      confusion: 'Please help me understand the steps, fix my pasted project code if needed, and suggest one small improvement after it works.',
    },
  },
  {
    id: 'explain-weak-skill',
    title: 'Explain a weak skill',
    categoryId: 'lesson-help',
    description: 'Use this after Review marks a topic as something to practise.',
    draft: {
      fileName: 'My weak skill from CodeQuest Review',
      buildGoal: 'Explain this weak skill to me like I am a beginner.',
      confusion: 'Please use simple words, a tiny code example if helpful, and one quick check question.',
    },
  },
  {
    id: 'weak-skill-challenge',
    title: 'Weak skill practice challenge',
    categoryId: 'practice-challenge',
    description: 'Ask for a small practice challenge for one review skill.',
    draft: {
      fileName: 'My weak skill from CodeQuest Review',
      buildGoal: 'Create a small practice challenge for this skill.',
      confusion: 'Please make it beginner-friendly, possible in the CodeQuest Playground, and include hints before the answer.',
    },
  },
  {
    id: 'codex-safety',
    title: 'Codex safety prompt',
    categoryId: 'codex-safe-edit',
    description: 'Start a safer Codex task with small changes and clear testing.',
    draft: {
      buildGoal: 'I want Codex to add one small feature safely.',
      confusion: 'Please start from latest main, create a fresh branch, do not rebuild from scratch, keep changes small, explain changed files, and run the build if possible.',
    },
  },
  {
    id: 'challenge-not-passing',
    title: 'Explain why my challenge is not passing',
    categoryId: 'challenge-help',
    description: 'Paste challenge code and checker feedback for a beginner-friendly explanation.',
    draft: {
      fileName: 'CodeQuest challenge',
      buildGoal: 'I am trying to pass a CodeQuest coding challenge.',
      confusion: 'Please explain why my challenge is not passing. Do not shame me; show the next small fix first.',
    },
  },
  {
    id: 'challenge-hint-only',
    title: 'Give me a hint without giving me the full answer',
    categoryId: 'challenge-help',
    description: 'Get one gentle nudge while keeping the solution yours.',
    draft: {
      fileName: 'CodeQuest challenge',
      buildGoal: 'I want to solve this challenge myself.',
      confusion: 'Please give me one hint without giving me the full answer.',
    },
  },
  {
    id: 'challenge-beginner-solution',
    title: 'Explain the solution like I am a beginner',
    categoryId: 'challenge-help',
    description: 'Use after trying a challenge when you want the solution explained simply.',
    draft: {
      fileName: 'CodeQuest challenge',
      buildGoal: 'I want to understand the solution to this beginner coding challenge.',
      confusion: 'Please explain the solution like I am a beginner, step by step.',
    },
  },
  {
    id: 'similar-challenge',
    title: 'Create a similar practice challenge',
    categoryId: 'practice-challenge',
    description: 'Ask for another tiny challenge using the same skill.',
    draft: {
      fileName: 'CodeQuest challenge',
      buildGoal: 'I finished or tried a beginner CodeQuest challenge and want more practice.',
      confusion: 'Please create a similar practice challenge with hints, but do not include the full answer until I ask.',
    },
  },
];

export const emptyAiHelperDraft = {
  categoryId: 'explain-code',
  code: '',
  errorMessage: '',
  fileName: '',
  buildGoal: '',
  confusion: '',
  generatedPrompt: '',
};

export function buildAiPrompt(draft) {
  const categoryId = draft.categoryId || emptyAiHelperDraft.categoryId;
  const category = aiPromptCategories.find((item) => item.id === categoryId) ?? aiPromptCategories[0];
  const contextLines = [
    draft.fileName ? `File or lesson name: ${draft.fileName}` : '',
    draft.buildGoal ? `What I am trying to build: ${draft.buildGoal}` : '',
    draft.confusion ? `What I do not understand: ${draft.confusion}` : '',
    draft.errorMessage ? `Error message:\n${draft.errorMessage}` : '',
    draft.code ? `Code or project notes:\n${draft.code}` : '',
  ].filter(Boolean);
  const contextBlock = contextLines.length ? contextLines.join('\n\n') : 'I have not added details yet. Please ask me 3 simple questions to get started.';

  return `${getCategoryOpening(category.id)}

Please follow these rules:
- Explain things like I am a beginner.
- Use simple words before technical words.
- Do not shame me for mistakes.
- Give me small steps I can try one at a time.
- If you suggest code, explain where it goes and why it helps.

My details:
${contextBlock}

${getCategoryRequest(category.id)}`;
}

function getCategoryOpening(categoryId) {
  switch (categoryId) {
    case 'fix-error':
      return 'You are a patient coding tutor. Help me understand and fix this error.';
    case 'improve-code':
      return 'You are a patient coding tutor. Help me improve this code without rewriting everything.';
    case 'explain-file':
      return 'You are a patient coding tutor. Explain this file or app like I am a beginner.';
    case 'practice-challenge':
      return 'You are a patient coding coach. Create a tiny practice challenge for me.';
    case 'lesson-help':
      return 'You are a patient coding tutor. Help me understand this lesson.';
    case 'review-playground':
      return 'You are a patient coding tutor. Review my playground code and help me learn from it.';
    case 'challenge-help':
      return 'You are a patient coding tutor. Help me understand this coding challenge without shaming me.';
    case 'project-help':
      return 'You are a patient coding project coach. Help me build this beginner project step by step.';
    case 'codex-safe-edit':
      return 'You are Codex helping in an existing project. Make safe, small changes only.';
    case 'explain-code':
    default:
      return 'You are a patient coding tutor. Explain this code like I am a beginner.';
  }
}

function getCategoryRequest(categoryId) {
  switch (categoryId) {
    case 'fix-error':
      return 'Please explain what the error means, list the most likely cause, show the smallest safe fix, and give me one check to confirm it worked.';
    case 'improve-code':
      return 'Please suggest 3 small improvements, explain why each one helps, and avoid changing the whole design or structure unless it is necessary.';
    case 'explain-file':
      return 'Please explain the folder structure or file purpose, important imports and exports, state, localStorage usage, and how data flows through the app.';
    case 'practice-challenge':
      return 'Please create a 10-20 minute challenge with a goal, starter hints, stretch idea, and a hidden answer I can reveal after trying.';
    case 'lesson-help':
      return 'Please summarize the lesson, give a real-world analogy, explain the key terms, and ask me 3 quick check-for-understanding questions.';
    case 'review-playground':
      return 'Please review my HTML, CSS, and JavaScript separately, point out one thing I did well, one bug risk, and one beginner-friendly next improvement.';
    case 'challenge-help':
      return 'Please use the challenge instructions, checker feedback, and pasted code to explain the next helpful step. If I asked for a hint, do not give the full answer.';
    case 'project-help':
      return 'Please help me with this project in one of these ways: explain how to build it, find bugs in my pasted code, suggest simple improvements, or explain the checklist steps in beginner-friendly words.';
    case 'codex-safe-edit':
      return 'Please start from the latest main branch, create a fresh branch, do not rebuild the app from scratch, keep the diff small, avoid unrelated files, explain changed files, and run the build if possible.';
    case 'explain-code':
    default:
      return 'Please walk through the code from top to bottom, explain important lines, name any confusing syntax, and suggest one tiny experiment I can try.';
  }
}
