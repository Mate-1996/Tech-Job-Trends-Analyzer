"use client";
import { useState, useEffect } from "react";
import { getSkillTrends } from "@/lib/api";

interface SkillTrend {
  skill: string;
  count: number;
}

export default function AnalyticsPage() {
  const [trends, setTrends] = useState<SkillTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSkillTrends().then(data => {
      setTrends(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const max = trends[0]?.count || 1;

  const colors = [
    "var(--accent)",
    "#58a6ff",
    "#3fb950",
    "#d2a8ff",
    "#f78166",
    "#56d364",
    "#79c0ff",
    "#ffa657",
    "#ff7b72",
    "#a5d6ff",
  ];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>

      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "600", marginBottom: "6px" }}>
          Skill Trends
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Most in-demand technologies across all scraped job listings
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "60px 0" }}>
          Loading analytics...
        </div>
      ) : trends.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "60px 0" }}>
          No data yet. Run the scraper first.
        </div>
      ) : (
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "32px",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {trends.map(({ skill, count }, i) => (
              <div key={skill}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      width: "20px",
                      textAlign: "right",
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>{skill}</span>
                  </div>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "12px",
                    color: colors[i % colors.length],
                    fontWeight: "500",
                  }}>
                    {count} jobs
                  </span>
                </div>
                <div style={{
                  height: "6px",
                  background: "var(--bg)",
                  borderRadius: "3px",
                  marginLeft: "30px",
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${(count / max) * 100}%`,
                    background: colors[i % colors.length],
                    borderRadius: "3px",
                    transition: "width 0.6s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: "32px",
            paddingTop: "24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            color: "var(--text-muted)",
            fontSize: "12px",
            fontFamily: "'DM Mono', monospace",
          }}>
            <span>{trends.length} skills tracked</span>
            <span>top skill: {trends[0]?.count} listings</span>
          </div>
        </div>
      )}
    </div>
  );
}