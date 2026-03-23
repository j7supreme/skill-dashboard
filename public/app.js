/* ============================================================
   Skill Dashboard — app.js
   ============================================================ */
'use strict';

// ── State ─────────────────────────────────────────────────────
const state = {
  skills: [],
  filtered: [],
  scope: 'global',
  view: 'grid',
  sort: 'newest',
  agent: 'all',
  fn: 'all',
  search: '',
  loading: false,
  openDropdown: null,
  detailSkill: null,
};

// ── DOM refs ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const els = {
  search: $('search'),
  searchClear: $('searchClear'),
  btnGrid: $('btnGrid'),
  btnList: $('btnList'),
  sortSelect: $('sortSelect'),
  agentSelect: $('agentSelect'),
  functionSelect: $('functionSelect'),
  refreshBtn: $('refreshBtn'),
  themeBtn: $('themeBtn'),
  tabs: document.querySelectorAll('.tab'),
  countGlobal: $('countGlobal'),
  countProject: $('countProject'),
  loadingState: $('loadingState'),
  emptyState: $('emptyState'),
  container: $('skillsContainer'),
  detailOverlay: $('detailOverlay'),
  detailPanel: $('detailPanel'),
  detailTitle: $('detailTitle'),
  detailDescription: $('detailDescription'),
  detailBadges: $('detailBadges'),
  detailPath: $('detailPath'),
  detailAgents: $('detailAgents'),
  detailInstallDate: $('detailInstallDate'),
  detailMd: $('detailMd'),
  detailClose: $('detailClose'),
  detailSkillsShBtn: $('detailSkillsShBtn'),
  detailCopyBtn: $('detailCopyBtn'),
  toast: $('toast'),
  confirmOverlay: $('confirmOverlay'),
  confirmModal: $('confirmModal'),
  confirmTitle: $('confirmTitle'),
  confirmBody: $('confirmBody'),
  confirmCancel: $('confirmCancel'),
  confirmOk: $('confirmOk'),
};

// ── Icon generation ───────────────────────────────────────────
const ICON_COLORS = [
  ['var(--text)', 'var(--surface)'],
];

const CATEGORY_ICONS = {
  adapt: '🔄', animate: '✨', audit: '🔍', bolder: '💪',
  clarify: '💬', colorize: '🎨', critique: '📝', delight: '🌟',
  distill: '⚗️', extract: '📤', 'find-skills': '🔎',
  'frontend-design': '🖼️', 'frontend-slides': '📊',
  harden: '🛡️', normalize: '⚖️', onboard: '🚀', optimize: '⚡',
  polish: '✦', pptx: '📑', quieter: '🔇',
  'remotion-best-practices': '🎬', 'teach-impeccable': '🎓',
  'vercel-react-best-practices': '▲', figma: '🎯',
  'figma-implement-design': '✏️', imagegen: '🖼️',
};

function skillIcon(name) {
  return CATEGORY_ICONS[name] || name[0].toUpperCase();
}

function skillColor(name) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return ICON_COLORS[Math.abs(hash) % ICON_COLORS.length];
}

// ── API ───────────────────────────────────────────────────────
async function fetchSkills() {
  const res = await fetch('/api/skills');
  if (!res.ok) throw new Error('Failed to load skills');
  return res.json();
}

async function apiAction(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Action failed');
  return data;
}

async function fetchDetail(name) {
  const res = await fetch(`/api/skills/${encodeURIComponent(name)}/detail`);
  if (!res.ok) throw new Error('Failed to load details');
  return res.json();
}

// ── Data loading ──────────────────────────────────────────────
async function loadSkills() {
  state.loading = true;
  els.loadingState.classList.remove('hidden');
  els.emptyState.classList.add('hidden');
  els.container.classList.add('hidden');

  try {
    const { skills } = await fetchSkills();
    state.skills = skills;
    populateDropdowns();
    applyFilters();
  } catch (e) {
    showToast('Error loading skills: ' + e.message, 'error');
    els.loadingState.classList.add('hidden');
    els.emptyState.classList.remove('hidden');
  } finally {
    state.loading = false;
  }
}

function populateDropdowns() {
  const agents = new Set();
  const functions = new Set();
  state.skills.forEach(s => {
    functions.add(s.functionGroup || 'Other Utilities');
    (s.agents || []).forEach(a => agents.add(a));
  });

  els.agentSelect.innerHTML = '<option value="all">All Agents</option>' +
    [...agents].sort().map(a => `<option value="${a}">${a}</option>`).join('');
  els.agentSelect.value = state.agent;

  els.functionSelect.innerHTML = '<option value="all">All Functions</option>' +
    [...functions].sort().map(f => `<option value="${f}">${f}</option>`).join('');
  els.functionSelect.value = state.fn;
}

// ── Filtering / Sorting ───────────────────────────────────────
function applyFilters() {
  let list = [...state.skills];

  // Scope filter strictly global or project
  list = list.filter(s => s.scope === state.scope);

  // Agent filter
  if (state.agent !== 'all') {
    list = list.filter(s => (s.agents || []).includes(state.agent));
  }
  
  // Function filter
  if (state.fn !== 'all') {
    list = list.filter(s => s.functionGroup === state.fn);
  }

  // Search
  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.agents || []).some(a => a.toLowerCase().includes(q))
    );
  }

  // Sort
  list.sort((a, b) => {
    if (state.sort === 'name') return a.name.localeCompare(b.name);
    if (state.sort === 'newest') return (b.installDate || '').localeCompare(a.installDate || '');
    if (state.sort === 'oldest') return (a.installDate || '').localeCompare(b.installDate || '');
    return 0;
  });

  state.filtered = list;
  updateCounts();
  render();
}

function updateCounts() {
  els.countGlobal.textContent = state.skills.filter(s => s.scope === 'global').length;
  els.countProject.textContent = state.skills.filter(s => s.scope === 'project').length;
}

// ── Grouping ──────────────────────────────────────────────────
function groupSkills(skills) {
  const groups = {};
  for (const s of skills) {
    const key = s.functionGroup || 'Other Utilities';
    (groups[key] = groups[key] || []).push(s);
  }
  return groups;
}

// ── Rendering ─────────────────────────────────────────────────
function render() {
  els.loadingState.classList.add('hidden');

  if (state.filtered.length === 0) {
    els.emptyState.classList.remove('hidden');
    els.container.classList.add('hidden');
    return;
  }

  els.emptyState.classList.add('hidden');
  els.container.classList.remove('hidden');
  els.container.innerHTML = '';

  const groups = groupSkills(state.filtered);

  // Render groups in fixed alphabetical order so the categories don't jump around
  const sortedGroups = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));

  for (const [groupName, skills] of sortedGroups) {
    const block = document.createElement('div');
    block.className = 'group-block';
    block.dataset.group = groupName;

    // Section header
    const header = document.createElement('div');
    header.className = 'group-header';
    header.innerHTML = `
      <span class="group-title">${groupName}</span>
      <span class="group-line"></span>
      <span class="group-count">${skills.length}</span>
      <span class="group-toggle-icon">▾</span>`;
    header.addEventListener('click', () => {
      block.classList.toggle('collapsed');
      header.querySelector('.group-toggle-icon').textContent =
        block.classList.contains('collapsed') ? '▸' : '▾';
    });
    block.appendChild(header);

    const wrapper = document.createElement('div');
    wrapper.className = 'group-content';

    const grid = document.createElement('div');
    grid.className = state.view === 'grid' ? 'grid-view' : 'list-view';
    for (const skill of skills) {
      grid.appendChild(state.view === 'grid' ? buildCard(skill) : buildListRow(skill));
    }
    wrapper.appendChild(grid);

    block.appendChild(wrapper);
    els.container.appendChild(block);
  }
}

function buildCard(skill) {
  const card = document.createElement('div');
  card.className = 'skill-card';
  card.dataset.name = skill.name;

  const agentBadges = buildAgentBadges(skill.agents || []);

  card.innerHTML = `
    <div class="card-top">
      <div class="card-info">
        <div class="card-name" title="${skill.name}">${skill.name}</div>
        <div class="card-description">${skill.description || 'No description available'}</div>
      </div>
    </div>
    <div class="card-badges">${agentBadges}</div>
    <div class="card-footer">
      <button class="btn btn-primary detail-btn">Details</button>
      <div style="flex:1"></div>
      <div style="position:relative">
        <button class="more-btn" title="More actions" aria-haspopup="true">⋯</button>
      </div>
    </div>`;

  card.addEventListener('click', e => {
    if (e.target.closest('.more-btn') || e.target.closest('.dropdown') || e.target.closest('.detail-btn')) return;
    openDetail(skill);
  });
  card.querySelector('.detail-btn').addEventListener('click', () => openDetail(skill));
  card.querySelector('.more-btn').addEventListener('click', e => {
    e.stopPropagation();
    toggleDropdown(e.currentTarget, skill);
  });

  return card;
}

function buildListRow(skill) {
  const row = document.createElement('div');
  row.className = 'list-row';
  const agentBadges = buildAgentBadges(skill.agents || []);

  row.innerHTML = `
    <div class="card-info">
      <div class="card-name">${skill.name}</div>
      <div class="card-description">${skill.description || ''}</div>
    </div>
    <div class="card-badges">${agentBadges}</div>
    <div class="list-actions">
      <button class="btn btn-secondary detail-btn">Details</button>
      <div style="position:relative">
        <button class="more-btn" title="More actions">⋯</button>
      </div>
    </div>`;

  row.addEventListener('click', e => {
    if (e.target.closest('.more-btn') || e.target.closest('.dropdown') || e.target.closest('.detail-btn')) return;
    openDetail(skill);
  });
  row.querySelector('.detail-btn').addEventListener('click', () => openDetail(skill));
  row.querySelector('.more-btn').addEventListener('click', e => {
    e.stopPropagation();
    toggleDropdown(e.currentTarget, skill);
  });
  return row;
}

function buildAgentBadges(agents) {
  const MAX = 3;
  let html = agents.slice(0, MAX).map(a => `<span class="badge badge-agent">${a}</span>`).join('');
  if (agents.length > MAX) {
    html += `<span class="badge badge-more-agents">+${agents.length - MAX} more</span>`;
  }
  return html;
}

// ── Dropdown ──────────────────────────────────────────────────
function toggleDropdown(btn, skill) {
  // If a dropdown is already open on THIS button, close it
  if (state.openDropdown && btn.parentElement.contains(state.openDropdown)) {
    closeDropdown();
    return;
  }
  closeDropdown();
  const menu = document.createElement('div');
  menu.className = 'dropdown';
  menu.innerHTML = `
    <button class="dropdown-item" data-action="update">Update</button>
    <button class="dropdown-item" data-action="reinstall">Reinstall</button>
    <button class="dropdown-item" data-action="copy">Copy install command</button>
    <div class="dropdown-divider"></div>
    <button class="dropdown-item danger" data-action="uninstall">Uninstall</button>`;
  menu.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', e => {
      e.stopPropagation();
      closeDropdown();
      handleAction(item.dataset.action, skill);
    });
  });

  btn.parentElement.appendChild(menu);
  state.openDropdown = menu;
}

function closeDropdown() {
  if (state.openDropdown) {
    state.openDropdown.remove();
    state.openDropdown = null;
  }
}

// ── Actions ───────────────────────────────────────────────────
async function handleAction(action, skill) {
  if (action === 'copy') {
    await navigator.clipboard.writeText(skill.installCmd || `npx skills add ${skill.name}`);
    showToast('Install command copied!', 'success');
    return;
  }

  if (action === 'uninstall') {
    confirm(
      `Uninstall "${skill.name}"?`,
      `This will remove the skill from your ${skill.scope === 'global' ? 'global' : 'project'} installation.`,
      async () => {
        try {
          showToast('Uninstalling…');
          await apiAction(`/api/skills/${encodeURIComponent(skill.name)}/uninstall`, {
            isGlobal: skill.scope === 'global',
          });
          showToast(`"${skill.name}" uninstalled`, 'success');
          await loadSkills();
        } catch (e) { showToast(e.message, 'error'); }
      }
    );
    return;
  }

  if (action === 'update') {
    confirm(
      `Update "${skill.name}"?`,
      'This will pull the latest version of this skill.',
      async () => {
        try {
          showToast('Updating…');
          await apiAction(`/api/skills/${encodeURIComponent(skill.name)}/update`, {});
          showToast(`"${skill.name}" updated`, 'success');
          await loadSkills();
        } catch (e) { showToast(e.message, 'error'); }
      }
    );
    return;
  }

  if (action === 'reinstall') {
    confirm(
      `Reinstall "${skill.name}"?`,
      'This will remove and re-add the skill. Any custom modifications may be lost.',
      async () => {
        try {
          showToast('Reinstalling…');
          await apiAction(`/api/skills/${encodeURIComponent(skill.name)}/reinstall`, {
            source: skill.source,
            isGlobal: skill.scope === 'global',
          });
          showToast(`"${skill.name}" reinstalled`, 'success');
          await loadSkills();
        } catch (e) { showToast(e.message, 'error'); }
      }
    );
  }
}

// ── Detail Panel ──────────────────────────────────────────────
async function openDetail(skill) {
  state.detailSkill = skill;

  els.detailTitle.textContent = skill.name;
  els.detailDescription.textContent = skill.description || '';
  els.detailPath.textContent = skill.path;
  
  if (skill.installDate) {
    const d = new Date(skill.installDate);
    const YY = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const DD = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const MIN = String(d.getMinutes()).padStart(2, '0');
    els.detailInstallDate.textContent = `${YY}/${MM}/${DD} ${HH}:${MIN}`;
  } else {
    els.detailInstallDate.textContent = 'Unknown';
  }

  els.detailBadges.innerHTML = `
    <span class="badge badge-scope-${skill.scope}">${skill.scope}</span>
    ${skill.userInvokable ? '<span class="badge badge-invokable">⚡ user-invokable</span>' : ''}`;
  els.detailAgents.innerHTML = (skill.agents || []).map(a => `<span class="badge badge-agent">${a}</span>`).join('');
  els.detailMd.innerHTML = renderMarkdown(skill.skillsMdPreview || skill.skillsMdFull || 'No SKILL.md found.');

  els.detailOverlay.classList.remove('hidden');
  els.detailPanel.classList.remove('hidden');

  // Async load full detail
  try {
    const detail = await fetchDetail(skill.name);
    if (detail.skillsMdFull) {
      els.detailMd.innerHTML = renderMarkdown(detail.skillsMdFull);
    }
  } catch {}
}

function closeDetail() {
  els.detailOverlay.classList.add('hidden');
  els.detailPanel.classList.add('hidden');
  state.detailSkill = null;
}

function renderMarkdown(md) {
  // Simple markdown renderer (no external dependency)
  return md
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, m => `<ul>${m}</ul>`)
    .replace(/\n{2,}/g,'</p><p>')
    .replace(/^(?!<[huplr])(.+)$/gm, '$1')
    .replace(/^<\/p><p>/, '')
    .replace(/<\/p><p>$/, '');
}

// ── Confirm Modal ─────────────────────────────────────────────
let _confirmCallback = null;

function confirm(title, body, callback) {
  els.confirmTitle.textContent = title;
  els.confirmBody.textContent = body;
  _confirmCallback = callback;
  els.confirmOverlay.classList.remove('hidden');
  els.confirmModal.classList.remove('hidden');
}

function closeConfirm() {
  els.confirmOverlay.classList.add('hidden');
  els.confirmModal.classList.add('hidden');
  _confirmCallback = null;
}

// ── Toast ─────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, type = '') {
  if (_toastTimer) clearTimeout(_toastTimer);
  els.toast.textContent = msg;
  els.toast.className = 'toast' + (type ? ` ${type}` : '');
  els.toast.classList.remove('hidden');
  _toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 3000);
}

// ── Event Listeners ───────────────────────────────────────────
els.search.addEventListener('input', () => {
  state.search = els.search.value;
  els.searchClear.style.opacity = state.search ? '1' : '0';
  applyFilters();
});

els.searchClear.addEventListener('click', () => {
  els.search.value = '';
  state.search = '';
  els.searchClear.style.opacity = '0';
  applyFilters();
});

els.btnGrid.addEventListener('click', () => {
  state.view = 'grid';
  els.btnGrid.classList.add('active'); els.btnGrid.setAttribute('aria-pressed','true');
  els.btnList.classList.remove('active'); els.btnList.setAttribute('aria-pressed','false');
  render();
});
els.btnList.addEventListener('click', () => {
  state.view = 'list';
  els.btnList.classList.add('active'); els.btnList.setAttribute('aria-pressed','true');
  els.btnGrid.classList.remove('active'); els.btnGrid.setAttribute('aria-pressed','false');
  render();
});

els.sortSelect.addEventListener('change', () => { state.sort = els.sortSelect.value; applyFilters(); });
els.agentSelect.addEventListener('change', () => { state.agent = els.agentSelect.value; applyFilters(); });
els.functionSelect.addEventListener('change', () => { state.fn = els.functionSelect.value; applyFilters(); });
els.refreshBtn.addEventListener('click', () => { els.refreshBtn.style.transform = 'rotate(360deg)'; loadSkills(); setTimeout(() => els.refreshBtn.style.transform = '', 600); });

// Theme toggle — default light
const _savedTheme = localStorage.getItem('skill-dash-theme') || 'light';
document.documentElement.setAttribute('data-theme', _savedTheme === 'dark' ? 'dark' : '');
els.themeBtn.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = isDark ? '' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('skill-dash-theme', next || 'light');
});

els.tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    els.tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
    tab.classList.add('active'); tab.setAttribute('aria-selected','true');
    state.scope = tab.dataset.scope;
    applyFilters();
  });
});

els.detailClose.addEventListener('click', closeDetail);
els.detailOverlay.addEventListener('click', closeDetail);
els.detailSkillsShBtn.addEventListener('click', () => window.open('https://skills.sh/', '_blank'));
els.detailCopyBtn.addEventListener('click', async () => {
  if (!state.detailSkill) return;
  await navigator.clipboard.writeText(state.detailSkill.installCmd || `npx skills add ${state.detailSkill.name}`);
  showToast('Install command copied!', 'success');
});

els.confirmCancel.addEventListener('click', closeConfirm);
els.confirmOk.addEventListener('click', () => {
  const cb = _confirmCallback;
  closeConfirm();
  if (cb) cb();
});

document.addEventListener('click', e => {
  if (state.openDropdown && !e.target.closest('.dropdown') && !e.target.closest('.more-btn')) {
    closeDropdown();
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeDropdown();
    closeDetail();
    closeConfirm();
  }
});

// ── Init ──────────────────────────────────────────────────────
loadSkills();
