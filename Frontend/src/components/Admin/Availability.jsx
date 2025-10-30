import { useEffect, useMemo, useState } from "react";

const LS_KEY = "availabilityBlocks";

function loadBlocks() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { days: [], slots: [] };
    const parsed = JSON.parse(raw);
    return {
      days: Array.isArray(parsed.days) ? parsed.days : [],
      slots: Array.isArray(parsed.slots) ? parsed.slots : [],
    };
  } catch {
    return { days: [], slots: [] };
  }
}
function saveBlocks(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

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
  const [data, setData] = useState(() => loadBlocks());

  const [dayInput, setDayInput] = useState("");
  const [slotDate, setSlotDate] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [slotReason, setSlotReason] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    saveBlocks(data);
  }, [data]);

  const addMessage = (kind, text) => {
    setMessages((prev) => [...prev.slice(-3), { kind, text, ts: Date.now() }]);
    setTimeout(() => setMessages((prev) => prev.slice(1)), 4000);
  };

  const addDay = () => {
    const d = normalizeDate(dayInput);
    if (!d) return addMessage("error", "Please pick a date");
    if (data.days.includes(d))
      return addMessage("error", "Date already blocked");
    setData((prev) => ({ ...prev, days: [...prev.days, d].sort() }));
    setDayInput("");
    addMessage("success", `Blocked ${d}`);
  };

  const removeDay = (d) => {
    setData((prev) => ({ ...prev, days: prev.days.filter((x) => x !== d) }));
  };

  const addSlot = () => {
    const d = normalizeDate(slotDate);
    if (!d) return addMessage("error", "Pick a date for the slot");
    const s = timeToMinutes(slotStart);
    const e = timeToMinutes(slotEnd);
    if (s == null || e == null)
      return addMessage("error", "Start and end time are required");
    if (e <= s) return addMessage("error", "End time must be after start time");

    // detect overlap with existing slots same date
    const overlap = data.slots.some((it) => {
      if (it.date !== d) return false;
      const is = timeToMinutes(it.start);
      const ie = timeToMinutes(it.end);
      return Math.max(is, s) < Math.min(ie, e);
    });
    if (overlap)
      return addMessage("error", "Overlaps an existing slot for that date");

    const next = {
      id: crypto.randomUUID(),
      date: d,
      start: slotStart,
      end: slotEnd,
      reason: slotReason.trim() || undefined,
    };
    setData((prev) => ({
      ...prev,
      slots: [...prev.slots, next].sort((a, b) =>
        (a.date + a.start).localeCompare(b.date + b.start)
      ),
    }));
    setSlotReason("");
    addMessage("success", `Blocked ${d} ${slotStart}-${slotEnd}`);
  };

  const removeSlot = (id) => {
    setData((prev) => ({
      ...prev,
      slots: prev.slots.filter((x) => x.id !== id),
    }));
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

  const clearAll = () => {
    if (!confirm("Remove all blocked days and slots?")) return;
    setData({ days: [], slots: [] });
  };

  return (
    <div className="auth-card">
      <div className="toolbar">
        <div>
          <h2 style={{ margin: 0 }}>Availability</h2>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            Block full dates or specific time slots. Stored locally for now; can
            be wired to backend later.
          </div>
        </div>
        <div className="actions-inline">
          <button className="secondary" onClick={clearAll}>
            Clear All
          </button>
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
                    <tr key={d}>
                      <td>{d}</td>
                      <td className="actions">
                        <div className="actions-inline">
                          <button onClick={() => removeDay(d)}>Remove</button>
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
