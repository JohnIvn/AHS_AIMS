import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../utils/api";

function normalizeDate(d) {
  if (!d) return "";
  try {
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = `${dt.getMonth() + 1}`.padStart(2, "0");
    const day = `${dt.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return d;
  }
}

function timeToMinutes(t) {
  const [h, m] = (t || "").split(":").map((x) => parseInt(x, 10));
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export default function Availability() {
  const [data, setData] = useState({ days: [], slots: [] });
  const [loading, setLoading] = useState(true);

  const [dayInput, setDayInput] = useState("");
  const [slotDate, setSlotDate] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [slotReason, setSlotReason] = useState("");
  const [messages, setMessages] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [googleSheetId, setGoogleSheetId] = useState(
    localStorage.getItem("googleSheetId") || ""
  );

  // Fetch availability data from backend
  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/availability`);
      if (!res.ok) throw new Error("Failed to fetch availability");
      const json = await res.json();
      setData({
        days: json.days || [],
        slots: json.slots || [],
      });
    } catch (err) {
      addMessage("error", err.message || "Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  const addMessage = (kind, text) => {
    setMessages((prev) => [...prev.slice(-3), { kind, text, ts: Date.now() }]);
    setTimeout(() => setMessages((prev) => prev.slice(1)), 4000);
  };

  const addDay = async () => {
    const d = normalizeDate(dayInput);
    if (!d) return addMessage("error", "Please pick a date");

    try {
      const res = await fetch(`${API_BASE}/availability/dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: d }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to block date");

      setDayInput("");
      addMessage("success", `Blocked ${d}`);
      await fetchAvailability();
    } catch (err) {
      addMessage("error", err.message || "Failed to block date");
    }
  };

  const removeDay = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/availability/dates/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove blocked date");

      addMessage("success", "Blocked date removed");
      await fetchAvailability();
    } catch (err) {
      addMessage("error", err.message || "Failed to remove date");
    }
  };

  const addSlot = async () => {
    const d = normalizeDate(slotDate);
    if (!d) return addMessage("error", "Pick a date for the slot");
    const s = timeToMinutes(slotStart);
    const e = timeToMinutes(slotEnd);
    if (s == null || e == null)
      return addMessage("error", "Start and end time are required");
    if (e <= s) return addMessage("error", "End time must be after start time");

    try {
      const res = await fetch(`${API_BASE}/availability/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: d,
          startTime: slotStart,
          endTime: slotEnd,
          reason: slotReason.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to block slot");

      setSlotReason("");
      addMessage("success", `Blocked ${d} ${slotStart}-${slotEnd}`);
      await fetchAvailability();
    } catch (err) {
      addMessage("error", err.message || "Failed to block time slot");
    }
  };

  const removeSlot = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/availability/slots/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove blocked slot");

      addMessage("success", "Blocked time slot removed");
      await fetchAvailability();
    } catch (err) {
      addMessage("error", err.message || "Failed to remove slot");
    }
  };

  const groupedSlots = useMemo(() => {
    const map = new Map();
    for (const it of data.slots) {
      if (!map.has(it.date)) map.set(it.date, []);
      map.get(it.date).push(it);
    }
    for (const arr of map.values())
      arr.sort((a, b) => a.start.localeCompare(b.start));
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [data.slots]);

  const clearAll = async () => {
    if (!confirm("Remove all blocked days and slots?")) return;

    try {
      const res = await fetch(`${API_BASE}/availability/clear`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to clear all blocks");

      addMessage("success", "All blocks cleared");
      await fetchAvailability();
    } catch (err) {
      addMessage("error", err.message || "Failed to clear blocks");
    }
  };

  const syncToGoogleSheets = async () => {
    if (!googleSheetId.trim()) {
      return addMessage("error", "Please enter a Google Sheet ID");
    }

    try {
      setSyncing(true);
      const res = await fetch(`${API_BASE}/availability/sync-to-sheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId: googleSheetId.trim() }),
      });

      const json = await res.json();
      if (!res.ok)
        throw new Error(json.message || "Failed to sync to Google Sheets");

      localStorage.setItem("googleSheetId", googleSheetId.trim());
      addMessage(
        "success",
        `Synced ${json.blockedDatesCount} dates and ${json.blockedSlotsCount} slots to Google Sheets`
      );
    } catch (err) {
      addMessage("error", err.message || "Failed to sync to Google Sheets");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-card">
        <h2>Availability</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="toolbar">
        <div>
          <h2 style={{ margin: 0 }}>Availability</h2>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            Block full dates or specific time slots to prevent appointments.
          </div>
        </div>
        <div className="actions-inline">
          <button className="secondary" onClick={clearAll}>
            Clear All
          </button>
        </div>
      </div>

      {/* Google Sheets Sync Section */}
      <div
        className="auth-card"
        style={{ padding: 12, marginTop: 12, backgroundColor: "#f8f9fa" }}
      >
        <h3 style={{ marginTop: 0, fontSize: 14 }}>🔄 Sync to Google Forms</h3>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
          Sync blocked dates to Google Sheets so Google Forms can update
          automatically.
        </div>
        <div className="inline">
          <input
            type="text"
            className="input"
            placeholder="Google Sheet ID (e.g., 1abc...xyz)"
            value={googleSheetId}
            onChange={(e) => setGoogleSheetId(e.target.value)}
            style={{ flex: 1, minWidth: 300 }}
          />
          <button onClick={syncToGoogleSheets} disabled={syncing}>
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
          💡 After syncing, Google Apps Script will update your form within 5
          minutes.
        </div>
      </div>

      <div className="grid" style={{ marginTop: 12 }}>
        <div className="auth-card" style={{ padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Block full date</h3>
          <div className="inline">
            <input
              type="date"
              className="input"
              value={dayInput}
              onChange={(e) => setDayInput(e.target.value)}
            />
            <button onClick={addDay}>Add</button>
          </div>

          <div className="table-wrapper" style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="actions">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.days.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ color: "var(--muted)" }}>
                      No blocked dates
                    </td>
                  </tr>
                ) : (
                  data.days.map((d) => (
                    <tr key={d.id}>
                      <td>{d.date}</td>
                      <td className="actions">
                        <div className="actions-inline">
                          <button onClick={() => removeDay(d.id)}>
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="auth-card" style={{ padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Block time slot</h3>
          <div className="inline" style={{ flexWrap: "wrap" }}>
            <input
              type="date"
              className="input"
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
            />
            <input
              type="time"
              className="input"
              value={slotStart}
              onChange={(e) => setSlotStart(e.target.value)}
            />
            <input
              type="time"
              className="input"
              value={slotEnd}
              onChange={(e) => setSlotEnd(e.target.value)}
            />
            <input
              type="text"
              className="input"
              placeholder="Reason (optional)"
              value={slotReason}
              onChange={(e) => setSlotReason(e.target.value)}
            />
            <button onClick={addSlot}>Add Slot</button>
          </div>

          <div className="table-wrapper" style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Reason</th>
                  <th className="actions">Action</th>
                </tr>
              </thead>
              <tbody>
                {groupedSlots.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ color: "var(--muted)" }}>
                      No blocked slots
                    </td>
                  </tr>
                ) : (
                  groupedSlots.flatMap(([d, arr]) =>
                    arr.map((it) => (
                      <tr key={it.id}>
                        <td>{d}</td>
                        <td>{it.start}</td>
                        <td>{it.end}</td>
                        <td className="truncate">{it.reason || "-"}</td>
                        <td className="actions">
                          <div className="actions-inline">
                            <button onClick={() => removeSlot(it.id)}>
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <ul className="messages" style={{ marginTop: 12 }}>
          {messages.map((m) => (
            <li key={m.ts} className={m.kind === "error" ? "error" : "success"}>
              {m.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
