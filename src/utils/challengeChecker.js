function normalizeText(value = '') {
  return value.toLowerCase().replace(/\s*:\s*/g, ': ').replace(/\s+/g, ' ').trim();
}

function cssPropertyPattern(property) {
  return new RegExp(`${property.replace('-', '\\-')}\\s*:`, 'i');
}

function hasClickListener(js = '') {
  return /addEventListener\s*\(\s*['"]click['"]/i.test(js) || /\.onclick\s*=/i.test(js) || /onclick\s*=/.test(js);
}

function hasTextChange(js = '') {
  return /\.(textContent|innerText|innerHTML)\s*=/i.test(js);
}

function hasStyleChange(js = '') {
  return /\.style\.|classList\.(add|remove|toggle)|className\s*=/i.test(js);
}

function checkCriterion(criterion, code, document) {
  const html = code.html ?? '';
  const css = code.css ?? '';
  const js = code.js ?? '';
  const allCode = `${html}\n${css}\n${js}`;

  try {
    switch (criterion.type) {
      case 'html-selector':
        return Boolean(document.querySelector(criterion.selector));
      case 'selector-text-includes': {
        const element = document.querySelector(criterion.selector);
        return Boolean(element && normalizeText(element.textContent).includes(normalizeText(criterion.text)));
      }
      case 'selector-min-text-length': {
        const element = document.querySelector(criterion.selector);
        return Boolean(element && normalizeText(element.textContent).length >= criterion.minLength);
      }
      case 'text-in-html':
        return normalizeText(html).includes(normalizeText(criterion.text));
      case 'text-in-code':
        return normalizeText(allCode).includes(normalizeText(criterion.text));
      case 'css-property':
        return cssPropertyPattern(criterion.property).test(css);
      case 'css-includes':
        return normalizeText(css).includes(normalizeText(criterion.text));
      case 'js-includes':
        return normalizeText(js).includes(normalizeText(criterion.text));
      case 'js-click-listener':
        return hasClickListener(js) || /onclick\s*=/i.test(html);
      case 'js-text-change':
        return hasTextChange(js);
      case 'js-style-change':
        return hasStyleChange(js);
      case 'code-includes-any':
        return criterion.values.some((value) => normalizeText(allCode).includes(normalizeText(value)));
      default:
        return false;
    }
  } catch (error) {
    console.warn('CodeQuest challenge check could not read a criterion.', criterion, error);
    return false;
  }
}

export function checkChallengeCode(challenge, code) {
  const parser = new DOMParser();
  const document = parser.parseFromString(code.html ?? '', 'text/html');
  const results = challenge.successCriteria.map((criterion) => ({
    ...criterion,
    passed: checkCriterion(criterion, code, document),
  }));
  const passed = results.filter((result) => result.passed);
  const needsWork = results.filter((result) => !result.passed);
  const nextHint = needsWork.length ? challenge.hints[0] : challenge.explanation;

  return {
    allPassed: needsWork.length === 0,
    passed,
    needsWork,
    nextHint,
  };
}
