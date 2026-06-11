// Milestone 2 still uses local sample data so the app works fully offline.
// Later milestones can replace this file with real lesson content.
export const todaysLesson = {
  id: 'lesson-html-buttons',
  title: 'Make your first button',
  language: 'HTML + CSS',
  minutes: 12,
  xpReward: 40,
  progress: 35,
  goal: 'Learn how buttons let people interact with a web page.',
};

export const dailyChecklist = [
  { id: 'open-app', label: 'Open CodeQuest', xp: 5, automatic: true },
  { id: 'read-lesson', label: 'Read today\'s mini lesson', xp: 10 },
  { id: 'solve-challenge', label: 'Solve one practice challenge', xp: 20 },
  { id: 'reflect', label: 'Write one thing you learned', xp: 5 },
];

export const dailyGoal = {
  targetCompletedItems: 3,
  label: 'Complete 3 daily quests',
};

export const badges = [
  { id: 'first-open', name: 'First Step', emoji: '👋', description: 'Opened CodeQuest for a daily quest.' },
  { id: 'first-lesson', name: 'Lesson Starter', emoji: '📘', description: 'Completed your first lesson.' },
  { id: 'xp-100', name: '100 XP Club', emoji: '⭐', description: 'Earned 100 total XP.' },
  { id: 'streak-3', name: '3-Day Spark', emoji: '🔥', description: 'Reached a 3-day learning streak.' },
];

export const navItems = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'learn', label: 'Learn', icon: '📘' },
  { id: 'practice', label: 'Practice', icon: '⚡' },
  { id: 'projects', label: 'Projects', icon: '🛠️' },
  { id: 'profile', label: 'Profile', icon: '🙂' },
];
