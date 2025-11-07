import { useEffect, useState } from "react";
import { getApiUrl } from "../../utils/api";

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // 'view', 'edit', 'add'
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    contact_number: "",
    password: "",
    confirm_password: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  const token = localStorage.getItem("token");

  // Fetch all staff members
  const fetchStaff = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetch(getApiUrl("/api/staff"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.message || "Failed to load staff");
      }
      setStaffList(data.staff || []);
      updateStats(data.staff || []);
    } catch (e) {
      setError(e.message || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update stats
  const updateStats = (list) => {
    const totals = {
      total: list.length,
      active: list.filter((s) => s.status === "active").length,
      inactive: list.filter((s) => s.status === "inactive").length,
    };
    setStats(totals);
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...staffList];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Search filter
    const q = search.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (s) =>
          s.first_name?.toLowerCase().includes(q) ||
          s.last_name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.contact_number?.includes(q)
      );
    }

    // Sort by name
    filtered.sort((a, b) => {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    setFilteredStaff(filtered);
  }, [staffList, search, statusFilter]);

  // Open modal for viewing staff details
  const handleViewStaff = (staff) => {
    setSelectedStaff(staff);
    setModalMode("view");
    setShowModal(true);
  };

  // Open modal for editing staff
  const handleEditStaff = (staff) => {
    setSelectedStaff(staff);
    setFormData({
      first_name: staff.first_name || "",
      last_name: staff.last_name || "",
      email: staff.email || "",
      contact_number: staff.contact_number || "",
      password: "",
      confirm_password: "",
    });
    setFormErrors({});
    setModalMode("edit");
    setShowModal(true);
  };

  // Open modal for adding new staff
  const handleAddStaff = () => {
    setSelectedStaff(null);
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      contact_number: "",
      password: "",
      confirm_password: "",
    });
    setFormErrors({});
    setModalMode("add");
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStaff(null);
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      contact_number: "",
      password: "",
      confirm_password: "",
    });
    setFormErrors({});
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.first_name.trim()) {
      errors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      errors.last_name = "Last name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    if (
      formData.contact_number &&
      !/^09\d{9}$/.test(formData.contact_number.replace(/\s+/g, ""))
    ) {
      errors.contact_number = "Use PH mobile format: 09XXXXXXXXX";
    }

    // Password validation (required for adding, optional for editing)
    if (modalMode === "add") {
      if (!formData.password) {
        errors.password = "Password is required";
      } else if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      } else if (
        !/[A-Za-z]/.test(formData.password) ||
        !/\d/.test(formData.password)
      ) {
        errors.password = "Password must include letters and numbers";
      }

      if (!formData.confirm_password) {
        errors.confirm_password = "Please confirm password";
      } else if (formData.password !== formData.confirm_password) {
        errors.confirm_password = "Passwords do not match";
      }
    } else if (modalMode === "edit" && formData.password) {
      // If password is being changed
      if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      } else if (
        !/[A-Za-z]/.test(formData.password) ||
        !/\d/.test(formData.password)
      ) {
        errors.password = "Password must include letters and numbers";
      }

      if (formData.password !== formData.confirm_password) {
        errors.confirm_password = "Passwords do not match";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setBusyId("form");
      setError("");

      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        contact_number: formData.contact_number.trim() || null,
      };

      // Include password if provided
      if (formData.password) {
        payload.password = formData.password;
      }

      let res;
      if (modalMode === "add") {
        res = await fetch(getApiUrl("/api/staff"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === "edit") {
        res = await fetch(getApiUrl(`/api/staff/${selectedStaff.staff_id}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.message || "Operation failed");
      }

      // Refresh the staff list
      await fetchStaff();
      handleCloseModal();
    } catch (e) {
      setError(e.message || "Operation failed");
    } finally {
      setBusyId(null);
    }
  };

  // Toggle staff status (active/inactive)
  const handleToggleStatus = async (staff) => {
    if (!token) return;
    try {
      setBusyId(staff.staff_id);
      setError("");

      const newStatus = staff.status === "active" ? "inactive" : "active";
      const res = await fetch(
        getApiUrl(`/api/staff/${staff.staff_id}/status`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.message || "Failed to update status");
      }

      // Update local state
      setStaffList((prev) =>
        prev.map((s) =>
          s.staff_id === staff.staff_id ? { ...s, status: newStatus } : s
        )
      );
    } catch (e) {
      setError(e.message || "Failed to update status");
    } finally {
      setBusyId(null);
    }
  };

  // Delete staff member
  const handleDeleteStaff = async (staff) => {
    if (!token) return;
    if (
      !confirm(
        `Are you sure you want to delete ${staff.first_name} ${staff.last_name}?`
      )
    ) {
      return;
    }

    try {
      setBusyId(staff.staff_id);
      setError("");

      const res = await fetch(getApiUrl(`/api/staff/${staff.staff_id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.message || "Failed to delete staff");
      }

      // Remove from local state
      setStaffList((prev) => prev.filter((s) => s.staff_id !== staff.staff_id));
    } catch (e) {
      setError(e.message || "Failed to delete staff");
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="auth-card">
      <div className="toolbar">
        <h2>Staff Management</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            placeholder="Search by name, email, or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ maxWidth: 320 }}
          />
          <button onClick={handleAddStaff} style={{ whiteSpace: "nowrap" }}>
            + Add Staff
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="tabs" style={{ marginTop: 8, marginBottom: 8 }}>
        <button
          className={statusFilter === "all" ? "active" : ""}
          onClick={() => setStatusFilter("all")}
        >
          All ({stats.total})
        </button>
        <button
          className={statusFilter === "active" ? "active" : ""}
          onClick={() => setStatusFilter("active")}
        >
          Active ({stats.active})
        </button>
        <button
          className={statusFilter === "inactive" ? "active" : ""}
          onClick={() => setStatusFilter("inactive")}
        >
          Inactive ({stats.inactive})
        </button>
      </div>

      {error && (
        <div className="error" style={{ marginBottom: 8 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 24, textAlign: "center" }}>Loading...</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th align="left">Name</th>
                <th align="left">Email</th>
                <th align="left">Contact Number</th>
                <th align="left">Status</th>
                <th align="left">Date Created</th>
                <th align="left" className="actions">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 12, textAlign: "center" }}>
                    No staff members found
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.staff_id}>
                    <td>
                      {staff.first_name} {staff.last_name}
                    </td>
                    <td>
                      <a href={`mailto:${staff.email}`}>{staff.email}</a>
                    </td>
                    <td>{staff.contact_number || "-"}</td>
                    <td>
                      <span className={`status-badge status-${staff.status}`}>
                        {staff.status}
                      </span>
                    </td>
                    <td>{formatDate(staff.date_created)}</td>
                    <td className="actions">
                      <div className="actions-inline">
                        <button
                          onClick={() => handleViewStaff(staff)}
                          style={{ padding: "6px 10px" }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditStaff(staff)}
                          style={{ padding: "6px 10px" }}
                          disabled={busyId === staff.staff_id}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(staff)}
                          style={{
                            padding: "6px 10px",
                            background:
                              staff.status === "active" ? "#d97706" : "#059669",
                          }}
                          disabled={busyId === staff.staff_id}
                        >
                          {staff.status === "active"
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(staff)}
                          style={{
                            padding: "6px 10px",
                            background: "#dc2626",
                          }}
                          disabled={busyId === staff.staff_id}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={handleCloseModal}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: 8,
              padding: 24,
              maxWidth: 600,
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3>
                {modalMode === "view"
                  ? "Staff Details"
                  : modalMode === "edit"
                  ? "Edit Staff"
                  : "Add New Staff"}
              </h3>
              <button
                onClick={handleCloseModal}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  padding: 0,
                  color: "#666",
                }}
              >
                ×
              </button>
            </div>

            {modalMode === "view" ? (
              // View mode
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <strong>Name:</strong> {selectedStaff?.first_name}{" "}
                  {selectedStaff?.last_name}
                </div>
                <div>
                  <strong>Email:</strong> {selectedStaff?.email}
                </div>
                <div>
                  <strong>Contact Number:</strong>{" "}
                  {selectedStaff?.contact_number || "Not provided"}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`status-badge status-${selectedStaff?.status}`}
                  >
                    {selectedStaff?.status}
                  </span>
                </div>
                <div>
                  <strong>Date Created:</strong>{" "}
                  {formatDate(selectedStaff?.date_created)}
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <button onClick={() => handleEditStaff(selectedStaff)}>
                    Edit Staff
                  </button>
                  <button onClick={handleCloseModal} className="secondary">
                    Close
                  </button>
                </div>
              </div>
            ) : (
              // Edit/Add mode
              <form onSubmit={handleSubmit} className="form">
                <div className="grid">
                  <label>
                    First Name
                    <input
                      name="first_name"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          first_name: e.target.value,
                        }))
                      }
                      disabled={busyId === "form"}
                    />
                    {formErrors.first_name && (
                      <div className="error">{formErrors.first_name}</div>
                    )}
                  </label>
                  <label>
                    Last Name
                    <input
                      name="last_name"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          last_name: e.target.value,
                        }))
                      }
                      disabled={busyId === "form"}
                    />
                    {formErrors.last_name && (
                      <div className="error">{formErrors.last_name}</div>
                    )}
                  </label>
                </div>

                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    disabled={busyId === "form" || modalMode === "edit"}
                    readOnly={modalMode === "edit"}
                  />
                  {formErrors.email && (
                    <div className="error">{formErrors.email}</div>
                  )}
                  {modalMode === "edit" && (
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                      Email cannot be changed
                    </div>
                  )}
                </label>

                <label>
                  Contact Number
                  <input
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contact_number: e.target.value,
                      }))
                    }
                    placeholder="09XXXXXXXXX"
                    disabled={busyId === "form"}
                  />
                  {formErrors.contact_number && (
                    <div className="error">{formErrors.contact_number}</div>
                  )}
                </label>

                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: "1px solid #eee",
                  }}
                >
                  <h4 style={{ marginBottom: 12 }}>
                    {modalMode === "add"
                      ? "Set Password"
                      : "Change Password (Optional)"}
                  </h4>

                  <label>
                    {modalMode === "add" ? "Password" : "New Password"}
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      placeholder="••••••••"
                      disabled={busyId === "form"}
                    />
                    <div style={{ fontSize: 12, color: "#666" }}>
                      Min 8 chars, include letters and numbers
                    </div>
                    {formErrors.password && (
                      <div className="error">{formErrors.password}</div>
                    )}
                  </label>

                  <label>
                    Confirm Password
                    <input
                      type="password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          confirm_password: e.target.value,
                        }))
                      }
                      placeholder="••••••••"
                      disabled={busyId === "form"}
                    />
                    {formErrors.confirm_password && (
                      <div className="error">{formErrors.confirm_password}</div>
                    )}
                  </label>
                </div>

                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <button type="submit" disabled={busyId === "form"}>
                    {busyId === "form"
                      ? "Saving..."
                      : modalMode === "add"
                      ? "Add Staff"
                      : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="secondary"
                    disabled={busyId === "form"}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
