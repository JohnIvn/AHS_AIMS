import { useEffect, useMemo, useState } from "react";

export default function Appointments() {
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    denied: 0,
    today: 0,
  });
  const [error, setError] = useState("");

  // Map Google Sheets response rows to UI items
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
      const firstKey = findKey(row, ["first_name", "firstname", "given_name"]);
      const middleKey = findKey(row, [
        "middle_name",
        "middlename",
        "middle",
        "mi",
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
      const reasonKey = findKey(row, ["reason", "purpose", "concern", "notes"]);
      const statusKey = findKey(row, ["status", "appointment_status"]);
      const dateKey = findKey(row, ["date", "appointment_date", "what_date"]);
      const timeKey = findKey(row, ["time", "appointment_time"]);
      const tsKey = findKey(row, ["timestamp", "created_at", "submitted_at"]);

      let dt = null;
      if (dateKey && timeKey) {
        dt = new Date(`${norm(row[dateKey])} ${norm(row[timeKey])}`);
      } else if (dateKey) {
        dt = new Date(norm(row[dateKey]));
      } else if (tsKey) {
        dt = new Date(norm(row[tsKey]));
      }

      const dateTime =
        dt && !isNaN(dt.getTime())
          ? dt.toISOString()
          : new Date().toISOString();

      let patientName = "Unknown";
      if (firstKey || middleKey || lastKey) {
        const parts = [
          firstKey ? norm(row[firstKey]) : "",
          middleKey ? norm(row[middleKey]) : "",
          lastKey ? norm(row[lastKey]) : "",
        ].filter(Boolean);
        patientName = parts.join(" ").trim() || "Unknown";
      } else if (nameKey) {
        patientName = norm(row[nameKey]) || "Unknown";
      }

      return {
        id: row.id ?? `${patientName || "unknown"}-${dateTime}`,
        patientName,
        email: emailKey ? norm(row[emailKey]) : "",
        dateTime,
        reason: reasonKey ? norm(row[reasonKey]) : "",
        status: statusKey ? norm(row[statusKey]).toLowerCase() : "pending",
        createdAt: tsKey ? new Date(norm(row[tsKey])).toISOString() : dateTime,
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
      if (new Date(a.dateTime).toDateString() === todayStr) totals.today += 1;
    }
    return totals;
  };

  const applyFilters = (source) => {
    const q = search.trim().toLowerCase();
    let result = [...source];
    if (status && status !== "all") {
      result = result.filter((a) => a.status === status);
    }
    if (q) {
      result = result.filter(
        (a) =>
          a.patientName.toLowerCase().includes(q) ||
          a.reason.toLowerCase().includes(q) ||
          (a.email || "").toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    setItems(result);
    setStats(computeStats(source));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        const res = await fetch("/api/google-forms/responses");
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        const rows = json?.data || [];
        const mapped = mapRowsToItems(rows);
        setAllItems(mapped);
        // Apply current filters on fresh data
        const q = search.trim().toLowerCase();
        let filtered = [...mapped];
        if (status && status !== "all")
          filtered = filtered.filter((a) => a.status === status);
        if (q)
          filtered = filtered.filter(
            (a) =>
              a.patientName.toLowerCase().includes(q) ||
              a.reason.toLowerCase().includes(q) ||
              (a.email || "").toLowerCase().includes(q)
          );
        filtered.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        setItems(filtered);
        setStats(computeStats(mapped));
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to load appointments");
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters(allItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search, allItems]);

  const counts = useMemo(
    () => [
      { key: "all", label: "All", value: stats.total },
      { key: "pending", label: "Pending", value: stats.pending },
      { key: "accepted", label: "Accepted", value: stats.accepted },
      { key: "denied", label: "Denied", value: stats.denied },
    ],
    [stats]
  );

  const extractNames = (item) => {
    const norm = (s) => (s || "").toString().trim();
    const row = item.raw || {};
    const keys = Object.keys(row).reduce((acc, k) => {
      acc[k.toLowerCase()] = k;
      return acc;
    }, {});
    const get = (...cands) => {
      for (const c of cands) {
        const k = keys[c.toLowerCase()];
        if (k) return norm(row[k]);
      }
      return "";
    };
    const first = get("first_name", "firstname", "given_name");
    const middle = get("middle_name", "middlename", "middle", "mi");
    const last = get("last_name", "lastname", "family_name");
    if (first || middle || last) {
      return {
        firstName: [first, middle].filter(Boolean).join(" ") || "Unknown",
        lastName: last || "Unknown",
      };
    }
    // Fallback: split patientName into first/middle(last)
    const parts = norm(item.patientName).split(/\s+/).filter(Boolean);
    if (parts.length === 0)
      return { firstName: "Unknown", lastName: "Unknown" };
    if (parts.length === 1) return { firstName: parts[0], lastName: "Unknown" };
    return {
      firstName: parts.slice(0, -1).join(" "),
      lastName: parts.slice(-1)[0],
    };
  };

  const handleDecision = async (item, decision) => {
    try {
      if (!item.email) {
        setError("Email is required to record a decision.");
        return;
      }
      setBusyId(item.id);
      setError("");
      const { firstName, lastName } = extractNames(item);
      const payload = {
        firstName,
        lastName,
        email: item.email,
        contactNumber: "",
        reason: item.reason || "",
        status: decision,
      };
      const res = await fetch("/api/appointments/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to record decision (${res.status})`);
      }
      // Optimistically update local state
      setAllItems((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? { ...p, status: decision, updatedAt: new Date().toISOString() }
            : p
        )
      );
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to record decision");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="auth-card">
      <div className="toolbar">
        <h2>Appointments</h2>
        <input
          placeholder="Search by name, reason, or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={{ maxWidth: 320 }}
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

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th align="left">Date</th>
              <th align="left">Time</th>
              <th align="left">Full Name</th>
              <th align="left">Email</th>
              <th align="left">Reason</th>
              <th align="left">Status</th>
              <th align="left">Actions</th>
              {/* Actions removed in read-only mode */}
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
                const timeStr = date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <tr key={a.id}>
                    <td>{dateStr}</td>
                    <td>{timeStr}</td>
                    <td>{a.patientName}</td>
                    <td>
                      {a.email ? (
                        <a href={`mailto:${a.email}`}>{a.email}</a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="truncate" title={a.reason}>
                      {a.reason}
                    </td>
                    <td>
                      <span className={`status-badge status-${a.status}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                      >
                        <button
                          onClick={() => handleDecision(a, "accepted")}
                          disabled={busyId === a.id || !a.email}
                          style={{ padding: "6px 10px" }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDecision(a, "denied")}
                          disabled={busyId === a.id || !a.email}
                          style={{ padding: "6px 10px", background: "#2a2f45" }}
                        >
                          Deny
                        </button>
                      </div>
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
