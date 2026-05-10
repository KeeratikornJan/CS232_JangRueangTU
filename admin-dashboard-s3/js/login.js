'use strict';

// =============================================================================
// JANGRUEANG TU – Custom Cognito Login (USER_PASSWORD_AUTH / SRP)
// -----------------------------------------------------------------------------
// Requires the AWS Cognito Identity SDK to be loaded BEFORE this script:
//   <script src="https://cdn.jsdelivr.net/npm/amazon-cognito-identity-js@6.3.12/dist/amazon-cognito-identity.min.js"></script>
//
// On success the ID token is stored at sessionStorage["id_token"] (and also
// at sessionStorage["idToken"] for compatibility with mockData.js / AppAPI),
// then the user is redirected to dashboardAdmin.html.
// =============================================================================

const COGNITO_USER_POOL_ID = 'us-east-1_TGgji2jjl';
const COGNITO_CLIENT_ID    = '3vac4ifvp4jdj9fsmk8dd2eqr0';
const POST_LOGIN_REDIRECT  = 'views/dashboardAdmin.html';

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggle();
  initLoginForm();
});

function initPasswordToggle() {
  const toggleBtn     = document.getElementById('togglePwBtn');
  const passwordInput = document.getElementById('password');
  if (!toggleBtn || !passwordInput) return;

  toggleBtn.addEventListener('click', () => {
    const isVisible   = toggleBtn.getAttribute('aria-pressed') === 'true';
    const nextVisible = !isVisible;
    passwordInput.type = nextVisible ? 'text' : 'password';
    toggleBtn.setAttribute('aria-pressed', String(nextVisible));
    toggleBtn.setAttribute('aria-label', nextVisible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน');
  });
}

function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = (form.elements['username'].value || '').trim();
    const password = form.elements['password'].value || '';

    if (!username || !password) {
      showError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    if (!window.AmazonCognitoIdentity) {
      showError('ไม่พบ Cognito SDK – ตรวจสอบว่าโหลด amazon-cognito-identity.min.js แล้ว');
      return;
    }

    clearError();
    setSubmitting(true);
    authenticate(username, password)
      .then(handleSuccess)
      .catch(handleFailure)
      .finally(() => setSubmitting(false));
  });
}

function authenticate(username, password) {
  return new Promise((resolve, reject) => {
    const { CognitoUserPool, CognitoUser, AuthenticationDetails } = window.AmazonCognitoIdentity;

    const userPool = new CognitoUserPool({
      UserPoolId: COGNITO_USER_POOL_ID,
      ClientId:   COGNITO_CLIENT_ID,
    });

    const cognitoUser = new CognitoUser({ Username: username, Pool: userPool });
    // SRP is the default; the SDK falls back to USER_PASSWORD_AUTH if the
    // app client has it enabled and the pool can't satisfy SRP.
    cognitoUser.setAuthenticationFlowType('USER_SRP_AUTH');

    const authDetails = new AuthenticationDetails({ Username: username, Password: password });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => resolve({ session, cognitoUser }),
      onFailure: (err)     => reject(err),
      newPasswordRequired: () => reject(new Error('ต้องเปลี่ยนรหัสผ่านก่อนเข้าใช้งาน (โปรดติดต่อผู้ดูแลระบบ)')),
      mfaRequired:         () => reject(new Error('บัญชีนี้ต้องใช้ MFA – ยังไม่รองรับใน UI นี้')),
      totpRequired:        () => reject(new Error('บัญชีนี้ต้องใช้ TOTP – ยังไม่รองรับใน UI นี้')),
    });
  });
}

function handleSuccess({ session, cognitoUser }) {
  const idToken     = session.getIdToken().getJwtToken();
  const accessToken = session.getAccessToken().getJwtToken();
  const expiresAt   = session.getIdToken().getExpiration() * 1000; // seconds → ms

  // Primary key requested by the spec.
  sessionStorage.setItem('id_token', idToken);
  // Aliases consumed by the existing AppAPI / mockData.js helpers.
  sessionStorage.setItem('idToken', idToken);
  sessionStorage.setItem('accessToken', accessToken);
  sessionStorage.setItem('tokenExpiresAt', String(expiresAt));
  sessionStorage.setItem('cognitoUsername', cognitoUser.getUsername());

  console.log('[login] success — redirecting to', POST_LOGIN_REDIRECT);
  window.location.href = POST_LOGIN_REDIRECT;
}

function handleFailure(err) {
  console.error('[login] authentication failed', err);
  const code = (err && (err.code || err.name)) || '';
  let msg = (err && err.message) || 'เข้าสู่ระบบไม่สำเร็จ';
  if (code === 'NotAuthorizedException')  msg = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
  if (code === 'UserNotFoundException')   msg = 'ไม่พบบัญชีผู้ใช้นี้';
  if (code === 'UserNotConfirmedException') msg = 'บัญชียังไม่ได้รับการยืนยัน';
  if (code === 'PasswordResetRequiredException') msg = 'จำเป็นต้องตั้งรหัสผ่านใหม่';
  showError(msg);
}

function setSubmitting(isSubmitting) {
  const btn = document.getElementById('loginBtn');
  if (!btn) return;
  btn.disabled = isSubmitting;
  btn.textContent = isSubmitting ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ';
}

function showError(message) {
  const el = document.getElementById('loginError');
  if (!el) { alert(message); return; }
  el.textContent = message;
  el.hidden = false;
}

function clearError() {
  const el = document.getElementById('loginError');
  if (!el) return;
  el.textContent = '';
  el.hidden = true;
}
