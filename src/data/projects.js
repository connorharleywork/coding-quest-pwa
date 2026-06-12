export const beginnerProjects = [
  {
    id: 'personal-profile-card',
    title: 'Personal Profile Card',
    difficulty: 'Beginner',
    estimatedTime: '25 min',
    skillsPractised: ['HTML sections', 'CSS colours', 'Buttons'],
    xpReward: 45,
    description: 'Make a small card that introduces you, your interests, and one friendly button.',
    goal: 'Build a simple profile card with your name, a short bio, a list of interests, and a button that changes a message.',
    steps: [
      'Change the heading to your name or a fun coder nickname.',
      'Write one short sentence about what you are learning.',
      'Add three interests or favourite things to the list.',
      'Change at least one colour in the CSS so the card feels like yours.',
      'Make the button show a friendly message when it is clicked.',
    ],
    hints: [
      'Text between opening and closing tags is safe to edit first.',
      'CSS colour values can be colour names like purple or hex codes like #6d5dfc.',
      'In JavaScript, message.textContent controls the words that appear after the click.',
    ],
    starterCode: {
      html: `<section class="profile-card">
  <p class="tag">Future Web Builder</p>
  <h1>Your Name</h1>
  <p class="bio">I am learning how websites are made one small step at a time.</p>

  <h2>Things I like</h2>
  <ul>
    <li>Creative ideas</li>
    <li>Helpful apps</li>
    <li>Learning new skills</li>
  </ul>

  <button id="hello-button">Say hello</button>
  <p id="profile-message" aria-live="polite"></p>
</section>`,
      css: `.profile-card {
  max-width: 360px;
  margin: 32px auto;
  padding: 24px;
  border-radius: 24px;
  background: #f0efff;
  color: #272c5f;
  font-family: Arial, sans-serif;
  text-align: center;
  box-shadow: 0 16px 32px rgba(39, 44, 95, 0.16);
}

.tag {
  color: #5d50e6;
  font-weight: bold;
  text-transform: uppercase;
}

ul {
  display: inline-block;
  text-align: left;
}

button {
  border: 0;
  border-radius: 999px;
  padding: 12px 18px;
  color: white;
  background: #6d5dfc;
  font-weight: bold;
}

#profile-message {
  color: #0f8f84;
  font-weight: bold;
}`,
      js: `const button = document.querySelector('#hello-button');
const message = document.querySelector('#profile-message');

button.addEventListener('click', () => {
  message.textContent = 'Hello from my first profile card!';
});`,
    },
    completionChecklist: [
      'My card has a name or nickname.',
      'My card has a short bio sentence.',
      'My card has three list items.',
      'I changed at least one colour.',
      'The button shows a message when clicked.',
    ],
  },
  {
    id: 'interactive-button-page',
    title: 'Interactive Button Page',
    difficulty: 'Beginner',
    estimatedTime: '30 min',
    skillsPractised: ['Buttons', 'Events', 'Text updates'],
    xpReward: 50,
    description: 'Create a page where buttons change text so you can see JavaScript responding to clicks.',
    goal: 'Build a tiny button lab with two buttons: one gives encouragement and one clears the message.',
    steps: [
      'Read the HTML and find the two button ids.',
      'Change the heading and intro sentence.',
      'Change the encouragement message in JavaScript.',
      'Style the buttons so they are easy to see.',
      'Test both buttons in the live preview.',
    ],
    hints: [
      'Each button is found with document.querySelector and its id.',
      'addEventListener waits for a click before running the code inside it.',
      'An empty string, written as \'\', clears text from the page.',
    ],
    starterCode: {
      html: `<main class="button-page">
  <h1>Button Practice</h1>
  <p>Click a button and watch the message change.</p>
  <div class="button-row">
    <button id="encourage-button">Encourage me</button>
    <button id="clear-button">Clear</button>
  </div>
  <p id="button-message" aria-live="polite">No clicks yet.</p>
</main>`,
      css: `.button-page {
  min-height: 100vh;
  padding: 32px;
  font-family: Arial, sans-serif;
  text-align: center;
  color: #272c5f;
  background: #e7fbff;
}

.button-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

button {
  border: 0;
  border-radius: 16px;
  padding: 12px 16px;
  color: white;
  background: #6d5dfc;
  font-weight: bold;
}

#clear-button {
  background: #272c5f;
}

#button-message {
  font-size: 1.2rem;
  font-weight: bold;
}`,
      js: `const encourageButton = document.querySelector('#encourage-button');
const clearButton = document.querySelector('#clear-button');
const message = document.querySelector('#button-message');

encourageButton.addEventListener('click', () => {
  message.textContent = 'You are learning by trying. Keep going!';
});

clearButton.addEventListener('click', () => {
  message.textContent = '';
});`,
    },
    completionChecklist: [
      'I changed the heading or intro sentence.',
      'The encourage button changes the message.',
      'The clear button removes the message.',
      'The buttons have clear styling.',
    ],
  },
  {
    id: 'colour-changer',
    title: 'Colour Changer',
    difficulty: 'Beginner',
    estimatedTime: '35 min',
    skillsPractised: ['CSS classes', 'JavaScript style changes', 'Page feedback'],
    xpReward: 55,
    description: 'Make buttons that change the page background colour.',
    goal: 'Build a simple colour changer that lets someone pick a calm, bright, or dark theme.',
    steps: [
      'Look at the three colour buttons in the HTML.',
      'Change the page title to your own colour theme idea.',
      'Try each button and notice what JavaScript changes.',
      'Edit one CSS colour value.',
      'Update the status message text for each colour.',
    ],
    hints: [
      'document.body.style.background changes the whole page background.',
      'Keep colour names inside quote marks in JavaScript.',
      'Use high contrast so text stays easy to read.',
    ],
    starterCode: {
      html: `<main class="colour-app">
  <h1>Colour Changer</h1>
  <p>Choose a mood for this page.</p>
  <button id="calm-button">Calm</button>
  <button id="bright-button">Bright</button>
  <button id="dark-button">Dark</button>
  <p id="colour-status" aria-live="polite">Pick a colour to begin.</p>
</main>`,
      css: `.colour-app {
  min-height: 100vh;
  padding: 32px;
  font-family: Arial, sans-serif;
  text-align: center;
  color: #272c5f;
}

button {
  margin: 6px;
  border: 0;
  border-radius: 999px;
  padding: 12px 18px;
  background: #6d5dfc;
  color: white;
  font-weight: bold;
}

#colour-status {
  margin-top: 24px;
  font-weight: bold;
}`,
      js: `const calmButton = document.querySelector('#calm-button');
const brightButton = document.querySelector('#bright-button');
const darkButton = document.querySelector('#dark-button');
const status = document.querySelector('#colour-status');

calmButton.addEventListener('click', () => {
  document.body.style.background = '#e7fbff';
  status.textContent = 'Calm mode is on.';
});

brightButton.addEventListener('click', () => {
  document.body.style.background = '#fff8d8';
  status.textContent = 'Bright mode is on.';
});

darkButton.addEventListener('click', () => {
  document.body.style.background = '#20244f';
  status.textContent = 'Dark mode is on.';
});`,
    },
    completionChecklist: [
      'All three colour buttons work.',
      'I changed the title or intro text.',
      'I changed at least one colour value.',
      'The page shows a status message after a click.',
    ],
  },
  {
    id: 'simple-todo-list',
    title: 'Simple To-Do List',
    difficulty: 'Beginner',
    estimatedTime: '45 min',
    skillsPractised: ['Inputs', 'Lists', 'Creating elements'],
    xpReward: 65,
    description: 'Create a tiny list where a learner can add tasks to the page.',
    goal: 'Build a to-do list that adds the text from an input into a visible list.',
    steps: [
      'Type a task into the input and press the add button.',
      'Read the JavaScript and find where the new list item is created.',
      'Change the placeholder text in the input.',
      'Style the list items so they look neat.',
      'Add your own helper sentence for empty tasks.',
    ],
    hints: [
      'input.value is the text currently typed into the box.',
      'document.createElement(\'li\') makes a new list item.',
      'trim() removes extra spaces before checking if the input is empty.',
    ],
    starterCode: {
      html: `<main class="todo-app">
  <h1>My To-Do List</h1>
  <p>Add one small task you want to remember.</p>
  <div class="todo-form">
    <input id="todo-input" type="text" placeholder="Type a task" />
    <button id="add-button">Add task</button>
  </div>
  <p id="todo-message" aria-live="polite"></p>
  <ul id="todo-list"></ul>
</main>`,
      css: `.todo-app {
  max-width: 420px;
  margin: 32px auto;
  padding: 24px;
  border-radius: 24px;
  background: #f8f7ff;
  color: #272c5f;
  font-family: Arial, sans-serif;
}

.todo-form {
  display: flex;
  gap: 8px;
}

input {
  flex: 1;
  border: 1px solid #dfe1ff;
  border-radius: 14px;
  padding: 12px;
}

button {
  border: 0;
  border-radius: 14px;
  padding: 12px;
  background: #20c7b9;
  color: white;
  font-weight: bold;
}

li {
  margin: 8px 0;
  padding: 10px;
  border-radius: 12px;
  background: white;
}`,
      js: `const input = document.querySelector('#todo-input');
const addButton = document.querySelector('#add-button');
const list = document.querySelector('#todo-list');
const message = document.querySelector('#todo-message');

addButton.addEventListener('click', () => {
  const taskText = input.value.trim();

  if (taskText === '') {
    message.textContent = 'Type a task first.';
    return;
  }

  const item = document.createElement('li');
  item.textContent = taskText;
  list.appendChild(item);
  input.value = '';
  message.textContent = 'Task added!';
});`,
    },
    completionChecklist: [
      'Typing a task and clicking Add creates a list item.',
      'Empty tasks show a helpful message.',
      'I changed the placeholder or helper text.',
      'The list items have visible styling.',
    ],
  },
  {
    id: 'mini-landing-page',
    title: 'Mini Landing Page',
    difficulty: 'Beginner',
    estimatedTime: '50 min',
    skillsPractised: ['Page layout', 'Hero sections', 'Call-to-action buttons'],
    xpReward: 75,
    description: 'Design a simple landing page for an imaginary app, club, or idea.',
    goal: 'Build a one-screen landing page with a headline, short pitch, feature cards, and a call-to-action button.',
    steps: [
      'Choose an imaginary app, club, or idea for the page.',
      'Change the headline and pitch text to match your idea.',
      'Edit the three feature cards.',
      'Change at least two colours in the CSS.',
      'Make the button show a sign-up message when clicked.',
    ],
    hints: [
      'A landing page explains one idea clearly and quickly.',
      'Feature cards should use short, simple benefits.',
      'The button does not need a real signup form yet; a message is enough for this beginner project.',
    ],
    starterCode: {
      html: `<main class="landing-page">
  <section class="hero">
    <p class="tagline">Tiny idea, big energy</p>
    <h1>Launch Your Mini App</h1>
    <p>Create a simple page that explains why your idea is helpful.</p>
    <button id="signup-button">Join the waitlist</button>
    <p id="signup-message" aria-live="polite"></p>
  </section>

  <section class="features" aria-label="Features">
    <article>Easy to start</article>
    <article>Fun to use</article>
    <article>Built for beginners</article>
  </section>
</main>`,
      css: `.landing-page {
  min-height: 100vh;
  padding: 32px;
  color: #272c5f;
  background: linear-gradient(135deg, #f0efff, #e7fbff);
  font-family: Arial, sans-serif;
  text-align: center;
}

.hero {
  max-width: 640px;
  margin: 0 auto 24px;
}

.tagline {
  color: #5d50e6;
  font-weight: bold;
  text-transform: uppercase;
}

h1 {
  font-size: 2.5rem;
}

button {
  border: 0;
  border-radius: 999px;
  padding: 14px 20px;
  color: white;
  background: #6d5dfc;
  font-weight: bold;
}

.features {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

article {
  border-radius: 18px;
  background: white;
  padding: 18px;
  font-weight: bold;
}`,
      js: `const signupButton = document.querySelector('#signup-button');
const signupMessage = document.querySelector('#signup-message');

signupButton.addEventListener('click', () => {
  signupMessage.textContent = 'Thanks for joining! This button works.';
});`,
    },
    completionChecklist: [
      'My page has a clear headline.',
      'My page has a short pitch sentence.',
      'I edited all three feature cards.',
      'I changed at least two colours.',
      'The call-to-action button shows a message.',
    ],
  },
];
