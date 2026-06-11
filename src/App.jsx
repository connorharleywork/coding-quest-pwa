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

export default App;
