import { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

function useApprovedAppointments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/appointments/approved`);
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        const json = await res.json();
        if (!ignore) setItems(json.items || []);
      } catch (e) {
        if (!ignore) setError(e.message || String(e));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  return { items, loading, error, reload: () => {} };
}

function formatSchoolYear(dateStr) {
  try {
    const d = new Date(dateStr);
    const y = d.getUTCFullYear();
    return `${y}-${(y + 1).toString().slice(-2)}`;
  } catch {
    const y = new Date().getFullYear();
    return `${y}-${(y + 1).toString().slice(-2)}`;
  }
}

function PrintableForm({ item, index }) {
  const ref = useRef(null);

  const [form, setForm] = useState(() => ({
    principal: "The Principal / Registrar",
    schoolOffice: "National Capital Region, Division of Caloocan City",
    schoolName: "SCHOOLS DIVISION OFFICE OF CALOOCAN CITY",
    schoolAddress: "#95 Makati St. Amparo Subd. Caloocan City",
    date: new Date().toLocaleDateString(),
    studentName: `${item.first_name || ""} ${item.last_name || ""}`.trim(),
    irn: "",
    schoolYear: formatSchoolYear(item.date_created),
    gradeAndSection: "",
    requestType: "1st Request",
    note: "SFO is not valid without SCHOOL SEAL.",
    adviser: "",
  }));

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const exportPdf = async () => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 64; // margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const x = 32;
    const y = 32;
    pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    pdf.save(`printable_${index + 1}_${item.last_name || ""}.pdf`);
  };

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        marginBottom: 24,
        padding: 12,
        background: "white",
      }}
    >
      <div
        ref={ref}
        style={{
          padding: 12,
          color: "#111827",
          fontFamily: "serif",
          background: "white",
          width: 794,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: "bold" }}>
              Republic of the Philippines
            </div>
            <div>Department of Education</div>
            <div>{form.schoolOffice}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: "bold" }}>{form.schoolName}</div>
            <div>{form.schoolAddress}</div>
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            borderTop: "1px solid #d1d5db",
            paddingTop: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: "bold", marginBottom: 6 }}>
                {form.principal}
              </div>
              <div
                style={{
                  width: 280,
                  height: 1,
                  background: "#9ca3af",
                  marginBottom: 16,
                }}
              ></div>
              <div>Sir / Madam:</div>
              <p style={{ marginTop: 12, lineHeight: 1.6 }}>
                Please furnish us with the Permanent Record (Form 137/SF10)
                along with other pertinent documents (Form 137A/SF10-ES), of the
                following student/s who is/are temporarily enrolled in this
                school upon presentation of their Form 138/SF9.
              </p>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: 12,
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        border: "1px solid #9ca3af",
                        padding: 6,
                        textAlign: "left",
                      }}
                    >
                      Name of Student/s
                    </th>
                    <th
                      style={{
                        border: "1px solid #9ca3af",
                        padding: 6,
                        textAlign: "left",
                      }}
                    >
                      IRN
                    </th>
                    <th
                      style={{
                        border: "1px solid #9ca3af",
                        padding: 6,
                        textAlign: "left",
                      }}
                    >
                      School Year
                    </th>
                    <th
                      style={{
                        border: "1px solid #9ca3af",
                        padding: 6,
                        textAlign: "left",
                      }}
                    >
                      Grade and Section
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #9ca3af", padding: 6 }}>
                      {form.studentName}
                    </td>
                    <td style={{ border: "1px solid #9ca3af", padding: 6 }}>
                      {form.irn}
                    </td>
                    <td style={{ border: "1px solid #9ca3af", padding: 6 }}>
                      {form.schoolYear}
                    </td>
                    <td style={{ border: "1px solid #9ca3af", padding: 6 }}>
                      {form.gradeAndSection}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: 12 }}>
                <label>
                  Request Type:&nbsp;
                  <select
                    name="requestType"
                    value={form.requestType}
                    onChange={onChange}
                  >
                    <option>1st Request</option>
                    <option>2nd Request</option>
                    <option>Urgent</option>
                  </select>
                </label>
              </div>

              <p style={{ marginTop: 12, lineHeight: 1.6 }}>
                Your early attention to the request will be highly appreciated.
                Please entrust to the bearer.
              </p>

              <div style={{ marginTop: 12, color: "#374151", fontSize: 11 }}>
                {form.note}
              </div>

              <div style={{ marginTop: 24 }}>
                <div>Respectfully yours,</div>
                <div
                  style={{
                    marginTop: 24,
                    width: 260,
                    height: 1,
                    background: "#9ca3af",
                  }}
                ></div>
                <div style={{ fontWeight: "bold" }}>
                  {form.adviser || "Adviser/Registrar"}
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div>Date: {form.date}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button onClick={exportPdf}>Export PDF</button>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            name="studentName"
            value={form.studentName}
            onChange={onChange}
            placeholder="Student Name"
          />
          <input
            name="irn"
            value={form.irn}
            onChange={onChange}
            placeholder="IRN"
          />
          <input
            name="schoolYear"
            value={form.schoolYear}
            onChange={onChange}
            placeholder="School Year"
          />
          <input
            name="gradeAndSection"
            value={form.gradeAndSection}
            onChange={onChange}
            placeholder="Grade & Section"
          />
          <input
            name="adviser"
            value={form.adviser}
            onChange={onChange}
            placeholder="Adviser/Registrar"
          />
        </div>
      </div>
    </div>
  );
}

export default function Printables() {
  const { items, loading, error } = useApprovedAppointments();

  return (
    <div>
      <h2>Printables</h2>
      <p style={{ color: "#6b7280" }}>
        Approved appointments formatted for printing and PDF export.
      </p>
      {loading && <div>Loading…</div>}
      {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
      {!loading && !error && items.length === 0 && (
        <div>No approved appointments yet.</div>
      )}
      <div>
        {items.map((item, i) => (
          <PrintableForm key={item.user_id} item={item} index={i} />
        ))}
      </div>
    </div>
  );
}
