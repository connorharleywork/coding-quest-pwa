export const AI_EVALUATION_TYPES = {
  lessonAnswer: 'lesson-answer',
  challengeCode: 'challenge-code',
  reviewAnswer: 'review-answer',
  projectQuestion: 'project-question',
};

export function buildEvaluationPrompt({ type, screen, title, skill, question, answer, code, feedback }) {
  return [
    'You are a patient beginner coding tutor for CodeQuest.',
    `Evaluation type: ${type}`,
    `Current screen: ${screen ?? 'Unknown'}`,
    title ? `Title: ${title}` : '',
    skill ? `Skill/topic: ${skill}` : '',
    question ? `Question or task: ${question}` : '',
    answer ? `Learner answer: ${answer}` : '',
    feedback ? `Current deterministic feedback: ${feedback}` : '',
    code ? `Learner code or notes:\n${code}` : '',
    'Respond with: what is correct, what still needs work, one next hint, and one tiny next step. Do not award XP.',
  ].filter(Boolean).join('\n\n');
}

export function createMockEvaluation(context) {
  // Future backend AI evaluation hook:
  // Send this sanitized context to a server endpoint that owns the AI provider call.
  // Do NOT store an API key in this static frontend; browser bundles and localStorage can be inspected by users.
  // Later payloads may include the current screen, lesson/challenge/project/review title, skill/topic,
  // learner answer, challenge or playground HTML/CSS/JS, and deterministic checker feedback.
  return {
    source: 'local-mock',
    prompt: buildEvaluationPrompt(context),
    whatWasCorrect: 'CodeQuest kept the deterministic lesson or challenge checker in control.',
    needsWork: 'Use the prompt with an AI assistant if you want a deeper explanation before trying again.',
    nextHint: 'Focus on the first missing requirement, then run the existing CodeQuest check again.',
  };
}
