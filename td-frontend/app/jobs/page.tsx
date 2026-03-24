"use client";
import { useState, useEffect, useCallback } from "react";
import { searchJobs, saveJob, getSources, Job, SearchParams } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";


const SKILL_COLORS: Record<string, { bg: string; color: string; border: string }> = {

  Python:     { bg: "#3572A520", color: "#3572A5", border: "#3572A540" },
  JavaScript: { bg: "#f1e05a20", color: "#b8a800", border: "#f1e05a40" },
  TypeScript: { bg: "#2b7de920", color: "#2b7de9", border: "#2b7de940" },
  Go:         { bg: "#00ADD820", color: "#00ADD8", border: "#00ADD840" },
  Rust:       { bg: "#dea58420", color: "#c06020", border: "#dea58440" },
  Java:       { bg: "#b0721420", color: "#b07214", border: "#b0721440" },
  Ruby:       { bg: "#cc342d20", color: "#cc342d", border: "#cc342d40" },
  PHP:        { bg: "#777BB420", color: "#5a5d8a", border: "#777BB440" },
  "C++":      { bg: "#f34b7d20", color: "#c0204d", border: "#f34b7d40" },
  "C#":       { bg: "#23915120", color: "#1a6e3d", border: "#23915140" },
  Swift:      { bg: "#F0523020", color: "#c03010", border: "#F0523040" },
  Kotlin:     { bg: "#A97BFF20", color: "#7c4de0", border: "#A97BFF40" },
  Scala:      { bg: "#DC322F20", color: "#a02020", border: "#DC322F40" },

  React:      { bg: "#61DAFB20", color: "#0a9ab5", border: "#61DAFB40" },
  "Next.js":  { bg: "#ffffff20", color: "#aaaaaa", border: "#ffffff30" },
  Vue:        { bg: "#4FC08D20", color: "#2d8a5e", border: "#4FC08D40" },
  Angular:    { bg: "#DD003120", color: "#aa0020", border: "#DD003140" },
  Django:     { bg: "#09241420", color: "#0a6640", border: "#09241440" },
  FastAPI:    { bg: "#05998820", color: "#057060", border: "#05998840" },
  Flask:      { bg: "#00000020", color: "#888888", border: "#00000040" },
  "Node.js":  { bg: "#33993320", color: "#1a7a1a", border: "#33993340" },
  Spring:     { bg: "#6DB33F20", color: "#4a8a28", border: "#6DB33F40" },

  "Machine Learning": { bg: "#FF6F0020", color: "#cc4800", border: "#FF6F0040" },
  TensorFlow: { bg: "#FF6F0020", color: "#cc4800", border: "#FF6F0040" },
  PyTorch:    { bg: "#EE4C2C20", color: "#bb2a0a", border: "#EE4C2C40" },
  Pandas:     { bg: "#15047420", color: "#3a2090", border: "#15047440" },
  Spark:      { bg: "#E25A1C20", color: "#b03808", border: "#E25A1C40" },

  AWS:        { bg: "#FF990020", color: "#cc6600", border: "#FF990040" },
  Azure:      { bg: "#0078D420", color: "#005a9e", border: "#0078D440" },
  GCP:        { bg: "#4285F420", color: "#1a5cc0", border: "#4285F440" },
  Docker:     { bg: "#2496ED20", color: "#1070b8", border: "#2496ED40" },
  Kubernetes: { bg: "#326CE520", color: "#1a4ab0", border: "#326CE540" },
  Terraform:  { bg: "#7B42BC20", color: "#5a28a0", border: "#7B42BC40" },

  PostgreSQL: { bg: "#33679820", color: "#1a5070", border: "#33679840" },
  MongoDB:    { bg: "#47A24820", color: "#2a7a2a", border: "#47A24840" },
  Redis:      { bg: "#DC382D20", color: "#aa1a10", border: "#DC382D40" },
  SQL:        { bg: "#e0e0e020", color: "#888888", border: "#e0e0e040" },
};

const DEFAULT_SKILL_COLOR = { bg: "#30363d40", color: "#8b949e", border: "#30363d" };

function skillStyle(skill: string) {
  return SKILL_COLORS[skill] ?? DEFAULT_SKILL_COLOR;
}


const SOURCE_STYLES: Record<string, { bg: string; color: string }> = {
  "LinkedIn":         { bg: "#0A66C220", color: "#0A66C2" },
  "We Work Remotely": { bg: "#23c45e20", color: "#1a9e4a" },
  "RemoteOK":         { bg: "#f0a50020", color: "#c07800" },
};

function SourceBadge({ source }: { source: string }) {
  const style = SOURCE_STYLES[source] ?? { bg: "#30363d40", color: "#8b949e" };
  return (
    <span style={{
      background: style.bg,
      color: style.color,
      fontSize: "10px",
      fontFamily: "'DM Mono', monospace",
      fontWeight: "600",
      padding: "2px 8px",
      borderRadius: "4px",
      letterSpacing: "0.03em",
      whiteSpace: "nowrap",
    }}>
      {source}
    </span>
  );
}

function timeAgo(iso: string): string {
  if (!iso) return "";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  } catch { return ""; }
}


function JobModal({ job, onClose, onSave, saved, saveLoading, token }: {
  job: Job;
  onClose: () => void;
  onSave: (id: string) => void;
  saved: string[];
  saveLoading: string | null;
  token: string | null;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "660px",
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "16px", right: "16px",
            background: "transparent", border: "none",
            color: "var(--text-muted)", fontSize: "20px",
            cursor: "pointer", lineHeight: 1,
          }}
        >✕</button>

        {/* Header */}
        <div style={{ marginBottom: "20px", paddingRight: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
            <SourceBadge source={job.source} />
            {job.salary && (
              <span style={{
                background: "var(--accent-dim)", color: "var(--accent)",
                fontSize: "11px", fontFamily: "'DM Mono', monospace",
                padding: "2px 8px", borderRadius: "4px",
              }}>{job.salary}</span>
            )}
            <span style={{ color: "var(--text-muted)", fontSize: "11px", fontFamily: "'DM Mono', monospace" }}>
              {timeAgo(job.date_posted)}
            </span>
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: "600", marginBottom: "4px" }}>{job.title}</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            {job.company}
            {job.location && <><span style={{ margin: "0 6px", color: "var(--border)" }}>·</span>{job.location}</>}
          </p>
        </div>

        {/* Skills */}
        {job.skills?.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Skills</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {job.skills.map(skill => {
                const s = skillStyle(skill);
                return (
                  <span key={skill} style={{
                    background: s.bg, color: s.color,
                    border: `1px solid ${s.border}`,
                    fontSize: "11px", fontFamily: "'DM Mono', monospace",
                    padding: "3px 10px", borderRadius: "20px",
                  }}>{skill}</span>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        {job.description && (
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Description</p>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{job.description}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px" }}>
          <a
            href={job.job_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, background: "var(--accent)", color: "#000",
              textDecoration: "none", padding: "12px",
              borderRadius: "8px", fontSize: "14px", fontWeight: "600",
              textAlign: "center",
            }}
          >
            Apply Now →
          </a>
          {token && (
            <button
              onClick={() => onSave(job.id)}
              disabled={saved.includes(job.id) || saveLoading === job.id}
              style={{
                background: "transparent",
                border: `1px solid ${saved.includes(job.id) ? "var(--success)" : "var(--border)"}`,
                color: saved.includes(job.id) ? "var(--success)" : "var(--text-muted)",
                padding: "12px 20px", borderRadius: "8px",
                fontSize: "14px", cursor: saved.includes(job.id) ? "default" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {saved.includes(job.id) ? "✓ Saved" : saveLoading === job.id ? "..." : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
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
  width: "100%",
  transition: "border-color 0.2s",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none",
};

export default function JobsPage() {
  const { token } = useAuth();

  const [jobs, setJobs]           = useState<Job[]>([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [sources, setSources]     = useState<string[]>([]);
  const [saved, setSaved]         = useState<string[]>([]);
  const [saveLoading, setSaveLoading] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [filters, setFilters] = useState<SearchParams>({
    title: "", location: "", skill: "",
    source: "", job_type: "", date_range: "",
  });

  // Load available sources for the dropdown
  useEffect(() => {
    getSources().then(setSources).catch(() => {});
  }, []);

  const runSearch = useCallback(async (params: SearchParams, p: number) => {
    setLoading(true);
    try {
      const data = await searchJobs({ ...params, page: p, per_page: 20 });
      setJobs(data.jobs);
      setTotal(data.total);
      setTotalPages(data.total_pages);
      setPage(data.page);
    } catch {
      setJobs([]);
    }
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => { runSearch(filters, 1); }, []);

  function handleSearch() { runSearch(filters, 1); }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  function handlePageChange(p: number) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    runSearch(filters, p);
  }

  async function handleSave(jobId: string) {
    if (!token) { alert("Please login to save jobs"); return; }
    setSaveLoading(jobId);
    await saveJob(jobId, token);
    setSaved(prev => [...prev, jobId]);
    setSaveLoading(null);
  }

  function setFilter(key: keyof SearchParams, value: string) {
    setFilters(f => ({ ...f, [key]: value }));
  }

  return (
    <>
      {selectedJob && (
        <JobModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onSave={handleSave}
          saved={saved}
          saveLoading={saveLoading}
          token={token}
        />
      )}

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "600", marginBottom: "6px" }}>Tech Jobs</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            {loading ? "Searching..." : `${total.toLocaleString()} jobs found`}
          </p>
        </div>

        {/* Filter panel */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "28px",
        }}>
          {/* Row 1: text filters */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <input
              placeholder="Job title..."
              value={filters.title}
              onChange={e => setFilter("title", e.target.value)}
              onKeyDown={handleKeyDown}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "var(--accent)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />
            <input
              placeholder="Location..."
              value={filters.location}
              onChange={e => setFilter("location", e.target.value)}
              onKeyDown={handleKeyDown}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "var(--accent)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />
            <input
              placeholder="Skill (e.g. Python)..."
              value={filters.skill}
              onChange={e => setFilter("skill", e.target.value)}
              onKeyDown={handleKeyDown}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "var(--accent)")}
              onBlur={e => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Row 2: dropdowns + search button */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "12px", alignItems: "center" }}>
            {/* Source */}
            <div style={{ position: "relative" }}>
              <select
                value={filters.source}
                onChange={e => setFilter("source", e.target.value)}
                style={selectStyle}
              >
                <option value="">All sources</option>
                {sources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", fontSize: "12px" }}>▾</span>
            </div>

            {/* Job type */}
            <div style={{ position: "relative" }}>
              <select
                value={filters.job_type}
                onChange={e => setFilter("job_type", e.target.value)}
                style={selectStyle}
              >
                <option value="">All types</option>
                <option value="internship">Internship</option>
                <option value="full-time">Full-time</option>
                <option value="contract">Contract</option>
                <option value="part-time">Part-time</option>
              </select>
              <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", fontSize: "12px" }}>▾</span>
            </div>

            {/* Date range */}
            <div style={{ position: "relative" }}>
              <select
                value={filters.date_range}
                onChange={e => setFilter("date_range", e.target.value)}
                style={selectStyle}
              >
                <option value="">Any time</option>
                <option value="24h">Last 24 hours</option>
                <option value="week">Last week</option>
                <option value="month">Last month</option>
              </select>
              <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", fontSize: "12px" }}>▾</span>
            </div>

            <button
              onClick={handleSearch}
              style={{
                background: "var(--accent)", color: "#000",
                border: "none", borderRadius: "8px",
                padding: "10px 28px", fontSize: "14px",
                fontWeight: "600", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              Search
            </button>
          </div>

          {/* Active filter chips */}
          {Object.entries(filters).some(([, v]) => v) && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
              {Object.entries(filters).map(([key, val]) => val ? (
                <span
                  key={key}
                  onClick={() => setFilter(key as keyof SearchParams, "")}
                  style={{
                    background: "var(--accent-dim)", color: "var(--accent)",
                    border: "1px solid var(--accent)40",
                    fontSize: "11px", fontFamily: "'DM Mono', monospace",
                    padding: "3px 10px", borderRadius: "20px",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                  }}
                >
                  {key.replace("_", " ")}: {val} <span style={{ fontSize: "10px" }}>✕</span>
                </span>
              ) : null)}
              <span
                onClick={() => { setFilters({ title: "", location: "", skill: "", source: "", job_type: "", date_range: "" }); }}
                style={{
                  color: "var(--text-muted)", fontSize: "11px",
                  fontFamily: "'DM Mono', monospace",
                  padding: "3px 10px", cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Clear all
              </span>
            </div>
          )}
        </div>

        {/* Job list */}
        {loading ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "80px 0" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>⟳</div>
            Loading jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "80px 0" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>🔍</div>
            No jobs found. Try adjusting your filters.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "18px 22px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseOver={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)60";
                    (e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)";
                  }}
                  onMouseOut={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLDivElement).style.background = "var(--bg-card)";
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Top row: source badge, salary, time */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <SourceBadge source={job.source} />
                      {job.salary && (
                        <span style={{
                          background: "var(--accent-dim)", color: "var(--accent)",
                          fontSize: "11px", fontFamily: "'DM Mono', monospace",
                          padding: "2px 8px", borderRadius: "4px",
                        }}>{job.salary}</span>
                      )}
                      <span style={{ color: "var(--text-muted)", fontSize: "11px", fontFamily: "'DM Mono', monospace", marginLeft: "auto" }}>
                        {timeAgo(job.date_posted)}
                      </span>
                    </div>

                    {/* Title + company */}
                    <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "3px", color: "var(--text)" }}>
                      {job.title}
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "12px" }}>
                      {job.company}
                      {job.location && <><span style={{ margin: "0 6px", color: "var(--border)" }}>·</span>{job.location}</>}
                    </p>

                    {/* Skill tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                      {job.skills?.slice(0, 7).map(skill => {
                        const s = skillStyle(skill);
                        return (
                          <span
                            key={skill}
                            onClick={e => { e.stopPropagation(); setFilter("skill", skill); }}
                            style={{
                              background: s.bg, color: s.color,
                              border: `1px solid ${s.border}`,
                              fontSize: "11px", fontFamily: "'DM Mono', monospace",
                              padding: "2px 9px", borderRadius: "20px",
                              cursor: "pointer",
                            }}
                          >{skill}</span>
                        );
                      })}
                      {(job.skills?.length ?? 0) > 7 && (
                        <span style={{ color: "var(--text-muted)", fontSize: "11px", fontFamily: "'DM Mono', monospace", padding: "2px 0" }}>
                          +{job.skills.length - 7}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side actions */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <a
                      href={job.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: "var(--accent)", color: "#000",
                        textDecoration: "none", padding: "8px 18px",
                        borderRadius: "8px", fontSize: "13px",
                        fontWeight: "600", textAlign: "center",
                      }}
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
                        padding: "7px 18px", borderRadius: "8px",
                        fontSize: "13px",
                        cursor: saved.includes(job.id) ? "default" : "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {saved.includes(job.id) ? "✓ Saved" : saveLoading === job.id ? "..." : "Save"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: "flex", justifyContent: "center",
                alignItems: "center", gap: "8px",
                marginTop: "40px", paddingBottom: "40px",
              }}>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    color: page === 1 ? "var(--text-muted)" : "var(--text)",
                    padding: "8px 16px", borderRadius: "8px",
                    fontSize: "13px", cursor: page === 1 ? "not-allowed" : "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    opacity: page === 1 ? 0.4 : 1,
                  }}
                >← Prev</button>

                {/* Page number buttons */}
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  // Show pages around current page
                  let p: number;
                  if (totalPages <= 7) {
                    p = i + 1;
                  } else if (page <= 4) {
                    p = i + 1;
                  } else if (page >= totalPages - 3) {
                    p = totalPages - 6 + i;
                  } else {
                    p = page - 3 + i;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      style={{
                        background: p === page ? "var(--accent)" : "var(--bg-card)",
                        border: `1px solid ${p === page ? "var(--accent)" : "var(--border)"}`,
                        color: p === page ? "#000" : "var(--text-muted)",
                        padding: "8px 14px", borderRadius: "8px",
                        fontSize: "13px", cursor: "pointer",
                        fontFamily: "'DM Mono', monospace",
                        fontWeight: p === page ? "600" : "400",
                        minWidth: "40px",
                      }}
                    >{p}</button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    color: page === totalPages ? "var(--text-muted)" : "var(--text)",
                    padding: "8px 16px", borderRadius: "8px",
                    fontSize: "13px", cursor: page === totalPages ? "not-allowed" : "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    opacity: page === totalPages ? 0.4 : 1,
                  }}
                >Next →</button>

                <span style={{ color: "var(--text-muted)", fontSize: "12px", fontFamily: "'DM Mono', monospace", marginLeft: "8px" }}>
                  {page} / {totalPages}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}