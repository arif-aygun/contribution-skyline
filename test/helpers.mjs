// Builds GitHub-GraphQL-shaped calendar JSON for tests and fixtures.

const DAY_MS = 86_400_000;

export function makeCalendarJson({ start, days, count = () => 0 }) {
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const weeks = [];
  let total = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(startMs + i * DAY_MS);
    const weekday = d.getUTCDay();
    if (weeks.length === 0 || weekday === 0) weeks.push({ contributionDays: [] });
    const c = count(i);
    total += c;
    weeks.at(-1).contributionDays.push({ date: d.toISOString().slice(0, 10), contributionCount: c, weekday });
  }
  return {
    data: { user: { contributionsCollection: { contributionCalendar: { totalContributions: total, weeks }, restrictedContributionsCount: 0 } } },
  };
}
