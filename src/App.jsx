import React, { useEffect, useMemo, useState } from 'react';
import { BottomNav } from './components/BottomNav.jsx';
import { StatCard } from './components/StatCard.jsx';
import { dailyChecklist, dailyGoal, todaysLesson } from './data/sampleData.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import {
  completeChecklistItem,
  completeLesson,
  getEarnedBadgeDetails,
  getLocalDateKey,
  getTodayChecklist,
  getXpToNextLevel,
  initialProgress,
  isDailyGoalComplete,
  normalizeProgress,
  startDailySession,
} from './lib/progress.js';

function App() {
  const todayKey = useMemo(() => getLocalDateKey(), []);
  const [progress, setProgress] = useLocalStorage('codequest-progress', initialProgress);
  const [activeNavItem, setActiveNavItem] = useState('home');
  const [feedback, setFeedback] = useState('');

  // Normalize saved progress on every render so old Milestone 1 data still works
  // and the UI can safely read all Milestone 2 fields.
  const safeProgress = normalizeProgress(progress, todayKey);
  const completedToday = getTodayChecklist(safeProgress, todayKey);
  const completedChecklistCount = completedToday.length;
  const dailyGoalPercent = Math.min(100, (completedChecklistCount / dailyGoal.targetCompletedItems) * 100);
  const dailyGoalComplete = isDailyGoalComplete(safeProgress, todayKey);
  const lessonIsComplete = safeProgress.completedLessons.includes(todaysLesson.id);
  const earnedBadges = getEarnedBadgeDetails(safeProgress);

  useEffect(() => {
    const sessionResult = startDailySession(progress, todayKey);
    setProgress(sessionResult.progress);

    if (sessionResult.message) {
      setFeedback(sessionResult.message);
    }
    // This runs when the app opens. The progress helper prevents duplicate XP
    // during React Strict Mode and browser refreshes by checking today's item ids.
  }, []);

  useEffect(() => {
    if (!feedback) return undefined;

    const timeoutId = window.setTimeout(() => setFeedback(''), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  function handleChecklistItem(item) {
    if (item.automatic || completedToday.includes(item.id)) return;

    const result = completeChecklistItem(safeProgress, item.id, todayKey);
    setProgress(result.progress);
    setFeedback(result.message);
  }

  function continueLearning() {
    const result = completeLesson(safeProgress, todaysLesson, todayKey);
    setProgress(result.progress);
    setFeedback(result.message);
  }

  function renderMainContent() {
    if (activeNavItem === 'profile') {
      return (
        <ProfilePage
          completedChecklistCount={completedChecklistCount}
          dailyGoalPercent={dailyGoalPercent}
          earnedBadges={earnedBadges}
          progress={safeProgress}
        />
      );
    }

    if (activeNavItem !== 'home') {
      return <PlaceholderPage activeNavItem={activeNavItem} />;
    }

    return (
      <>
        <section className="stats-grid" aria-label="Your learning stats">
          <StatCard label="XP total" value={safeProgress.totalXp.toLocaleString()} helper="Keep collecting stars" />
          <StatCard label="Level" value={safeProgress.level} helper={`${getXpToNextLevel(safeProgress.totalXp)} XP to next`} />
          <StatCard label="Streak" value={`${safeProgress.currentStreak} days`} helper="Complete your daily goal" />
        </section>

        <section className="goal-card" aria-labelledby="daily-goal-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Daily goal</p>
              <h2 id="daily-goal-title">{dailyGoal.label}</h2>
            </div>
            <strong>{completedChecklistCount}/{dailyGoal.targetCompletedItems}</strong>
          </div>
          <div className="progress-track" aria-label={`${Math.round(dailyGoalPercent)}% daily goal progress`}>
            <span style={{ width: `${dailyGoalPercent}%` }} />
          </div>
          <p className="goal-copy">
            {dailyGoalComplete
              ? 'Goal complete! Your streak is protected for today. 🔥'
              : 'Finish enough daily quests to grow your streak.'}
          </p>
import React from 'react';
import { BottomNav } from './components/BottomNav.jsx';
import { StatCard } from './components/StatCard.jsx';
import { dailyChecklist, todaysLesson } from './data/sampleData.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';

const initialProgress = {
  xp: 120,
  streak: 3,
  completedLessons: ['lesson-web-basics'],
  checklist: {
    'open-app': true,
  },
};

function getLevelFromXp(xp) {
  // Every 100 XP moves the learner up one level in this first version.
  return Math.max(1, Math.floor(xp / 100) + 1);
}

function App() {
  const [progress, setProgress] = useLocalStorage('codequest-progress', initialProgress);
  const activeNavItem = 'home';
  const level = getLevelFromXp(progress.xp);
  const completedChecklistCount = dailyChecklist.filter((item) => progress.checklist[item.id]).length;
  const checklistIsComplete = completedChecklistCount === dailyChecklist.length;
  const lessonIsComplete = progress.completedLessons.includes(todaysLesson.id);

  function toggleChecklistItem(item) {
    setProgress((currentProgress) => {
      const itemIsComplete = Boolean(currentProgress.checklist[item.id]);

      return {
        ...currentProgress,
        xp: Math.max(0, currentProgress.xp + (itemIsComplete ? -item.xp : item.xp)),
        checklist: {
          ...currentProgress.checklist,
          [item.id]: !itemIsComplete,
        },
      };
    });
  }

  function continueLearning() {
    // In milestone 1, this button simulates completing today's lesson locally.
    if (lessonIsComplete) return;

    setProgress((currentProgress) => ({
      ...currentProgress,
      xp: currentProgress.xp + todaysLesson.xpReward,
      streak: Math.max(currentProgress.streak, 4),
      completedLessons: [...new Set([...currentProgress.completedLessons, todaysLesson.id])],
      checklist: {
        ...currentProgress.checklist,
        'read-lesson': true,
      },
    }));
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
          <StatCard label="XP total" value={progress.xp.toLocaleString()} helper="Keep collecting stars" />
          <StatCard label="Level" value={level} helper={`${100 - (progress.xp % 100)} XP to next`} />
          <StatCard label="Streak" value={`${progress.streak} days`} helper="Come back tomorrow" />
        </section>

        <section className="lesson-card" aria-labelledby="lesson-title">
          <div className="section-heading">
            <p className="eyebrow">Today&apos;s lesson</p>
            <span>{todaysLesson.minutes} min</span>
          </div>
          <h2 id="lesson-title">{todaysLesson.title}</h2>
          <p>{todaysLesson.goal}</p>
          <div className="lesson-meta">
            <span>{todaysLesson.language}</span>
            <span>+{todaysLesson.xpReward} XP</span>
          </div>
          <div className="progress-track" aria-label={`${todaysLesson.progress}% lesson progress`}>
            <span style={{ width: `${lessonIsComplete ? 100 : todaysLesson.progress}%` }} />
          </div>
          <button className="primary-button" disabled={lessonIsComplete} type="button" onClick={continueLearning}>
          <button className="primary-button" type="button" onClick={continueLearning}>
            {lessonIsComplete ? 'Lesson complete ✓' : 'Continue learning'}
          </button>
        </section>

        <section className="checklist-card" aria-labelledby="checklist-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Daily checklist</p>
              <h2 id="checklist-title">Small wins for today</h2>
            </div>
            <strong>{completedChecklistCount}/{dailyChecklist.length}</strong>
          </div>
          <div className="checklist-items">
            {dailyChecklist.map((item) => {
              const isComplete = completedToday.includes(item.id);

              return (
                <label className={`checklist-item ${isComplete ? 'complete' : ''}`} key={item.id}>
                  <input
                    checked={isComplete}
                    disabled={item.automatic || isComplete}
                    onChange={() => handleChecklistItem(item)}
                    type="checkbox"
                  />
                  <span>{item.label}</span>
                  <small>{isComplete ? 'Done today' : `+${item.xp} XP`}</small>
                </label>
              );
            })}
          </div>
          {dailyGoalComplete && <p className="celebration">Daily goal complete! Come back tomorrow to keep the streak. 🎉</p>}
        </section>
      </>
    );
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
          <div className="hero-badge" aria-label={`${safeProgress.level} current level`}>
            <span>Lvl</span>
            <strong>{safeProgress.level}</strong>
          </div>
        </header>

        {feedback && <p className="xp-feedback" role="status">{feedback}</p>}

        {renderMainContent()}
      </main>

      <BottomNav activeItem={activeNavItem} onSelect={setActiveNavItem} />
            {dailyChecklist.map((item) => (
              <label className="checklist-item" key={item.id}>
                <input
                  checked={Boolean(progress.checklist[item.id])}
                  onChange={() => toggleChecklistItem(item)}
                  type="checkbox"
                />
                <span>{item.label}</span>
                <small>+{item.xp} XP</small>
              </label>
            ))}
          </div>
          {checklistIsComplete && <p className="celebration">Quest complete! Your future self says thanks. 🎉</p>}
        </section>
      </main>

      <BottomNav activeItem={activeNavItem} />
    </div>
  );
}

function ProfilePage({ completedChecklistCount, dailyGoalPercent, earnedBadges, progress }) {
  return (
    <section className="profile-card" aria-labelledby="profile-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Profile</p>
          <h2 id="profile-title">Your CodeQuest stats</h2>
        </div>
        <strong>Lvl {progress.level}</strong>
      </div>

      <div className="profile-grid">
        <StatCard label="Total XP" value={progress.totalXp.toLocaleString()} helper={`${getXpToNextLevel(progress.totalXp)} XP to next`} />
        <StatCard label="Level" value={progress.level} helper="Based on total XP" />
        <StatCard label="Streak" value={`${progress.currentStreak} days`} helper="Goal-based streak" />
        <StatCard label="Lessons" value={progress.completedLessons.length} helper="Completed locally" />
      </div>

      <div className="profile-section">
        <div className="section-heading compact">
          <h3>Daily goal progress</h3>
          <span>{completedChecklistCount}/{dailyGoal.targetCompletedItems}</span>
        </div>
        <div className="progress-track" aria-label={`${Math.round(dailyGoalPercent)}% daily goal progress`}>
          <span style={{ width: `${dailyGoalPercent}%` }} />
        </div>
      </div>

      <div className="profile-section">
        <div className="section-heading compact">
          <h3>Badges earned</h3>
          <span>{earnedBadges.length}</span>
        </div>
        {earnedBadges.length > 0 ? (
          <div className="badge-list">
            {earnedBadges.map((badge) => (
              <article className="badge-pill" key={badge.id}>
                <span aria-hidden="true">{badge.emoji}</span>
                <div>
                  <strong>{badge.name}</strong>
                  <small>{badge.description}</small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">Complete daily quests and lessons to earn your first badge.</p>
        )}
      </div>
    </section>
  );
}

function PlaceholderPage({ activeNavItem }) {
  const title = activeNavItem.charAt(0).toUpperCase() + activeNavItem.slice(1);

  return (
    <section className="placeholder-card" aria-labelledby="placeholder-title">
      <p className="eyebrow">Coming soon</p>
      <h2 id="placeholder-title">{title}</h2>
      <p>Milestone 2 keeps the focus on local XP, streaks, daily progress, and profile stats.</p>
    </section>
  );
}

export default App;
