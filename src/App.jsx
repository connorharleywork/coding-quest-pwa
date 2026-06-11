import React, { useEffect, useMemo, useState } from 'react';
import { BottomNav } from './components/BottomNav.jsx';
import { StatCard } from './components/StatCard.jsx';
import { dailyChecklist, todaysLesson } from './data/sampleData.js';
import {
  DAILY_GOAL_COUNT,
  completeChecklistItem,
  getCompletedChecklistCount,
  getLevelFromXp,
  loadProgress,
  saveProgress,
  setChecklistItemCompletion,
} from './utils/progress.js';

const openAppChecklistItem = dailyChecklist.find((item) => item.id === 'open-app');
const readLessonChecklistItem = dailyChecklist.find((item) => item.id === 'read-lesson');

function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [activeNavItem, setActiveNavItem] = useState('home');
  const [xpFeedback, setXpFeedback] = useState('');

  const level = getLevelFromXp(progress.totalXp);
  const completedChecklistCount = getCompletedChecklistCount(progress, dailyChecklist);
  const checklistIsComplete = completedChecklistCount === dailyChecklist.length;
  const dailyGoalIsComplete = completedChecklistCount >= DAILY_GOAL_COUNT;
  const lessonIsComplete = progress.completedLessons.includes(todaysLesson.id);
  const badges = useMemo(() => getEarnedBadges(progress, dailyGoalIsComplete), [dailyGoalIsComplete, progress]);

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

  function continueLearning() {
    // This button simulates completing today's lesson locally until real lessons exist.
    if (lessonIsComplete) {
      setXpFeedback('Today\'s lesson is already complete. Great work!');
      return;
    }

    setProgress((currentProgress) => {
      const lessonProgress = {
        ...currentProgress,
        totalXp: currentProgress.totalXp + todaysLesson.xpReward,
        completedLessons: [...new Set([...currentProgress.completedLessons, todaysLesson.id])],
      };
      const result = readLessonChecklistItem
        ? completeChecklistItem(lessonProgress, readLessonChecklistItem, dailyChecklist)
        : { progress: lessonProgress, xpEarned: 0, goalCompletedNow: false };
      const checklistXp = result.xpEarned > 0 ? ` +${result.xpEarned} checklist XP.` : '';
      const goalMessage = result.goalCompletedNow ? ' Daily goal complete — streak updated!' : '';

      setXpFeedback(`Lesson complete! +${todaysLesson.xpReward} XP.${checklistXp}${goalMessage}`);
      return result.progress;
    });
  }

  function completePracticeChallenge() {
    const challengeItem = dailyChecklist.find((item) => item.id === 'solve-challenge');
    if (challengeItem) completeItem(challengeItem, 'Practice challenge solved!');
  }

  function completeReflection() {
    const reflectionItem = dailyChecklist.find((item) => item.id === 'reflect');
    if (reflectionItem) completeItem(reflectionItem, 'Reflection saved!');
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
            {renderLessonCard({ lessonIsComplete, continueLearning })}
            {renderChecklistCard({ checklistIsComplete, completedChecklistCount, toggleChecklistItem, progress, dailyGoalIsComplete })}
          </>
        )}

        {activeNavItem === 'learn' && renderLessonCard({ lessonIsComplete, continueLearning })}

        {activeNavItem === 'practice' && (
          <section className="lesson-card" aria-labelledby="practice-title">
            <div className="section-heading">
              <p className="eyebrow">Practice</p>
              <span>+20 XP</span>
            </div>
            <h2 id="practice-title">Solve one practice challenge</h2>
            <p>Try a tiny HTML button challenge to build confidence one step at a time.</p>
            <button className="primary-button" type="button" onClick={completePracticeChallenge}>
              Mark practice complete
            </button>
          </section>
        )}

        {activeNavItem === 'projects' && (
          <section className="lesson-card" aria-labelledby="projects-title">
            <div className="section-heading">
              <p className="eyebrow">Projects</p>
              <span>Mini build</span>
            </div>
            <h2 id="projects-title">Reflect on your progress</h2>
            <p>Write one thing you learned today before you start your next beginner project.</p>
            <button className="primary-button" type="button" onClick={completeReflection}>
              Mark reflection complete
            </button>
          </section>
        )}

        {activeNavItem === 'profile' && (
          <section className="checklist-card" aria-labelledby="profile-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Profile</p>
                <h2 id="profile-title">Your CodeQuest progress</h2>
              </div>
              <strong>{completedChecklistCount}/{dailyChecklist.length}</strong>
            </div>
            <div className="checklist-items">
              <ProfileRow label="Total XP" value={progress.totalXp.toLocaleString()} />
              <ProfileRow label="Level" value={level} />
              <ProfileRow label="Streak" value={`${progress.streak} days`} />
              <ProfileRow label="Completed lessons" value={progress.completedLessons.length} />
              <ProfileRow label="Badges earned" value={badges.length ? badges.join(', ') : 'None yet'} />
              <ProfileRow label="Today’s checklist" value={`${completedChecklistCount}/${dailyChecklist.length} done`} />
            </div>
          </section>
        )}
      </main>

      <BottomNav activeItem={activeNavItem} onSelect={setActiveNavItem} />
    </div>
  );
}

function renderLessonCard({ lessonIsComplete, continueLearning }) {
  return (
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
      <div className="progress-track" aria-label={`${lessonIsComplete ? 100 : todaysLesson.progress}% lesson progress`}>
        <span style={{ width: `${lessonIsComplete ? 100 : todaysLesson.progress}%` }} />
      </div>
      <button className="primary-button" type="button" onClick={continueLearning}>
        {lessonIsComplete ? 'Lesson complete ✓' : 'Continue learning'}
      </button>
    </section>
  );
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

function getEarnedBadges(progress, dailyGoalIsComplete) {
  return [
    progress.completedLessons.length > 0 && 'First Lesson',
    progress.totalXp >= 100 && '100 XP Club',
    dailyGoalIsComplete && 'Daily Goal',
    progress.streak >= 3 && 'Streak Starter',
  ].filter(Boolean);
}

export default App;
