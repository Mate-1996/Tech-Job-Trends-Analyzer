"use client";
import { useState, useEffect } from "react";
import { searchJobs, saveJob } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  skills: string[];
  job_url: string;
  source: string;
  date_posted: string;
}

export default function JobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState({ title: "", location: "", skill: "" });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<string[]>([]);
  const [saveLoading, setSaveLoading] = useState<string | null>(null);

  useEffect(() => { handleSearch(); }, []);

  async function handleSearch() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.title) params.title = filters.title;
      if (filters.location) params.location = filters.location;
      if (filters.skill) params.skill = filters.skill;
      const data = await searchJobs(params);
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      setJobs([]);
    }
    setLoading(false);
  }

  async function handleSave(jobId: string) {
    if (!token) { alert("Please login to save jobs"); return; }
    setSaveLoading(jobId);
    await saveJob(jobId, token);
    setSaved(prev => [...prev, jobId]);
    setSaveLoading(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "var(--text)",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    flex: 1,
    minWidth: "160px",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>

      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "600", marginBottom: "6px" }}>
          Tech Jobs
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          {loading ? "Loading..." : `${jobs.length} jobs found`}
        </p>
      </div>

      {/* Search bar */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "32px",
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        alignItems: "center",
      }}>
        <input
          placeholder="Job title..."
          value={filters.title}
          onChange={e => setFilters({ ...filters, title: e.target.value })}
          onKeyDown={handleKeyDown}
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = "var(--accent)")}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />
        <input
          placeholder="Location..."
          value={filters.location}
          onChange={e => setFilters({ ...filters, location: e.target.value })}
          onKeyDown={handleKeyDown}
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = "var(--accent)")}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />
        <input
          placeholder="python"
          value={filters.skill}
          onChange={e => setFilters({ ...filters, skill: e.target.value })}
          onKeyDown={handleKeyDown}
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = "var(--accent)")}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />
        <button
          onClick={handleSearch}
          style={{
            background: "var(--accent)",
            color: "#000",
            border: "none",
            borderRadius: "8px",
            padding: "10px 24px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: "nowrap",
            transition: "opacity 0.2s",
          }}
          onMouseOver={e => ((e.target as HTMLButtonElement).style.opacity = "0.85")}
          onMouseOut={e => ((e.target as HTMLButtonElement).style.opacity = "1")}
        >
          Search
        </button>
      </div>

      {/* Job list */}
      {loading ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "60px 0" }}>
          Loading jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "60px 0" }}>
          No jobs found. Try running the scraper first.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {jobs.map(job => (
            <div
              key={job.id}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "16px",
                transition: "border-color 0.2s",
              }}
              onMouseOver={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "#444c56")}
              onMouseOut={e => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)")}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text)" }}>
                    {job.title}
                  </h2>
                  {job.salary && (
                    <span style={{
                      background: "var(--accent-dim)",
                      color: "var(--accent)",
                      fontSize: "11px",
                      fontFamily: "'DM Mono', monospace",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontWeight: "500",
                    }}>
                      {job.salary}
                    </span>
                  )}
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "12px" }}>
                  {job.company}
                  {job.location && (
                    <span style={{ color: "var(--border)", margin: "0 6px" }}>·</span>
                  )}
                  {job.location}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {job.skills?.slice(0, 8).map(skill => (
                    <span
                      key={skill}
                      onClick={() => setFilters(f => ({ ...f, skill }))}
                      style={{
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                        color: "var(--text-muted)",
                        fontSize: "11px",
                        fontFamily: "'DM Mono', monospace",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseOver={e => {
                        (e.target as HTMLSpanElement).style.borderColor = "var(--accent)";
                        (e.target as HTMLSpanElement).style.color = "var(--accent)";
                      }}
                      onMouseOut={e => {
                        (e.target as HTMLSpanElement).style.borderColor = "var(--border)";
                        (e.target as HTMLSpanElement).style.color = "var(--text-muted)";
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
                <a
                  href={job.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "var(--accent)",
                    color: "#000",
                    textDecoration: "none",
                    padding: "8px 18px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    textAlign: "center",
                    transition: "opacity 0.2s",
                  }}
                  onMouseOver={e => { (e.target as HTMLAnchorElement).style.opacity = "0.85"; }}
                  onMouseOut={e => { (e.target as HTMLAnchorElement).style.opacity = "1"; }}
                >
                  Apply →
                </a>
                <button
                  onClick={() => handleSave(job.id)}
                  disabled={saved.includes(job.id) || saveLoading === job.id}
                  style={{
                    background: "transparent",
                    border: `1px solid ${saved.includes(job.id) ? "var(--success)" : "var(--border)"}`,
                    color: saved.includes(job.id) ? "var(--success)" : "var(--text-muted)",
                    padding: "7px 18px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    cursor: saved.includes(job.id) ? "default" : "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.2s",
                  }}
                >
                  {saved.includes(job.id) ? "✓ Saved" : saveLoading === job.id ? "..." : "Save"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}