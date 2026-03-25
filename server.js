#!/usr/bin/env node
'use strict';

const express = require('express');
const { execFileSync, execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const process = require('process');

const PORT = Number(process.env.PORT || 3847);
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function runCLI(cmd, cwd) {
  try {
    return execFileSync(cmd.command, cmd.args, {
      cwd: cwd || process.cwd(),
      timeout: 15000,
      encoding: 'utf8',
    });
  } catch {
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
  try {
    return JSON.parse(raw.trim());
  } catch {
    return [];
  }
}

function npxCommand(args) {
  return { command: 'npx', args: ['-y', ...args] };
}

function readFixtureSkills(global) {
  const fixturePath = process.env.SKILL_DASHBOARD_FIXTURE;
  if (!fixturePath) return null;
  try {
    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const list = global ? fixture.global : fixture.project;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function listSkills({ global = false, cwd } = {}) {
  const fixture = readFixtureSkills(global);
  if (fixture) return fixture;
  const args = ['skills', 'ls'];
  if (global) args.push('-g');
  args.push('--json');
  return parseSkillsJson(runCLI(npxCommand(args), cwd));
}

function resolveProjectDir(value) {
  const candidate = String(value || process.cwd()).trim();
  const resolved = path.resolve(candidate);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    const error = new Error(`Project path not found: ${candidate}`);
    error.statusCode = 400;
    throw error;
  }
  return resolved;
}

function listAllSkills(projectDir) {
  const globalSkills = listSkills({ global: true }).map(skill => ({ ...skill, scope: 'global' }));
  const projectSkills = projectDir
    ? listSkills({ cwd: projectDir }).map(skill => ({ ...skill, scope: 'project' }))
    : [];
  return [...globalSkills, ...projectSkills];
}

function findSkill({ name, skillPath, scope, projectDir }) {
  const skills = listAllSkills(projectDir);
  if (skillPath) {
    return skills.find(skill => skill.path === skillPath && (!scope || skill.scope === scope)) || null;
  }
  return skills.find(skill => skill.name === name && (!scope || skill.scope === scope)) || null;
}

function readSkillMd(skillPath) {
  const mdPath = path.join(skillPath, 'SKILL.md');
  if (!fs.existsSync(mdPath)) return null;
  return fs.readFileSync(mdPath, 'utf8');
}

function stripFrontmatter(md) {
  if (!md) return '';
  return md.replace(/^---\n[\s\S]*?\n---\n*/m, '').trim();
}

function parseFrontmatter(md) {
  if (!md) return {};
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const block = match[1];
  const result = {};
  for (const line of block.split('\n')) {
    if (/^\s/.test(line)) continue;
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
  } catch {
    return null;
  }
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
  const metaPath = path.join(skill.path, 'metadata.json');
  if (!fs.existsSync(metaPath)) return null;
  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    return meta.source || null;
  } catch {
    return null;
  }
}

function normalizeGitHubUrl(value) {
  if (!value || typeof value !== 'string') return null;
  let next = value.trim();
  if (!next) return null;
  if (next.startsWith('git+')) next = next.slice(4);
  if (next.startsWith('git@github.com:')) {
    next = `https://github.com/${next.slice('git@github.com:'.length)}`;
  }
  next = next.replace(/\.git(#.*)?$/, '');
  if (/^https?:\/\/github\.com\/[^/\s]+\/[^/\s#]+/i.test(next)) return next;
  return null;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function resolveRepoUrlFromPackageJson(skillPath) {
  const packageJson = readJsonIfExists(path.join(skillPath, 'package.json'));
  if (!packageJson) return null;
  if (typeof packageJson.repository === 'string') {
    return normalizeGitHubUrl(packageJson.repository);
  }
  if (packageJson.repository && typeof packageJson.repository.url === 'string') {
    return normalizeGitHubUrl(packageJson.repository.url);
  }
  if (typeof packageJson.homepage === 'string') {
    return normalizeGitHubUrl(packageJson.homepage);
  }
  return null;
}

function resolveRepoUrlFromMarkdown(md) {
  if (!md) return null;
  const markdownLink = md.match(/\((https?:\/\/github\.com\/[^)\s]+)\)/i);
  if (markdownLink) return normalizeGitHubUrl(markdownLink[1]);
  const plainLink = md.match(/https?:\/\/github\.com\/[^\s)]+/i);
  return plainLink ? normalizeGitHubUrl(plainLink[0]) : null;
}

function resolveSourceLink(skill, md) {
  const source = inferInstallSource(skill);
  const candidates = [
    normalizeGitHubUrl(source),
    resolveRepoUrlFromPackageJson(skill.path),
    resolveRepoUrlFromMarkdown(md),
  ];

  const githubUrl = candidates.find(Boolean) || null;
  if (githubUrl) {
    return {
      label: 'github',
      url: githubUrl,
    };
  }

  return null;
}

function inferFunctionGroup(description, body) {
  const signal = `${description || ''} ${body.slice(0, 250)}`.toLowerCase();
  if (signal.match(/\b(comprehensive audit|ux perspective|severity rating|actionable feedback|generates.*report|assesses|evaluates design|design effectiveness)\b/)) {
    return 'Analysis & Review';
  }
  if (signal.match(/\b(performance|loading speed|bundle size|rendering|react|next\.js|i18n|internationalization|error handling|edge cases?|resilience|production.ready|production-ready|typescript|refactor|video creation|security vulnerability)\b/)) {
    return 'Code & Development';
  }
  if (signal.match(/\b(copy|microcopy|pptx|\.pptx|slide deck|pitch deck|presentation|speaker note|onboarding|empty state|first.time user|ux copy|error message)\b/)) {
    return 'Content & Communication';
  }
  if (signal.match(/\b(discover and install|agent skill|one.time setup|saves it to|config file|persistent|ai config|design context.*project|extends capabilities|fetch.*design context)\b/)) {
    return 'Workflow & Tooling';
  }
  if (signal.match(/\b(design|interface|visual|ui|color|colour|motion|animation|component|design system|token|layout|screen|responsive|aesthetic|personality|figma|frontend|spacing|alignment|typography|engaging|memorable)\b/)) {
    return 'Design & UI';
  }
  return 'Other Utilities';
}

function resolveSkillContent(skill, { includeBody = false } = {}) {
  const md = readSkillMd(skill.path);
  const frontmatter = parseFrontmatter(md);
  const body = stripFrontmatter(md);
  const description = frontmatter.description || frontmatter.name || skill.name;

  return {
    description,
    body: includeBody ? body : '',
  };
}

function enrichSkill(skill) {
  const originalMd = readSkillMd(skill.path);
  const fm = parseFrontmatter(originalMd);
  const body = stripFrontmatter(originalMd);
  const content = resolveSkillContent(skill, { includeBody: false });
  const installDate = getInstallDate(skill.path);
  const group = inferGroup(skill.path);
  const source = inferInstallSource(skill);
  const sourceLink = resolveSourceLink(skill, originalMd);
  const functionGroup = inferFunctionGroup(fm.description || '', body);

  return {
    ...skill,
    description: content.description,
    userInvokable: fm['user-invokable'] === 'true',
    installDate,
    installDay: installDate ? installDate.slice(0, 10) : null,
    group,
    functionGroup,
    source,
    hasMd: !!originalMd,
    installCmd: source ? `npx skills add ${source}` : `npx skills add ${skill.name}`,
    sourceLink,
  };
}

app.get('/api/skills', async (req, res) => {
  let projectDir;

  try {
    projectDir = resolveProjectDir(req.query.projectDir);
    const enriched = listAllSkills(projectDir).map(skill => enrichSkill(skill));

    res.json({ skills: enriched, projectDir });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to load skills' });
  }
});

app.get('/api/skills/:name/detail', async (req, res) => {
  const name = req.params.name;
  let projectDir;

  try {
    projectDir = resolveProjectDir(req.query.projectDir);
    const found = findSkill({
      name,
      skillPath: req.query.skillPath,
      scope: req.query.scope,
      projectDir,
    });
    if (!found) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    const content = resolveSkillContent(found, { includeBody: true });
    const sourceLink = resolveSourceLink(found, readSkillMd(found.path));
    res.json({
      name,
      path: found.path,
      scope: found.scope,
      description: content.description,
      skillsMdBody: content.body,
      sourceLink,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to load details' });
  }
});

app.post('/api/skills/:name/uninstall', (req, res) => {
  const { name } = req.params;
  const { isGlobal } = req.body;
  const args = ['skills', 'remove', name];
  let cwd;
  if (isGlobal) args.push('-g');
  args.push('-y');
  try {
    cwd = resolveProjectDir(req.body.projectDir);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
  execCLI(npxCommand(args), cwd, 30000, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr || err.message });
    return res.json({ success: true, output: stdout });
  });
});

app.post('/api/skills/:name/update', (req, res) => {
  const { name } = req.params;
  const { isGlobal } = req.body;
  const args = ['skills', 'update', name];
  let cwd;
  if (isGlobal) args.push('-g');
  try {
    cwd = resolveProjectDir(req.body.projectDir);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
  execCLI(npxCommand(args), cwd, 30000, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr || err.message });
    return res.json({ success: true, output: stdout });
  });
});

app.post('/api/skills/:name/reinstall', (req, res) => {
  const { name, source, isGlobal } = req.body;
  const addSource = source || name;
  const removeArgs = ['skills', 'remove', name];
  const addArgs = ['skills', 'add', addSource];
  let cwd;
  if (isGlobal) {
    removeArgs.push('-g');
    addArgs.push('-g');
  }
  removeArgs.push('-y');
  addArgs.push('-y');

  try {
    cwd = resolveProjectDir(req.body.projectDir);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  execCLI(npxCommand(removeArgs), cwd, 30000, (removeErr, removeStdout, removeStderr) => {
    if (removeErr) return res.status(500).json({ error: removeStderr || removeErr.message });
    return execCLI(npxCommand(addArgs), cwd, 30000, (addErr, addStdout, addStderr) => {
      if (addErr) return res.status(500).json({ error: addStderr || addErr.message });
      return res.json({ success: true, output: `${removeStdout}${addStdout}` });
    });
  });
});

const server = app.listen(PORT, async () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n🚀  Skill Dashboard running at ${url}`);
  console.log(`   Project context: ${process.cwd()}\n`);
  if (process.env.SKILL_DASHBOARD_NO_OPEN === '1') return;
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
