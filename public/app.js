/* ============================================================
   Skill Dashboard — app.js
   ============================================================ */
'use strict';

const UI_STRINGS = {
  en: {
    appTitle: 'Skill Dashboard',
    appDescription: 'Manage your installed agent skills — view, group, update, and uninstall from one place.',
    searchPlaceholder: 'Search skills…',
    clearSearch: 'Clear search',
    viewMode: 'View mode',
    gridView: 'Grid view',
    listView: 'List view',
    filterAgent: 'Filter by Agent',
    filterFunction: 'Filter by Function',
    sortSkills: 'Sort skills',
    allAgents: 'All Agents',
    allFunctions: 'All Functions',
    sortNewest: 'Newest installed',
    sortOldest: 'Oldest installed',
    sortName: 'Name A-Z',
    refreshSkills: 'Refresh skills',
    toggleTheme: 'Toggle light/dark',
    skillScope: 'Skill scope',
    globalSkills: 'Global Skills',
    projectSkills: 'Project Skills',
    loadingSkills: 'Loading skills…',
    loadingSkillDetails: 'Loading skill details…',
    noSkillsFound: 'No skills found',
    tryDifferentSearch: 'Try a different search or install a skill with',
    path: 'Path',
    compatibleAgents: 'Compatible Agents',
    installDate: 'Install Date',
    skillOverview: 'Skill Overview',
    closeDetail: 'Close detail panel',
    viewSource: 'View Source',
    copyInstallCommand: 'Copy Install Command',
    cancel: 'Cancel',
    confirm: 'Confirm',
    details: 'Details',
    moreActions: 'More actions',
    moreCount: '+{count} more',
    actionUpdate: 'Update',
    actionReinstall: 'Reinstall',
    actionCopy: 'Copy install command',
    actionUninstall: 'Uninstall',
    installCopied: 'Install command copied!',
    uninstalling: 'Uninstalling…',
    updating: 'Updating…',
    reinstalling: 'Reinstalling…',
    uninstalled: '"{name}" uninstalled',
    updated: '"{name}" updated',
    reinstalled: '"{name}" reinstalled',
    uninstallTitle: 'Uninstall "{name}"?',
    uninstallBodyGlobal: 'This will remove the skill from your global installation.',
    uninstallBodyProject: 'This will remove the skill from your project installation.',
    updateTitle: 'Update "{name}"?',
    updateBody: 'This will pull the latest version of this skill.',
    reinstallTitle: 'Reinstall "{name}"?',
    reinstallBody: 'This will remove and re-add the skill. Any custom modifications may be lost.',
    unknown: 'Unknown',
    noDescription: 'No description available',
    noSkillDoc: 'No SKILL.md found.',
    docTranslated: 'Displaying Simplified Chinese translation',
    docAutoTranslated: 'Displaying auto-translated Simplified Chinese content',
    docFallback: 'Chinese translation unavailable, displaying original English',
    scopeGlobal: 'global',
    scopeProject: 'project',
    userInvokable: 'user-invokable',
    languageLabel: 'Language',
    languageEnglish: 'English',
    languageChinese: '简体中文',
    footerMadeBy: 'Made by J7Supreme',
    functionAnalysis: 'Analysis & Review',
    functionCode: 'Code & Development',
    functionContent: 'Content & Communication',
    functionWorkflow: 'Workflow & Tooling',
    functionDesign: 'Design & UI',
    functionOther: 'Other Utilities',
    errorLoadingSkills: 'Error loading skills: {message}',
    errorLoadingDetails: 'Error loading details: {message}',
  },
  'zh-CN': {
    appTitle: '技能面板',
    appDescription: '统一查看、分组、更新和卸载已安装的 agent skills。',
    searchPlaceholder: '搜索 skills…',
    clearSearch: '清空搜索',
    viewMode: '视图模式',
    gridView: '网格视图',
    listView: '列表视图',
    filterAgent: '按 Agent 筛选',
    filterFunction: '按功能筛选',
    sortSkills: '排序 skills',
    allAgents: '全部 Agents',
    allFunctions: '全部功能',
    sortNewest: '最近安装',
    sortOldest: '最早安装',
    sortName: '名称 A-Z',
    refreshSkills: '刷新 skills',
    toggleTheme: '切换明暗主题',
    skillScope: 'Skill 范围',
    globalSkills: '全局 Skills',
    projectSkills: '项目 Skills',
    loadingSkills: '正在加载 skills…',
    loadingSkillDetails: '正在加载技能详情…',
    noSkillsFound: '未找到 skills',
    tryDifferentSearch: '试试其他搜索条件，或使用以下命令安装 skill：',
    path: '路径',
    compatibleAgents: '兼容 Agents',
    installDate: '安装时间',
    skillOverview: '技能概览',
    closeDetail: '关闭详情面板',
    viewSource: '查看来源',
    copyInstallCommand: '复制安装命令',
    cancel: '取消',
    confirm: '确认',
    details: '详情',
    moreActions: '更多操作',
    moreCount: '+{count} 个更多',
    actionUpdate: '更新',
    actionReinstall: '重装',
    actionCopy: '复制安装命令',
    actionUninstall: '卸载',
    installCopied: '已复制安装命令',
    uninstalling: '正在卸载…',
    updating: '正在更新…',
    reinstalling: '正在重装…',
    uninstalled: '已卸载 “{name}”',
    updated: '已更新 “{name}”',
    reinstalled: '已重装 “{name}”',
    uninstallTitle: '卸载 “{name}”？',
    uninstallBodyGlobal: '这会从你的全局安装中移除该 skill。',
    uninstallBodyProject: '这会从你的项目安装中移除该 skill。',
    updateTitle: '更新 “{name}”？',
    updateBody: '这会拉取该 skill 的最新版本。',
    reinstallTitle: '重装 “{name}”？',
    reinstallBody: '这会先删除再重新添加该 skill。任何自定义修改都可能丢失。',
    unknown: '未知',
    noDescription: '暂无描述',
    noSkillDoc: '未找到 SKILL.md。',
    docTranslated: '当前显示简体中文译文',
    docAutoTranslated: '当前显示自动翻译的简体中文内容',
    docFallback: '暂无简体中文译文，当前显示英文原文',
    scopeGlobal: '全局',
    scopeProject: '项目',
    userInvokable: '可由用户触发',
    languageLabel: '语言',
    languageEnglish: 'English',
    languageChinese: '简体中文',
    footerMadeBy: 'J7Supreme 制作',
    functionAnalysis: '分析与评审',
    functionCode: '代码与开发',
    functionContent: '内容与沟通',
    functionWorkflow: '工作流与工具',
    functionDesign: '设计与界面',
    functionOther: '其他工具',
    errorLoadingSkills: '加载 skills 失败：{message}',
    errorLoadingDetails: '加载详情失败：{message}',
  },
};

const FUNCTION_GROUP_LABELS = {
  'Analysis & Review': 'functionAnalysis',
  'Code & Development': 'functionCode',
  'Content & Communication': 'functionContent',
  'Workflow & Tooling': 'functionWorkflow',
  'Design & UI': 'functionDesign',
  'Other Utilities': 'functionOther',
};

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
  locale: detectInitialLocale(),
};

const $ = id => document.getElementById(id);
const els = {
  search: $('search'),
  searchClear: $('searchClear'),
  btnGrid: $('btnGrid'),
  btnList: $('btnList'),
  sortSelect: $('sortSelect'),
  agentSelect: $('agentSelect'),
  functionSelect: $('functionSelect'),
  languageSelect: $('languageSelect'),
  refreshBtn: $('refreshBtn'),
  themeBtn: $('themeBtn'),
  tabs: document.querySelectorAll('.tab'),
  countGlobal: $('countGlobal'),
  countProject: $('countProject'),
  loadingState: $('loadingState'),
  emptyState: $('emptyState'),
  emptySubPrefix: $('emptySubPrefix'),
  container: $('skillsContainer'),
  detailOverlay: $('detailOverlay'),
  detailPanel: $('detailPanel'),
  detailTitle: $('detailTitle'),
  detailDescription: $('detailDescription'),
  detailBadges: $('detailBadges'),
  detailPathTitle: $('detailPathTitle'),
  detailPath: $('detailPath'),
  detailAgentsTitle: $('detailAgentsTitle'),
  detailAgents: $('detailAgents'),
  detailInstallDateTitle: $('detailInstallDateTitle'),
  detailInstallDate: $('detailInstallDate'),
  detailOverviewTitle: $('detailOverviewTitle'),
  detailDocNotice: $('detailDocNotice'),
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
  logoText: $('logoText'),
  footerText: $('footerText'),
  loadingText: $('loadingText'),
  emptyText: $('emptyText'),
  tabGlobal: $('tabGlobal'),
  tabProject: $('tabProject'),
};

let currentSourceUrl = null;

function detectInitialLocale() {
  const stored = localStorage.getItem('skill-dash-locale');
  if (stored && UI_STRINGS[stored]) return stored;
  return navigator.language && navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

function t(key, params = {}) {
  const dict = UI_STRINGS[state.locale] || UI_STRINGS.en;
  const fallback = UI_STRINGS.en[key] || key;
  return (dict[key] || fallback).replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '');
}

function localizedFunctionGroup(label) {
  return t(FUNCTION_GROUP_LABELS[label] || 'functionOther');
}

async function fetchSkills() {
  const res = await fetch(`/api/skills?locale=${encodeURIComponent(state.locale)}`);
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
  const res = await fetch(`/api/skills/${encodeURIComponent(name)}/detail?locale=${encodeURIComponent(state.locale)}`);
  if (!res.ok) throw new Error('Failed to load details');
  return res.json();
}

async function loadSkills() {
  state.loading = true;
  els.loadingState.classList.remove('hidden');
  els.emptyState.classList.add('hidden');
  els.container.classList.add('hidden');

  try {
    const { skills } = await fetchSkills();
    state.skills = skills;
    populateDropdowns();
    applyTranslations();
    applyFilters();
  } catch (error) {
    showToast(t('errorLoadingSkills', { message: error.message }), 'error');
    els.loadingState.classList.add('hidden');
    els.emptyState.classList.remove('hidden');
  } finally {
    state.loading = false;
  }
}

function populateDropdowns() {
  const agents = new Set();
  const functions = new Set();
  state.skills.forEach(skill => {
    functions.add(skill.functionGroup || 'Other Utilities');
    (skill.agents || []).forEach(agent => agents.add(agent));
  });

  els.agentSelect.innerHTML = `<option value="all">${t('allAgents')}</option>` +
    [...agents].sort().map(agent => `<option value="${agent}">${agent}</option>`).join('');
  els.agentSelect.value = state.agent;

  els.functionSelect.innerHTML = `<option value="all">${t('allFunctions')}</option>` +
    [...functions].sort().map(fn => `<option value="${fn}">${localizedFunctionGroup(fn)}</option>`).join('');
  els.functionSelect.value = state.fn;
}

function applyFilters() {
  let list = [...state.skills];
  list = list.filter(skill => skill.scope === state.scope);

  if (state.agent !== 'all') {
    list = list.filter(skill => (skill.agents || []).includes(state.agent));
  }

  if (state.fn !== 'all') {
    list = list.filter(skill => skill.functionGroup === state.fn);
  }

  if (state.search) {
    const query = state.search.toLowerCase();
    list = list.filter(skill =>
      skill.name.toLowerCase().includes(query) ||
      (skill.description || '').toLowerCase().includes(query) ||
      (skill.originalDescription || '').toLowerCase().includes(query) ||
      (skill.agents || []).some(agent => agent.toLowerCase().includes(query))
    );
  }

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
  els.countGlobal.textContent = state.skills.filter(skill => skill.scope === 'global').length;
  els.countProject.textContent = state.skills.filter(skill => skill.scope === 'project').length;
}

function groupSkills(skills) {
  const groups = {};
  for (const skill of skills) {
    const key = skill.functionGroup || 'Other Utilities';
    (groups[key] = groups[key] || []).push(skill);
  }
  return groups;
}

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
  const sortedGroups = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));

  for (const [groupName, skills] of sortedGroups) {
    const block = document.createElement('div');
    block.className = 'group-block';
    block.dataset.group = groupName;

    const header = document.createElement('div');
    header.className = 'group-header';
    header.innerHTML = `
      <span class="group-title">${localizedFunctionGroup(groupName)}</span>
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
        <div class="card-description">${skill.description || t('noDescription')}</div>
      </div>
    </div>
    <div class="card-badges">${agentBadges}</div>
    <div class="card-footer">
      <button class="btn btn-primary detail-btn">${t('details')}</button>
      <div style="flex:1"></div>
      <div style="position:relative">
        <button class="more-btn" title="${t('moreActions')}" aria-label="${t('moreActions')}" aria-haspopup="true">⋯</button>
      </div>
    </div>`;

  card.addEventListener('click', event => {
    if (event.target.closest('.more-btn') || event.target.closest('.dropdown') || event.target.closest('.detail-btn')) return;
    openDetail(skill);
  });
  card.querySelector('.detail-btn').addEventListener('click', () => openDetail(skill));
  card.querySelector('.more-btn').addEventListener('click', event => {
    event.stopPropagation();
    toggleDropdown(event.currentTarget, skill);
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
      <button class="btn btn-secondary detail-btn">${t('details')}</button>
      <div style="position:relative">
        <button class="more-btn" title="${t('moreActions')}" aria-label="${t('moreActions')}">⋯</button>
      </div>
    </div>`;

  row.addEventListener('click', event => {
    if (event.target.closest('.more-btn') || event.target.closest('.dropdown') || event.target.closest('.detail-btn')) return;
    openDetail(skill);
  });
  row.querySelector('.detail-btn').addEventListener('click', () => openDetail(skill));
  row.querySelector('.more-btn').addEventListener('click', event => {
    event.stopPropagation();
    toggleDropdown(event.currentTarget, skill);
  });
  return row;
}

function buildAgentBadges(agents) {
  const max = 3;
  let html = agents.slice(0, max).map(agent => `<span class="badge badge-agent">${agent}</span>`).join('');
  if (agents.length > max) {
    html += `<span class="badge badge-more-agents">${t('moreCount', { count: agents.length - max })}</span>`;
  }
  return html;
}

function toggleDropdown(button, skill) {
  if (state.openDropdown && button.parentElement.contains(state.openDropdown)) {
    closeDropdown();
    return;
  }

  closeDropdown();
  const menu = document.createElement('div');
  menu.className = 'dropdown';
  menu.innerHTML = `
    <button class="dropdown-item" data-action="update">${t('actionUpdate')}</button>
    <button class="dropdown-item" data-action="reinstall">${t('actionReinstall')}</button>
    <button class="dropdown-item" data-action="copy">${t('actionCopy')}</button>
    <div class="dropdown-divider"></div>
    <button class="dropdown-item danger" data-action="uninstall">${t('actionUninstall')}</button>`;

  menu.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', event => {
      event.stopPropagation();
      closeDropdown();
      handleAction(item.dataset.action, skill);
    });
  });

  button.parentElement.appendChild(menu);
  state.openDropdown = menu;
}

function closeDropdown() {
  if (!state.openDropdown) return;
  state.openDropdown.remove();
  state.openDropdown = null;
}

async function handleAction(action, skill) {
  if (action === 'copy') {
    await navigator.clipboard.writeText(skill.installCmd || `npx skills add ${skill.name}`);
    showToast(t('installCopied'), 'success');
    return;
  }

  if (action === 'uninstall') {
    confirmAction(
      t('uninstallTitle', { name: skill.name }),
      skill.scope === 'global' ? t('uninstallBodyGlobal') : t('uninstallBodyProject'),
      async () => {
        try {
          showToast(t('uninstalling'));
          await apiAction(`/api/skills/${encodeURIComponent(skill.name)}/uninstall`, {
            isGlobal: skill.scope === 'global',
          });
          showToast(t('uninstalled', { name: skill.name }), 'success');
          await loadSkills();
        } catch (error) {
          showToast(error.message, 'error');
        }
      }
    );
    return;
  }

  if (action === 'update') {
    confirmAction(
      t('updateTitle', { name: skill.name }),
      t('updateBody'),
      async () => {
        try {
          showToast(t('updating'));
          await apiAction(`/api/skills/${encodeURIComponent(skill.name)}/update`, {});
          showToast(t('updated', { name: skill.name }), 'success');
          await loadSkills();
        } catch (error) {
          showToast(error.message, 'error');
        }
      }
    );
    return;
  }

  if (action === 'reinstall') {
    confirmAction(
      t('reinstallTitle', { name: skill.name }),
      t('reinstallBody'),
      async () => {
        try {
          showToast(t('reinstalling'));
          await apiAction(`/api/skills/${encodeURIComponent(skill.name)}/reinstall`, {
            source: skill.source,
            isGlobal: skill.scope === 'global',
          });
          showToast(t('reinstalled', { name: skill.name }), 'success');
          await loadSkills();
        } catch (error) {
          showToast(error.message, 'error');
        }
      }
    );
  }
}

async function openDetail(skill) {
  state.detailSkill = skill;
  els.detailTitle.textContent = skill.name;
  els.detailDescription.textContent = skill.description || '';
  els.detailPath.textContent = skill.path;
  els.detailInstallDate.textContent = formatInstallDate(skill.installDate);
  els.detailBadges.innerHTML = `
    <span class="badge badge-scope-${skill.scope}">${skill.scope === 'global' ? t('scopeGlobal') : t('scopeProject')}</span>
    ${skill.userInvokable ? `<span class="badge badge-invokable">⚡ ${t('userInvokable')}</span>` : ''}`;
  els.detailAgents.innerHTML = (skill.agents || []).map(agent => `<span class="badge badge-agent">${agent}</span>`).join('');
  els.detailDocNotice.textContent = '';
  els.detailMd.innerHTML = `<p>${escapeHtml(t('loadingSkillDetails'))}</p>`;
  updateSourceButton(skill.sourceLink);

  els.detailOverlay.classList.remove('hidden');
  els.detailPanel.classList.remove('hidden');

  try {
    const detail = await fetchDetail(skill.name);
    if (!state.detailSkill || state.detailSkill.name !== skill.name) return;
    els.detailDescription.textContent = detail.description || skill.description || '';
    els.detailDocNotice.textContent = detailNotice(detail);
    els.detailMd.innerHTML = renderMarkdown(detail.skillsMdBody || detail.skillsMdOriginalBody || t('noSkillDoc'));
    updateSourceButton(detail.sourceLink || skill.sourceLink);
  } catch (error) {
    els.detailDocNotice.textContent = '';
    els.detailMd.innerHTML = `<p>${escapeHtml(t('errorLoadingDetails', { message: error.message }))}</p>`;
  }
}

function detailNotice(detail) {
  if (state.locale !== 'zh-CN') return '';
  if (detail.hasFallback) return t('docFallback');
  if (detail.translationSource === 'machine') return t('docAutoTranslated');
  if (detail.resolvedLocale === 'zh-CN') return t('docTranslated');
  return '';
}

function closeDetail() {
  els.detailOverlay.classList.add('hidden');
  els.detailPanel.classList.add('hidden');
  state.detailSkill = null;
  currentSourceUrl = null;
}

function updateSourceButton(sourceLink) {
  currentSourceUrl = sourceLink && sourceLink.url ? sourceLink.url : null;
  if (!currentSourceUrl) {
    els.detailSkillsShBtn.classList.add('hidden');
    return;
  }
  els.detailSkillsShBtn.classList.remove('hidden');
}

function formatInstallDate(value) {
  if (!value) return t('unknown');
  try {
    return new Intl.DateTimeFormat(state.locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderMarkdown(markdown) {
  const safe = escapeHtml(markdown || '');
  const blocks = safe.split(/\n{2,}/).map(block => block.trim()).filter(Boolean);
  return blocks.map(renderMarkdownBlock).join('');
}

function renderMarkdownBlock(block) {
  if (/^```/.test(block) && /```$/.test(block)) {
    return `<pre><code>${block.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '')}</code></pre>`;
  }

  const lines = block.split('\n');
  if (lines.every(line => /^\s*[-*]\s+/.test(line))) {
    return `<ul>${lines.map(line => `<li>${renderInline(line.replace(/^\s*[-*]\s+/, ''))}</li>`).join('')}</ul>`;
  }

  if (lines.every(line => /^\s*\d+\.\s+/.test(line))) {
    return `<ol>${lines.map(line => `<li>${renderInline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`).join('')}</ol>`;
  }

  if (lines.length === 1 && /^###\s+/.test(lines[0])) {
    return `<h3>${renderInline(lines[0].replace(/^###\s+/, ''))}</h3>`;
  }
  if (lines.length === 1 && /^##\s+/.test(lines[0])) {
    return `<h2>${renderInline(lines[0].replace(/^##\s+/, ''))}</h2>`;
  }
  if (lines.length === 1 && /^#\s+/.test(lines[0])) {
    return `<h1>${renderInline(lines[0].replace(/^#\s+/, ''))}</h1>`;
  }

  return `<p>${lines.map(renderInline).join('<br/>')}</p>`;
}

function renderInline(text) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

let confirmCallback = null;

function confirmAction(title, body, callback) {
  els.confirmTitle.textContent = title;
  els.confirmBody.textContent = body;
  confirmCallback = callback;
  els.confirmOverlay.classList.remove('hidden');
  els.confirmModal.classList.remove('hidden');
}

function closeConfirm() {
  els.confirmOverlay.classList.add('hidden');
  els.confirmModal.classList.add('hidden');
  confirmCallback = null;
}

let toastTimer = null;

function showToast(message, type = '') {
  if (toastTimer) clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.className = `toast${type ? ` ${type}` : ''}`;
  els.toast.classList.remove('hidden');
  toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 3000);
}

function applyTranslations() {
  document.documentElement.lang = state.locale;
  document.title = t('appTitle');
  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) descriptionMeta.setAttribute('content', t('appDescription'));

  els.logoText.textContent = t('appTitle');
  els.search.placeholder = t('searchPlaceholder');
  els.search.setAttribute('aria-label', t('searchPlaceholder'));
  els.searchClear.setAttribute('aria-label', t('clearSearch'));
  els.btnGrid.setAttribute('title', t('gridView'));
  els.btnList.setAttribute('title', t('listView'));
  els.refreshBtn.setAttribute('title', t('refreshSkills'));
  els.themeBtn.setAttribute('title', t('toggleTheme'));
  els.agentSelect.setAttribute('aria-label', t('filterAgent'));
  els.functionSelect.setAttribute('aria-label', t('filterFunction'));
  els.sortSelect.setAttribute('aria-label', t('sortSkills'));

  els.tabGlobal.childNodes[0].textContent = `${t('globalSkills')} `;
  els.tabProject.childNodes[0].textContent = `${t('projectSkills')} `;
  els.loadingText.textContent = t('loadingSkills');
  els.emptyText.textContent = t('noSkillsFound');
  els.emptySubPrefix.textContent = `${t('tryDifferentSearch')} `;

  els.detailPathTitle.textContent = t('path');
  els.detailAgentsTitle.textContent = t('compatibleAgents');
  els.detailInstallDateTitle.textContent = t('installDate');
  els.detailOverviewTitle.textContent = t('skillOverview');
  els.detailClose.setAttribute('aria-label', t('closeDetail'));
  els.detailSkillsShBtn.textContent = t('viewSource');
  els.detailCopyBtn.textContent = t('copyInstallCommand');
  els.confirmCancel.textContent = t('cancel');
  els.confirmOk.textContent = t('confirm');
  els.languageSelect.setAttribute('aria-label', t('languageLabel'));
  els.languageSelect.innerHTML = `
    <option value="en">${t('languageEnglish')}</option>
    <option value="zh-CN">${t('languageChinese')}</option>`;
  els.languageSelect.value = state.locale;
  els.footerText.textContent = t('footerMadeBy');

  els.sortSelect.innerHTML = `
    <option value="newest">${t('sortNewest')}</option>
    <option value="oldest">${t('sortOldest')}</option>
    <option value="name">${t('sortName')}</option>`;
  els.sortSelect.value = state.sort;
}

function setLocale(locale) {
  state.locale = UI_STRINGS[locale] ? locale : 'en';
  localStorage.setItem('skill-dash-locale', state.locale);
  applyTranslations();
  loadSkills();
  if (state.detailSkill) openDetail(state.detailSkill);
}

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
  els.btnGrid.classList.add('active');
  els.btnGrid.setAttribute('aria-pressed', 'true');
  els.btnList.classList.remove('active');
  els.btnList.setAttribute('aria-pressed', 'false');
  render();
});

els.btnList.addEventListener('click', () => {
  state.view = 'list';
  els.btnList.classList.add('active');
  els.btnList.setAttribute('aria-pressed', 'true');
  els.btnGrid.classList.remove('active');
  els.btnGrid.setAttribute('aria-pressed', 'false');
  render();
});

els.sortSelect.addEventListener('change', () => {
  state.sort = els.sortSelect.value;
  applyFilters();
});
els.agentSelect.addEventListener('change', () => {
  state.agent = els.agentSelect.value;
  applyFilters();
});
els.functionSelect.addEventListener('change', () => {
  state.fn = els.functionSelect.value;
  applyFilters();
});
els.languageSelect.addEventListener('change', () => setLocale(els.languageSelect.value));
els.refreshBtn.addEventListener('click', () => {
  els.refreshBtn.style.transform = 'rotate(360deg)';
  loadSkills();
  setTimeout(() => { els.refreshBtn.style.transform = ''; }, 600);
});

const savedTheme = localStorage.getItem('skill-dash-theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme === 'dark' ? 'dark' : '');
els.themeBtn.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = isDark ? '' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('skill-dash-theme', next || 'light');
});

els.tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    els.tabs.forEach(item => {
      item.classList.remove('active');
      item.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    state.scope = tab.dataset.scope;
    applyFilters();
  });
});

els.detailClose.addEventListener('click', closeDetail);
els.detailOverlay.addEventListener('click', closeDetail);
els.detailSkillsShBtn.addEventListener('click', () => {
  if (!currentSourceUrl) return;
  window.open(currentSourceUrl, '_blank');
});
els.detailCopyBtn.addEventListener('click', async () => {
  if (!state.detailSkill) return;
  await navigator.clipboard.writeText(state.detailSkill.installCmd || `npx skills add ${state.detailSkill.name}`);
  showToast(t('installCopied'), 'success');
});

els.confirmCancel.addEventListener('click', closeConfirm);
els.confirmOk.addEventListener('click', () => {
  const callback = confirmCallback;
  closeConfirm();
  if (callback) callback();
});

document.addEventListener('click', event => {
  if (state.openDropdown && !event.target.closest('.dropdown') && !event.target.closest('.more-btn')) {
    closeDropdown();
  }
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  closeDropdown();
  closeDetail();
  closeConfirm();
});

applyTranslations();
loadSkills();
