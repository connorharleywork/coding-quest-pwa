export const beginnerLessons = [
  {
    id: 'lesson-what-is-coding',
    title: 'What is coding?',
    minutes: 5,
    tags: ['Mindset', 'Computers', 'Beginner'],
    xpReward: 25,
    explanation:
      'Coding means writing clear instructions for a computer to follow. A computer is very fast, but it needs exact steps. When you code, you break an idea into tiny pieces, put those pieces in order, and let the computer do them. You do not have to memorize everything. You learn by trying, checking what happened, and making small fixes.',
    codeExample: null,
    miniTask: 'Think of one everyday task, like making a sandwich. Write three tiny steps a computer would need to follow.',
    quiz: {
      question: 'What is coding mostly about?',
      choices: ['Giving a computer step-by-step instructions', 'Typing as fast as possible', 'Only building video games'],
      answer: 'Giving a computer step-by-step instructions',
    },
    hint: 'Pretend the computer is a helpful robot that needs very specific directions.',
  },
  {
    id: 'lesson-what-is-a-website',
    title: 'What is a website?',
    minutes: 6,
    tags: ['Web', 'Browser', 'Beginner'],
    xpReward: 30,
    explanation:
      'A website is a set of pages you can open in a browser like Safari, Chrome, or Edge. A web page can show words, pictures, buttons, links, videos, forms, and more. The browser reads files and turns them into the page you see. Most beginner websites use HTML for structure, CSS for style, and JavaScript for interaction.',
    codeExample: `<h1>My first web page</h1>\n<p>Hello, world!</p>`,
    miniTask: 'Look at a website you use often. Name one piece of structure, one style choice, and one interactive part.',
    quiz: {
      question: 'Which app do people usually use to view websites?',
      choices: ['A web browser', 'A kitchen timer', 'A calculator'],
      answer: 'A web browser',
    },
    hint: 'Chrome, Safari, Firefox, and Edge are examples.',
  },
  {
    id: 'lesson-html-basics',
    title: 'HTML basics',
    minutes: 8,
    tags: ['HTML', 'Structure', 'Elements'],
    xpReward: 35,
    explanation:
      'HTML is the structure of a web page. It uses small labels called tags to tell the browser what each part means. A heading tag means “this is a title.” A paragraph tag means “this is text.” HTML is like the outline or skeleton of the page.',
    codeExample: `<h1>About me</h1>\n<p>I am learning to code with CodeQuest.</p>\n<button>Say hello</button>`,
    miniTask: 'Imagine your own profile page. Write one heading and one sentence you would put on it.',
    quiz: {
      question: 'What does HTML mainly describe?',
      choices: ['The structure and meaning of page content', 'The battery level of a laptop', 'The price of a website'],
      answer: 'The structure and meaning of page content',
    },
    hint: 'HTML answers: “What is this content?”',
  },
  {
    id: 'lesson-css-basics',
    title: 'CSS basics',
    minutes: 8,
    tags: ['CSS', 'Style', 'Design'],
    xpReward: 35,
    explanation:
      'CSS controls how a web page looks. You can use CSS to choose colors, spacing, sizes, fonts, borders, shadows, and layout. If HTML is the skeleton of a page, CSS is the outfit and decoration that makes the page feel friendly and clear.',
    codeExample: `button {\n  background: purple;\n  color: white;\n  border-radius: 12px;\n}`,
    miniTask: 'Pick one button on an app you like. Describe its color, shape, and spacing.',
    quiz: {
      question: 'What does CSS mainly control?',
      choices: ['How a page looks', 'Whether your computer is plugged in', 'The address of your house'],
      answer: 'How a page looks',
    },
    hint: 'CSS answers: “How should this content look?”',
  },
  {
    id: 'lesson-javascript-basics',
    title: 'JavaScript basics',
    minutes: 10,
    tags: ['JavaScript', 'Interaction', 'Logic'],
    xpReward: 40,
    explanation:
      'JavaScript makes web pages respond to people. It can react when someone clicks a button, types into a form, completes a lesson, or earns XP. JavaScript can remember values, make decisions, and update what appears on the screen.',
    codeExample: `const name = 'Learner';\nconsole.log('Hello, ' + name + '!');`,
    miniTask: 'Name one thing you clicked in CodeQuest today. That click could be handled with JavaScript.',
    quiz: {
      question: 'What is JavaScript often used for on websites?',
      choices: ['Making pages interactive', 'Painting your bedroom wall', 'Charging your phone'],
      answer: 'Making pages interactive',
    },
    hint: 'Think about clicks, quizzes, saved progress, and buttons.',
  },
];
