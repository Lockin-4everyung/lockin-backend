const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { test } = require('node:test');

test('production HTTP API and Swagger end-to-end', { timeout: 30000 }, async (t) => {
  // PORT=0 lets the OS choose a free port, avoiding collisions with local servers.
  const child = spawn(process.execPath, ['dist/main.js'], {
    cwd: require('node:path').resolve(__dirname, '..'),
    env: { ...process.env, PORT: '0', NODE_ENV: 'production', NO_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  t.after(async () => {
    if (child.exitCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
  });
  let base;
  for (let attempt = 0; attempt < 150; attempt++) {
    const match = output.match(/Swagger: http:\/\/[^:]+:(\d+)\/api\/docs/);
    if (match) { base = `http://127.0.0.1:${match[1]}`; break; }
    if (child.exitCode !== null) assert.fail(`Server exited: ${output}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(base, `Server failed to start: ${output}`);

  async function request(method, path, body, expectedStatus = 200) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    assert.equal(response.status, expectedStatus, `${method} ${path}: ${JSON.stringify(data)}`);
    return data;
  }

  const payload = {
    title: 'Study NestJS',
    description: 'Prepare the LockIn assignment',
    creatorId: 'user-1',
    startTime: '2026-11-10T09:00:00+07:00',
    endTime: '2026-11-10T10:00:00+07:00',
  };
  let commitment;
  let invitation;

  await t.test('create, list and retrieve a commitment', async () => {
    assert.deepEqual(await request('GET', '/commitments'), []);
    commitment = await request('POST', '/commitments', payload, 201);
    assert.equal(commitment.status, 'scheduled');
    assert.match(commitment.id, /^[0-9a-f-]{36}$/);
    assert.ok(Number.isFinite(Date.parse(commitment.createdAt)));
    assert.deepEqual(await request('GET', `/commitments/${commitment.id}`), commitment);
    assert.deepEqual(await request('GET', '/commitments'), [commitment]);
  });

  await t.test('update a commitment and validate the merged time range atomically', async () => {
    const path = `/commitments/${commitment.id}`;
    await request('PATCH', path, { startTime: payload.endTime }, 400);
    await request('PATCH', path, { endTime: payload.startTime }, 400);
    assert.deepEqual(await request('GET', path), commitment);
    const updated = await request('PATCH', path, { title: 'Updated study plan', status: 'completed' });
    assert.equal(updated.title, 'Updated study plan');
    assert.equal(updated.status, 'completed');
    assert.equal(updated.createdAt, commitment.createdAt);
    assert.equal(updated.creatorId, payload.creatorId);
    await request('PATCH', path, { status: 'cancelled' });
    await request('PATCH', path, { status: 'scheduled' });
  });

  await t.test('create an invitation, list, accept and verify its status', async () => {
    invitation = await request('POST', `/commitments/${commitment.id}/invitations`, { inviteeId: 'user-2' }, 201);
    assert.equal(invitation.commitmentId, commitment.id);
    assert.equal(invitation.status, 'pending');
    assert.deepEqual(await request('GET', '/invitations'), [invitation]);
    const accepted = await request('PATCH', `/invitations/${invitation.id}/accept`);
    assert.equal(accepted.status, 'accepted');
    assert.equal((await request('GET', '/invitations'))[0].status, 'accepted');
  });

  await t.test('decline a second invitation and prevent all terminal transitions', async () => {
    await request('PATCH', `/invitations/${invitation.id}/accept`, undefined, 409);
    await request('PATCH', `/invitations/${invitation.id}/decline`, undefined, 409);
    await request('POST', `/commitments/${commitment.id}/invitations`, { inviteeId: 'user-2' }, 409);
    const second = await request('POST', `/commitments/${commitment.id}/invitations`, { inviteeId: 'user-3' }, 201);
    assert.equal((await request('PATCH', `/invitations/${second.id}/decline`)).status, 'declined');
    await request('PATCH', `/invitations/${second.id}/decline`, undefined, 409);
    await request('PATCH', `/invitations/${second.id}/accept`, undefined, 409);
    assert.deepEqual((await request('GET', '/invitations')).map((item) => item.status), ['accepted', 'declined']);
  });

  await t.test('return 404 for missing commitment and invitation IDs', async () => {
    await request('GET', '/commitments/missing', undefined, 404);
    await request('PATCH', '/commitments/missing', { title: 'Missing' }, 404);
    await request('POST', '/commitments/missing/invitations', { inviteeId: 'user-2' }, 404);
    await request('PATCH', '/invitations/missing/accept', undefined, 404);
    await request('PATCH', '/invitations/missing/decline', undefined, 404);
  });

  await t.test('reject invalid required fields, timestamps, statuses and unknown properties', async () => {
    for (const patch of [
      { title: '' }, { title: '   ' }, { title: 42 }, { creatorId: null },
      { startTime: 'not-a-date' }, { startTime: '2026-02-30T00:00:00Z' },
      { startTime: '2026-11-10T09:00:00' },
      { endTime: payload.startTime }, { endTime: '2026-11-10T01:00:00Z' },
      { extra: true }, { status: 'accepted' },
    ]) await request('POST', '/commitments', { ...payload, ...patch }, 400);
    await request('POST', '/commitments', {}, 400);
    for (const patch of [{ title: null }, { description: null }, { status: null }, { status: 'invalid' }, { id: 'overwrite' }]) {
      await request('PATCH', `/commitments/${commitment.id}`, patch, 400);
    }
    for (const body of [{}, { inviteeId: '' }, { inviteeId: ' ' }, { inviteeId: 4 }, { inviteeId: 'user-4', status: 'accepted' }]) {
      await request('POST', `/commitments/${commitment.id}/invitations`, body, 400);
    }
    assert.equal((await request('GET', '/commitments')).length, 1);
    assert.equal((await request('GET', '/invitations')).length, 2);
    // Compare actual instants across different timezone offsets.
    const offset = await request('POST', '/commitments', {
      ...payload, startTime: '2026-11-10T09:00:00+07:00', endTime: '2026-11-10T02:30:00Z',
    }, 201);
    assert.equal(offset.status, 'scheduled');
  });

  await t.test('serve interactive Swagger, exactly two groups, and schemas for all eight operations', async () => {
    const ui = await fetch(`${base}/api/docs`);
    assert.equal(ui.status, 200);
    assert.match(await ui.text(), /swagger-ui/);
    const init = await fetch(`${base}/api/docs/swagger-ui-init.js`);
    assert.equal(init.status, 200);
    assert.match(await init.text(), /tryItOutEnabled/);
    const spec = await request('GET', '/api/docs-json');
    assert.equal(spec.info.title, 'LockIn Backend API');
    assert.equal(spec.info.version, '1.0.0');
    assert.deepEqual(spec.tags.map((tag) => tag.name).sort(), ['Commitments', 'Invitations']);
    let count = 0;
    for (const path of Object.values(spec.paths)) {
      for (const [method, operation] of Object.entries(path)) {
        if (!['get', 'post', 'patch'].includes(method)) continue;
        count++;
        assert.equal(operation.tags.length, 1);
        assert.ok(['Commitments', 'Invitations'].includes(operation.tags[0]));
        const success = operation.responses[method === 'post' ? '201' : '200'];
        assert.ok(success.content['application/json'].schema);
        for (const parameter of operation.parameters) assert.ok(parameter.description);
        for (const [status, response] of Object.entries(operation.responses)) {
          if (Number(status) >= 400) assert.ok(response.content['application/json'].schema);
        }
      }
    }
    assert.equal(count, 8);
    assert.ok(spec.paths['/commitments'].post.requestBody.content['application/json'].schema);
    assert.ok(spec.paths['/commitments/{id}'].patch.requestBody.content['application/json'].schema);
    assert.ok(spec.paths['/commitments/{id}/invitations'].post.requestBody.content['application/json'].schema);
    const cors = await fetch(`${base}/commitments`, { method: 'OPTIONS', headers: { Origin: 'https://example.com', 'Access-Control-Request-Method': 'POST' } });
    assert.equal(cors.headers.get('access-control-allow-origin'), '*');
  });
});
