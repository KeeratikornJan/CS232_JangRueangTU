'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggle();
  initFormValidation();
});


function initPasswordToggle() {
  const toggleBtn     = document.getElementById('togglePwBtn');
  const passwordInput = document.getElementById('password');

  if (!toggleBtn || !passwordInput) return;

  toggleBtn.addEventListener('click', () => {
    const isVisible = toggleBtn.getAttribute('aria-pressed') === 'true';

    const nextVisible = !isVisible;
    passwordInput.type = nextVisible ? 'text' : 'password';

    toggleBtn.setAttribute('aria-pressed', String(nextVisible));
    toggleBtn.setAttribute('aria-label', nextVisible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน');
  });
}


function initFormValidation() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const email    = form.elements['email'].value.trim();
    const password = form.elements['password'].value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !password) {
      showError(form, 'กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    if (!emailRegex.test(email)) {
      showError(form, 'รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }

    clearError(form);

    console.log('Submitting login for:', email);
  });
}


function showError(form, message) {
  let errorEl = form.querySelector('.login-form__error');

  if (!errorEl) {
    errorEl = document.createElement('p');
    errorEl.className = 'login-form__error';
    errorEl.setAttribute('role', 'alert');
    errorEl.style.cssText = [
      'font-size: 13px',
      'color: #ef4444',
      'margin-top: -8px',
      'margin-bottom: 12px',
    ].join(';');
    form.querySelector('.btn-login').before(errorEl);
  }

  errorEl.textContent = message;
}


function clearError(form) {
  const errorEl = form.querySelector('.login-form__error');
  if (errorEl) errorEl.remove();
}