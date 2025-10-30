import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
// Note: FullCalendar v6 packages no longer include CSS files in npm;
// default styles are minimal and components render without importing CSS here.

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export default function Calendar() {
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const fetchEvents = useCallback(async (start, end) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      const res = await fetch(
        `${API_BASE}/appointments/calendar?${params.toString()}`
      );
      if (!res.ok) throw new Error(`Failed to load events: ${res.status}`);
      const json = await res.json();
      // backend returns start/end as ISO already
      setEvents(
        (json.events || []).map((e) => ({
          ...e,
          start: e.start,
          end: e.end,
        }))
      );
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDatesSet = useCallback(
    (arg) => {
      fetchEvents(arg.start, arg.end);
    },
    [fetchEvents]
  );

  const handleEventClick = useCallback((clickInfo) => {
    setSelected({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.start,
      end: clickInfo.event.end,
      ...clickInfo.event.extendedProps,
    });
  }, []);

  const headerToolbar = useMemo(
    () => ({
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    }),
    []
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
      <div>
        {loading && <div style={{ marginBottom: 8 }}>Loading events…</div>}
        {error && (
          <div style={{ color: "#b91c1c", marginBottom: 8 }}>{error}</div>
        )}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          height="auto"
          headerToolbar={headerToolbar}
          events={events}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          weekends={true}
          eventDisplay="block"
        />
      </div>

      <aside style={{ borderLeft: "1px solid #e5e7eb", paddingLeft: 12 }}>
        <h3 style={{ marginTop: 0 }}>Details</h3>
        {!selected ? (
          <p>Select an appointment on the calendar.</p>
        ) : (
          <div style={{ fontSize: 14, lineHeight: 1.5 }}>
            <div>
              <strong>Title:</strong> {selected.title}
            </div>
            <div>
              <strong>Status:</strong> {selected.status}
            </div>
            <div>
              <strong>Email:</strong> {selected.email}
            </div>
            {selected.contactNumber && (
              <div>
                <strong>Contact:</strong> {selected.contactNumber}
              </div>
            )}
            {selected.reason && (
              <div>
                <strong>Reason:</strong> {selected.reason}
              </div>
            )}
            <div style={{ marginTop: 8, color: "#6b7280" }}>
              <div>
                <strong>Date:</strong>{" "}
                {selected.start
                  ? new Date(selected.start).toLocaleString()
                  : "-"}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
