(() => {
  const $ = id => document.getElementById(id);
  const PROJECTS_KEY = 'careernaviq_projects';
  const TASKS_KEY = 'careernaviq_tasks';
  const AI_SELECTION_KEY = 'careernaviq_ai_selection';
  const DB_NAME = 'careernaviq-local-workspace';
  const ITEM_STORE = 'items';

  function loadJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
  }
  function saveProjects(items) { localStorage.setItem(PROJECTS_KEY, JSON.stringify(items)); renderProjects(); }
  function uuid() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }

  function renderProjects() {
    const container = $('projectList');
    if (!container) return;
    const projects = loadJson(PROJECTS_KEY, []);
    container.innerHTML = '';
    if (!projects.length) {
      container.className = 'project-list empty-state';
      container.textContent = 'No projects yet.';
      return;
    }
    container.className = 'project-list';
    projects.forEach(project => {
      const row = document.createElement('div');
      row.className = 'project-row';
      const info = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = project.name;
      const next = document.createElement('small');
      next.textContent = project.next ? `Next: ${project.next}` : 'No next action set';
      info.append(title, next);
      const actions = document.createElement('div');
      actions.className = 'project-actions';
      const copy = document.createElement('button');
      copy.className = 'mini-btn';
      copy.textContent = 'Ask ChatGPT';
      copy.addEventListener('click', () => handoff(`Help me with this work project. Project: ${project.name}. ${project.next ? `Current next action: ${project.next}.` : ''} Give me the best next steps and anything I may be overlooking.`));
      const del = document.createElement('button');
      del.className = 'mini-btn danger';
      del.textContent = 'Delete';
      del.addEventListener('click', () => saveProjects(projects.filter(p => p.id !== project.id)));
      actions.append(copy, del);
      row.append(info, actions);
      container.appendChild(row);
    });
  }

  function addProject() {
    const name = $('projectNameInput')?.value.trim();
    const next = $('projectNextInput')?.value.trim();
    if (!name) return;
    const projects = loadJson(PROJECTS_KEY, []);
    projects.unshift({ id: uuid(), name, next, createdAt: Date.now() });
    saveProjects(projects);
    $('projectNameInput').value = '';
    $('projectNextInput').value = '';
  }

  function readItems() {
    return new Promise(resolve => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onerror = () => resolve([]);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(ITEM_STORE)) { resolve([]); return; }
        const get = db.transaction(ITEM_STORE, 'readonly').objectStore(ITEM_STORE).getAll();
        get.onsuccess = () => resolve(get.result || []);
        get.onerror = () => resolve([]);
      };
    });
  }

  async function buildPrompt(question, forceBrief = false) {
    const tasks = loadJson(TASKS_KEY, []).filter(t => !t.done);
    const projects = loadJson(PROJECTS_KEY, []);
    const includeContext = $('includeAiContext')?.checked ?? true;
    let selected = [];
    if (includeContext) {
      let selectedIds = [];
      try { selectedIds = JSON.parse(sessionStorage.getItem(AI_SELECTION_KEY) || '[]'); } catch {}
      const items = await readItems();
      selected = items.filter(i => selectedIds.includes(i.id) && i.text?.trim()).slice(0, 8);
    }

    const sections = [];
    sections.push(`I am using CareerNavIQ as my personal work command center. Help me with this request:\n${question || 'Review my current work and tell me what I should focus on next.'}`);
    if (projects.length) sections.push(`ACTIVE PROJECTS:\n${projects.slice(0, 10).map(p => `- ${p.name}${p.next ? ` | Next: ${p.next}` : ''}`).join('\n')}`);
    if (includeContext && tasks.length) sections.push(`OPEN TASKS / FOLLOW-UPS:\n${tasks.slice(0, 20).map(t => `- ${t.text}`).join('\n')}`);
    if (includeContext && selected.length) sections.push(`SELECTED WORK MATERIAL:\n${selected.map((item, i) => `--- ${i + 1}. ${item.title || item.fileName || 'Work item'} (${item.kind || 'note'}) ---\n${String(item.text).slice(0, 7000)}`).join('\n\n')}`);
    if (forceBrief) sections.push('Return a concise work brief with: top priorities, deadlines/follow-ups, risks or blockers, and the next 3 actions I should take.');
    else sections.push('Use the context above only as needed. Be practical and action-oriented. If you draft work communications, keep them professional and concise.');
    return sections.join('\n\n');
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove(); return ok;
    }
  }

  async function handoff(question, forceBrief = false) {
    const prompt = await buildPrompt(question, forceBrief);
    const copied = await copyText(prompt);
    const reply = $('assistantReply');
    if (reply) reply.textContent = copied ? 'Work brief copied. ChatGPT is opening — paste it into the chat and send.' : 'ChatGPT is opening. Copy your work brief manually if your browser blocked clipboard access.';
    window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer');
  }

  document.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.id === 'askBtn') {
      event.preventDefault(); event.stopImmediatePropagation();
      const question = $('assistantInput')?.value.trim();
      if (!question) { if ($('assistantReply')) $('assistantReply').textContent = 'Type a question first.'; return; }
      handoff(question);
    }
    if (target.closest('.suggestions button')) {
      event.preventDefault(); event.stopImmediatePropagation();
      const text = target.textContent.trim();
      if ($('assistantInput')) $('assistantInput').value = text;
      handoff(text);
    }
  }, true);

  function renameAiButtons() {
    document.querySelectorAll('.mini-btn').forEach(btn => {
      if (btn.textContent.trim() === 'Add to AI') btn.textContent = 'Use in ChatGPT';
      if (btn.textContent.trim() === 'AI ✓') btn.textContent = 'ChatGPT ✓';
    });
  }
  new MutationObserver(renameAiButtons).observe(document.body, { childList: true, subtree: true });

  $('openChatGPTBtn')?.addEventListener('click', () => window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer'));
  $('connectionsOpenChatGPT')?.addEventListener('click', () => window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer'));
  $('copyWorkBriefBtn')?.addEventListener('click', () => handoff('Review my current work and organize my day.', true));
  $('addProjectBtn')?.addEventListener('click', addProject);
  $('projectNextInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') addProject(); });
  $('projectNameInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') addProject(); });

  document.querySelectorAll('.nav[data-view="projects"]').forEach(btn => btn.addEventListener('click', () => {
    setTimeout(() => {
      if ($('viewEyebrow')) $('viewEyebrow').textContent = 'PROJECTS';
      if ($('viewTitle')) $('viewTitle').textContent = 'My work.';
      if ($('viewSubtitle')) $('viewSubtitle').textContent = 'Keep recurring assignments organized and hand any project to ChatGPT when you need help.';
    }, 0);
  }));

  renderProjects();
  renameAiButtons();
})();