const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const message = document.getElementById('message');
const signupMessage = document.getElementById('signupMessage');

function showMessage(element, text, type = 'success') {
  element.textContent = text;
  element.className = `alert alert-message ${type}`;
  element.style.display = 'block';
}

function clearMessage(element) {
  element.textContent = '';
  element.className = 'alert alert-message';
  element.style.display = 'none';
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const rememberMe = document.getElementById('rememberMe')?.checked === true;

  const btn = loginForm.querySelector('.btn-signin');
  btn.disabled = true;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      setCurrentUser(email, data.companyName, rememberMe);
      showMessage(message, `Welcome back, ${data.companyName || 'user'}! Redirecting...`, 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1200);
    } else {
      showMessage(message, data.error || 'Login failed', 'error');
      btn.disabled = false;
      btn.querySelector('.btn-text').style.display = 'inline';
      btn.querySelector('.btn-loader').style.display = 'none';
    }
  } catch (error) {
    showMessage(message, 'Network error. Please try again.', 'error');
    btn.disabled = false;
    btn.querySelector('.btn-text').style.display = 'inline';
    btn.querySelector('.btn-loader').style.display = 'none';
  }
});

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const companyName = document.getElementById('signupCompany').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('signupConfirmPassword').value;

  const btn = signupForm.querySelector('.btn-signin');
  btn.disabled = true;

  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, email, password, confirmPassword })
    });

    const data = await response.json();

    if (response.ok) {
      setCurrentUser(email, companyName, false);
      showMessage(signupMessage, 'Account created successfully! Redirecting to dashboard...', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    } else {
      showMessage(signupMessage, data.error || 'Signup failed', 'error');
      btn.disabled = false;
      btn.querySelector('.btn-text').style.display = 'inline';
      btn.querySelector('.btn-loader').style.display = 'none';
    }
  } catch (error) {
    showMessage(signupMessage, 'Network error. Please try again.', 'error');
    btn.disabled = false;
    btn.querySelector('.btn-text').style.display = 'inline';
    btn.querySelector('.btn-loader').style.display = 'none';
  }
});

