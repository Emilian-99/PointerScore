function escapeLegalText(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function renderLegalBody(value) {
  return String(value).split('\n\n').map(paragraph => {
    const linked = escapeLegalText(paragraph).replace(/https:\/\/[^\s<>]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, text => {
      const href = text.includes('@') && !text.startsWith('https://') ? 'mailto:' + text : text;
      return '<a href="' + href + '">' + text + '</a>';
    });
    return '<p>' + linked.split('\n').join('<br>') + '</p>';
  }).join('');
}

function applyLegalLanguage(language = document.documentElement.lang) {
  const key = document.body?.dataset?.legalPage;
  const locale = language === 'en' ? 'en' : 'de';
  const data = window.PointerScoreLegalDocuments[key]?.[locale];
  const container = document.querySelector('.legal-document');
  if (!data || !container) return;
  container.innerHTML = [
    '<p class="eyebrow">' + (locale === 'en' ? 'Legal' : 'Rechtliches') + '</p>',
    '<h1>' + escapeLegalText(data.title) + '</h1>',
    '<p class="legal-date">' + (locale === 'en' ? 'Last updated' : 'Stand') + ': ' + "14.10.2026" + '</p>',
    ...data.sections.map(([heading, text], index) => '<section class="legal-section" id="' + key + '-' + locale + '-' + (index + 1) + '"><h2>' + escapeLegalText(heading) + '</h2>' + renderLegalBody(text) + '</section>')
  ].join('');
  document.title = data.title + ' | PointerScore';
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', data.description);
}

document.addEventListener('DOMContentLoaded', () => applyLegalLanguage(window.PointerScoreI18n?.language || document.documentElement.lang));
window.addEventListener('pointerscore:languagechange', event => applyLegalLanguage(event.detail?.language || document.documentElement.lang));
