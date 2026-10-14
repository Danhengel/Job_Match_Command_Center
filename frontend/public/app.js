import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';

const CLIENT_ID_KEY = 'careernaviq_ms_client_id';
const TENANT_ID_KEY = 'careernaviq_ms_tenant_id';
const GRAPH_SCOPES = ['User.Read'];

const modal = document.getElementById('modal');
const connectBtn = document.getElementById('connectBtn');
const closeModalBtn = document.getElementById('closeModal');
const saveAndSignInBtn = document.getElementById('modalOk');
const clearSetupBtn = document.getElementById('clearMicrosoftSetup');
const signOutBtn = document.getElementById('signOutBtn');
const clientIdInput = document.getElementById('clientIdInput');
const tenantIdInput = document.getElementById('tenantIdInput');
const setupMessage = document.getElementById('msSetupMessage');
const accountStatus = document.getElementById('accountStatus');
const greeting = document.getElementById('greeting');
const setupStatus = document.getElementById('setupStatus');
const setupDot = document.getElementById('setupDot');
const assistantReply = document.getElementById('assistantReply');
const assistantInput = document.getElementById('assistantInput');

let msalInstance = null;
let activeAccount = null;
let profile = null;

function openModal(message = '') {
  clientIdInput.value = localStorage.getItem(CLIENT_ID_KEY) || '';
  tenantIdInput.value = localStorage.getItem(TENANT_ID_KEY) || '';
  setupMessage.textContent = message;
  setupMessage.className = 'setup-message';
  signOutBtn.hidden = !activeAccount;
  modal.hidden = false;
}

function closeModal() {
  modal.hidden = true;
}

function validGuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

function authorityFromTenant(tenantId) {
  return `https://login.microsoftonline.com/${tenantId || 'organizations'}`;
}

async function createMicrosoftClient() {
  const clientId = (localStorage.getItem(CLIENT_ID_KEY) || '').trim();
  const tenantId = (localStorage.getItem(TENANT_ID_KEY) || '').trim();
  if (!clientId) return null;

  msalInstance = new PublicClientApplication({
    auth: {
      clientId,
      authority: authorityFromTenant(tenantId),
      redirectUri: `${window.location.origin}/`,
      postLogoutRedirectUri: `${window.location.origin}/`
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false
    }
  });

  await msalInstance.initialize();
  const redirectResult = await msalInstance.handleRedirectPromise();

  if (redirectResult?.account) {
    msalInstance.setActiveAccount(redirectResult.account);
  }

  const accounts = msalInstance.getAllAccounts();
  activeAccount = msalInstance.getActiveAccount() || accounts[0] || null;
  if (activeAccount) msalInstance.setActiveAccount(activeAccount);
  return msalInstance;
}

async function acquireGraphToken() {
  if (!msalInstance || !activeAccount) throw new Error('Microsoft 365 is not connected.');
  try {
    const response = await msalInstance.acquireTokenSilent({
      scopes: GRAPH_SCOPES,
      account: activeAccount
    });
    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect({ scopes: GRAPH_SCOPES, account: activeAccount });
      return null;
    }
    throw error;
  }
}

async function loadMicrosoftProfile() {
  const token = await acquireGraphToken();
  if (!token) return;

  const response = await fetch('https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Microsoft Graph returned ${response.status}: ${detail.slice(0, 180)}`);
  }

  profile = await response.json();
  renderMicrosoftState();
}

function renderMicrosoftState() {
  if (!activeAccount) {
    connectBtn.textContent = 'Connect Microsoft 365';
    accountStatus.textContent = localStorage.getItem(CLIENT_ID_KEY)
      ? 'Microsoft app ready — sign in next'
      : 'Microsoft 365 not connected';
    setupStatus.textContent = localStorage.getItem(CLIENT_ID_KEY)
      ? 'Microsoft sign-in is configured'
      : 'Assistant setup started';
    setupDot.className = `status-dot${localStorage.getItem(CLIENT_ID_KEY) ? '' : ' offline'}`;
    signOutBtn.hidden = true;
    greeting.textContent = 'Good to see you.';
    return;
  }

  const displayName = profile?.displayName || activeAccount.name || 'Connected user';
  const email = profile?.mail || profile?.userPrincipalName || activeAccount.username || '';
  connectBtn.textContent = 'Microsoft 365 Connected';
  accountStatus.textContent = email ? `${displayName} · ${email}` : displayName;
  setupStatus.textContent = 'Microsoft 365 connection verified';
  setupDot.className = 'status-dot';
  signOutBtn.hidden = false;
  greeting.textContent = `Good to see you${displayName ? `, ${displayName.split(' ')[0]}` : ''}.`;
  assistantReply.textContent = 'Microsoft 365 is connected. Next we can add Outlook, Calendar, and OneDrive permissions one at a time.';
}

function showMicrosoftError(error) {
  console.error(error);
  const message = error?.errorMessage || error?.message || String(error);
  setupStatus.textContent = 'Microsoft connection needs attention';
  setupDot.className = 'status-dot error';
  accountStatus.textContent = 'Microsoft 365 connection failed';
  openModal(message.includes('AADSTS65001')
    ? 'Microsoft requires consent for this app. Your employer may require administrator approval.'
    : message.includes('AADSTS700016')
      ? 'Microsoft could not find this Application (client) ID. Check the ID and tenant setting.'
      : message.includes('AADSTS50011')
        ? 'The redirect URI does not match. In Microsoft Entra, add https://careernaviq.com/ as a Single-page application (SPA) redirect URI.'
        : message.slice(0, 260));
  setupMessage.classList.add('error');
}

async function signInMicrosoft() {
  try {
    if (!localStorage.getItem(CLIENT_ID_KEY)) {
      openModal('Create the Microsoft app registration first, then paste the Application (client) ID here.');
      return;
    }
    if (!msalInstance) await createMicrosoftClient();
    if (activeAccount) {
      await loadMicrosoftProfile();
      renderMicrosoftState();
      openModal('Microsoft 365 is already connected on this browser session.');
      setupMessage.classList.add('success');
      return;
    }
    connectBtn.disabled = true;
    connectBtn.textContent = 'Opening Microsoft…';
    await msalInstance.loginRedirect({
      scopes: GRAPH_SCOPES,
      prompt: 'select_account'
    });
  } catch (error) {
    connectBtn.disabled = false;
    renderMicrosoftState();
    showMicrosoftError(error);
  }
}

async function saveMicrosoftSetupAndSignIn() {
  const clientId = clientIdInput.value.trim();
  const tenantId = tenantIdInput.value.trim();

  if (!validGuid(clientId)) {
    setupMessage.textContent = 'Paste the Application (client) ID from the Microsoft Entra app Overview page.';
    setupMessage.className = 'setup-message error';
    return;
  }
  if (tenantId && !validGuid(tenantId)) {
    setupMessage.textContent = 'The tenant ID should be a GUID, or leave it blank for organizational accounts.';
    setupMessage.className = 'setup-message error';
    return;
  }

  localStorage.setItem(CLIENT_ID_KEY, clientId);
  if (tenantId) localStorage.setItem(TENANT_ID_KEY, tenantId);
  else localStorage.removeItem(TENANT_ID_KEY);

  setupMessage.textContent = 'Configuration saved. Redirecting to Microsoft sign-in…';
  setupMessage.className = 'setup-message success';
  msalInstance = null;
  activeAccount = null;
  await signInMicrosoft();
}

async function signOutMicrosoft() {
  if (!msalInstance || !activeAccount) return;
  await msalInstance.logoutRedirect({ account: activeAccount });
}

function clearMicrosoftSetup() {
  localStorage.removeItem(CLIENT_ID_KEY);
  localStorage.removeItem(TENANT_ID_KEY);
  sessionStorage.clear();
  msalInstance = null;
  activeAccount = null;
  profile = null;
  clientIdInput.value = '';
  tenantIdInput.value = '';
  setupMessage.textContent = 'Microsoft setup cleared from this browser.';
  setupMessage.className = 'setup-message success';
  renderMicrosoftState();
}

connectBtn.addEventListener('click', async () => {
  if (activeAccount) openModal('Microsoft 365 is connected.');
  else await signInMicrosoft();
});
closeModalBtn.addEventListener('click', closeModal);
saveAndSignInBtn.addEventListener('click', saveMicrosoftSetupAndSignIn);
clearSetupBtn.addEventListener('click', clearMicrosoftSetup);
signOutBtn.addEventListener('click', signOutMicrosoft);
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
document.querySelectorAll('.microsoft-feature').forEach(button => button.addEventListener('click', async () => {
  if (!activeAccount) await signInMicrosoft();
  else openModal('Microsoft 365 is connected. We will add this feature permission in the next step.');
}));

const ask = () => {
  const text = assistantInput.value.trim();
  assistantReply.textContent = text
    ? `You asked: “${text}” — the ChatGPT connection will be added after Microsoft 365 is working.`
    : 'Type a question first.';
};
document.getElementById('askBtn').addEventListener('click', ask);
assistantInput.addEventListener('keydown', event => { if (event.key === 'Enter') ask(); });
document.querySelectorAll('.suggestions button').forEach(button => button.addEventListener('click', () => {
  assistantInput.value = button.textContent;
  ask();
}));
document.querySelectorAll('.nav').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.nav').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  assistantReply.textContent = `${button.textContent} workspace is ready for the next setup step.`;
}));

(async function boot() {
  renderMicrosoftState();
  if (!localStorage.getItem(CLIENT_ID_KEY)) return;
  try {
    await createMicrosoftClient();
    renderMicrosoftState();
    if (activeAccount) await loadMicrosoftProfile();
  } catch (error) {
    showMicrosoftError(error);
  } finally {
    connectBtn.disabled = false;
  }
})();
