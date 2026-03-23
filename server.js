#!/usr/bin/env node
'use strict';

const express = require('express');
const { execFileSync, execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const process = require('process');

const PORT = 3847;
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function runCLI(cmd, cwd) {
  try {
    return execFileSync(cmd.command, cmd.args, {
      cwd: cwd || process.cwd(),
      timeout: 15000,
      encoding: 'utf8',
    });
  } catch (e) {
    return null;
  }
}

function execCLI(cmd, cwd, timeout, callback) {
  return execFile(
    cmd.command,
    cmd.args,
    { cwd: cwd || process.cwd(), timeout, encoding: 'utf8' },
    callback
  );
}

function parseSkillsJson(raw) {
  if (!raw) return [];
  try { return JSON.parse(raw.trim()); } catch { return []; }
}

function npxCommand(args) {
  return { command: 'npx', args: ['-y', ...args] };
}

function listSkills({ global = false, cwd } = {}) {
  const args = ['skills', 'ls'];
  if (global) args.push('-g');
  args.push('--json');
  return parseSkillsJson(runCLI(npxCommand(args), cwd));
}

function findSkillByName(name, projectDir) {
  const globalSkills = listSkills({ global: true }).map(s => ({ ...s, scope: 'global' }));
  const projectSkills = projectDir
    ? listSkills({ cwd: projectDir }).map(s => ({ ...s, scope: 'project' }))
    : [];

  return [...globalSkills, ...projectSkills].find(skill => skill.name === name) || null;
}

function readSkillMd(skillPath) {
  const mdPath = path.join(skillPath, 'SKILL.md');
  if (!fs.existsSync(mdPath)) return null;
  return fs.readFileSync(mdPath, 'utf8');
}

function parseFrontmatter(md) {
  if (!md) return {};
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const block = match[1];
  const result = {};
  for (const line of block.split('\n')) {
    if (/^\s/.test(line)) continue; // skip nested YAML (args, list items, etc.)
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
    result[key] = val;
  }
  return result;
}

function getInstallDate(skillPath) {
  try {
    const stat = fs.statSync(skillPath);
    return stat.mtime.toISOString();
  } catch { return null; }
}

function inferGroup(skillPath) {
  const p = skillPath.replace(os.homedir(), '~');
  if (p.includes('/.codex/skills/')) return 'Codex';
  if (p.includes('/.agents/skills/')) return 'Agents';
  if (p.includes('/node_modules/')) {
    const parts = p.split('/');
    const nm = parts.findIndex(x => x === 'node_modules');
    return parts[nm + 1] || 'Project';
  }
  return 'Other';
}

function inferInstallSource(skill) {
  // Try to read a skills-lock.json or metadata if present
  const metaPath = path.join(skill.path, 'metadata.json');
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      if (meta.source) return meta.source;
    } catch {}
  }
  return null;
}

function enrichSkill(skill) {
  const md = readSkillMd(skill.path);
  const fm = parseFrontmatter(md);
  const installDate = getInstallDate(skill.path);
  const group = inferGroup(skill.path);
  const source = inferInstallSource(skill);

  // Get markdown body (after frontmatter)
  let body = md || '';
  body = body.replace(/^---[\s\S]*?---\n*/m, '').trim();
  const summary = body.slice(0, 400).trim();

  // Functional classification — use description + first body para only, NOT the skill name
  const descText = (fm.description || '').toLowerCase();
  const bodyFirst = body.slice(0, 250).toLowerCase();
  const signal = `${descText} ${bodyFirst}`;
  let functionGroup = 'Other Utilities';

  // Analysis & Review — must be the primary purpose, not just a passing mention of "review"
  if (signal.match(/\b(comprehensive audit|ux perspective|severity rating|actionable feedback|generates.*report|assesses|evaluates design|design effectiveness)\b/)) {
    functionGroup = 'Analysis & Review';

  // Code & Development — implementation, performance, security, framework specifics
  } else if (signal.match(/\b(performance|loading speed|bundle size|rendering|react|next\.js|i18n|internationalization|error handling|edge cases?|resilience|production.ready|production-ready|typescript|refactor|video creation|security vulnerability)\b/)) {
    functionGroup = 'Code & Development';

  // Content & Communication — copy, microcopy, writing, presentations, onboarding flows
  } else if (signal.match(/\b(copy|microcopy|pptx|\.pptx|slide deck|pitch deck|presentation|speaker note|onboarding|empty state|first.time user|ux copy|error message)\b/)) {
    functionGroup = 'Content & Communication';

  // Workflow & Tooling — setup, agent skill management, configuration, memory
  } else if (signal.match(/\b(discover and install|agent skill|one.time setup|saves it to|config file|persistent|ai config|design context.*project|extends capabilities|fetch.*design context)\b/)) {
    functionGroup = 'Workflow & Tooling';

  // Design & UI — broadest, used as a well-populated fallback
  } else if (signal.match(/\b(design|interface|visual|ui|color|colour|motion|animation|component|design system|token|layout|screen|responsive|aesthetic|personality|figma|frontend|spacing|alignment|typography|engaging|memorable)\b/)) {
    functionGroup = 'Design & UI';
  }

  return {
    ...skill,
    description: fm.description || fm.name || skill.name,
    userInvokable: fm['user-invokable'] === 'true',
    installDate,
    installDay: installDate ? installDate.slice(0, 10) : null,
    group,
    functionGroup,
    source,
    hasMd: !!md,
    skillsMdPreview: summary,
    installCmd: source ? `npx skills add ${source}` : `npx skills add ${skill.name}`,
    skillsMdFull: md || '',
  };
}

// ─── API Routes ───────────────────────────────────────────────────────────────

app.get('/api/skills', (req, res) => {
  const projectDir = req.query.projectDir || process.cwd();

  const globalSkills = listSkills({ global: true }).map(s => ({ ...s, scope: 'global' }));
  const projectSkills = projectDir ? listSkills({ cwd: projectDir }).map(s => ({ ...s, scope: 'project' })) : [];

  // Deduplicate and combine
  const globalNames = new Set(globalSkills.map(s => s.name));
  const onlyProject = projectSkills.filter(s => !globalNames.has(s.name));
  const all = [...globalSkills, ...onlyProject].map(enrichSkill);

  res.json({ skills: all });
});

app.get('/api/skills/:name/detail', (req, res) => {
  const name = req.params.name;
  const projectDir = req.query.projectDir || process.cwd();
  const found = findSkillByName(name, projectDir);
  if (!found) return res.status(404).json({ error: 'Skill not found' });

  const md = readSkillMd(found.path);
  const fm = parseFrontmatter(md);
  res.json({
    name,
    path: found.path,
    description: fm.description || '',
    skillsMdFull: md || '',
    skillsShUrl: `https://skills.sh/`,
  });
});

app.post('/api/skills/:name/uninstall', (req, res) => {
  const { name } = req.params;
  const { isGlobal } = req.body;
  const args = ['skills', 'remove', name];
  if (isGlobal) args.push('-g');
  args.push('-y');
  execCLI(npxCommand(args), process.cwd(), 30000, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr || err.message });
    res.json({ success: true, output: stdout });
  });
});

app.post('/api/skills/:name/update', (req, res) => {
  const { name } = req.params;
  execCLI(npxCommand(['skills', 'update', name]), process.cwd(), 30000, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr || err.message });
    res.json({ success: true, output: stdout });
  });
});

app.post('/api/skills/:name/reinstall', (req, res) => {
  const { name, source, isGlobal } = req.body;
  const addSource = source || name;
  const removeArgs = ['skills', 'remove', name];
  const addArgs = ['skills', 'add', addSource];
  if (isGlobal) {
    removeArgs.push('-g');
    addArgs.push('-g');
  }
  removeArgs.push('-y');
  addArgs.push('-y');

  execCLI(npxCommand(removeArgs), process.cwd(), 30000, (removeErr, removeStdout, removeStderr) => {
    if (removeErr) return res.status(500).json({ error: removeStderr || removeErr.message });

    execCLI(npxCommand(addArgs), process.cwd(), 30000, (addErr, addStdout, addStderr) => {
      if (addErr) return res.status(500).json({ error: addStderr || addErr.message });
      res.json({ success: true, output: `${removeStdout}${addStdout}` });
    });
  });
});

// ─── Launch ───────────────────────────────────────────────────────────────────

const server = app.listen(PORT, async () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n🚀  Skill Dashboard running at ${url}`);
  console.log(`   Project context: ${process.cwd()}\n`);
  try {
    const { default: open } = await import('open');
    open(url);
  } catch {
    console.log('   Open the URL above in your browser.');
  }
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Close the existing process or run the dashboard from a free port.`);
    process.exit(1);
  }

  console.error(error.message || error);
  process.exit(1);
});
