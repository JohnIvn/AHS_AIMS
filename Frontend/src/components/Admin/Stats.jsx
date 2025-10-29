import { useEffect, useMemo, useState } from "react";

export default function Stats() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const norm = (s) => (s || "").toString().trim();
  const mapRowsToItems = (rows = []) => {
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
      const firstKey = findKey(row, ["first_name", "firstname", "given_name"]);
      const lastKey = findKey(row, ["last_name", "lastname", "family_name"]);
      const dateKey = findKey(row, ["date", "appointment_date", "what_date"]);
      const timeKey = findKey(row, ["time", "appointment_time"]);
      const statusKey = findKey(row, ["status", "appointment_status"]);
      const emailKey = findKey(row, [
        "email",
        "email_address",
        "emailaddress",
        "e-mail",
      ]);
      const tsKey = findKey(row, ["timestamp", "created_at", "submitted_at"]);

      let dt = null;
      if (dateKey && timeKey) {
        dt = new Date(`${norm(row[dateKey])} ${norm(row[timeKey])}`);
      } else if (dateKey) {
        dt = new Date(norm(row[dateKey]));
      }
      const dateTime = dt && !isNaN(dt.getTime()) ? dt : null;

      const status = statusKey ? norm(row[statusKey]).toLowerCase() : "pending";
      const submittedAt = tsKey ? new Date(norm(row[tsKey])) : null;
      const patientName = `${firstKey ? norm(row[firstKey]) : ""} ${
        lastKey ? norm(row[lastKey]) : ""
      }`.trim();
      return {
        dateTime,
        status,
        submittedAt,
        email: emailKey ? norm(row[emailKey]) : "",
        patientName,
      };
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/google-forms/responses");
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        let mapped = mapRowsToItems(json?.data || []);
        // Merge DB status (accepted/denied) for accuracy
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
            console.warn("Stats status merge failed:", e?.message || e);
          }
        }
        setRows(mapped);
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const { totals, daily, byDateBreakdown, recentSubmissions } = useMemo(() => {
  const totals = { total: 0, pending: 0, accepted: 0, denied: 0, today: 0 };
    const byDay = new Map();
    const breakdown = new Map(); // date -> {total,pending,accepted,denied,earliest,latest}
    const todayStr = new Date().toDateString();
    for (const r of rows) {
      totals.total += 1;
      if (r.status === "accepted") totals.accepted += 1;
      else if (r.status === "denied") totals.denied += 1;
      else totals.pending += 1;
      // Today counts submissions (submittedAt), not appointment dates
      if (r.submittedAt && r.submittedAt.toDateString() === todayStr)
        totals.today += 1;
      const key = r.dateTime
        ? r.dateTime.toISOString().slice(0, 10)
        : "unknown";
      byDay.set(key, (byDay.get(key) || 0) + 1);

      if (!breakdown.has(key))
        breakdown.set(key, {
          total: 0,
          pending: 0,
          accepted: 0,
          denied: 0,
          earliest: null,
          latest: null,
        });
      const bd = breakdown.get(key);
      bd.total += 1;
      if (r.status === "accepted") bd.accepted += 1;
      else if (r.status === "denied") bd.denied += 1;
      else bd.pending += 1;
      if (r.dateTime instanceof Date && !isNaN(r.dateTime)) {
        if (!bd.earliest || r.dateTime < bd.earliest) bd.earliest = r.dateTime;
        if (!bd.latest || r.dateTime > bd.latest) bd.latest = r.dateTime;
      }
    }
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      last7.push({
        key,
        label: d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        count: byDay.get(key) || 0,
      });
    }
    // Build by-date table rows (limit to last 14 entries by date desc)
    const byDateBreakdown = Array.from(breakdown.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 14)
      .map(([dateKey, counts]) => ({ dateKey, ...counts }));

    // Recent submissions by submittedAt (fallback to dateTime)
    const recentSubmissions = [...rows]
      .map((r) => ({
        when: r.submittedAt || r.dateTime || null,
        dateTime: r.dateTime,
        status: r.status,
        email: r.email,
        patientName: r.patientName,
      }))
      .filter((r) => !!r.when)
      .sort((a, b) => b.when - a.when)
      .slice(0, 10);

    return { totals, daily: last7, byDateBreakdown, recentSubmissions };
  }, [rows]);

  const maxDaily = Math.max(1, ...daily.map((d) => d.count));

  return (
    <div className="auth-card">
      <div className="toolbar">
        <h2>Stats</h2>
      </div>

      {error && (
        <div className="error" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 16 }}>Loading…</div>
      ) : (
        <>
          <div className="grid" style={{ marginTop: 8 }}>
            <StatTile label="Total" value={totals.total} />
            <StatTile label="Today (submissions)" value={totals.today} />
            <StatTile label="Pending" value={totals.pending} />
            <StatTile label="Accepted" value={totals.accepted} />
            <StatTile label="Denied" value={totals.denied} />
          </div>

          <div className="auth-card" style={{ marginTop: 12 }}>
            <h3 style={{ marginTop: 0 }}>Last 7 days</h3>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-end",
                height: 160,
              }}
            >
              {daily.map((d) => (
                <div key={d.key} style={{ textAlign: "center", minWidth: 36 }}>
                  <div
                    style={{
                      height: Math.round((d.count / maxDaily) * 110) + 10,
                      background: "#4f6bed",
                      borderRadius: 8,
                      width: 28,
                      margin: "0 auto",
                    }}
                    title={`${d.label}: ${d.count}`}
                  />
                  <div style={{ fontSize: 12, color: "#9aa4bf", marginTop: 6 }}>
                    {d.label}
                  </div>
                  <div style={{ fontSize: 12 }}>{d.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="auth-card" style={{ marginTop: 12 }}>
            <h3 style={{ marginTop: 0 }}>By date (last 14)</h3>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th align="left">Date</th>
                    <th align="left">Time Range</th>
                    <th align="left">Total</th>
                    <th align="left">Pending</th>
                    <th align="left">Accepted</th>
                    <th align="left">Denied</th>
                  </tr>
                </thead>
                <tbody>
                  {byDateBreakdown.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{ padding: 12, textAlign: "center" }}
                      >
                        No data
                      </td>
                    </tr>
                  ) : (
                    byDateBreakdown.map((r) => {
                      const fmt = (d) =>
                        d
                          ? d.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-";
                      const range = r.earliest
                        ? r.latest && r.latest > r.earliest
                          ? `${fmt(r.earliest)} - ${fmt(r.latest)}`
                          : fmt(r.earliest)
                        : "-";
                      return (
                        <tr key={r.dateKey}>
                          <td>{new Date(r.dateKey).toLocaleDateString()}</td>
                          <td>{range}</td>
                          <td>{r.total}</td>
                          <td>{r.pending}</td>
                          <td>{r.accepted}</td>
                          <td>{r.denied}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="auth-card" style={{ marginTop: 12 }}>
            <h3 style={{ marginTop: 0 }}>Recent submissions (timestamp)</h3>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th align="left">Timestamp</th>
                    <th align="left">Appt Date</th>
                    <th align="left">Appt Time</th>
                    <th align="left">Name</th>
                    <th align="left">Email</th>
                    <th align="left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{ padding: 12, textAlign: "center" }}
                      >
                        No recent
                      </td>
                    </tr>
                  ) : (
                    recentSubmissions.map((r, idx) => {
                      const ts = r.when ? new Date(r.when) : null;
                      const appt = r.dateTime ? new Date(r.dateTime) : null;
                      return (
                        <tr key={idx}>
                          <td>{ts ? ts.toLocaleString() : "-"}</td>
                          <td>{appt ? appt.toLocaleDateString() : "-"}</td>
                          <td>
                            {appt
                              ? appt.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </td>
                          <td>{r.patientName || "-"}</td>
                          <td>{r.email || "-"}</td>
                          <td>
                            <span className={`status-badge status-${r.status}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div
      className="auth-card"
      style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6 }}
    >
      <div style={{ color: "#9aa4bf", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
