const crypto = require('crypto');

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function cleanText(value, max) {
  return String(value || '').replace(/\u0000/g, '').slice(0, max);
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') {
    try { return Promise.resolve(JSON.parse(req.body)); } catch { return Promise.resolve({}); }
  }
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 200000) req.destroy();
    });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (error) { reject(error); }
    });
    req.on('error', reject);
  });
}

function extractOutputText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const parts = [];
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') parts.push(content.text);
    }
  }
  return parts.join('\n').trim();
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const origin = req.headers.origin || '';
  const allowedOrigins = new Set(['https://careernaviq.com', 'https://www.careernaviq.com']);
  if (origin && !allowedOrigins.has(origin)) {
    res.status(403).json({ error: 'Origin not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const expectedAccess = process.env.CAREERNAVIQ_ACCESS_TOKEN;
  if (!apiKey || !expectedAccess) {
    res.status(503).json({ error: 'AI backend is not configured yet.' });
    return;
  }

  const suppliedAccess = req.headers['x-careernaviq-access'];
  if (!safeEqual(suppliedAccess, expectedAccess)) {
    res.status(401).json({ error: 'Invalid CareerNavIQ access code.' });
    return;
  }

  let body;
  try {
    body = await parseBody(req);
  } catch {
    res.status(400).json({ error: 'Invalid request body.' });
    return;
  }

  const question = cleanText(body.question, 5000).trim();
  if (!question) {
    res.status(400).json({ error: 'A question is required.' });
    return;
  }

  const context = Array.isArray(body.context) ? body.context.slice(0, 12) : [];
  const tasks = Array.isArray(body.tasks) ? body.tasks.slice(0, 30) : [];

  let contextChars = 0;
  const contextBlocks = [];
  for (const item of context) {
    if (contextChars >= 50000) break;
    const title = cleanText(item?.title, 300) || 'Untitled item';
    const kind = cleanText(item?.kind, 80) || 'item';
    const text = cleanText(item?.text, Math.min(10000, 50000 - contextChars)).trim();
    if (!text) continue;
    contextChars += text.length;
    contextBlocks.push(`[${kind}] ${title}\n${text}`);
  }

  const taskLines = tasks
    .map(task => cleanText(typeof task === 'string' ? task : task?.text, 500).trim())
    .filter(Boolean);

  const userInput = [
    `USER QUESTION:\n${question}`,
    taskLines.length ? `OPEN TASKS:\n- ${taskLines.join('\n- ')}` : '',
    contextBlocks.length ? `SELECTED WORK CONTEXT:\n\n${contextBlocks.join('\n\n---\n\n')}` : ''
  ].filter(Boolean).join('\n\n');

  const instructions = [
    'You are CareerNavIQ, a concise personal work assistant.',
    'Use only the user question, open tasks, and selected work context supplied in this request.',
    'Do not claim you read Outlook, Teams, OneDrive, company systems, or any file that is not explicitly included.',
    'When useful, identify priorities, deadlines, unanswered questions, follow-ups, risks, and next actions.',
    'For meeting preparation, produce short talking points, questions to ask, and action items.',
    'For email drafting, keep the draft professional and practical unless the user asks for another tone.',
    'If the supplied context is insufficient, say what is missing instead of guessing.',
    'Never state that an email was sent, a task was completed, or another external action occurred unless the user explicitly says it happened.'
  ].join(' ');

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-6-luna',
        instructions,
        input: userInput,
        max_output_tokens: 1200,
        store: false
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || `OpenAI returned ${response.status}.`;
      res.status(response.status >= 400 && response.status < 500 ? 400 : 502).json({ error: message });
      return;
    }

    const answer = extractOutputText(data);
    if (!answer) {
      res.status(502).json({ error: 'The AI response did not contain text.' });
      return;
    }

    res.status(200).json({ answer, model: data.model || process.env.OPENAI_MODEL || 'gpt-6-luna' });
  } catch (error) {
    console.error('CareerNavIQ OpenAI request failed:', error);
    res.status(502).json({ error: 'The AI service could not be reached.' });
  }
};
