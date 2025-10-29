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
      const dateKey = findKey(row, ["date", "appointment_date", "what_date"]);
      const timeKey = findKey(row, ["time", "appointment_time"]);
      const statusKey = findKey(row, ["status", "appointment_status"]);

      let dt = null;
      if (dateKey && timeKey) {
        dt = new Date(`${norm(row[dateKey])} ${norm(row[timeKey])}`);
      } else if (dateKey) {
        dt = new Date(norm(row[dateKey]));
      }
      const dateTime = dt && !isNaN(dt.getTime()) ? dt : null;

      const status = statusKey ? norm(row[statusKey]).toLowerCase() : "pending";
      return { dateTime, status };
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
        const mapped = mapRowsToItems(json?.data || []);
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

  const { totals, daily } = useMemo(() => {
    const totals = { total: 0, pending: 0, accepted: 0, denied: 0, today: 0 };
    const byDay = new Map();
    const todayStr = new Date().toDateString();
    for (const r of rows) {
      totals.total += 1;
      if (r.status === "accepted") totals.accepted += 1;
      else if (r.status === "denied") totals.denied += 1;
      else totals.pending += 1;
      if (r.dateTime && r.dateTime.toDateString() === todayStr)
        totals.today += 1;
      const key = r.dateTime
        ? r.dateTime.toISOString().slice(0, 10)
        : "unknown";
      byDay.set(key, (byDay.get(key) || 0) + 1);
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
    return { totals, daily: last7 };
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
            <StatTile label="Today" value={totals.today} />
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
