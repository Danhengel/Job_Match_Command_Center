import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';

const DB_NAME = 'careernaviq-local-workspace';
const DB_VERSION = 1;
const ITEM_STORE = 'items';
const TASKS_KEY = 'careernaviq_tasks';
const AI_SELECTION_KEY = 'careernaviq_ai_selection';
const AI_ACCESS_KEY = 'careernaviq_ai_access';
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
const askBtn = $('askBtn');
const fileInput = $('fileInput');
const dropzone = $('dropzone');
const importMessage = $('importMessage');
const openAiStatus = $('openAiStatus');
const openAiServerHint = $('openAiServerHint');
const aiAccessCodeInput = $('aiAccessCodeInput');
const aiSetupMessage = $('aiSetupMessage');
const includeAiContext = $('includeAiContext');
const aiContextCount = $('aiContextCount');

let msalInstance = null;
let activeAccount = null;
let profile = null;
let dbPromise = null;
let cachedItems = [];
let aiStatusState = { configured: false, hasApiKey: false, hasAccessToken: false, model: '' };
let selectedAiIds = new Set(loadJsonSession(AI_SELECTION_KEY, []));

const viewMeta = {
  today: ['YOUR DAY', 'Good to see you.', 'Bring your work into one place, organize it, and turn it into an actionable day.'],
  import: ['IMPORT CENTER', 'Bring your work in.', 'Add permitted exports, files, emails, notes, and meeting material without needing a direct company connection.'],
  inbox: ['INBOX', 'Imported email.', 'Keep important messages together so follow-ups and drafts can be built from the material you choose.'],
  meetings: ['MEETINGS', 'Meeting workspace.', 'Keep agendas, transcripts, notes, and supporting material together.'],
  tasks: ['FOLLOW-UPS', 'My tasks.', 'Track what you owe, what you are waiting on, and what needs attention next.'],
  library: ['LIBRARY', 'Your work library.', 'Everything you deliberately import into this browser, organized in one place.'],
  connections: ['CONNECTIONS', 'Optional connections.', 'CareerNavIQ works locally first. Add Microsoft or ChatGPT only when you choose.']
};

function loadJsonSession(key, fallback) {
  try { return JSON.parse(sessionStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function saveAiSelection() {
  sessionStorage.setItem(AI_SELECTION_KEY, JSON.stringify([...selectedAiIds]));
  updateAiContextCount();
}

function openDatabase() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ITEM_STORE)) db.createObjectStore(ITEM_STORE, { keyPath: 'id' });
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
  await dbPut({
    id: uuid(), kind, title: title || `${kindLabel(kind)} ${new Date().toLocaleDateString()}`,
    fileName: '', mime: 'text/plain', size: new Blob([text]).size, createdAt: Date.now(), text, blob: null
  });
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

function toggleAiSelection(item) {
  if (!item.text?.trim()) return;
  if (selectedAiIds.has(item.id)) selectedAiIds.delete(item.id);
  else selectedAiIds.add(item.id);
  saveAiSelection();
  renderWorkspaceLists();
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
    row.className = `library-item${selectedAiIds.has(item.id) ? ' ai-selected' : ''}`;

    const info = document.createElement('div');
    info.className = 'item-info';
    const badge = document.createElement('span');
    badge.className = `kind-badge kind-${item.kind}`;
    badge.textContent = kindLabel(item.kind);
    const title = document.createElement('strong');
    title.textContent = itemName(item);
    const meta = document.createElement('small');
    const readable = item.text?.trim() ? 'AI-readable text' : 'original file only';
    meta.textContent = `${humanSize(item.size)} · ${readable} · ${new Date(item.createdAt).toLocaleString()}`;
    info.append(badge, title, meta);

    const actions = document.createElement('div');
    actions.className = 'item-actions';
    if (item.text?.trim()) {
      actions.append(makeButton(selectedAiIds.has(item.id) ? 'AI ✓' : 'Add to AI', `mini-btn ai-pick${selectedAiIds.has(item.id) ? ' selected' : ''}`, () => toggleAiSelection(item)));
    }
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
      actions.append(makeButton('Copy', 'mini-btn', () => navigator.clipboard.writeText(item.text)));
    }
    actions.append(makeButton('Delete', 'mini-btn danger', async () => {
      selectedAiIds.delete(item.id);
      saveAiSelection();
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
  updateAiContextCount();
}

function updateAiContextCount() {
  const valid = cachedItems.filter(i => selectedAiIds.has(i.id) && i.text?.trim()).length;
  aiContextCount.textContent = `${valid} item${valid === 1 ? '' : 's'} selected`;
}

function renderWorkspaceLists() {
  renderItemList($('recentItems'), cachedItems, 8);
  renderItemList($('libraryItems'), cachedItems);
  renderItemList($('emailItems'), cachedItems.filter(i => i.kind === 'email'));
  renderItemList($('meetingItems'), cachedItems.filter(i => i.kind === 'meeting'));
  updateAiContextCount();
}

async function refreshWorkspace() {
  cachedItems = await dbAll();
  const validIds = new Set(cachedItems.map(i => i.id));
  selectedAiIds = new Set([...selectedAiIds].filter(id => validIds.has(id)));
  saveAiSelection();
  updateStats();
  renderWorkspaceLists();
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
  const payload = {
    exportedAt: new Date().toISOString(),
    note: 'Original binary file contents are not embedded in this JSON export. Download originals individually from the Library.',
    items,
    tasks: loadTasks()
  };
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
    return `Local summary: ${tasks.length} open task${tasks.length === 1 ? '' : 's'}, ${emails.length} imported email${emails.length === 1 ? '' : 's'}, and ${meetings.length} meeting item${meetings.length === 1 ? '' : 's'}.`;
  }
  if (q.includes('next meeting') || q.includes('prepare me')) {
    if (!meetings.length) return 'I do not have meeting material yet. Import an agenda, .ics file, transcript, or notes first.';
    return `I found ${meetings.length} meeting item${meetings.length === 1 ? '' : 's'}: ${meetings.slice(0, 4).map(itemName).join('; ')}.`;
  }
  if (q.includes('waiting on') || q.includes('follow up')) {
    if (!tasks.length) return 'There are no open tasks in your local follow-up list yet.';
    return `Open follow-ups: ${tasks.slice(0, 8).map(t => t.text).join('; ')}${tasks.length > 8 ? '; …' : ''}`;
  }
  return `I can see ${cachedItems.length} local library item${cachedItems.length === 1 ? '' : 's'} and ${tasks.length} open task${tasks.length === 1 ? '' : 's'}. The secure AI backend is not available for this question yet.`;
}

function selectedContext() {
  return cachedItems
    .filter(item => selectedAiIds.has(item.id) && item.text?.trim())
    .slice(0, 12)
    .map(item => ({ id: item.id, title: itemName(item), kind: item.kind, text: item.text.slice(0, 10000) }));
}

async function checkAiStatus() {
  try {
    const response = await fetch('/api/assistant-status', { cache: 'no-store' });
    if (!response.ok) throw new Error('AI status unavailable');
    aiStatusState = await response.json();
    renderAiStatus();
  } catch (error) {
    console.error(error);
    aiStatusState = { configured: false, hasApiKey: false, hasAccessToken: false, model: '' };
    openAiStatus.textContent = 'Backend unavailable';
    openAiStatus.className = 'connection-status error';
  }
}

function renderAiStatus() {
  if (aiStatusState.configured) {
    openAiStatus.textContent = `Ready · ${aiStatusState.model || 'OpenAI'}`;
    openAiStatus.className = 'connection-status ready';
    openAiServerHint.textContent = 'Secure server connection is ready. Enter your personal CareerNavIQ access code for this browser session.';
    setupStatus.textContent = 'Local workspace + AI backend ready';
    setupDot.className = 'status-dot';
    return;
  }
  openAiStatus.textContent = 'Server setup required';
  openAiStatus.className = 'connection-status';
  const missing = [];
  if (!aiStatusState.hasApiKey) missing.push('OpenAI API key');
  if (!aiStatusState.hasAccessToken) missing.push('personal access code');
  openAiServerHint.textContent = `Secure backend is installed. Still needed on Vercel: ${missing.join(' and ') || 'configuration'}.`;
  setupStatus.textContent = 'Local workspace ready';
  setupDot.className = 'status-dot';
}

function saveAiAccess() {
  const value = aiAccessCodeInput.value.trim();
  if (!value) {
    aiSetupMessage.textContent = 'Enter the private CareerNavIQ access code first.';
    aiSetupMessage.className = 'setup-message error';
    return;
  }
  sessionStorage.setItem(AI_ACCESS_KEY, value);
  aiAccessCodeInput.value = '';
  aiSetupMessage.textContent = 'Access code saved for this browser session only. Ask the assistant to verify it.';
  aiSetupMessage.className = 'setup-message success';
}

function clearAiAccess() {
  sessionStorage.removeItem(AI_ACCESS_KEY);
  aiAccessCodeInput.value = '';
  aiSetupMessage.textContent = 'AI access code cleared from this browser session.';
  aiSetupMessage.className = 'setup-message';
}

async function runAssistant() {
  const question = assistantInput.value.trim();
  if (!question) {
    assistantReply.textContent = 'Type a question first.';
    return;
  }

  const access = sessionStorage.getItem(AI_ACCESS_KEY) || '';
  if (!aiStatusState.configured || !access) {
    assistantReply.textContent = `${localAssistantAnswer(question)} ${aiStatusState.configured ? 'Go to Connections and enter your CareerNavIQ access code to use ChatGPT.' : 'Go to Connections to finish the secure ChatGPT setup.'}`;
    return;
  }

  const contextEnabled = includeAiContext.checked;
  const context = contextEnabled ? selectedContext() : [];
  const tasks = contextEnabled ? loadTasks().filter(t => !t.done).map(t => ({ text: t.text })) : [];

  askBtn.disabled = true;
  askBtn.textContent = 'Thinking…';
  assistantReply.classList.add('loading');
  assistantReply.textContent = contextEnabled
    ? `Sending your question${context.length ? ` with ${context.length} selected text item${context.length === 1 ? '' : 's'}` : ''}${tasks.length ? ` and ${tasks.length} open task${tasks.length === 1 ? '' : 's'}` : ''}…`
    : 'Sending only your question…';

  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CareerNavIQ-Access': access
      },
      body: JSON.stringify({ question, context, tasks })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Assistant returned ${response.status}.`);
    assistantReply.textContent = data.answer;
    assistantReply.classList.remove('error');
  } catch (error) {
    console.error(error);
    assistantReply.textContent = error.message || 'The AI request failed.';
    assistantReply.classList.add('error');
  } finally {
    assistantReply.classList.remove('loading');
    askBtn.disabled = false;
    askBtn.textContent = 'Ask';
  }
}

function openMicrosoftModal(message = '') {
  clientIdInput.value = localStorage.getItem(CLIENT_ID_KEY) || '';
  tenantIdInput.value = localStorage.getItem(TENANT_ID_KEY) || '';
  setupMessage.textContent = message;
  setupMessage.className = 'setup-message';
  signOutBtn.hidden = !activeAccount;
  modal.hidden = false;
}

function closeMicrosoftModal() { modal.hidden = true; }
function validGuid(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim()); }
function authorityFromTenant(tenantId) { return `https://login.microsoftonline.com/${tenantId || 'organizations'}`; }

async function createMicrosoftClient() {
  const clientId = (localStorage.getItem(CLIENT_ID_KEY) || '').trim();
  const tenantId = (localStorage.getItem(TENANT_ID_KEY) || '').trim();
  if (!clientId) return null;
  msalInstance = new PublicClientApplication({
    auth: { clientId, authority: authorityFromTenant(tenantId), redirectUri: `${window.location.origin}/`, postLogoutRedirectUri: `${window.location.origin}/` },
    cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false }
  });
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
  if (!response.ok) throw new Error(`Microsoft Graph returned ${response.status}.`);
  profile = await response.json();
  renderMicrosoftState();
}

function renderMicrosoftState() {
  if (!activeAccount) {
    accountStatus.textContent = localStorage.getItem(CLIENT_ID_KEY) ? 'App ready — sign in next' : 'Not connected';
    accountStatus.className = 'connection-status';
    connectBtn.textContent = 'Microsoft 365 setup';
    signOutBtn.hidden = true;
    return;
  }
  const displayName = profile?.displayName || activeAccount.name || 'Connected user';
  accountStatus.textContent = displayName;
  accountStatus.className = 'connection-status ready';
  connectBtn.textContent = 'Microsoft 365 connected';
  signOutBtn.hidden = false;
}

function showMicrosoftError(error) {
  console.error(error);
  const message = error?.errorMessage || error?.message || String(error);
  openMicrosoftModal(message.includes('AADSTS65001')
    ? 'Microsoft requires consent for this app. Your employer may require administrator approval.'
    : message.includes('AADSTS700016')
      ? 'Microsoft could not find this Application (client) ID. Check the ID and tenant setting.'
      : message.includes('AADSTS50011')
        ? 'The redirect URI does not match. Add https://careernaviq.com/ as an SPA redirect URI.'
        : message.slice(0, 260));
  setupMessage.classList.add('error');
}

async function signInMicrosoft() {
  try {
    if (!localStorage.getItem(CLIENT_ID_KEY)) {
      openMicrosoftModal('Create the Microsoft app registration first, then paste the Application (client) ID here.');
      return;
    }
    if (!msalInstance) await createMicrosoftClient();
    if (activeAccount) {
      await loadMicrosoftProfile();
      openMicrosoftModal('Microsoft 365 is already connected on this browser session.');
      setupMessage.classList.add('success');
      return;
    }
    await msalInstance.loginRedirect({ scopes: GRAPH_SCOPES, prompt: 'select_account' });
  } catch (error) { showMicrosoftError(error); }
}

async function saveMicrosoftSetupAndSignIn() {
  const clientId = clientIdInput.value.trim();
  const tenantId = tenantIdInput.value.trim();
  if (!validGuid(clientId)) {
    setupMessage.textContent = 'Paste the Application (client) ID from Microsoft Entra.';
    setupMessage.className = 'setup-message error';
    return;
  }
  if (tenantId && !validGuid(tenantId)) {
    setupMessage.textContent = 'The tenant ID should be a GUID, or leave it blank.';
    setupMessage.className = 'setup-message error';
    return;
  }
  localStorage.setItem(CLIENT_ID_KEY, clientId);
  if (tenantId) localStorage.setItem(TENANT_ID_KEY, tenantId); else localStorage.removeItem(TENANT_ID_KEY);
  msalInstance = null;
  activeAccount = null;
  await signInMicrosoft();
}

async function signOutMicrosoft() {
  if (msalInstance && activeAccount) await msalInstance.logoutRedirect({ account: activeAccount });
}

function clearMicrosoftSetup() {
  localStorage.removeItem(CLIENT_ID_KEY);
  localStorage.removeItem(TENANT_ID_KEY);
  msalInstance = null;
  activeAccount = null;
  profile = null;
  clientIdInput.value = '';
  tenantIdInput.value = '';
  setupMessage.textContent = 'Microsoft setup cleared from this browser.';
  setupMessage.className = 'setup-message success';
  renderMicrosoftState();
}

// Navigation and local workspace events
document.querySelectorAll('.nav').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
document.querySelectorAll('.jump').forEach(button => button.addEventListener('click', () => setView(button.dataset.jump)));
$('quickImportBtn').addEventListener('click', () => setView('import'));
$('exportBtn').addEventListener('click', exportWorkspace);
$('savePasteBtn').addEventListener('click', savePastedItem);
$('addTaskBtn').addEventListener('click', addTask);
$('taskInput').addEventListener('keydown', event => { if (event.key === 'Enter') addTask(); });
fileInput.addEventListener('change', () => importFiles(fileInput.files));
['dragenter', 'dragover'].forEach(name => dropzone.addEventListener(name, event => { event.preventDefault(); dropzone.classList.add('dragging'); }));
['dragleave', 'drop'].forEach(name => dropzone.addEventListener(name, event => { event.preventDefault(); dropzone.classList.remove('dragging'); }));
dropzone.addEventListener('drop', event => importFiles(event.dataTransfer.files));
$('clearLibraryBtn').addEventListener('click', async () => {
  if (!confirm('Clear all locally imported library items from this browser?')) return;
  await dbClear();
  selectedAiIds.clear();
  saveAiSelection();
  await refreshWorkspace();
});

// Assistant events
askBtn.addEventListener('click', runAssistant);
assistantInput.addEventListener('keydown', event => { if (event.key === 'Enter') runAssistant(); });
document.querySelectorAll('.suggestions button').forEach(button => button.addEventListener('click', () => { assistantInput.value = button.textContent; runAssistant(); }));
$('saveAiAccessBtn').addEventListener('click', saveAiAccess);
$('clearAiAccessBtn').addEventListener('click', clearAiAccess);

// Microsoft events
connectBtn.addEventListener('click', async () => { if (activeAccount) openMicrosoftModal('Microsoft 365 is connected.'); else await signInMicrosoft(); });
closeModalBtn.addEventListener('click', closeMicrosoftModal);
saveAndSignInBtn.addEventListener('click', saveMicrosoftSetupAndSignIn);
clearSetupBtn.addEventListener('click', clearMicrosoftSetup);
signOutBtn.addEventListener('click', signOutMicrosoft);
modal.addEventListener('click', event => { if (event.target === modal) closeMicrosoftModal(); });

(async function boot() {
  renderTasks();
  renderMicrosoftState();
  await refreshWorkspace();
  await checkAiStatus();
  if (sessionStorage.getItem(AI_ACCESS_KEY)) {
    aiSetupMessage.textContent = 'A CareerNavIQ access code is stored for this browser session.';
    aiSetupMessage.className = 'setup-message success';
  }
  if (localStorage.getItem(CLIENT_ID_KEY)) {
    try {
      await createMicrosoftClient();
      renderMicrosoftState();
      if (activeAccount) await loadMicrosoftProfile();
    } catch (error) { showMicrosoftError(error); }
  }
})();
