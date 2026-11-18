import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { createApp } from '../src/app';

const app = createApp();
const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

async function makeUser() {
  const email = `sec-${randomUUID()}@unispase.test`;
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Security Tester', email, password: 'StudyHard123' });
  return { token: response.body.data.accessToken as string, email };
}

describe('Security protections', () => {
  it('rejects missing, malformed and tampered JWTs', async () => {
    expect((await request(app).get('/api/v1/tasks')).status).toBe(401);
    expect((await request(app).get('/api/v1/tasks').set(authHeader('not-a-token'))).status).toBe(401);
    const { token } = await makeUser();
    const tampered = `${token.slice(0, -3)}abc`;
    expect((await request(app).get('/api/v1/tasks').set(authHeader(tampered))).status).toBe(401);
  });

  it('prevents IDOR across users for tasks, exams and courses', async () => {
    const owner = await makeUser();
    const attacker = await makeUser();

    const task = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(owner.token))
      .send({ title: 'Private task' });
    const exam = await request(app)
      .post('/api/v1/exams')
      .set(authHeader(owner.token))
      .send({ title: 'Private exam', startsAt: new Date(Date.now() + 86400000).toISOString() });
    const course = await request(app)
      .post('/api/v1/courses')
      .set(authHeader(owner.token))
      .send({ code: 'PRIV 1', title: 'Private course' });

    for (const path of [
      `/api/v1/tasks/${task.body.data.id}`,
      `/api/v1/exams/${exam.body.data.id}`,
      `/api/v1/courses/${course.body.data.id}`,
    ]) {
      const read = await request(app).get(path).set(authHeader(attacker.token));
      const update = await request(app).patch(path).set(authHeader(attacker.token)).send({ title: 'Hacked' });
      const remove = await request(app).delete(path).set(authHeader(attacker.token));
      expect([read.status, update.status, remove.status]).toEqual([404, 404, 404]);
    }
  });

  it('enforces password strength and rejects duplicate accounts', async () => {
    const weak = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Weak User', email: `weak-${randomUUID()}@test.dev`, password: 'abc' });
    expect(weak.status).toBe(422);

    const user = await makeUser();
    const duplicate = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Duplicate', email: user.email, password: 'StudyHard123' });
    expect(duplicate.status).toBe(409);
  });

  it('rejects malformed identifiers and unexpected validation bypasses', async () => {
    const { token } = await makeUser();
    const badId = await request(app).get('/api/v1/tasks/not-a-uuid').set(authHeader(token));
    expect(badId.status).toBe(422);

    const badPayload = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(token))
      .send({ title: '', priority: 'IMPOSSIBLE', dueAt: 'yesterday' });
    expect(badPayload.status).toBe(422);
  });

  it('blocks requests from untrusted CORS origins', async () => {
    const response = await request(app).get('/health').set('Origin', 'https://evil.example');
    expect(response.status).toBe(403);
  });

  it('stores user text as inert data (no HTML rendering)', async () => {
    const { token } = await makeUser();
    const payload = '<script>alert(1)</script>';
    const created = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader(token))
      .send({ title: payload });
    expect(created.status).toBe(201);
    expect(created.body.data.title).toBe(payload);
    expect(created.headers['content-type']).toContain('application/json');
  });

  it('rate limits repeated login attempts', async () => {
    let sawLimit = false;
    for (let i = 0; i < 13; i += 1) {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'WrongPassword1' });
      if (response.status === 429) sawLimit = true;
    }
    expect(sawLimit).toBe(true);
  });
});
