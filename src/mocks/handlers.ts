import { delay, http, HttpResponse, type HttpHandler } from 'msw';
import type { Employee, Feedback, FeedbackInput, SentimentFilter } from '../api/types';
import { COMPANY_VALUES } from '../api/types';
import type { MockDb } from './db';
import { personaFromAuthorization, type MockPersona } from './personas';
import type { StoredEmployee, StoredFeedback } from './seed';
import { fakeSentiment } from './sentiment';
import { computeOverview } from './stats';

interface Options {
  baseUrl: string;
  /** Artificial latency in ms, so loading states are visible in the demo. */
  latency?: number;
  now?: () => Date;
}

type Caller = { persona: MockPersona; employee: StoredEmployee | undefined };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const error = (status: number, code: string, message: string) => HttpResponse.json({ code, message }, { status });
/** Spring Security answers 401/403 without a body. */
const denied = (status: 401 | 403) => new HttpResponse(null, { status });

const isManager = (caller: Caller) => caller.persona.roles.includes('MANAGER');
const isEmployee = (caller: Caller) => caller.persona.roles.includes('EMPLOYEE');
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export function createHandlers(db: MockDb, { baseUrl, latency = 0, now = () => new Date() }: Options): HttpHandler[] {
  const url = (path: string) => `${baseUrl}${path}`;
  const employees = () => db.data.employees;

  async function authenticate(request: Request): Promise<Caller | Response> {
    if (latency) await delay(latency);
    const persona = personaFromAuthorization(request.headers.get('Authorization'));
    if (!persona) return denied(401);
    const employee = employees().find((e) => e.username.toLowerCase() === persona.username);
    return { persona, employee };
  }

  const toEmployee = (caller: Caller, e: StoredEmployee): Employee => {
    const full = isManager(caller) || caller.employee?.id === e.id;
    return { ...e, salary: full ? e.salary : null, address: full ? e.address : null };
  };

  const toFeedback = (f: StoredFeedback, revealAuthor = false): Feedback => {
    const author = f.authorId ? employees().find((e) => e.id === f.authorId) : undefined;
    const showAuthor = !!author && (!f.anonymous || revealAuthor);
    return {
      id: f.id,
      recipientId: f.recipientId,
      recipientName: employees().find((e) => e.id === f.recipientId)?.name ?? '',
      authorId: showAuthor ? (author?.id ?? null) : null,
      authorName: showAuthor ? (author?.name ?? null) : null,
      anonymous: f.anonymous,
      value: f.value,
      message: f.message,
      sentiment: f.sentiment,
      createdAt: f.createdAt,
    };
  };

  const newest = (a: StoredFeedback, b: StoredFeedback) => b.createdAt.localeCompare(a.createdAt);
  const byName = (a: StoredEmployee, b: StoredEmployee) => a.name.localeCompare(b.name);

  function validateEmployee(body: Record<string, unknown>, requireUsername: boolean): string[] {
    const missing = ['name', 'department', 'role', 'email', 'address', ...(requireUsername ? ['username'] : [])].filter(
      (field) => !text(body[field]),
    );
    if (typeof body.salary !== 'number' || !Number.isFinite(body.salary)) missing.push('salary');
    return missing;
  }

  return [
    http.get(url('/employees'), async ({ request }) => {
      const caller = await authenticate(request);
      if (caller instanceof Response) return caller;
      return HttpResponse.json([...employees()].sort(byName).map((e) => toEmployee(caller, e)));
    }),

    http.get(url('/employees/me'), async ({ request }) => {
      const caller = await authenticate(request);
      if (caller instanceof Response) return caller;
      if (!caller.employee) return error(404, 'NOT_FOUND', `No employee is linked to user '${caller.persona.username}'`);
      return HttpResponse.json(toEmployee(caller, caller.employee));
    }),

    http.get(url('/employees/:id'), async ({ request, params }) => {
      const caller = await authenticate(request);
      if (caller instanceof Response) return caller;
      const employee = employees().find((e) => e.id === params.id);
      if (!employee) return error(404, 'NOT_FOUND', `Employee '${String(params.id)}' not found`);
      return HttpResponse.json(toEmployee(caller, employee));
    }),

    http.post(url('/employees'), async ({ request }) => {
      const caller = await authenticate(request);
      if (caller instanceof Response) return caller;
      if (!isManager(caller)) return denied(403);
      const body = (await request.json()) as Record<string, unknown>;
      const missing = validateEmployee(body, true);
      if (missing.length) return error(400, 'BAD_REQUEST', `Missing required fields: ${missing.join(', ')}`);
      if (!EMAIL.test(text(body.email))) return error(400, 'BAD_REQUEST', 'Email is not valid');
      if ((body.salary as number) <= 0) return error(400, 'BAD_REQUEST', 'Salary must be greater than 0');
      const username = text(body.username).toLowerCase();
      if (employees().some((e) => e.username.toLowerCase() === username)) {
        return error(409, 'CONFLICT', `Username '${username}' is already taken`);
      }
      const created: StoredEmployee = {
        id: crypto.randomUUID(),
        username,
        name: text(body.name),
        department: text(body.department),
        role: text(body.role),
        email: text(body.email),
        salary: body.salary as number,
        address: text(body.address),
        createdAt: now().toISOString(),
      };
      db.data.employees.push(created);
      db.save();
      return HttpResponse.json(toEmployee(caller, created), { status: 201 });
    }),

    http.put(url('/employees/:id'), async ({ request, params }) => {
      const caller = await authenticate(request);
      if (caller instanceof Response) return caller;
      const employee = employees().find((e) => e.id === params.id);
      if (!employee) return error(404, 'NOT_FOUND', `Employee '${String(params.id)}' not found`);
      const body = (await request.json()) as Record<string, unknown>;
      if (body.username !== undefined && text(body.username).toLowerCase() !== employee.username.toLowerCase()) {
        return error(400, 'BAD_REQUEST', 'The username cannot be changed');
      }

      if (isManager(caller)) {
        const missing = validateEmployee(body, false);
        if (missing.length) return error(400, 'BAD_REQUEST', `Missing required fields: ${missing.join(', ')}`);
        if ((body.salary as number) <= 0) return error(400, 'BAD_REQUEST', 'Salary must be greater than 0');
        Object.assign(employee, {
          name: text(body.name),
          department: text(body.department),
          role: text(body.role),
          email: text(body.email),
          salary: body.salary,
          address: text(body.address),
        });
      } else {
        if (caller.employee?.id !== employee.id) return error(403, 'FORBIDDEN', 'You can only edit your own profile');
        const changesOthers = (['name', 'department', 'role', 'salary'] as const).some(
          (field) => body[field] !== undefined && body[field] !== employee[field],
        );
        if (changesOthers) return error(403, 'FORBIDDEN', 'Only managers can change name, department, role or salary');
        if (!text(body.email) || !text(body.address)) return error(400, 'BAD_REQUEST', 'Missing required fields: email, address');
        if (!EMAIL.test(text(body.email))) return error(400, 'BAD_REQUEST', 'Email is not valid');
        employee.email = text(body.email);
        employee.address = text(body.address);
      }
      db.save();
      return HttpResponse.json(toEmployee(caller, employee));
    }),

    http.delete(url('/employees/:id'), async ({ request, params }) => {
      const caller = await authenticate(request);
      if (caller instanceof Response) return caller;
      if (!isManager(caller)) return denied(403);
      const employee = employees().find((e) => e.id === params.id);
      if (!employee) return error(404, 'NOT_FOUND', `Employee '${String(params.id)}' not found`);
      db.data.employees = employees().filter((e) => e !== employee);
      // Feedback about them goes; feedback they wrote stays, without an author.
      db.data.feedback = db.data.feedback
        .filter((f) => f.recipientId !== employee.id)
        .map((f) => (f.authorId === employee.id ? { ...f, authorId: null } : f));
      db.save();
      return new HttpResponse(null, { status: 204 });
    }),

    http.post(url('/feedback'), async ({ request }) => {
      const caller = await authenticate(request);
      if (caller instanceof Response) return caller;
      if (!isEmployee(caller) || !caller.employee) return error(403, 'FORBIDDEN', 'Only employees with a record can send feedback');
      const body = (await request.json()) as Partial<FeedbackInput>;
      const message = text(body.message);
      if (!message || message.length > 500) return error(400, 'BAD_REQUEST', 'Message must be between 1 and 500 characters');
      if (body.value != null && !COMPANY_VALUES.includes(body.value)) return error(400, 'BAD_REQUEST', 'Unknown value');
      const recipient = employees().find((e) => e.id === body.recipientId);
      if (!recipient) return error(404, 'NOT_FOUND', `Employee '${String(body.recipientId)}' not found`);
      if (recipient.id === caller.employee.id) return error(400, 'BAD_REQUEST', 'You cannot give feedback to yourself');
      const { sentimentAnalysisEnabled, sentimentAnalysisAvailable } = db.data.settings;
      const stored: StoredFeedback = {
        id: crypto.randomUUID(),
        recipientId: recipient.id,
        authorId: caller.employee.id,
        anonymous: body.anonymous === true,
        value: body.value ?? null,
        message,
        sentiment: sentimentAnalysisEnabled && sentimentAnalysisAvailable ? fakeSentiment(message) : null,
        createdAt: now().toISOString(),
      };
      db.data.feedback.unshift(stored);
      db.save();
      return HttpResponse.json(toFeedback(stored, true), { status: 201 });
    }),

    http.get(url('/feedback/received'), async ({ request }) => {
      const caller = await authenticate(request);
      if (caller instanceof Response) return caller;
      if (!isEmployee(caller)) return denied(403);
      const mine = db.data.feedback.filter((f) => f.recipientId === caller.employee?.id);
      return HttpResponse.json([...mine].sort(newest).map((f) => toFeedback(f)));
    }),

    http.get(url('/feedback/sent'), async ({ request }) => {
      const caller = await authenticate(request);
      if (caller instanceof Response) return caller;
      if (!isEmployee(caller)) return denied(403);
      const mine = db.data.feedback.filter((f) => !!caller.employee && f.authorId === caller.employee.id);
      return HttpResponse.json([...mine].sort(newest).map((f) => toFeedback(f, true)));
    }),

    http.get(url('/feedback'), async ({ request }) => {
      const caller = await authenticate(request);
      if (caller instanceof Response) return caller;
      if (!isManager(caller)) return denied(403);
      const params = new URL(request.url).searchParams;
      const recipientId = params.get('recipientId');
      const department = params.get('department');
      const sentiment = params.get('sentiment') as SentimentFilter | null;
      const from = params.get('from');
      const to = params.get('to');
      const departmentOf = new Map(employees().map((e) => [e.id, e.department]));
      const result = db.data.feedback
        .filter((f) => !recipientId || f.recipientId === recipientId)
        .filter((f) => !department || departmentOf.get(f.recipientId) === department)
        .filter((f) => !sentiment || (sentiment === 'NONE' ? !f.sentiment : f.sentiment?.label === sentiment))
        .filter((f) => !from || f.createdAt.slice(0, 10) >= from.slice(0, 10))
        .filter((f) => !to || f.createdAt.slice(0, 10) <= to.slice(0, 10))
        .sort(newest)
        .map((f) => toFeedback(f));
      return HttpResponse.json(result);
    }),

    http.get(url('/stats/overview'), async ({ request }) => {
      const caller = await authenticate(request);
      if (caller instanceof Response) return caller;
      if (!isManager(caller)) return denied(403);
      const months = Number(new URL(request.url).searchParams.get('months') ?? 6);
      if (!Number.isInteger(months) || months < 1 || months > 12) return error(400, 'BAD_REQUEST', 'months must be between 1 and 12');
      return HttpResponse.json(computeOverview(employees(), db.data.feedback, now(), months));
    }),

    http.get(url('/settings'), async ({ request }) => {
      const caller = await authenticate(request);
      if (caller instanceof Response) return caller;
      return HttpResponse.json(db.data.settings);
    }),

    http.put(url('/settings'), async ({ request }) => {
      const caller = await authenticate(request);
      if (caller instanceof Response) return caller;
      if (!isManager(caller)) return denied(403);
      const body = (await request.json()) as { sentimentAnalysisEnabled?: unknown };
      if (typeof body.sentimentAnalysisEnabled !== 'boolean') return error(400, 'BAD_REQUEST', 'sentimentAnalysisEnabled is required');
      db.data.settings = { ...db.data.settings, sentimentAnalysisEnabled: body.sentimentAnalysisEnabled };
      db.save();
      return HttpResponse.json(db.data.settings);
    }),
  ];
}
