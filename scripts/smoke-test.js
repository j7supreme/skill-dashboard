'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

async function main() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-dashboard-smoke-'));
  const fixturePath = path.join(tempRoot, 'fixture.json');
  const projectDir = path.join(tempRoot, 'project');
  fs.mkdirSync(projectDir, { recursive: true });

  const globalShared = createSkill(tempRoot, 'global-shared', 'shared', 'Global shared description');
  const globalSolo = createSkill(tempRoot, 'global-solo', 'adapt', 'Global adapt description');
  const projectShared = createSkill(tempRoot, 'project-shared', 'shared', 'Project shared description');
  const projectSolo = createSkill(tempRoot, 'project-solo', 'localonly', 'Project local description');

  fs.writeFileSync(
    fixturePath,
    JSON.stringify(
      {
        global: [
          { name: 'shared', path: globalShared, agents: ['Codex'] },
          { name: 'adapt', path: globalSolo, agents: ['Cline'] },
        ],
        project: [
          { name: 'shared', path: projectShared, agents: ['ProjectAgent'] },
          { name: 'localonly', path: projectSolo, agents: ['ProjectAgent'] },
        ],
      },
      null,
      2
    )
  );

  const port = 4100 + Math.floor(Math.random() * 300);
  const server = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(port),
      SKILL_DASHBOARD_NO_OPEN: '1',
      SKILL_DASHBOARD_FIXTURE: fixturePath,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  server.stdout.on('data', chunk => {
    output += chunk.toString();
  });
  server.stderr.on('data', chunk => {
    output += chunk.toString();
  });

  try {
    await waitForServer(port);

    const skillsRes = await getJson(port, `/api/skills?projectDir=${encodeURIComponent(projectDir)}`);
    assert.equal(skillsRes.status, 200);
    assert.equal(skillsRes.body.skills.length, 4);

    const shared = skillsRes.body.skills.filter(skill => skill.name === 'shared');
    assert.equal(shared.length, 2);
    assert.deepEqual(
      shared.map(skill => skill.scope).sort(),
      ['global', 'project']
    );

    const detailRes = await getJson(
      port,
      `/api/skills/shared/detail?projectDir=${encodeURIComponent(projectDir)}&skillPath=${encodeURIComponent(projectShared)}&scope=project`
    );
    assert.equal(detailRes.status, 200);
    assert.equal(detailRes.body.scope, 'project');
    assert.match(detailRes.body.skillsMdBody, /project-shared body/);

    const invalidProject = await getJson(port, `/api/skills?projectDir=${encodeURIComponent('/missing/project')}`);
    assert.equal(invalidProject.status, 400);
    assert.match(invalidProject.body.error, /Project path not found/);

    const missingDetail = await getJson(
      port,
      `/api/skills/unknown/detail?projectDir=${encodeURIComponent(projectDir)}&skillPath=${encodeURIComponent('/missing/skill')}&scope=project`
    );
    assert.equal(missingDetail.status, 404);
    assert.equal(missingDetail.body.error, 'Skill not found');

    console.log('Smoke test passed');
  } finally {
    server.kill('SIGINT');
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }

  if (server.exitCode && server.exitCode !== 0) {
    throw new Error(output || `Server exited with code ${server.exitCode}`);
  }
}

function createSkill(root, folder, name, description) {
  const skillDir = path.join(root, folder);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, 'SKILL.md'),
    `---\nname: ${name}\ndescription: ${description}\nuser-invokable: true\n---\n\n${description}\n\n## Notes\n\n${folder} body`
  );
  return skillDir;
}

async function waitForServer(port) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/skills`);
      if (res.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out waiting for server on port ${port}`);
}

async function getJson(port, pathname) {
  const res = await fetch(`http://127.0.0.1:${port}${pathname}`);
  const body = await res.json();
  return { status: res.status, body };
}

main().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
