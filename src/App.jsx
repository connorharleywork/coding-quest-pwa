import React, { useEffect, useMemo, useState } from 'react';
import { BottomNav } from './components/BottomNav.jsx';
import { StatCard } from './components/StatCard.jsx';
import { beginnerLessons } from './data/lessons.js';
import { dailyChecklist } from './data/sampleData.js';
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
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [xpFeedback, setXpFeedback] = useState('');

  const level = getLevelFromXp(progress.totalXp);
  const completedChecklistCount = getCompletedChecklistCount(progress, dailyChecklist);
  const checklistIsComplete = completedChecklistCount === dailyChecklist.length;
  const dailyGoalIsComplete = completedChecklistCount >= DAILY_GOAL_COUNT;
  const completedBeginnerLessonsCount = beginnerLessons.filter((lesson) => progress.completedLessons.includes(lesson.id)).length;
  const nextLesson = getFirstUnlockedIncompleteLesson(progress.completedLessons);
  const selectedLesson = selectedLessonId ? beginnerLessons.find((lesson) => lesson.id === selectedLessonId) : null;
  const badges = useMemo(() => getEarnedBadges(progress, dailyGoalIsComplete, completedBeginnerLessonsCount), [dailyGoalIsComplete, progress, completedBeginnerLessonsCount]);

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
    const challengeItem = dailyChecklist.find((item) => item.id === 'solve-challenge');
    if (challengeItem) completeItem(challengeItem, 'Practice challenge solved!');
  }

  function completeReflection() {
    const reflectionItem = dailyChecklist.find((item) => item.id === 'reflect');
    if (reflectionItem) completeItem(reflectionItem, 'Reflection saved!');
  }

  function selectNavItem(navItem) {
    setActiveNavItem(navItem);
    if (navItem !== 'learn') {
      setSelectedLessonId(null);
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
            {renderChecklistCard({ checklistIsComplete, completedChecklistCount, toggleChecklistItem, progress, dailyGoalIsComplete })}
          </>
        )}

        {activeNavItem === 'learn' && (
          selectedLesson
            ? <LessonScreen lesson={selectedLesson} completedLessonIds={progress.completedLessons} onBack={() => setSelectedLessonId(null)} onComplete={completeLesson} />
            : <LearningPath completedLessonIds={progress.completedLessons} onOpenLesson={openLesson} />
        )}

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
              <ProfileRow label="Completed lessons" value={`${completedBeginnerLessonsCount}/${beginnerLessons.length}`} />
              <ProfileRow label="Badges earned" value={badges.length ? badges.join(', ') : 'None yet'} />
              <ProfileRow label="Today’s checklist" value={`${completedChecklistCount}/${dailyChecklist.length} done`} />
            </div>
          </section>
        )}
      </main>

      <BottomNav activeItem={activeNavItem} onSelect={selectNavItem} />
    </div>
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
  return (
    <section className="lesson-card learning-path" aria-labelledby="learn-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Learn</p>
          <h2 id="learn-title">Beginner web development path</h2>
        </div>
        <span>{completedLessonIds.filter((lessonId) => beginnerLessons.some((lesson) => lesson.id === lessonId)).length}/{beginnerLessons.length}</span>
      </div>
      <p>Start with plain-language basics, then unlock each next lesson by finishing the one before it.</p>
      <div className="lesson-list">
        {beginnerLessons.map((lesson, index) => {
          const isCompleted = completedLessonIds.includes(lesson.id);
          const isUnlocked = isLessonUnlocked(lesson.id, completedLessonIds);
          const status = isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked';

          return (
            <button
              className={`path-card ${status}`}
              disabled={!isUnlocked}
              key={lesson.id}
              onClick={() => onOpenLesson(lesson)}
              type="button"
            >
              <span className="path-step">{index + 1}</span>
              <span className="path-copy">
                <strong>{lesson.title}</strong>
                <small>{lesson.minutes} min • {lesson.tags.join(' • ')} • +{lesson.xpReward} XP</small>
              </span>
              <span className="path-status">{getLessonStatusLabel(status)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function LessonScreen({ lesson, completedLessonIds, onBack, onComplete }) {
  const isComplete = completedLessonIds.includes(lesson.id);

  return (
    <article className="lesson-card lesson-screen" aria-labelledby="lesson-screen-title">
      <button className="back-button" type="button" onClick={onBack}>← Back to path</button>
      <div className="section-heading">
        <p className="eyebrow">Lesson</p>
        <span>{lesson.minutes} min</span>
      </div>
      <h2 id="lesson-screen-title">{lesson.title}</h2>
      <div className="lesson-meta">
        {lesson.tags.map((tag) => <span key={tag}>{tag}</span>)}
        <span>+{lesson.xpReward} XP</span>
      </div>
      <p>{lesson.explanation}</p>

      {lesson.codeExample && (
        <div className="code-example">
          <strong>Example</strong>
          <pre><code>{lesson.codeExample}</code></pre>
        </div>
      )}

      <div className="mini-task">
        <strong>Mini task</strong>
        <p>{lesson.miniTask}</p>
      </div>

      <details className="quiz-card">
        <summary>{lesson.quiz.question}</summary>
        <ul>
          {lesson.quiz.choices.map((choice) => (
            <li className={choice === lesson.quiz.answer ? 'correct-answer' : undefined} key={choice}>{choice}</li>
          ))}
        </ul>
        <p><strong>Answer:</strong> {lesson.quiz.answer}</p>
      </details>

      <details className="hint-card">
        <summary>Need a hint?</summary>
        <p>{lesson.hint}</p>
      </details>

      <button className="primary-button" type="button" onClick={() => onComplete(lesson)}>
        {isComplete ? 'Lesson complete ✓' : `Complete lesson for ${lesson.xpReward} XP`}
      </button>
    </article>
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

function getEarnedBadges(progress, dailyGoalIsComplete, completedBeginnerLessonsCount) {
  return [
    completedBeginnerLessonsCount > 0 && 'First Lesson',
    completedBeginnerLessonsCount === beginnerLessons.length && 'Path Explorer',
    progress.totalXp >= 100 && '100 XP Club',
    dailyGoalIsComplete && 'Daily Goal',
    progress.streak >= 3 && 'Streak Starter',
  ].filter(Boolean);
}

export default App;
