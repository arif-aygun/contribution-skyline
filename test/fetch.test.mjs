import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCalendar, fetchCalendar } from '../src/fetch.js';
import { makeCalendarJson } from './helpers.mjs';

const valid = () => makeCalendarJson({ start: '2026-01-04', days: 14, count: (i) => i % 3 });

function mutateFirstDay(json, patch) {
  const copy = structuredClone(json);
  Object.assign(copy.data.user.contributionsCollection.contributionCalendar.weeks[0].contributionDays[0], patch);
  return copy;
}

test('parses a valid 2-week response in calendar order', () => {
  const { total, days } = parseCalendar(valid());
  assert.equal(days.length, 14);
  assert.equal(days[0].date, '2026-01-04');
  assert.equal(days[13].date, '2026-01-17');
  assert.equal(total, days.reduce((s, d) => s + d.count, 0));
  assert.deepEqual(Object.keys(days[0]).sort(), ['count', 'date', 'weekday']);
});

test('throws on a GraphQL errors array', () => {
  assert.throws(() => parseCalendar({ errors: [{ message: 'Bad credentials' }] }), /Bad credentials/);
});

test('throws when user is null', () => {
  assert.throws(() => parseCalendar({ data: { user: null } }), /user not found/i);
});

test('throws on a negative count', () => {
  assert.throws(() => parseCalendar(mutateFirstDay(valid(), { contributionCount: -1 })), /count/);
});

test('throws on a non-integer count', () => {
  assert.throws(() => parseCalendar(mutateFirstDay(valid(), { contributionCount: 1.5 })), /count/);
});

test('throws on a malformed date', () => {
  assert.throws(() => parseCalendar(mutateFirstDay(valid(), { date: '2026/01/04' })), /date/);
});

test('throws on a weekday out of range', () => {
  assert.throws(() => parseCalendar(mutateFirstDay(valid(), { weekday: 7 })), /weekday/);
});

test('throws when weeks is missing', () => {
  assert.throws(() => parseCalendar({ data: { user: { contributionsCollection: {} } } }), /weeks/);
});

test('fetchCalendar sends the token and login, then parses', async () => {
  let seen;
  const fetchImpl = async (url, init) => {
    seen = { url, init };
    return { ok: true, status: 200, json: async () => valid() };
  };
  const cal = await fetchCalendar({ user: 'octo', token: 'tkn', fetchImpl });
  assert.equal(seen.url, 'https://api.github.com/graphql');
  assert.equal(seen.init.headers.Authorization, 'bearer tkn');
  assert.equal(JSON.parse(seen.init.body).variables.login, 'octo');
  assert.equal(cal.days.length, 14);
});

test('fetchCalendar throws with the HTTP status on 401', async () => {
  const fetchImpl = async () => ({ ok: false, status: 401, json: async () => ({}) });
  await assert.rejects(fetchCalendar({ user: 'octo', token: 'x', fetchImpl }), /401/);
});

test('throws on an empty calendar', () => {
  const json = valid();
  json.data.user.contributionsCollection.contributionCalendar.weeks = [];
  assert.throws(() => parseCalendar(json), /empty/i);
});

test('returns the restricted (private) contribution count', () => {
  const json = valid();
  json.data.user.contributionsCollection.restrictedContributionsCount = 7;
  assert.equal(parseCalendar(json).restricted, 7);
});

test('the query asks for the restricted count', async () => {
  const { QUERY } = await import('../src/fetch.js');
  assert.match(QUERY, /restrictedContributionsCount/);
});
