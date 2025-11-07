import { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { API_BASE, getApiUrl } from "../../utils/api";

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
        if (!ignore)
          setItems(
            (json.items || []).map((it) => ({
              ...it,
              // normalize fallback values to empty strings for easier form binding
              lrn: it.lrn || "",
              grade: it.grade || "",
              section: it.section || "",
            }))
          );
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

async function exportToPdf(element, filename) {
  if (!element) return;
  const canvas = await html2canvas(element, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 64;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const x = 32;
  const y = 32;
  pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
  pdf.save(filename);
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

function PrintableForm({ item, index, onExportComplete }) {
  const ref = useRef(null);

  const [form, setForm] = useState(() => ({
    principal: "The Principal / Registrar",
    schoolOffice: "National Capital Region, Division of Caloocan City",
    schoolName: "SCHOOLS DIVISION OFFICE OF CALOOCAN CITY",
    schoolAddress: "#95 Makati St. Amparo Subd. Caloocan City",
    date: new Date().toLocaleDateString(),
    studentName: `${item.first_name || ""} ${item.last_name || ""}`.trim(),
    irn: item.lrn || "",
    schoolYear: formatSchoolYear(item.date_created),
    gradeAndSection: [item.grade, item.section].filter(Boolean).join(" - "),
    requestType: "1st Request",
    note: "SFO is not valid without SCHOOL SEAL.",
    adviser: "",
  }));

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const exportPdf = async () => {
    await exportToPdf(
      ref.current,
      `printable_${index + 1}_${item.last_name || ""}.pdf`
    );
    if (onExportComplete) onExportComplete();
  };

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        marginBottom: 24,
        padding: 20,
        background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <div
        ref={ref}
        style={{
          padding: 32,
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
            marginBottom: 24,
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
            borderTop: "2px solid #374151",
            paddingTop: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>
              <div
                style={{ fontWeight: "bold", marginBottom: 8, fontSize: 14 }}
              >
                {form.principal}
              </div>
              <div
                style={{
                  width: 280,
                  height: 1,
                  background: "#374151",
                  marginBottom: 20,
                }}
              ></div>
              <div style={{ fontSize: 13 }}>Sir / Madam:</div>
              <p style={{ marginTop: 16, lineHeight: 1.8, fontSize: 13 }}>
                Please furnish us with the Permanent Record (Form 137/SF10)
                along with other pertinent documents (Form 137A/SF10-ES), of the
                following student/s who is/are temporarily enrolled in this
                school upon presentation of their Form 138/SF9.
              </p>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: 16,
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        border: "1px solid #374151",
                        padding: 8,
                        textAlign: "left",
                        background: "#f3f4f6",
                      }}
                    >
                      Name of Student/s
                    </th>
                    <th
                      style={{
                        border: "1px solid #374151",
                        padding: 8,
                        textAlign: "left",
                        background: "#f3f4f6",
                      }}
                    >
                      IRN
                    </th>
                    <th
                      style={{
                        border: "1px solid #374151",
                        padding: 8,
                        textAlign: "left",
                        background: "#f3f4f6",
                      }}
                    >
                      School Year
                    </th>
                    <th
                      style={{
                        border: "1px solid #374151",
                        padding: 8,
                        textAlign: "left",
                        background: "#f3f4f6",
                      }}
                    >
                      Grade and Section
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: "1px solid #374151", padding: 8 }}>
                      {form.studentName}
                    </td>
                    <td style={{ border: "1px solid #374151", padding: 8 }}>
                      {form.irn}
                    </td>
                    <td style={{ border: "1px solid #374151", padding: 8 }}>
                      {form.schoolYear}
                    </td>
                    <td style={{ border: "1px solid #374151", padding: 8 }}>
                      {form.gradeAndSection}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13 }}>
                  Request Type:&nbsp;
                  <select
                    name="requestType"
                    value={form.requestType}
                    onChange={onChange}
                    style={{ fontSize: 13 }}
                  >
                    <option>1st Request</option>
                    <option>2nd Request</option>
                    <option>Urgent</option>
                  </select>
                </label>
              </div>

              <p style={{ marginTop: 16, lineHeight: 1.8, fontSize: 13 }}>
                Your early attention to the request will be highly appreciated.
                Please entrust to the bearer.
              </p>

              <div
                style={{
                  marginTop: 12,
                  color: "#ef4444",
                  fontSize: 11,
                  fontStyle: "italic",
                }}
              >
                {form.note}
              </div>

              <div style={{ marginTop: 32 }}>
                <div style={{ fontSize: 13 }}>Respectfully yours,</div>
                <div
                  style={{
                    marginTop: 32,
                    width: 260,
                    height: 1,
                    background: "#374151",
                  }}
                ></div>
                <div style={{ fontWeight: "bold", fontSize: 13 }}>
                  {form.adviser || "Adviser/Registrar"}
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right", fontSize: 13 }}>
              <div>Date: {form.date}</div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginTop: 20,
          padding: 16,
          background: "#f9fafb",
          borderRadius: 8,
        }}
      >
        <input
          name="studentName"
          value={form.studentName}
          onChange={onChange}
          placeholder="Student Name"
          style={{
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 13,
          }}
        />
        <input
          name="irn"
          value={form.irn}
          onChange={onChange}
          placeholder="IRN"
          style={{
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 13,
          }}
        />
        <input
          name="schoolYear"
          value={form.schoolYear}
          onChange={onChange}
          placeholder="School Year"
          style={{
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 13,
          }}
        />
        <input
          name="gradeAndSection"
          value={form.gradeAndSection}
          onChange={onChange}
          placeholder="Grade & Section"
          style={{
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 13,
          }}
        />
        <input
          name="adviser"
          value={form.adviser}
          onChange={onChange}
          placeholder="Adviser/Registrar"
          style={{
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 13,
          }}
        />
      </div>

      <div
        style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}
      >
        <button
          onClick={exportPdf}
          style={{
            padding: "10px 24px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Export PDF
        </button>
      </div>
    </div>
  );
}

export default function Printables() {
  const { items, loading, error } = useApprovedAppointments();
  const [selected, setSelected] = useState(null);
  const [show, setShow] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [exporting, setExporting] = useState(false);

  const openForm = (item) => {
    setSelected(item);
    setShow(true);
  };

  const closeForm = () => {
    setShow(false);
  };

  const toggleSelect = (userId) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((it) => it.user_id)));
    }
  };

  const exportSelectedPDFs = async () => {
    if (selectedItems.size === 0) return;

    setExporting(true);
    try {
      for (const userId of selectedItems) {
        const item = items.find((it) => it.user_id === userId);
        if (!item) continue;

        // Create a temporary div for rendering
        const tempDiv = document.createElement("div");
        tempDiv.style.position = "absolute";
        tempDiv.style.left = "-9999px";
        document.body.appendChild(tempDiv);

        // Render the form content
        const formContent = createPrintableFormContent(item);
        tempDiv.innerHTML = formContent;

        // Export to PDF
        await exportToPdf(
          tempDiv.firstChild,
          `printable_${item.last_name || item.first_name || userId}.pdf`
        );

        // Clean up
        document.body.removeChild(tempDiv);

        // Small delay between exports
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Clear selection after successful export
      setSelectedItems(new Set());
    } catch (error) {
      console.error("Error exporting PDFs:", error);
      alert("Error exporting PDFs. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const createPrintableFormContent = (item) => {
    const schoolYear = formatSchoolYear(item.date_created);
    const studentName = `${item.first_name || ""} ${
      item.last_name || ""
    }`.trim();
    const gradeAndSection = [item.grade, item.section]
      .filter(Boolean)
      .join(" - ");

    return `
      <div style="padding: 32px; color: #111827; font-family: serif; background: white; width: 794px;">
        <div style="display: flex; justify-content: space-between; fontSize: 12px; margin-bottom: 24px;">
          <div>
            <div style="font-weight: bold;">Republic of the Philippines</div>
            <div>Department of Education</div>
            <div>National Capital Region, Division of Caloocan City</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold;">SCHOOLS DIVISION OFFICE OF CALOOCAN CITY</div>
            <div>#95 Makati St. Amparo Subd. Caloocan City</div>
          </div>
        </div>
        <div style="margin-top: 24px; border-top: 2px solid #374151; padding-top: 16px;">
          <div style="display: flex; justify-content: space-between;">
            <div style="flex: 1;">
              <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">The Principal / Registrar</div>
              <div style="width: 280px; height: 1px; background: #374151; margin-bottom: 20px;"></div>
              <div style="font-size: 13px;">Sir / Madam:</div>
              <p style="margin-top: 16px; line-height: 1.8; font-size: 13px;">
                Please furnish us with the Permanent Record (Form 137/SF10) along with other pertinent documents (Form 137A/SF10-ES), 
                of the following student/s who is/are temporarily enrolled in this school upon presentation of their Form 138/SF9.
              </p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px;">
                <thead>
                  <tr>
                    <th style="border: 1px solid #374151; padding: 8px; text-align: left; background: #f3f4f6;">Name of Student/s</th>
                    <th style="border: 1px solid #374151; padding: 8px; text-align: left; background: #f3f4f6;">IRN</th>
                    <th style="border: 1px solid #374151; padding: 8px; text-align: left; background: #f3f4f6;">School Year</th>
                    <th style="border: 1px solid #374151; padding: 8px; text-align: left; background: #f3f4f6;">Grade and Section</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="border: 1px solid #374151; padding: 8px;">${studentName}</td>
                    <td style="border: 1px solid #374151; padding: 8px;">${
                      item.lrn || ""
                    }</td>
                    <td style="border: 1px solid #374151; padding: 8px;">${schoolYear}</td>
                    <td style="border: 1px solid #374151; padding: 8px;">${gradeAndSection}</td>
                  </tr>
                </tbody>
              </table>
              <div style="margin-top: 16px;">
                <label style="font-size: 13px;">Request Type: 1st Request</label>
              </div>
              <p style="margin-top: 16px; line-height: 1.8; font-size: 13px;">
                Your early attention to the request will be highly appreciated. Please entrust to the bearer.
              </p>
              <div style="margin-top: 12px; color: #ef4444; font-size: 11px; font-style: italic;">
                SFO is not valid without SCHOOL SEAL.
              </div>
              <div style="margin-top: 32px;">
                <div style="font-size: 13px;">Respectfully yours,</div>
                <div style="margin-top: 32px; width: 260px; height: 1px; background: #374151;"></div>
                <div style="font-weight: bold; font-size: 13px;">Adviser/Registrar</div>
              </div>
            </div>
            <div style="text-align: right; font-size: 13px;">
              <div>Date: ${new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  return (
    <div className="auth-card">
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
            Printables
          </h2>
          <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>
            Approved appointments formatted for printing with on-demand PDF
            export.
          </div>
        </div>
        {selectedItems.size > 0 && (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "var(--muted)" }}>
              {selectedItems.size} selected
            </span>
            <button
              onClick={exportSelectedPDFs}
              disabled={exporting}
              style={{
                padding: "8px 20px",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: exporting ? "not-allowed" : "pointer",
                opacity: exporting ? 0.6 : 1,
              }}
            >
              {exporting
                ? "Exporting..."
                : `Export ${selectedItems.size} PDF${
                    selectedItems.size > 1 ? "s" : ""
                  }`}
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div
          style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}
        >
          Loading…
        </div>
      )}

      {error && (
        <div className="messages">
          <li className="error">{error}</li>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div
          style={{
            padding: 48,
            textAlign: "center",
            color: "var(--muted)",
            background: "var(--panel)",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ fontSize: 16, marginBottom: 8 }}>
            No approved appointments yet.
          </div>
          <div style={{ fontSize: 14 }}>
            Approved appointments will appear here for printing.
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div
          className="table-wrapper"
          style={{
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <table className="table" style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <th style={{ width: 48 }}>
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.size === items.length && items.length > 0
                    }
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer", width: 16, height: 16 }}
                  />
                </th>
                <th>Student</th>
                <th>LRN</th>
                <th>Grade</th>
                <th>Section</th>
                <th>Email</th>
                <th>Date</th>
                <th>Reason</th>
                <th className="actions" style={{ width: 120 }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr
                  key={it.user_id}
                  style={{
                    background: selectedItems.has(it.user_id)
                      ? "rgba(59, 130, 246, 0.1)"
                      : "transparent",
                  }}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(it.user_id)}
                      onChange={() => toggleSelect(it.user_id)}
                      style={{ cursor: "pointer", width: 16, height: 16 }}
                    />
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {`${it.first_name || ""} ${it.last_name || ""}`.trim()}
                  </td>
                  <td className="truncate">{it.lrn || "-"}</td>
                  <td className="truncate">{it.grade || "-"}</td>
                  <td className="truncate">{it.section || "-"}</td>
                  <td className="truncate">{it.email}</td>
                  <td>{new Date(it.date_created).toLocaleDateString()}</td>
                  <td className="truncate">{it.reason || "-"}</td>
                  <td className="actions">
                    <div className="actions-inline">
                      <button
                        onClick={() => openForm(it)}
                        style={{
                          padding: "6px 16px",
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        Open Form
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {show && selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
            backdropFilter: "blur(4px)",
          }}
          onClick={closeForm}
        >
          <div
            style={{
              background: "var(--panel)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              maxHeight: "90vh",
              overflow: "auto",
              padding: 24,
              maxWidth: 900,
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
                Printable Form
              </h3>
              <button
                onClick={closeForm}
                style={{
                  padding: "8px 20px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
            <PrintableForm
              item={selected}
              index={items.findIndex((x) => x.user_id === selected.user_id)}
              onExportComplete={closeForm}
            />
          </div>
        </div>
      )}
    </div>
  );
}
