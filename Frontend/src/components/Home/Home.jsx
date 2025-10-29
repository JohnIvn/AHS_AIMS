import { useEffect, useState } from "react";
import { getRecent, getStats, updateStatus } from "../../services/appointments";

export default function Home({ user, onSignOut, onNavigate }) {
  const name = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
    : "";
  const [stats, setStats] = useState(getStats());
  const [recent, setRecent] = useState(getRecent({ limit: 5 }));
  const [error, setError] = useState("");

  const refresh = () => {
    setStats(getStats());
    setRecent(getRecent({ limit: 5 }));
  };

  useEffect(() => {
    refresh();
  }, []);

  const onAction = (id, next) => {
    try {
      updateStatus(id, next);
      refresh();
      setError("");
    } catch (e) {
      setError(e.message || "Failed to update");
    }
  };

  return (
    <div className="auth-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <h2>Welcome{name ? `, ${name}` : ""}!</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="secondary"
            onClick={() => onNavigate && onNavigate("appointments")}
          >
            Manage Appointments
          </button>
          <button className="secondary" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginTop: 12,
        }}
      >
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Today" value={stats.today} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Accepted" value={stats.accepted} />
        <StatCard label="Denied" value={stats.denied} />
      </div>

      {error && (
        <div className="error" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}

      <div className="result" style={{ marginTop: 16 }}>
        <h4>Recent Appointments</h4>
        {recent.length === 0 ? (
          <div>No recent items</div>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: 8,
            }}
          >
            {recent.map((a) => {
              const d = new Date(a.dateTime);
              const dateStr = d.toLocaleDateString();
              const timeStr = d.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <li
                  key={a.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{a.patientName}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {dateStr} • {timeStr} • {a.reason}
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <span style={{ fontSize: 12, color: "#555" }}>
                      {a.status}
                    </span>
                    {a.status === "pending" ? (
                      <>
                        <button
                          className="secondary"
                          onClick={() => onAction(a.id, "accepted")}
                        >
                          Accept
                        </button>
                        <button
                          className="secondary"
                          onClick={() => onAction(a.id, "denied")}
                        >
                          Deny
                        </button>
                      </>
                    ) : (
                      <button
                        className="secondary"
                        onClick={() => onAction(a.id, "pending")}
                      >
                        Mark Pending
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
