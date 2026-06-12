import React, { useEffect, useMemo, useState } from 'react';
import { BottomNav } from './components/BottomNav.jsx';
import { StatCard } from './components/StatCard.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { beginnerLessons } from './data/lessons.js';
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
  loadProgress,
  saveProgress,
  setChecklistItemCompletion,
} from './utils/progress.js';

const openAppChecklistItem = dailyChecklist.find((item) => item.id === 'open-app');
const readLessonChecklistItem = dailyChecklist.find((item) => item.id === 'read-lesson');
const practiceChecklistItem = dailyChecklist.find((item) => item.id === 'solve-challenge');
const PLAYGROUND_STORAGE_KEY = 'codequest-playground-code';
const AI_HELPER_STORAGE_KEY = 'codequest-ai-helper-draft';
const starterPlaygroundCode = {
  html: `<section class="mini-page">
  <h1>Hello, CodeQuest!</h1>
  <p>HTML adds the words and parts you see on a web page.</p>
  <button id="quest-button">Click me</button>
  <p id="message" aria-live="polite"></p>
</section>`,
  css: `.mini-page {
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 24px;
  color: #272c5f;
}

button {
  border: 0;
  border-radius: 14px;
  padding: 12px 18px;
  color: white;
  background: #6d5dfc;
  font-weight: bold;
}

#message {
  color: #0f8f84;
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
  const [xpFeedback, setXpFeedback] = useState('');
  const [playgroundCode, setPlaygroundCode] = useLocalStorage(PLAYGROUND_STORAGE_KEY, starterPlaygroundCode);
  const [aiHelperDraft, setAiHelperDraft] = useLocalStorage(AI_HELPER_STORAGE_KEY, emptyAiHelperDraft);
  const [copyFeedback, setCopyFeedback] = useState('');

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
          <CodePlayground
            code={playgroundCode}
            onChangeCode={updatePlaygroundCode}
            onClearSavedCode={clearSavedPlaygroundCode}
            onAskAiHelp={openAiHelperFromPlayground}
            onCompletePractice={completePracticeChallenge}
            onResetCode={resetPlaygroundCode}
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
              <ProfileRow label="Practice completions" value={progress.practiceCompletions ?? 0} />
              <ProfileRow label="AI Helper uses" value={progress.aiHelperUses ?? 0} />
              <ProfileRow label="AI Helper XP today" value={progress.lastAiHelperRewardDate === getDeviceLocalDate() ? 'Collected' : `+${AI_HELPER_XP_REWARD} available`} />
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

function LessonScreen({ lesson, completedLessonIds, onAskAiHelp, onBack, onComplete }) {
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

      <div className="lesson-actions">
        <button className="primary-button" type="button" onClick={() => onComplete(lesson)}>
          {isComplete ? 'Lesson complete ✓' : `Complete lesson for ${lesson.xpReward} XP`}
        </button>
        <button className="secondary-button" type="button" onClick={() => onAskAiHelp(lesson)}>
          Ask AI to explain this lesson
        </button>
      </div>
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
