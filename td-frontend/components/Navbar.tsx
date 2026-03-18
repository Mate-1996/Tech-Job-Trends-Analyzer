"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function Navbar() {
  const { token, logout } = useAuth();
  const pathname = usePathname();

  const linkStyle = (path: string) => ({
    color: pathname === path ? "var(--accent)" : "var(--text-muted)",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: pathname === path ? "500" : "400",
    transition: "color 0.2s",
    paddingBottom: "2px",
    borderBottom: pathname === path ? "1px solid var(--accent)" : "1px solid transparent",
  });

  return (
    <nav style={{
      background: "var(--bg-card)",
      borderBottom: "1px solid var(--border)",
      padding: "0 32px",
      height: "64px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <Link href="/jobs" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{
          background: "var(--accent)",
          color: "#000",
          fontFamily: "'DM Mono', monospace",
          fontWeight: "500",
          fontSize: "12px",
          padding: "3px 8px",
          borderRadius: "4px",
          letterSpacing: "0.05em",
        }}>TJT</span>
        <span style={{ color: "var(--text)", fontWeight: "500", fontSize: "15px" }}>
          TechJobTrends
        </span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
        <Link href="/jobs" style={linkStyle("/jobs")}>Jobs</Link>
        <Link href="/analytics" style={linkStyle("/analytics")}>Analytics</Link>
        {token && <Link href="/saved" style={linkStyle("/saved")}>Saved</Link>}

        {token ? (
          <button
            onClick={logout}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              padding: "6px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.2s",
            }}
            onMouseOver={e => {
              (e.target as HTMLButtonElement).style.borderColor = "var(--danger)";
              (e.target as HTMLButtonElement).style.color = "var(--danger)";
            }}
            onMouseOut={e => {
              (e.target as HTMLButtonElement).style.borderColor = "var(--border)";
              (e.target as HTMLButtonElement).style.color = "var(--text-muted)";
            }}
          >
            Logout
          </button>
        ) : (
          <div style={{ display: "flex", gap: "10px" }}>
            <Link href="/login" style={{
              textDecoration: "none",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
              padding: "6px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              transition: "all 0.2s",
            }}>Login</Link>
            <Link href="/register" style={{
              textDecoration: "none",
              background: "var(--accent)",
              color: "#000",
              padding: "6px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              transition: "opacity 0.2s",
            }}>Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
}