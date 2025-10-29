import { useEffect, useState } from "react";

export default function Home({ user, onSignOut, onNavigate }) {
  const name = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
    : "";
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    denied: 0,
    today: 0,
  });
  const [recent, setRecent] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const mapRowsToItems = (rows = []) => {
      const norm = (s) => (s || "").toString().trim();
      const findKey = (obj, candidates) => {
        const keys = Object.keys(obj);
        const lcMap = keys.reduce((acc, k) => {
          acc[k.toLowerCase()] = k;
          return acc;
        }, {});
        for (const c of candidates) {
          const key = lcMap[c.toLowerCase()];
          if (key) return key;
        }
        return null;
      };

      return rows.map((row) => {
        const firstKey = findKey(row, [
          "first_name",
          "firstname",
          "given_name",
        ]);
        const lastKey = findKey(row, ["last_name", "lastname", "family_name"]);
        const nameKey = findKey(row, [
          "patient_name",
          "name",
          "full_name",
          "patient",
        ]);
        const emailKey = findKey(row, [
          "email",
          "email_address",
          "emailaddress",
          "e-mail",
        ]);
        const reasonKey = findKey(row, [
          "reason",
          "purpose",
          "concern",
          "notes",
        ]);
        const statusKey = findKey(row, ["status", "appointment_status"]);
        const dateKey = findKey(row, ["date", "appointment_date", "what_date"]);
        const timeKey = findKey(row, ["time", "appointment_time"]);
        const tsKey = findKey(row, ["timestamp", "created_at", "submitted_at"]);

        let dt = null;
        if (dateKey && timeKey)
          dt = new Date(`${norm(row[dateKey])} ${norm(row[timeKey])}`);
        else if (dateKey) dt = new Date(norm(row[dateKey]));
        else if (tsKey) dt = new Date(norm(row[tsKey]));

        const dateTime =
          dt && !isNaN(dt.getTime())
            ? dt.toISOString()
            : new Date().toISOString();

        const patientName =
          firstKey || lastKey
            ? `${firstKey ? norm(row[firstKey]) : ""} ${
                lastKey ? norm(row[lastKey]) : ""
              }`.trim() || "Unknown"
            : nameKey
            ? norm(row[nameKey]) || "Unknown"
            : "Unknown";

        return {
          id: row.id ?? `${norm(row[nameKey])}-${dateTime}`,
          patientName,
          email: emailKey ? norm(row[emailKey]) : "",
          dateTime,
          reason: reasonKey ? norm(row[reasonKey]) : "",
          status: statusKey ? norm(row[statusKey]).toLowerCase() : "pending",
          createdAt: tsKey
            ? new Date(norm(row[tsKey])).toISOString()
            : dateTime,
          updatedAt: dateTime,
          raw: row,
        };
      });
    };

    const computeStats = (list) => {
      const todayStr = new Date().toDateString();
      const totals = {
        total: list.length,
        pending: 0,
        accepted: 0,
        denied: 0,
        today: 0,
      };
      for (const a of list) {
        if (a.status === "pending") totals.pending += 1;
        else if (a.status === "accepted") totals.accepted += 1;
        else if (a.status === "denied") totals.denied += 1;
        // Today counts submissions (createdAt), not appointment dates
        if (new Date(a.createdAt).toDateString() === todayStr)
          totals.today += 1;
      }
      return totals;
    };

    const fetchData = async () => {
      try {
        setError("");
        const res = await fetch("/api/google-forms/responses");
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        const rows = json?.data || [];
        let mapped = mapRowsToItems(rows);
        // Merge DB statuses so dashboard reflects accept/deny
        const emails = Array.from(
          new Set(
            mapped.map((m) => (m.email || "").toLowerCase()).filter(Boolean)
          )
        );
        if (emails.length > 0) {
          try {
            const chk = await fetch("/api/appointments/check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ emails }),
            });
            if (chk.ok) {
              const data = await chk.json();
              const statusMap = (data.items || []).reduce((acc, it) => {
                acc[(it.email || "").toLowerCase()] = (
                  it.status || ""
                ).toLowerCase();
                return acc;
              }, {});
              mapped = mapped.map((m) => {
                const dbStatus = statusMap[(m.email || "").toLowerCase()];
                if (dbStatus && ["accepted", "denied"].includes(dbStatus)) {
                  return { ...m, status: dbStatus };
                }
                return m;
              });
            }
          } catch (e) {
            console.warn("Dashboard status merge failed:", e?.message || e);
          }
        }
        // recent by createdAt desc
        const recentItems = [...mapped]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        setRecent(recentItems);

        // appointments scheduled for today (by appointment dateTime)
        const todayStr = new Date().toDateString();
        const todays = mapped
          .filter((a) => new Date(a.dateTime).toDateString() === todayStr)
          .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        setTodayAppointments(todays);
        setStats(computeStats(mapped));
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to load dashboard data");
      }
    };

    fetchData();
  }, []);

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
        <StatCard label="Today (submissions)" value={stats.today} />
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
        <h4>Appointments Today</h4>
        {todayAppointments.length === 0 ? (
          <div>No appointments today</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th align="left">Time</th>
                  <th align="left">Name</th>
                  <th align="left">Reason</th>
                  <th align="left">Status</th>
                </tr>
              </thead>
              <tbody>
                {todayAppointments.map((a) => {
                  const d = new Date(a.dateTime);
                  const timeStr = d.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <tr key={a.id}>
                      <td>{timeStr}</td>
                      <td>{a.patientName}</td>
                      <td className="truncate" title={a.reason}>
                        {a.reason}
                      </td>
                      <td>
                        <span className={`status-badge status-${a.status}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ height: 12 }} />

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
                  <span className={`status-badge status-${a.status}`}>
                    {a.status}
                  </span>
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
