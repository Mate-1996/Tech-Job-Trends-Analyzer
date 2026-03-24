const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  skills: string[];
  job_url: string;
  source: string;
  description: string;
  date_posted: string;
}

export interface SearchParams {
  title?: string;
  location?: string;
  skill?: string;
  source?: string;
  job_type?: string;
  date_range?: string;
  page?: number;
  per_page?: number;
}

export async function searchJobs(params: SearchParams): Promise<JobsResponse> {
  const clean: Record<string, string> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") clean[k] = String(v);
  });
  const qs = new URLSearchParams(clean).toString();
  const res = await fetch(`${BASE}/jobs/search?${qs}`);
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

export async function getSources(): Promise<string[]> {
  const res = await fetch(`${BASE}/jobs/sources`);
  if (!res.ok) return [];
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