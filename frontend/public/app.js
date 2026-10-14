import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';

const DB_NAME = 'careernaviq-local-workspace';
const DB_VERSION = 1;
const ITEM_STORE = 'items';
const TASKS_KEY = 'careernaviq_tasks';
const CLIENT_ID_KEY = 'careernaviq_ms_client_id';
const TENANT_ID_KEY = 'careernaviq_ms_tenant_id';
const GRAPH_SCOPES = ['User.Read'];

const $ = id => document.getElementById(id);
const modal = $('modal');
const connectBtn = $('connectBtn');
const closeModalBtn = $('closeModal');
const saveAndSignInBtn = $('modalOk');
const clearSetupBtn = $('clearMicrosoftSetup');
const signOutBtn = $('signOutBtn');
const clientIdInput = $('clientIdInput');
const tenantIdInput = $('tenantIdInput');
const setupMessage = $('msSetupMessage');
const accountStatus = $('accountStatus');
const setupStatus = $('setupStatus');
const setupDot = $('setupDot');
const assistantReply = $('assistantReply');
const assistantInput = $('assistantInput');
const fileInput = $('fileInput');
const dropzone = $('dropzone');
const importMessage = $('importMessage');

let msalInstance = null;
let activeAccount = null;
let profile = null;
let dbPromise = null;
let cachedItems = [];

const viewMeta = {
  today: ['YOUR DAY', 'Good to see you.', 'Bring your work into one place, organize it, and turn it into an actionable day.'],
  import: ['IMPORT CENTER', 'Bring your work in.', 'Add permitted exports, files, emails, notes, and meeting material without needing a direct company connection.'],
  inbox: ['INBOX', 'Imported email.', 'Keep important messages together so follow-ups and drafts can be built from the material you choose.'],
  meetings: ['MEETINGS', 'Meeting workspace.', 'Keep agendas, transcripts, notes, and supporting material together.'],
  tasks: ['FOLLOW-UPS', 'My tasks.', 'Track what you owe, what you are waiting on, and what needs attention next.'],
  library: ['LIBRARY', 'Your work library.', 'Everything you deliberately import into this browser, organized in one place.'],
  connections: ['CONNECTIONS', 'Optional connections.', 'CareerNavIQ works locally first. Add Microsoft or ChatGPT only when you choose.']
};

function openDatabase() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ITEM_STORE)) {
        db.createObjectStore(ITEM_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function dbPut(item) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEM_STORE, 'readwrite');
    tx.objectStore(ITEM_STORE).put(item);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDelete(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEM_STORE, 'readwrite');
    tx.objectStore(ITEM_STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function dbClear() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ITEM_STORE, 'readwrite');
    tx.objectStore(ITEM_STORE).clear();
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function dbAll() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(ITEM_STORE, 'readonly').objectStore(ITEM_STORE).getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt - a.createdAt));
    request.onerror = () => reject(request.error);
  });
}

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ext(name = '') {
  return name.includes('.') ? name.split('.').pop().toLowerCase() : '';
}

function classifyFile(file) {
  const e = ext(file.name);
  if (['eml', 'msg'].includes(e)) return 'email';
  if (['ics', 'vcs'].includes(e)) return 'meeting';
  if (['xls', 'xlsx', 'xlsm', 'csv', 'tsv'].includes(e)) return 'data';
  if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'rtf'].includes(e)) return 'document';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic'].includes(e)) return 'image';
  if (['txt', 'md', 'json', 'log', 'html', 'htm'].includes(e)) return 'note';
  return 'file';
}

async function extractText(file) {
  const e = ext(file.name);
  const textExts = ['txt', 'md', 'csv', 'tsv', 'json', 'log', 'html', 'htm', 'ics', 'eml'];
  if (file.type?.startsWith('text/') || textExts.includes(e)) {
    try { return await file.text(); } catch { return ''; }
  }
  return '';
}

function humanSize(bytes = 0) {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
  return `${value >= 10 || i === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`;
}

function kindLabel(kind) {
  return ({ email: 'Email', meeting: 'Meeting', data: 'Spreadsheet/Data', document: 'Document', image: 'Image', note: 'Note', reference: 'Reference', file: 'File' })[kind] || 'Item';
}

function itemName(item) {
  return item.title || item.fileName || 'Untitled item';
}

async function importFiles(files) {
  const list = [...files];
  if (!list.length) return;
  importMessage.textContent = `Importing ${list.length} item${list.length === 1 ? '' : 's'}…`;
  importMessage.className = 'setup-message';
  try {
    for (const file of list) {
      await dbPut({
        id: uuid(),
        kind: classifyFile(file),
        title: file.name,
        fileName: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        createdAt: Date.now(),
        text: await extractText(file),
        blob: file
      });
    }
    importMessage.textContent = `${list.length} item${list.length === 1 ? '' : 's'} saved locally in this browser.`;
    importMessage.className = 'setup-message success';
    fileInput.value = '';
    await refreshWorkspace();
  } catch (error) {
    console.error(error);
    importMessage.textContent = 'That import could not be saved in this browser.';
    importMessage.className = 'setup-message error';
  }
}

async function savePastedItem() {
  const kind = $('pasteKind').value;
  const title = $('pasteTitle').value.trim();
  const text = $('pasteText').value.trim();
  if (!text) {
    importMessage.textContent = 'Paste some text before saving.';
    importMessage.className = 'setup-message error';
    return;
  }
  await dbPut({ id: uuid(), kind, title: title || `${kindLabel(kind)} ${new Date().toLocaleDateString()}`, fileName: '', mime: 'text/plain', size: new Blob([text]).size, createdAt: Date.now(), text, blob: null });
  $('pasteTitle').value = '';
  $('pasteText').value = '';
  importMessage.textContent = 'Pasted content saved to your local library.';
  importMessage.className = 'setup-message success';
  await refreshWorkspace();
}

function makeButton(label, className, handler) {
  const button = document.createElement('button');
  button.textContent = label;
  button.className = className;
  button.addEventListener('click', handler);
  return button;
}

function renderItemList(container, items, limit = Infinity) {
  container.innerHTML = '';
  const shown = items.slice(0, limit);
  if (!shown.length) {
    container.className = 'item-list empty-state';
    container.textContent = 'Nothing here yet.';
    return;
  }
  container.className = 'item-list';
  shown.forEach(item => {
    const row = document.createElement('div');
    row.className = 'library-item';
    const info = document.createElement('div');
    info.className = 'item-info';
    const badge = document.createElement('span');
    badge.className = `kind-badge kind-${item.kind}`;
    badge.textContent = kindLabel(item.kind);
    const title = document.createElement('strong');
    title.textContent = itemName(item);
    const meta = document.createElement('small');
    meta.textContent = `${humanSize(item.size)} · ${new Date(item.createdAt).toLocaleString()}`;
    info.append(badge, title, meta);

    const actions = document.createElement('div');
    actions.className = 'item-actions';
    if (item.blob) {
      actions.append(makeButton('Download', 'mini-btn', () => {
        const url = URL.createObjectURL(item.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.fileName || itemName(item);
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }));
    } else if (item.text) {
      actions.append(makeButton('Copy', 'mini-btn', async () => {
        await navigator.clipboard.writeText(item.text);
      }));
    }
    actions.append(makeButton('Delete', 'mini-btn danger', async () => {
      await dbDelete(item.id);
      await refreshWorkspace();
    }));
    row.append(info, actions);
    container.appendChild(row);
  });
}

function loadTasks() {
  try { return JSON.parse(localStorage.getItem(TASKS_KEY) || '[]'); } catch { return []; }
}

function saveTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  renderTasks();
  updateStats();
}

function addTask() {
  const input = $('taskInput');
  const text = input.value.trim();
  if (!text) return;
  const tasks = loadTasks();
  tasks.unshift({ id: uuid(), text, done: false, createdAt: Date.now() });
  saveTasks(tasks);
  input.value = '';
}

function renderTasks() {
  const container = $('taskList');
  const tasks = loadTasks();
  container.innerHTML = '';
  if (!tasks.length) {
    container.className = 'task-list empty-state';
    container.textContent = 'No tasks yet.';
    return;
  }
  container.className = 'task-list';
  tasks.forEach(task => {
    const row = document.createElement('div');
    row.className = `task-row${task.done ? ' done' : ''}`;
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = task.done;
    check.addEventListener('change', () => {
      const all = loadTasks();
      const current = all.find(t => t.id === task.id);
      if (current) current.done = check.checked;
      saveTasks(all);
    });
    const text = document.createElement('span');
    text.textContent = task.text;
    const del = makeButton('×', 'task-delete', () => saveTasks(loadTasks().filter(t => t.id !== task.id)));
    row.append(check, text, del);
    container.appendChild(row);
  });
}

function updateStats() {
  const openTasks = loadTasks().filter(t => !t.done).length;
  const emails = cachedItems.filter(i => i.kind === 'email').length;
  const meetings = cachedItems.filter(i => i.kind === 'meeting').length;
  $('statItems').textContent = cachedItems.length;
  $('statEmails').textContent = emails;
  $('statMeetings').textContent = meetings;
  $('statTasks').textContent = openTasks;
  $('inboxCount').textContent = emails;
  $('meetingCount').textContent = meetings;
  $('taskCount').textContent = openTasks;
  $('libraryCount').textContent = cachedItems.length;
}

async function refreshWorkspace() {
  cachedItems = await dbAll();
  updateStats();
  renderItemList($('recentItems'), cachedItems, 8);
  renderItemList($('libraryItems'), cachedItems);
  renderItemList($('emailItems'), cachedItems.filter(i => i.kind === 'email'));
  renderItemList($('meetingItems'), cachedItems.filter(i => i.kind === 'meeting'));
}

function setView(name) {
  document.querySelectorAll('.view').forEach(section => {
    const active = section.dataset.viewSection === name;
    section.hidden = !active;
    section.classList.toggle('active', active);
  });
  document.querySelectorAll('.nav').forEach(button => button.classList.toggle('active', button.dataset.view === name));
  const meta = viewMeta[name] || viewMeta.today;
  $('viewEyebrow').textContent = meta[0];
  $('viewTitle').textContent = meta[1];
  $('viewSubtitle').textContent = meta[2];
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function exportWorkspace() {
  const items = cachedItems.map(({ blob, ...item }) => item);
  const payload = { exportedAt: new Date().toISOString(), note: 'Original binary file contents are not embedded in this JSON export. Download originals individually from the Library.', items, tasks: loadTasks() };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `careernaviq-workspace-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function localAssistantAnswer(query) {
  const q = query.toLowerCase();
  const tasks = loadTasks().filter(t => !t.done);
  const emails = cachedItems.filter(i => i.kind === 'email');
  const meetings = cachedItems.filter(i => i.kind === 'meeting');

  if (q.includes('what should i work') || q.includes('today')) {
    return `You currently have ${tasks.length} open task${tasks.length === 1 ? '' : 's'}, ${emails.length} imported email${emails.length === 1 ? '' : 's'}, and ${meetings.length} meeting item${meetings.length === 1 ? '' : 's'}. ChatGPT is not connected yet, so I am only summarizing what is stored locally.`;
  }
  if (q.includes('next meeting') || q.includes('prepare me')) {
    if (!meetings.length) return 'I do not have any meeting material yet. Import an agenda, .ics file, transcript, or notes and I can keep it ready for the AI layer.';
    return `I found ${meetings.length} meeting item${meetings.length === 1 ? '' : 's'}: ${meetings.slice(0, 4).map(itemName).join('; ')}. The next step is connecting ChatGPT so it can actually prepare talking points from them.`;
  }
  if (q.includes('waiting on') || q.includes('follow up')) {
    if (!tasks.length) return 'There are no open tasks in your local follow-up list yet.';
    return `Your open follow-ups are: ${tasks.slice(0, 6).map(t => t.text).join('; ')}${tasks.length > 6 ? '; …' : ''}`;
  }

  const terms = q.split(/[^a-z0-9]+/).filter(word => word.length > 2);
  const matches = cachedItems.map(item => {
    const haystack = `${itemName(item)} ${item.text || ''}`.toLowerCase();
    const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
    return { item, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

  if (matches.length) return `I found ${matches.length} potentially relevant local item${matches.length === 1 ? '' : 's'}: ${matches.map(x => itemName(x.item)).join('; ')}. ChatGPT is not connected yet, so I have not sent or summarized their contents.`;
  return cachedItems.length ? 'I did not find a clear local match. Once ChatGPT is connected, it will be able to reason across the material you choose to provide.' : 'Your local library is empty. Start with Import Center and add the material you are allowed to use.';
}

// Microsoft 365 remains optional.
function openModal(message = '') {
  clientIdInput.value = localStorage.getItem(CLIENT_ID_KEY) || '';
  tenantIdInput.value = localStorage.getItem(TENANT_ID_KEY) || '';
  setupMessage.textContent = message;
  setupMessage.className = 'setup-message';
  signOutBtn.hidden = !activeAccount;
  modal.hidden = false;
}
function closeModal() { modal.hidden = true; }
function validGuid(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim()); }
function authorityFromTenant(tenantId) { return `https://login.microsoftonline.com/${tenantId || 'organizations'}`; }

async function createMicrosoftClient() {
  const clientId = (localStorage.getItem(CLIENT_ID_KEY) || '').trim();
  const tenantId = (localStorage.getItem(TENANT_ID_KEY) || '').trim();
  if (!clientId) return null;
  msalInstance = new PublicClientApplication({ auth: { clientId, authority: authorityFromTenant(tenantId), redirectUri: `${window.location.origin}/`, postLogoutRedirectUri: `${window.location.origin}/` }, cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false } });
  await msalInstance.initialize();
  const redirectResult = await msalInstance.handleRedirectPromise();
  if (redirectResult?.account) msalInstance.setActiveAccount(redirectResult.account);
  const accounts = msalInstance.getAllAccounts();
  activeAccount = msalInstance.getActiveAccount() || accounts[0] || null;
  if (activeAccount) msalInstance.setActiveAccount(activeAccount);
  return msalInstance;
}

async function acquireGraphToken() {
  if (!msalInstance || !activeAccount) throw new Error('Microsoft 365 is not connected.');
  try {
    const response = await msalInstance.acquireTokenSilent({ scopes: GRAPH_SCOPES, account: activeAccount });
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
  const response = await fetch('https://graph.microsoft.com/v1.0/me?$select=displayName,mail,userPrincipalName', { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Microsoft Graph returned ${response.status}`);
  profile = await response.json();
  renderMicrosoftState();
}

function renderMicrosoftState() {
  if (!activeAccount) {
    accountStatus.textContent = localStorage.getItem(CLIENT_ID_KEY) ? 'Configured — not signed in' : 'Not connected';
    signOutBtn.hidden = true;
    return;
  }
  const displayName = profile?.displayName || activeAccount.name || 'Connected';
  accountStatus.textContent = `${displayName} · Connected`;
  signOutBtn.hidden = false;
}

function showMicrosoftError(error) {
  console.error(error);
  const message = error?.errorMessage || error?.message || String(error);
  openModal(message.includes('AADSTS65001') ? 'Your organization requires consent or administrator approval for this app.' : message.slice(0, 260));
  setupMessage.classList.add('error');
}

async function signInMicrosoft() {
  try {
    if (!localStorage.getItem(CLIENT_ID_KEY)) { openModal('Only continue if your company permits an employee-created Microsoft app.'); return; }
    if (!msalInstance) await createMicrosoftClient();
    if (activeAccount) { await loadMicrosoftProfile(); openModal('Microsoft 365 is connected on this browser session.'); setupMessage.classList.add('success'); return; }
    await msalInstance.loginRedirect({ scopes: GRAPH_SCOPES, prompt: 'select_account' });
  } catch (error) { showMicrosoftError(error); }
}

async function saveMicrosoftSetupAndSignIn() {
  const clientId = clientIdInput.value.trim();
  const tenantId = tenantIdInput.value.trim();
  if (!validGuid(clientId)) { setupMessage.textContent = 'Paste the Application (client) ID from Microsoft Entra.'; setupMessage.className = 'setup-message error'; return; }
  if (tenantId && !validGuid(tenantId)) { setupMessage.textContent = 'The tenant ID should be a GUID, or leave it blank.'; setupMessage.className = 'setup-message error'; return; }
  localStorage.setItem(CLIENT_ID_KEY, clientId);
  if (tenantId) localStorage.setItem(TENANT_ID_KEY, tenantId); else localStorage.removeItem(TENANT_ID_KEY);
  msalInstance = null; activeAccount = null;
  await signInMicrosoft();
}

async function signOutMicrosoft() { if (msalInstance && activeAccount) await msalInstance.logoutRedirect({ account: activeAccount }); }
function clearMicrosoftSetup() {
  localStorage.removeItem(CLIENT_ID_KEY); localStorage.removeItem(TENANT_ID_KEY);
  msalInstance = null; activeAccount = null; profile = null;
  clientIdInput.value = ''; tenantIdInput.value = '';
  setupMessage.textContent = 'Microsoft setup cleared from this browser.';
  setupMessage.className = 'setup-message success';
  renderMicrosoftState();
}

// UI events
fileInput.addEventListener('change', () => importFiles(fileInput.files));
['dragenter', 'dragover'].forEach(name => dropzone.addEventListener(name, event => { event.preventDefault(); dropzone.classList.add('dragging'); }));
['dragleave', 'drop'].forEach(name => dropzone.addEventListener(name, event => { event.preventDefault(); dropzone.classList.remove('dragging'); }));
dropzone.addEventListener('drop', event => importFiles(event.dataTransfer.files));
$('savePasteBtn').addEventListener('click', savePastedItem);
$('addTaskBtn').addEventListener('click', addTask);
$('taskInput').addEventListener('keydown', event => { if (event.key === 'Enter') addTask(); });
$('exportBtn').addEventListener('click', exportWorkspace);
$('quickImportBtn').addEventListener('click', () => setView('import'));
$('clearLibraryBtn').addEventListener('click', async () => {
  if (!cachedItems.length) return;
  if (confirm('Clear every locally imported library item from this browser?')) { await dbClear(); await refreshWorkspace(); }
});

document.querySelectorAll('.nav').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
document.querySelectorAll('.jump').forEach(button => button.addEventListener('click', () => setView(button.dataset.jump)));

const ask = () => {
  const text = assistantInput.value.trim();
  assistantReply.textContent = text ? localAssistantAnswer(text) : 'Type a question first.';
};
$('askBtn').addEventListener('click', ask);
assistantInput.addEventListener('keydown', event => { if (event.key === 'Enter') ask(); });
document.querySelectorAll('.suggestions button').forEach(button => button.addEventListener('click', () => { assistantInput.value = button.textContent; ask(); }));

$('openAiSetupBtn').addEventListener('click', () => {
  setView('today');
  assistantReply.textContent = 'The local import system is ready. The next build step is the secure ChatGPT/OpenAI connection so your chosen library items can be analyzed.';
});

connectBtn.addEventListener('click', () => openModal('Microsoft 365 is optional. Only continue if your employer permits this connection.'));
closeModalBtn.addEventListener('click', closeModal);
saveAndSignInBtn.addEventListener('click', saveMicrosoftSetupAndSignIn);
clearSetupBtn.addEventListener('click', clearMicrosoftSetup);
signOutBtn.addEventListener('click', signOutMicrosoft);
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });

(async function boot() {
  try {
    await refreshWorkspace();
    renderTasks();
    renderMicrosoftState();
    if (localStorage.getItem(CLIENT_ID_KEY)) {
      try { await createMicrosoftClient(); renderMicrosoftState(); if (activeAccount) await loadMicrosoftProfile(); } catch (error) { console.warn('Optional Microsoft connection not loaded:', error); }
    }
  } catch (error) {
    console.error(error);
    setupStatus.textContent = 'Local workspace needs browser storage access';
    setupDot.className = 'status-dot error';
  }
})();
