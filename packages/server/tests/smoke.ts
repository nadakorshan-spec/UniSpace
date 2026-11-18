import { randomUUID } from 'crypto';

const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:4000';
let passed = 0;
let failed = 0;
const skipped: string[] = [];

function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function call(path: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status, body };
}

async function main() {
  console.log(`UniSpace smoke test against ${BASE}\n`);

  const health = await call('/health');
  check('GET /health', health.status === 200 && health.body?.status === 'ok');

  const email = `smoke-${randomUUID()}@unispase.test`;
  const registered = await call('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Smoke Tester', email, password: 'StudyHard123' }),
  });
  check('POST /auth/register', registered.status === 201, `status ${registered.status}`);
  const token = registered.body?.data?.accessToken as string;
  const auth = { Authorization: `Bearer ${token}` };

  const loggedIn = await call('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'StudyHard123' }),
  });
  check('POST /auth/login', loggedIn.status === 200 && !!loggedIn.body?.data?.accessToken);

  const me = await call('/api/v1/auth/me', { headers: auth });
  check('GET /auth/me', me.status === 200 && me.body?.data?.email === email);

  const course = await call('/api/v1/courses', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ code: 'SMK 101', title: 'Smoke Course', color: '#8B5CF6' }),
  });
  check('POST /courses', course.status === 201);
  const courseId = course.body?.data?.id as string;

  const task = await call('/api/v1/tasks', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      title: 'Smoke assignment',
      courseId,
      priority: 'HIGH',
      status: 'TODO',
      dueAt: new Date(Date.now() + 86400000).toISOString(),
    }),
  });
  check('POST /tasks with priority and deadline', task.status === 201 && task.body?.data?.priority === 'HIGH');
  const taskId = task.body?.data?.id as string;

  const exam = await call('/api/v1/exams', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      title: 'Smoke exam',
      courseId,
      examType: 'MIDTERM',
      startsAt: new Date(Date.now() + 172800000).toISOString(),
    }),
  });
  check('POST /exams', exam.status === 201);

  const tasks = await call('/api/v1/tasks?priority=HIGH', { headers: auth });
  check('GET /tasks?priority=HIGH', tasks.status === 200 && tasks.body?.data?.length === 1);

  const patched = await call(`/api/v1/tasks/${taskId}`, {
    method: 'PATCH',
    headers: auth,
    body: JSON.stringify({ status: 'COMPLETED' }),
  });
  check('PATCH /tasks/:id', patched.status === 200 && patched.body?.data?.status === 'COMPLETED');

  const stats = await call('/api/v1/dashboard/stats', { headers: auth });
  check(
    'GET /dashboard/stats returns real statistics',
    stats.status === 200 &&
      stats.body?.data?.totalCourses === 1 &&
      stats.body?.data?.totalTasks === 1 &&
      stats.body?.data?.totalExams === 1,
  );

  const calendar = await call('/api/v1/calendar', { headers: auth });
  check(
    'GET /calendar merges tasks and exams',
    calendar.status === 200 && calendar.body?.data?.length >= 2,
    `${calendar.body?.data?.length ?? 0} events`,
  );

  const plan = await call('/api/v1/ai/study-plan', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ days: 3, hoursPerDay: 2 }),
  });
  if (plan.status === 201) {
    check('POST /ai/study-plan (live OpenAI)', Array.isArray(plan.body?.data?.sessions));
  } else if (plan.status === 503 && plan.body?.error?.code === 'AI_NOT_CONFIGURED') {
    skipped.push('POST /ai/study-plan — OPENAI_API_KEY not configured (live AI testing blocked)');
    console.log('  SKIP  POST /ai/study-plan — OPENAI_API_KEY not configured');
  } else if (plan.status === 422) {
    skipped.push('POST /ai/study-plan — no study material available');
    console.log('  SKIP  POST /ai/study-plan — no study material');
  } else {
    check('POST /ai/study-plan', false, `unexpected status ${plan.status}`);
  }

  const deleted = await call(`/api/v1/courses/${courseId}`, { method: 'DELETE', headers: auth });
  check('DELETE /courses/:id', deleted.status === 200);

  console.log(`\nResults: ${passed} passed, ${failed} failed, ${skipped.length} skipped`);
  skipped.forEach((item) => console.log(`  Blocked: ${item}`));
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('Smoke test crashed:', error);
  process.exit(1);
});
