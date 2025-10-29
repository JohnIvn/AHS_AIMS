import { useEffect, useMemo, useState } from "react";
import {
  getAppointments,
  updateStatus,
  getStats,
} from "../../services/appointments";

export default function Appointments() {
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(getStats());
  const [error, setError] = useState("");

  const refresh = () => {
    setItems(getAppointments({ status, search }));
    setStats(getStats());
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search]);

  const onAction = (id, next) => {
    try {
      updateStatus(id, next);
      refresh();
      setError("");
    } catch (e) {
      setError(e.message || "Failed to update");
    }
  };

  const counts = useMemo(
    () => [
      { key: "all", label: "All", value: stats.total },
      { key: "pending", label: "Pending", value: stats.pending },
      { key: "accepted", label: "Accepted", value: stats.accepted },
      { key: "denied", label: "Denied", value: stats.denied },
    ],
    [stats]
  );

  return (
    <div className="auth-card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h2>Appointments</h2>
        <input
          placeholder="Search by name or reason"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
      </div>

      <div className="tabs" style={{ marginTop: 8, flexWrap: "wrap" }}>
        {counts.map((c) => (
          <button
            key={c.key}
            className={status === c.key ? "active" : ""}
            onClick={() => setStatus(c.key)}
          >
            {c.label} ({c.value})
          </button>
        ))}
      </div>

      {error && (
        <div className="error" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}

      <div className="table" style={{ marginTop: 12, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Date</th>
              <th align="left">Time</th>
              <th align="left">Patient</th>
              <th align="left">Reason</th>
              <th align="left">Status</th>
              <th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 12, textAlign: "center" }}>
                  No appointments
                </td>
              </tr>
            ) : (
              items.map((a) => {
                const date = new Date(a.dateTime);
                const dateStr = date.toLocaleDateString();
                const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return (
                  <tr key={a.id} style={{ borderTop: "1px solid #eee" }}>
                    <td>{dateStr}</td>
                    <td>{timeStr}</td>
                    <td>{a.patientName}</td>
                    <td>{a.reason}</td>
                    <td>{a.status}</td>
                    <td style={{ display: "flex", gap: 8 }}>
                      {a.status === "pending" ? (
                        <>
                          <button className="secondary" onClick={() => onAction(a.id, "accepted")}>Accept</button>
                          <button className="secondary" onClick={() => onAction(a.id, "denied")}>Deny</button>
                        </>
                      ) : (
                        <button className="secondary" onClick={() => onAction(a.id, "pending")}>
                          Mark Pending
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
