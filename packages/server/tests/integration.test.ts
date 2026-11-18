import { describe, expect, it, beforeAll } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { createApp } from '../src/app';
import { prisma } from '../src/utils/prisma';

const app = createApp();

async function registerUser(name = 'Test Student') {
  const email = `test-${randomUUID()}@unispase.test`;
  const response = await request(app)
    .post('/api/v1/auth/register')
    .send({ name, email, password: 'StudyHard123' });
  expect(response.status).toBe(201);
  return { token: response.body.data.accessToken as string, user: response.body.data.user, email };
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  await prisma.$connect();
});

describe('Auth API', () => {
  it('registers, logs in and returns the current user', async () => {
    const { email, token } = await registerUser();
    const me = await request(app).get('/api/v1/auth/me').set(auth(token));
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(email);

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'StudyHard123' });
    expect(login.status).toBe(200);
    expect(login.body.data.accessToken).toBeTruthy();
  });

  it('rejects a wrong password with 401', async () => {
    const { email } = await registerUser();
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'WrongPassword1' });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects invalid registration input with 422', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'A', email: 'not-an-email', password: 'weak' });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('Courses API and ownership', () => {
  it('performs CRUD and hides other users data', async () => {
    const owner = await registerUser('Course Owner');
    const other = await registerUser('Other User');

    const created = await request(app)
      .post('/api/v1/courses')
      .set(auth(owner.token))
      .send({ code: 'CS 101', title: 'Intro to Computing', color: '#8B5CF6' });
    expect(created.status).toBe(201);
    const courseId = created.body.data.id as string;

    const list = await request(app).get('/api/v1/courses').set(auth(owner.token));
    expect(list.body.data).toHaveLength(1);

    const denied = await request(app).get(`/api/v1/courses/${courseId}`).set(auth(other.token));
    expect(denied.status).toBe(404);

    const updated = await request(app)
      .patch(`/api/v1/courses/${courseId}`)
      .set(auth(owner.token))
      .send({ title: 'Computing Fundamentals' });
    expect(updated.body.data.title).toBe('Computing Fundamentals');

    const deleted = await request(app).delete(`/api/v1/courses/${courseId}`).set(auth(owner.token));
    expect(deleted.status).toBe(200);
    const after = await request(app).get(`/api/v1/courses/${courseId}`).set(auth(owner.token));
    expect(after.status).toBe(404);
  });
});

describe('Tasks, exams, dashboard and calendar', () => {
  it('manages tasks with priorities, statuses and deadlines', async () => {
    const { token } = await registerUser();
    const dueAt = new Date(Date.now() + 86400000).toISOString();

    const created = await request(app)
      .post('/api/v1/tasks')
      .set(auth(token))
      .send({ title: 'Finish lab report', priority: 'URGENT', status: 'TODO', type: 'ASSIGNMENT', dueAt });
    expect(created.status).toBe(201);
    expect(created.body.data.priority).toBe('URGENT');
    const id = created.body.data.id as string;

    const filtered = await request(app).get('/api/v1/tasks?priority=URGENT').set(auth(token));
    expect(filtered.body.data).toHaveLength(1);

    const updated = await request(app)
      .patch(`/api/v1/tasks/${id}`)
      .set(auth(token))
      .send({ status: 'COMPLETED' });
    expect(updated.body.data.status).toBe('COMPLETED');
    expect(updated.body.data.completedAt).toBeTruthy();

    const done = await request(app).get('/api/v1/tasks?status=COMPLETED').set(auth(token));
    expect(done.body.data).toHaveLength(1);
  });

  it('manages exams with course associations', async () => {
    const { token } = await registerUser();
    const course = await request(app)
      .post('/api/v1/courses')
      .set(auth(token))
      .send({ code: 'MATH 1', title: 'Calculus' });
    const startsAt = new Date(Date.now() + 172800000).toISOString();

    const exam = await request(app)
      .post('/api/v1/exams')
      .set(auth(token))
      .send({ title: 'Calculus Quiz', examType: 'QUIZ', startsAt, courseId: course.body.data.id });
    expect(exam.status).toBe(201);
    expect(exam.body.data.courseId).toBe(course.body.data.id);

    const list = await request(app).get('/api/v1/exams').set(auth(token));
    expect(list.body.data).toHaveLength(1);
  });

  it('returns real dashboard statistics and a merged calendar', async () => {
    const { token } = await registerUser();
    await request(app)
      .post('/api/v1/courses')
      .set(auth(token))
      .send({ code: 'BIO 1', title: 'Biology' });
    await request(app)
      .post('/api/v1/tasks')
      .set(auth(token))
      .send({ title: 'Read chapter 1', dueAt: new Date(Date.now() + 86400000).toISOString() });
    await request(app)
      .post('/api/v1/exams')
      .set(auth(token))
      .send({ title: 'Biology Test', startsAt: new Date(Date.now() + 172800000).toISOString() });

    const stats = await request(app).get('/api/v1/dashboard/stats').set(auth(token));
    expect(stats.status).toBe(200);
    expect(stats.body.data.totalCourses).toBe(1);
    expect(stats.body.data.totalTasks).toBe(1);
    expect(stats.body.data.totalExams).toBe(1);
    expect(stats.body.data.weeklyActivity).toHaveLength(7);

    const calendar = await request(app).get('/api/v1/calendar').set(auth(token));
    expect(calendar.status).toBe(200);
    expect(calendar.body.data.map((e: { kind: string }) => e.kind)).toEqual(expect.arrayContaining(['TASK', 'EXAM']));
  });
});
