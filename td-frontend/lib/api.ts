const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function searchJobs(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/jobs/search?${qs}`);
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

export async function getSkillTrends() {
  const res = await fetch(`${BASE}/jobs/analytics/skills`);
  if (!res.ok) throw new Error("Failed to fetch trends");
  return res.json();
}

export async function register(username: string, email: string, password: string) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function saveJob(jobId: string, token: string) {
  const res = await fetch(`${BASE}/jobs/save/${jobId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getSavedJobs(token: string) {
  const res = await fetch(`${BASE}/jobs/saved`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function unsaveJob(jobId: string, token: string) {
  const res = await fetch(`${BASE}/jobs/unsave/${jobId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}