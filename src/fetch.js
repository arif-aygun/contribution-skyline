// GitHub GraphQL → validated calendar. Anything unexpected throws, so a bad run never publishes an empty city.

const ENDPOINT = 'https://api.github.com/graphql';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount weekday } }
      }
    }
  }
}`;

function parseDay(day) {
  const { date, contributionCount: count, weekday } = day ?? {};
  if (typeof date !== 'string' || !DATE_RE.test(date)) throw new Error(`Invalid date: ${date}`);
  if (!Number.isInteger(count) || count < 0) throw new Error(`Invalid count on ${date}: ${count}`);
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    throw new Error(`Invalid weekday on ${date}: ${weekday}`);
  }
  return { date, count, weekday };
}

export function parseCalendar(json) {
  if (Array.isArray(json?.errors) && json.errors.length > 0) {
    throw new Error(`GitHub API error: ${json.errors[0]?.message ?? 'unknown'}`);
  }
  const user = json?.data?.user;
  if (!user) throw new Error('GitHub user not found (check SKYLINE_USER and the token)');
  const calendar = user.contributionsCollection?.contributionCalendar;
  if (!Array.isArray(calendar?.weeks)) throw new Error('Unexpected response: calendar weeks missing');
  const days = calendar.weeks.flatMap((w) => {
    if (!Array.isArray(w?.contributionDays)) throw new Error('Unexpected response: week without days');
    return w.contributionDays.map(parseDay);
  });
  if (days.length === 0) throw new Error('Unexpected response: calendar is empty');
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const restricted = user.contributionsCollection.restrictedContributionsCount;
  return { total, restricted: Number.isInteger(restricted) ? restricted : 0, days };
}

export async function fetchCalendar({ user, token, fetchImpl = fetch }) {
  const res = await fetchImpl(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'contribution-skyline',
    },
    body: JSON.stringify({ query: QUERY, variables: { login: user } }),
  });
  if (!res.ok) throw new Error(`GitHub API request failed: HTTP ${res.status}`);
  return parseCalendar(await res.json());
}
