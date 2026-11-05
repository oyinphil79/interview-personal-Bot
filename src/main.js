import './style.css';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ROLES, buildSystemPrompt } from './roles.js';
import { streamChat, DEFAULT_MODEL } from './gemini.js';

marked.setOptions({ breaks: true, gfm: true });

// ---------- storage helpers (never throw) ----------
const store = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  del(k) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

// ---------- state ----------
const state = {
  apiKey: store.get('gemini_api_key') || '',
  model: store.get('gemini_model') || DEFAULT_MODEL,
  roleId: store.get('active_role') in ROLES ? store.get('active_role') : 'aipm',
  mode: 'coach',
  // separate conversation per role
  chats: Object.fromEntries(Object.keys(ROLES).map((id) => [id, []])),
  busy: false,
  controller: null,
};

// ---------- elements ----------
const $ = (id) => document.getElementById(id);
const el = {
  tabs: $('roleTabs'),
  title: $('roleTitle'),
  blurb: $('roleBlurb'),
  messages: $('messages'),
  suggestions: $('suggestions'),
  form: $('composer'),
  input: $('input'),
  send: $('sendBtn'),
  mode: $('modeSelect'),
  clear: $('clearBtn'),
  keyBtn: $('keyBtn'),
  keyDot: $('keyDot'),
  keyBtnLabel: $('keyBtnLabel'),
  dialog: $('keyDialog'),
  keyForm: $('keyForm'),
  keyInput: $('keyInput'),
  modelInput: $('modelInput'),
  remember: $('rememberKey'),
  keyError: $('keyError'),
  keyCancel: $('keyCancel'),
};

// ---------- rendering ----------
function applyTheme(role) {
  const root = document.documentElement.style;
  const t = role.theme;
  root.setProperty('--accent', t.accent);
  root.setProperty('--accent-2', t.accent2);
  root.setProperty('--glow', t.glow);
  root.setProperty('--bot-bubble', t.botBubble);
  root.setProperty('--card-border', t.border);
  document.body.dataset.role = role.id;
}

function renderTabs() {
  el.tabs.innerHTML = '';
  for (const role of Object.values(ROLES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.role = 'tab';
    b.className = 'role-tab';
    b.dataset.role = role.id;
    b.style.setProperty('--tab-accent', role.theme.accent);
    b.style.setProperty('--tab-accent-2', role.theme.accent2);
    b.setAttribute('aria-selected', String(role.id === state.roleId));
    b.innerHTML = `<span class="tab-dot"></span><span class="tab-label">${role.label}</span>`;
    b.addEventListener('click', () => switchRole(role.id));
    el.tabs.appendChild(b);
  }
}

function renderMarkdown(text) {
  return DOMPurify.sanitize(marked.parse(text || ''));
}

function messageNode(role, text, { error = false } = {}) {
  const wrap = document.createElement('div');
  wrap.className = `msg ${role === 'user' ? 'user' : 'bot'}${error ? ' error-msg' : ''}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  if (role === 'user') bubble.textContent = text;
  else bubble.innerHTML = renderMarkdown(text);
  wrap.appendChild(bubble);
  return wrap;
}

function renderWelcome(role) {
  const w = document.createElement('div');
  w.className = 'welcome';
  w.innerHTML = `
    <div class="welcome-badge">${role.short}</div>
    <h3>Prepare for your ${role.label} interview</h3>
    <p class="muted">Pick a mode above, try a suggestion below, or ask anything. Areas we can cover:</p>
    <ul>${role.focus.map((f) => `<li>${f}</li>`).join('')}</ul>`;
  return w;
}

function renderMessages() {
  const role = ROLES[state.roleId];
  const chat = state.chats[state.roleId];
  el.messages.innerHTML = '';
  if (!chat.length) el.messages.appendChild(renderWelcome(role));
  for (const m of chat) el.messages.appendChild(messageNode(m.role, m.text, { error: m.error }));
  scrollToBottom();
}

function renderSuggestions() {
  const role = ROLES[state.roleId];
  el.suggestions.innerHTML = '';
  const list =
    state.mode === 'mock'
      ? ['start', 'Ask me a harder question', 'stop and give me my summary']
      : state.mode === 'feedback'
        ? ['Question: Tell me about a time you handled a failing project.\nMy answer: ']
        : role.suggestions;
  for (const s of list) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = s.split('\n')[0];
    b.addEventListener('click', () => {
      if (s.endsWith(': ')) {
        el.input.value = s;
        autoGrow();
        el.input.focus();
      } else send(s);
    });
    el.suggestions.appendChild(b);
  }
}

function renderHeader() {
  const role = ROLES[state.roleId];
  el.title.textContent = role.label;
  el.blurb.textContent = role.blurb;
}

function renderKeyStatus() {
  const has = !!state.apiKey;
  el.keyDot.classList.toggle('on', has);
  el.keyBtnLabel.textContent = has ? `Key set · ${state.model}` : 'Set API key';
}

function scrollToBottom() {
  el.messages.scrollTop = el.messages.scrollHeight;
}

function setBusy(b) {
  state.busy = b;
  el.send.classList.toggle('stop', b);
  el.send.setAttribute('aria-label', b ? 'Stop' : 'Send');
  el.send.innerHTML = b
    ? '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>'
    : '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z"/></svg>';
}

// ---------- actions ----------
function switchRole(id) {
  if (id === state.roleId) return;
  if (state.busy) state.controller?.abort();
  state.roleId = id;
  store.set('active_role', id);
  for (const t of el.tabs.children) t.setAttribute('aria-selected', String(t.dataset.role === id));
  applyTheme(ROLES[id]);
  renderHeader();
  renderMessages();
  renderSuggestions();
}

function openKeyDialog() {
  el.keyInput.value = state.apiKey;
  el.modelInput.value = state.model;
  el.keyError.hidden = true;
  el.dialog.showModal();
  el.keyInput.focus();
}

async function send(text) {
  text = text.trim();
  if (!text || state.busy) return;
  if (!state.apiKey) {
    openKeyDialog();
    return;
  }

  const roleId = state.roleId;
  const role = ROLES[roleId];
  const chat = state.chats[roleId];
  // drop previous error messages from the history sent to the model
  const history = chat.filter((m) => !m.error);
  chat.length = 0;
  chat.push(...history, { role: 'user', text });
  renderMessages();

  el.input.value = '';
  autoGrow();

  const botMsg = { role: 'model', text: '' };
  const node = messageNode('model', '');
  node.classList.add('streaming');
  node.querySelector('.bubble').innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
  el.messages.appendChild(node);
  scrollToBottom();

  state.controller = new AbortController();
  setBusy(true);
  try {
    await streamChat({
      apiKey: state.apiKey,
      model: state.model,
      system: buildSystemPrompt(role, state.mode),
      history: chat.map(({ role, text }) => ({ role, text })),
      signal: state.controller.signal,
      onChunk: (chunk) => {
        botMsg.text += chunk;
        if (state.roleId === roleId) {
          node.querySelector('.bubble').innerHTML = renderMarkdown(botMsg.text);
          scrollToBottom();
        }
      },
    });
    if (!botMsg.text) botMsg.text = '_No response received. Try rephrasing your message._';
    chat.push(botMsg);
  } catch (err) {
    if (err.name === 'AbortError') {
      if (botMsg.text) chat.push({ ...botMsg, text: botMsg.text + '\n\n_(stopped)_' });
    } else {
      let msg = `**Error:** ${err.message}`;
      if (err.status === 400 || err.status === 401 || err.status === 403)
        msg += '\n\nCheck that your API key is valid and has access to this model.';
      if (err.status === 404)
        msg += `\n\nModel \`${state.model}\` was not found. You can change the model in the API key settings.`;
      if (err.status === 429) msg += '\n\nRate limit reached — wait a moment and try again.';
      chat.push({ role: 'model', text: msg, error: true });
    }
  } finally {
    setBusy(false);
    state.controller = null;
    if (state.roleId === roleId) renderMessages();
  }
}

function autoGrow() {
  el.input.style.height = 'auto';
  el.input.style.height = Math.min(el.input.scrollHeight, 180) + 'px';
}

// ---------- events ----------
el.form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (state.busy) state.controller?.abort();
  else send(el.input.value);
});

el.input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    if (!state.busy) send(el.input.value);
  }
});
el.input.addEventListener('input', autoGrow);

el.mode.addEventListener('change', () => {
  state.mode = el.mode.value;
  el.input.placeholder =
    state.mode === 'mock'
      ? 'Type “start” to begin the mock interview…'
      : state.mode === 'feedback'
        ? 'Paste an interview question and your answer…'
        : 'Ask anything about this role’s interviews…';
  renderSuggestions();
});

el.clear.addEventListener('click', () => {
  if (state.busy) state.controller?.abort();
  state.chats[state.roleId] = [];
  renderMessages();
});

el.keyBtn.addEventListener('click', openKeyDialog);
el.keyCancel.addEventListener('click', () => el.dialog.close());

el.keyForm.addEventListener('submit', (e) => {
  const key = el.keyInput.value.trim();
  if (!key) {
    e.preventDefault();
    el.keyError.textContent = 'Please enter an API key.';
    el.keyError.hidden = false;
    return;
  }
  state.apiKey = key;
  state.model = el.modelInput.value.trim() || DEFAULT_MODEL;
  if (el.remember.checked) {
    store.set('gemini_api_key', key);
    store.set('gemini_model', state.model);
  } else {
    store.del('gemini_api_key');
    store.del('gemini_model');
  }
  renderKeyStatus();
  el.input.focus();
});

// ---------- init ----------
applyTheme(ROLES[state.roleId]);
renderTabs();
renderHeader();
renderMessages();
renderSuggestions();
renderKeyStatus();
if (!state.apiKey) openKeyDialog();
