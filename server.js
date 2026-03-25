#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const express = require('express');
const { execFileSync, execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const process = require('process');

const PORT = 3847;
const CACHE_DIR = path.join(__dirname, '.cache', 'translations');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const translationMemo = new Map();
const translationJobs = new Map();
const prewarmInFlight = new Set();
let prewarmQueue = [];
let prewarmActive = 0;
const PREWARM_CONCURRENCY = 2;

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

function listSkills({ global = false, cwd } = {}) {
  const args = ['skills', 'ls'];
  if (global) args.push('-g');
  args.push('--json');
  return parseSkillsJson(runCLI(npxCommand(args), cwd));
}

function findSkillByName(name, projectDir) {
  const globalSkills = listSkills({ global: true }).map(skill => ({ ...skill, scope: 'global' }));
  const projectSkills = projectDir
    ? listSkills({ cwd: projectDir }).map(skill => ({ ...skill, scope: 'project' }))
    : [];

  return [...globalSkills, ...projectSkills].find(skill => skill.name === name) || null;
}

function readSkillMd(skillPath, locale) {
  const filename = locale === 'zh-CN' ? 'SKILL.zh-CN.md' : 'SKILL.md';
  const mdPath = path.join(skillPath, filename);
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

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cacheFilePath(skillPath, locale, hash) {
  const safeName = path.basename(skillPath).replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(CACHE_DIR, locale, `${safeName}.${hash.slice(0, 16)}.json`);
}

function readTranslationCache(skillPath, locale, hash) {
  const filePath = cacheFilePath(skillPath, locale, hash);
  if (!fs.existsSync(filePath)) return { data: {}, filePath };
  try {
    return { data: JSON.parse(fs.readFileSync(filePath, 'utf8')), filePath };
  } catch {
    return { data: {}, filePath };
  }
}

function writeTranslationCache(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function translateChunk(text, targetLocale) {
  if (!text || !/[A-Za-z]/.test(text) || targetLocale !== 'zh-CN') return text;
  const key = `${targetLocale}:${text}`;
  if (translationMemo.has(key)) return translationMemo.get(key);

  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'auto');
  url.searchParams.set('tl', targetLocale);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);

  const res = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 Skill Dashboard' },
  });

  if (!res.ok) {
    throw new Error(`Translation request failed with ${res.status}`);
  }

  const data = await res.json();
  const translated = Array.isArray(data?.[0])
    ? data[0].map(part => Array.isArray(part) ? (part[0] || '') : '').join('')
    : text;
  translationMemo.set(key, translated || text);
  return translated || text;
}

function splitLargeBlock(text, limit = 1600) {
  if (text.length <= limit) return [text];
  const pieces = [];
  let buffer = '';
  for (const part of text.split(/(\n)/)) {
    if (buffer.length + part.length > limit && buffer) {
      pieces.push(buffer);
      buffer = '';
    }
    buffer += part;
  }
  if (buffer) pieces.push(buffer);
  return pieces;
}

function protectMarkdown(text) {
  const protectedValues = [];
  const save = value => `ZXQTOKEN${protectedValues.push(value) - 1}END`;

  let next = text.replace(/```[\s\S]*?```/g, match => save(match));
  next = next.replace(/`[^`\n]+`/g, match => save(match));
  next = next.replace(/\]\((https?:\/\/[^)\s]+)\)/g, (match, url) => `](${save(url)})`);
  next = next.replace(/https?:\/\/[^\s)]+/g, match => save(match));

  return {
    text: next,
    restore(value) {
      return value.replace(/ZXQTOKEN(\d+)END/g, (_, index) => protectedValues[Number(index)] || '');
    },
  };
}

async function translateMarkdown(body, targetLocale) {
  if (!body || targetLocale !== 'zh-CN') return body;
  const { text, restore } = protectMarkdown(body);
  const parts = text.split(/(\n\s*\n+)/);
  const translated = [];

  for (const part of parts) {
    if (!part) continue;
    if (/^\n\s*\n+$/.test(part)) {
      translated.push(part);
      continue;
    }

    const chunks = splitLargeBlock(part);
    const chunkResults = [];
    for (const chunk of chunks) {
      chunkResults.push(await translateChunk(chunk, targetLocale));
    }
    translated.push(chunkResults.join(''));
  }

  return restore(translated.join(''));
}

async function getCachedTranslation(skillPath, locale, originalDescription, originalBody) {
  const hash = sha256(`${originalDescription}\n---\n${originalBody}`);
  const { data, filePath } = readTranslationCache(skillPath, locale, hash);
  if (data.description && (!originalBody || data.body)) {
    return {
      hash,
      description: data.description,
      body: data.body || null,
    };
  }

  const jobKey = `${locale}:${skillPath}:${hash}:${originalBody ? 'full' : 'summary'}`;
  if (translationJobs.has(jobKey)) {
    return translationJobs.get(jobKey);
  }

  const job = (async () => {
    const next = {
      hash,
      description: data.description || null,
      body: data.body || null,
    };

    if (!next.description && originalDescription) {
      next.description = await translateChunk(originalDescription, locale);
    }

    if (!next.body && originalBody) {
      next.body = await translateMarkdown(originalBody, locale);
    }

    writeTranslationCache(filePath, {
      locale,
      hash,
      createdAt: new Date().toISOString(),
      description: next.description,
      body: next.body,
    });

    return next;
  })();

  translationJobs.set(jobKey, job);
  try {
    return await job;
  } finally {
    translationJobs.delete(jobKey);
  }
}

function enqueuePrewarm(task) {
  if (!task) return;
  const key = `${task.locale}:${task.skill.path}`;
  if (prewarmInFlight.has(key)) return;
  prewarmInFlight.add(key);
  prewarmQueue.push({ ...task, key });
  drainPrewarmQueue();
}

function drainPrewarmQueue() {
  while (prewarmActive < PREWARM_CONCURRENCY && prewarmQueue.length > 0) {
    const task = prewarmQueue.shift();
    prewarmActive += 1;
    Promise.resolve()
      .then(() => resolveLocalizedSkill(task.skill, task.locale, { includeBody: true }))
      .catch(() => {})
      .finally(() => {
        prewarmActive -= 1;
        prewarmInFlight.delete(task.key);
        drainPrewarmQueue();
      });
  }
}

function scheduleBodyPrewarm(skills, locale) {
  if (locale !== 'zh-CN') return;
  for (const skill of skills) {
    enqueuePrewarm({ skill, locale });
  }
}

async function resolveLocalizedSkill(skill, locale, { includeBody = false } = {}) {
  const originalMd = readSkillMd(skill.path, 'en');
  const originalFrontmatter = parseFrontmatter(originalMd);
  const originalBody = stripFrontmatter(originalMd);
  const originalDescription = originalFrontmatter.description || originalFrontmatter.name || skill.name;

  const base = {
    originalDescription,
    originalBody,
    resolvedLocale: 'en',
    translationSource: 'original',
    hasFallback: false,
    description: originalDescription,
    body: includeBody ? originalBody : '',
  };

  if (locale !== 'zh-CN' || !originalMd) return base;

  const localizedMd = readSkillMd(skill.path, 'zh-CN');
  if (localizedMd) {
    const fm = parseFrontmatter(localizedMd);
    return {
      originalDescription,
      originalBody,
      resolvedLocale: 'zh-CN',
      translationSource: 'manual',
      hasFallback: false,
      description: fm.description || originalDescription,
      body: includeBody ? stripFrontmatter(localizedMd) : '',
    };
  }

  try {
    const translated = await getCachedTranslation(skill.path, 'zh-CN', originalDescription, includeBody ? originalBody : '');
    return {
      originalDescription,
      originalBody,
      resolvedLocale: translated.description || translated.body ? 'zh-CN' : 'en',
      translationSource: 'machine',
      hasFallback: false,
      description: translated.description || originalDescription,
      body: includeBody ? (translated.body || originalBody) : '',
    };
  } catch {
    return {
      ...base,
      body: includeBody ? originalBody : '',
      hasFallback: true,
      translationSource: 'fallback',
    };
  }
}

async function enrichSkill(skill, locale) {
  const originalMd = readSkillMd(skill.path, 'en');
  const fm = parseFrontmatter(originalMd);
  const body = stripFrontmatter(originalMd);
  const localized = await resolveLocalizedSkill(skill, locale, { includeBody: false });
  const installDate = getInstallDate(skill.path);
  const group = inferGroup(skill.path);
  const source = inferInstallSource(skill);
  const sourceLink = resolveSourceLink(skill, originalMd);
  const functionGroup = inferFunctionGroup(fm.description || '', body);

  return {
    ...skill,
    description: localized.description,
    originalDescription: localized.originalDescription,
    userInvokable: fm['user-invokable'] === 'true',
    installDate,
    installDay: installDate ? installDate.slice(0, 10) : null,
    group,
    functionGroup,
    source,
    hasMd: !!originalMd,
    installCmd: source ? `npx skills add ${source}` : `npx skills add ${skill.name}`,
    resolvedLocale: localized.resolvedLocale,
    translationSource: localized.translationSource,
    hasFallback: localized.hasFallback,
    sourceLink,
  };
}

app.get('/api/skills', async (req, res) => {
  const projectDir = req.query.projectDir || process.cwd();
  const locale = req.query.locale === 'zh-CN' ? 'zh-CN' : 'en';

  try {
    const globalSkills = listSkills({ global: true }).map(skill => ({ ...skill, scope: 'global' }));
    const projectSkills = projectDir
      ? listSkills({ cwd: projectDir }).map(skill => ({ ...skill, scope: 'project' }))
      : [];

    const globalNames = new Set(globalSkills.map(skill => skill.name));
    const onlyProject = projectSkills.filter(skill => !globalNames.has(skill.name));
    const allSkills = [...globalSkills, ...onlyProject];
    const enriched = await Promise.all(allSkills.map(skill => enrichSkill(skill, locale)));
    scheduleBodyPrewarm(allSkills, locale);

    res.json({ skills: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to load skills' });
  }
});

app.get('/api/skills/:name/detail', async (req, res) => {
  const name = req.params.name;
  const projectDir = req.query.projectDir || process.cwd();
  const locale = req.query.locale === 'zh-CN' ? 'zh-CN' : 'en';
  const found = findSkillByName(name, projectDir);

  if (!found) {
    return res.status(404).json({ error: 'Skill not found' });
  }

  try {
    const localized = await resolveLocalizedSkill(found, locale, { includeBody: true });
    const sourceLink = resolveSourceLink(found, readSkillMd(found.path, 'en'));
    res.json({
      name,
      path: found.path,
      description: localized.description,
      originalDescription: localized.originalDescription,
      skillsMdBody: localized.body,
      skillsMdOriginalBody: localized.originalBody,
      resolvedLocale: localized.resolvedLocale,
      translationSource: localized.translationSource,
      hasFallback: localized.hasFallback,
      sourceLink,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to load details' });
  }
});

app.post('/api/skills/:name/uninstall', (req, res) => {
  const { name } = req.params;
  const { isGlobal } = req.body;
  const args = ['skills', 'remove', name];
  if (isGlobal) args.push('-g');
  args.push('-y');
  execCLI(npxCommand(args), process.cwd(), 30000, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr || err.message });
    return res.json({ success: true, output: stdout });
  });
});

app.post('/api/skills/:name/update', (req, res) => {
  const { name } = req.params;
  execCLI(npxCommand(['skills', 'update', name]), process.cwd(), 30000, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr || err.message });
    return res.json({ success: true, output: stdout });
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
    return execCLI(npxCommand(addArgs), process.cwd(), 30000, (addErr, addStdout, addStderr) => {
      if (addErr) return res.status(500).json({ error: addStderr || addErr.message });
      return res.json({ success: true, output: `${removeStdout}${addStdout}` });
    });
  });
});

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
