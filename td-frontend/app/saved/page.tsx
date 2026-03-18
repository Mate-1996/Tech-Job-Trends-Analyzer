"use client";
import { useState, useEffect } from "react";
import { getSavedJobs, unsaveJob } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  skills: string[];
  job_url: string;
  salary: string;
}

export default function SavedPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    getSavedJobs(token)
      .then(data => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleUnsave(jobId: string) {
    if (!token) return;
    await unsaveJob(jobId, token);
    setJobs(prev => prev.filter(j => j.id !== jobId));
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "600", marginBottom: "6px" }}>
          Saved Jobs
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          {loading ? "Loading..." : `${jobs.length} saved jobs`}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "60px 0" }}>
          Loading saved jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div style={{
          textAlign: "center",
          color: "var(--text-muted)",
          padding: "80px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}>
          <p style={{ fontSize: "16px" }}>No saved jobs yet</p>
          <Link href="/jobs" style={{
            background: "var(--accent)",
            color: "#000",
            textDecoration: "none",
            padding: "10px 24px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
          }}>
            Browse Jobs
          </Link>
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
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: "600" }}>{job.title}</h2>
                  {job.salary && (
                    <span style={{
                      background: "var(--accent-dim)",
                      color: "var(--accent)",
                      fontSize: "11px",
                      fontFamily: "'DM Mono', monospace",
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}>
                      {job.salary}
                    </span>
                  )}
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "12px" }}>
                  {job.company}
                  {job.location && <><span style={{ margin: "0 6px", color: "var(--border)" }}>·</span>{job.location}</>}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {job.skills?.slice(0, 8).map(skill => (
                    <span key={skill} style={{
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)",
                      fontSize: "11px",
                      fontFamily: "'DM Mono', monospace",
                      padding: "3px 10px",
                      borderRadius: "20px",
                    }}>
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
                  }}
                >
                  Apply →
                </a>
                <button
                  onClick={() => handleUnsave(job.id)}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--danger)",
                    padding: "7px 18px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "border-color 0.2s",
                  }}
                  onMouseOver={e => ((e.target as HTMLButtonElement).style.borderColor = "var(--danger)")}
                  onMouseOut={e => ((e.target as HTMLButtonElement).style.borderColor = "var(--border)")}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}