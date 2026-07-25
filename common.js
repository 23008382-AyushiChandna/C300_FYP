const AR_CURRENT_USER_KEY = 'arCurrentUser';

function setCurrentUser(email, companyName, rememberMe = false) {
  const payload = JSON.stringify({ email, companyName });
  if (rememberMe) {
    localStorage.setItem(AR_CURRENT_USER_KEY, payload);
    sessionStorage.removeItem(AR_CURRENT_USER_KEY);
  } else {
    sessionStorage.setItem(AR_CURRENT_USER_KEY, payload);
    localStorage.removeItem(AR_CURRENT_USER_KEY);
  }
}

function getCurrentUser() {
  const raw = sessionStorage.getItem(AR_CURRENT_USER_KEY) || localStorage.getItem(AR_CURRENT_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearCurrentUser() {
  sessionStorage.removeItem(AR_CURRENT_USER_KEY);
  localStorage.removeItem(AR_CURRENT_USER_KEY);
}

function pageName() {
  const parts = location.pathname.split('/');
  const page = parts.pop() || 'index.html';
  return page.toLowerCase();
}

function isIndexPage() {
  const page = pageName();
  return page === '' || page === 'index.html';
}

function setupAuth() {
  const user = getCurrentUser();
  if (isIndexPage()) {
    return;
  }
  if (!user) {
    window.location.href = 'index.html';
  }
}

function setupNavActive() {
  const current = pageName();
  document.querySelectorAll('nav.section-nav a').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    const target = href.split('/').pop().toLowerCase();
    link.classList.toggle('active', target === current);
  });
}

function setupLogout() {
  document.querySelectorAll('[data-action="logout"]').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      clearCurrentUser();
      window.location.href = 'index.html';
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupAuth();
  setupNavActive();
  setupLogout();
});
