import type { CompanyValue, Sentiment, SentimentLabel } from '../api/types';

/** Stored shape of the mock database: unlike the API, the author is always kept (as the backend does). */
export interface StoredEmployee {
  id: string;
  username: string;
  name: string;
  department: string;
  role: string;
  email: string;
  salary: number;
  address: string;
  createdAt: string;
}

export interface StoredFeedback {
  id: string;
  recipientId: string;
  /** Null only when the author was deleted. */
  authorId: string | null;
  anonymous: boolean;
  value: CompanyValue | null;
  message: string;
  sentiment: Sentiment | null;
  createdAt: string;
}

export interface MockData {
  employees: StoredEmployee[];
  feedback: StoredFeedback[];
  settings: { sentimentAnalysisEnabled: boolean; sentimentAnalysisAvailable: boolean };
}

const DAY = 86_400_000;

/** Small deterministic PRNG so the demo looks the same on every load. */
function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic UUID v4-shaped ids. */
function makeUuid(random: () => number): string {
  const hex = Array.from({ length: 32 }, () => Math.floor(random() * 16).toString(16));
  hex[12] = '4';
  hex[16] = ((parseInt(hex[16] ?? '0', 16) & 0x3) | 0x8).toString(16);
  const s = hex.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

type Person = [username: string, name: string, department: string, role: string, salary: number, address: string];

const PEOPLE: Person[] = [
  ['jose', 'José Antonio', 'IT', 'Java Senior Backend', 75600, 'Mainz, Germany'],
  ['louisa', 'Louisa Becker', 'IT', 'Senior Agile Coach', 79600, 'Mainz, Germany'],
  ['lukas', 'Lukas Hoffmann', 'IT', 'Frontend Engineer', 68200, 'Berlin, Germany'],
  ['priya', 'Priya Raman', 'IT', 'Platform Engineer', 82400, 'Munich, Germany'],
  ['maria', 'Maria Rossi', 'Sales', 'Account Executive', 61000, 'Berlin, Germany'],
  ['tom', 'Tom Fischer', 'Sales', 'Head of Sales', 98500, 'Hamburg, Germany'],
  ['aisha', 'Aisha Bello', 'Sales', 'Customer Success Manager', 58900, 'Frankfurt, Germany'],
  ['sofia', 'Sofía Martín', 'People', 'People Partner', 64300, 'Madrid, Spain'],
  ['noah', 'Noah Weber', 'People', 'Talent Acquisition Lead', 59800, 'Cologne, Germany'],
  ['elena', 'Elena Novak', 'Finance', 'Finance Manager', 88700, 'Vienna, Austria'],
  ['david', 'David Klein', 'Finance', 'Financial Analyst', 57400, 'Frankfurt, Germany'],
  ['hannah', 'Hannah Schulz', 'Finance', 'Controller', 71200, 'Leipzig, Germany'],
];

const POSITIVE: Record<CompanyValue, string[]> = {
  TEAMWORK: [
    'Thanks for pairing with me on the migration all week, {first}. I learned a ton and we shipped two days early.',
    '{first} stepped in to cover the on-call rotation when half the team was sick. Nobody even noticed the gap.',
    'Great collaboration on the quarterly planning, {first}. You made sure every team had a voice.',
  ],
  OWNERSHIP: [
    '{first} owned the incident from start to finish and wrote the clearest postmortem I have read this year.',
    'You picked up the forgotten vendor contract and got it renewed before the deadline. Huge save, {first}.',
    '{first} noticed the flaky reports nobody was fixing and just fixed them. Thank you!',
  ],
  CRAFT: [
    'The new onboarding checklist from {first} is beautifully done. Every detail is thought through.',
    'Your code reviews are always thorough and kind, {first}. The team writes better code because of you.',
    '{first} rebuilt the forecasting model and the accuracy jumped noticeably. Impressive work.',
  ],
  CUSTOMER_FOCUS: [
    '{first} turned a frustrated customer into our biggest advocate this quarter. Masterclass in listening.',
    'Thanks for joining the customer calls, {first}. Your answers made the renewal happen.',
    '{first} always brings the customer perspective into our discussions. It keeps us honest.',
  ],
  GROWTH: [
    'The workshop {first} ran on giving feedback was the most useful hour of my month.',
    '{first} mentored our new joiner patiently, and it shows: she is already shipping on her own.',
    'Loved how openly {first} shared what went wrong in the pilot. We all grew from it.',
  ],
};

const NEUTRAL = [
  'The update on the roadmap was useful, {first}. It would help to share it a bit earlier next time.',
  '{first} delivered the report on time. A short summary at the top would make it easier to scan.',
  'Solid handover, {first}. A couple of open questions are still in the doc, happy to go through them.',
  'Thanks for the status update, {first}. Let us align on priorities for next sprint.',
];

const NEGATIVE = [
  'The last two hand-offs from {first} came without context, and we lost time figuring things out.',
  'I felt the retro was rushed, {first}. Some concerns were not heard.',
  'Deadlines slipped again on the shared project, {first}. Let us find a way to flag risks earlier.',
];

function scoreFor(label: SentimentLabel, random: () => number): Sentiment {
  const base = label === 'POSITIVE' ? 0.86 : label === 'NEUTRAL' ? 0.58 : 0.74;
  return { label, score: Math.round((base + random() * (0.99 - base)) * 100) / 100 };
}

function pick<T>(items: readonly T[], random: () => number): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new Error('empty list');
  return item;
}

const VALUES: CompanyValue[] = ['TEAMWORK', 'OWNERSHIP', 'CRAFT', 'CUSTOMER_FOCUS', 'GROWTH'];

/**
 * ~12 employees in 4 departments and ~50 feedback items over the last 6 months, relative to `now`.
 * Maria's positive share drops from 80% to 40% between the two last 30-day windows, which raises one
 * dashboard alert.
 */
export function createSeed(now: Date = new Date()): MockData {
  const random = mulberry32(20260921);
  const at = (daysAgo: number, hour = 9 + Math.floor(random() * 8)) => {
    const date = new Date(now.getTime() - daysAgo * DAY);
    date.setUTCHours(hour, Math.floor(random() * 60), 0, 0);
    if (date.getTime() > now.getTime()) date.setTime(now.getTime() - 60_000 * (1 + Math.floor(random() * 50)));
    return date.toISOString();
  };

  const employees: StoredEmployee[] = PEOPLE.map(([username, name, department, role, salary, address], index) => ({
    id: makeUuid(random),
    username,
    name,
    department,
    role,
    email: `${username}@example.com`,
    salary,
    address,
    createdAt: at(400 - index * 9),
  }));

  const byUsername = (username: string) => {
    const employee = employees.find((e) => e.username === username);
    if (!employee) throw new Error(username);
    return employee;
  };
  const firstName = (employee: StoredEmployee) => employee.name.split(' ')[0] ?? employee.name;

  const feedback: StoredFeedback[] = [];
  const add = (
    recipient: StoredEmployee,
    author: StoredEmployee,
    daysAgo: number,
    label: SentimentLabel | null,
    options: { value?: CompanyValue | null; anonymous?: boolean; message?: string } = {},
  ) => {
    const value = options.value !== undefined ? options.value : pick(VALUES, random);
    const template =
      options.message ??
      (label === 'NEGATIVE'
        ? pick(NEGATIVE, random)
        : label === 'NEUTRAL'
          ? pick(NEUTRAL, random)
          : pick(POSITIVE[value ?? 'TEAMWORK'], random));
    feedback.push({
      id: makeUuid(random),
      recipientId: recipient.id,
      authorId: author.id,
      anonymous: options.anonymous ?? false,
      value,
      message: template.replaceAll('{first}', firstName(recipient)),
      sentiment: label ? scoreFor(label, random) : null,
      createdAt: at(daysAgo),
    });
  };

  const maria = byUsername('maria');
  const jose = byUsername('jose');
  const louisa = byUsername('louisa');

  // Maria: 4/5 positive 31-60 days ago, 2/5 positive in the last 30 days -> one alert.
  const previous: [number, SentimentLabel][] = [[34, 'POSITIVE'], [39, 'POSITIVE'], [44, 'NEUTRAL'], [50, 'POSITIVE'], [56, 'POSITIVE']];
  const current: [number, SentimentLabel][] = [[3, 'NEGATIVE'], [8, 'POSITIVE'], [14, 'NEUTRAL'], [19, 'NEGATIVE'], [25, 'POSITIVE']];
  const salesColleagues = ['tom', 'aisha', 'david', 'sofia', 'lukas'].map(byUsername);
  [...previous, ...current].forEach(([daysAgo, label], index) =>
    add(maria, salesColleagues[index % salesColleagues.length] ?? jose, daysAgo, label, { anonymous: index === 5 }),
  );

  // Hand-written items so the employee demo (José) has a lively inbox and outbox.
  add(jose, louisa, 2, 'POSITIVE', {
    value: 'TEAMWORK',
    message: 'José unblocked three teams this week by pairing on the API contract. Calm, clear and generous with his time.',
  });
  add(jose, byUsername('priya'), 12, 'POSITIVE', { value: 'CRAFT', anonymous: true });
  add(jose, byUsername('tom'), 27, 'NEUTRAL', { value: 'CUSTOMER_FOCUS' });
  add(louisa, jose, 5, 'POSITIVE', {
    value: 'GROWTH',
    message: 'Louisa, your retro format finally got the quiet people talking. Thank you for making space for everyone.',
  });
  add(byUsername('lukas'), jose, 21, 'POSITIVE', { value: 'CRAFT', anonymous: true });
  add(byUsername('aisha'), jose, 64, null, { value: 'CUSTOMER_FOCUS' });

  // The rest: spread over six months, more recent months slightly busier.
  const others = employees.filter((e) => e !== maria);
  const RANDOM_ITEMS = 38;
  for (let i = 0; i < RANDOM_ITEMS; i += 1) {
    // Stratified over ~6 months, slightly denser in recent weeks, so every month has activity.
    const daysAgo = Math.floor(Math.pow((i + random()) / RANDOM_ITEMS, 1.15) * 176) + 1;
    const pool = daysAgo > 62 ? employees : others;
    const recipient = pick(pool, random);
    let author = pick(employees, random);
    while (author === recipient) author = pick(employees, random);
    const roll = random();
    const label: SentimentLabel | null = roll < 0.74 ? 'POSITIVE' : roll < 0.88 ? 'NEUTRAL' : roll < 0.95 ? 'NEGATIVE' : null;
    add(recipient, author, daysAgo, label, { value: random() < 0.1 ? null : undefined, anonymous: random() < 0.14 });
  }

  feedback.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    employees,
    feedback,
    settings: { sentimentAnalysisEnabled: true, sentimentAnalysisAvailable: true },
  };
}
