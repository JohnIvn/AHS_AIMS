import { useEffect, useState } from "react";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:3000";

export default function Profile({ user, onUpdateUser }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    contact_number: "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pw, setPw] = useState({
    current_password: "",
    new_password: "",
    confirm: "",
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  // Forgot-password flow (email code)
  const [fgLoading, setFgLoading] = useState(false);
  const [fgError, setFgError] = useState("");
  const [fgSent, setFgSent] = useState(false);
  const [fg, setFg] = useState({ code: "", new_password: "", confirm: "" });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchProfile = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data?.success)
        throw new Error(data?.message || "Failed to load profile");
      const u = data.user || {};
      setForm({
        first_name: u.first_name || "",
        last_name: u.last_name || "",
        email: u.email || "",
        contact_number: u.contact_number || "",
      });
    } catch (e) {
      setError(e.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        first_name: user.first_name || prev.first_name,
        last_name: user.last_name || prev.last_name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setSaved(false);
    setError("");
  };

  const onSave = async () => {
    if (!token) {
      setError("Not authenticated");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          contact_number: form.contact_number || null,
        }),
      });
      const data = await res.json();
      if (!data?.success)
        throw new Error(data?.message || "Failed to save profile");
      const next = {
        ...(user || {}),
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        email: data.user.email,
        contact_number: data.user.contact_number,
      };
      localStorage.setItem("user", JSON.stringify(next));
      if (onUpdateUser) onUpdateUser(next);
      setSaved(true);
    } catch (e) {
      setError(e.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const onChangePw = async () => {
    if (!token) {
      setPwError("Not authenticated");
      return;
    }
    if (!pw.current_password || !pw.new_password || !pw.confirm) {
      setPwError("Please fill in all password fields");
      return;
    }
    if (pw.new_password !== pw.confirm) {
      setPwError("New password and confirmation do not match");
      return;
    }
    if (pw.new_password.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }
    try {
      setPwLoading(true);
      setPwError("");
      setPwSaved(false);
      const res = await fetch(`${API_BASE}/profile/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: pw.current_password,
          new_password: pw.new_password,
        }),
      });
      const data = await res.json();
      if (!data?.success)
        throw new Error(data?.message || "Failed to change password");
      setPwSaved(true);
      setPw({ current_password: "", new_password: "", confirm: "" });
    } catch (e) {
      setPwError(e.message || "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Admin Profile</h2>
      {error && (
        <div className="error" style={{ marginBottom: 8 }}>
          {error}
        </div>
      )}
      <div
        className="form-grid"
        style={{ display: "grid", gap: 12, opacity: loading ? 0.7 : 1 }}
      >
        <label>
          <div>First Name</div>
          <input
            name="first_name"
            value={form.first_name}
            onChange={onChange}
            disabled={loading}
          />
        </label>
        <label>
          <div>Last Name</div>
          <input
            name="last_name"
            value={form.last_name}
            onChange={onChange}
            disabled={loading}
          />
        </label>
        <label>
          <div>Email</div>
          <input name="email" type="email" value={form.email} readOnly />
        </label>
        <label>
          <div>Contact Number</div>
          <input
            name="contact_number"
            value={form.contact_number}
            onChange={onChange}
            disabled={loading}
          />
        </label>
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={onSave} disabled={loading}>
          Save
        </button>
        {saved && (
          <span style={{ alignSelf: "center", color: "#2a7" }}>Saved ✓</span>
        )}
      </div>
      {user && (
        <div className="result" style={{ marginTop: 16 }}>
          <h4>Current Profile JSON</h4>
          <pre>{JSON.stringify({ ...(user || {}), ...form }, null, 2)}</pre>
        </div>
      )}

      <div
        style={{ marginTop: 24, borderTop: "1px solid #eee", paddingTop: 16 }}
      >
        <h3>Change Password</h3>
        {pwError && (
          <div className="error" style={{ marginBottom: 8 }}>
            {pwError}
          </div>
        )}
        <div
          className="form-grid"
          style={{ display: "grid", gap: 12, opacity: pwLoading ? 0.7 : 1 }}
        >
          <label>
            <div>Current Password</div>
            <input
              type="password"
              name="current_password"
              value={pw.current_password}
              onChange={(e) => {
                setPw((p) => ({ ...p, current_password: e.target.value }));
                setPwSaved(false);
                setPwError("");
              }}
              disabled={pwLoading}
            />
          </label>
          <label>
            <div>New Password</div>
            <input
              type="password"
              name="new_password"
              value={pw.new_password}
              onChange={(e) => {
                setPw((p) => ({ ...p, new_password: e.target.value }));
                setPwSaved(false);
                setPwError("");
              }}
              disabled={pwLoading}
            />
          </label>
          <label>
            <div>Confirm New Password</div>
            <input
              type="password"
              name="confirm"
              value={pw.confirm}
              onChange={(e) => {
                setPw((p) => ({ ...p, confirm: e.target.value }));
                setPwSaved(false);
                setPwError("");
              }}
              disabled={pwLoading}
            />
          </label>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button onClick={onChangePw} disabled={pwLoading}>
            Change Password
          </button>
          {pwSaved && (
            <span style={{ alignSelf: "center", color: "#2a7" }}>
              Password changed ✓ (email sent)
            </span>
          )}
        </div>

        <div style={{ marginTop: 16, color: "#666", fontSize: 13 }}>
          Forgot your current password? You can reset it by email instead.
        </div>
        <div
          style={{
            marginTop: 8,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="secondary"
            onClick={async () => {
              if (!form.email) return;
              try {
                setFgLoading(true);
                setFgError("");
                setFgSent(false);
                const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: form.email }),
                });
                const data = await res.json();
                if (!data?.success)
                  throw new Error(data?.message || "Failed to send reset code");
                setFgSent(true);
              } catch (e) {
                setFgError(e.message || "Failed to send reset code");
              } finally {
                setFgLoading(false);
              }
            }}
            disabled={fgLoading}
          >
            {fgLoading
              ? "Sending…"
              : `Send code to ${form.email || "your email"}`}
          </button>
          {fgSent && <span style={{ color: "#2a7" }}>Code sent ✓</span>}
        </div>
        {fgError && (
          <div className="error" style={{ marginTop: 8 }}>
            {fgError}
          </div>
        )}

        {fgSent && (
          <div style={{ marginTop: 12 }}>
            <div
              className="form-grid"
              style={{ display: "grid", gap: 12, opacity: fgLoading ? 0.7 : 1 }}
            >
              <label>
                <div>Verification Code</div>
                <input
                  name="code"
                  value={fg.code}
                  onChange={(e) =>
                    setFg((s) => ({ ...s, code: e.target.value }))
                  }
                  disabled={fgLoading}
                  placeholder="6-digit code"
                />
              </label>
              <label>
                <div>New Password</div>
                <input
                  type="password"
                  name="fg_new_password"
                  value={fg.new_password}
                  onChange={(e) =>
                    setFg((s) => ({ ...s, new_password: e.target.value }))
                  }
                  disabled={fgLoading}
                />
              </label>
              <label>
                <div>Confirm New Password</div>
                <input
                  type="password"
                  name="fg_confirm"
                  value={fg.confirm}
                  onChange={(e) =>
                    setFg((s) => ({ ...s, confirm: e.target.value }))
                  }
                  disabled={fgLoading}
                />
              </label>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={async () => {
                  if (!form.email) return;
                  if (!fg.code || !fg.new_password || !fg.confirm) {
                    setFgError("Please fill in code and new password fields");
                    return;
                  }
                  if (fg.new_password !== fg.confirm) {
                    setFgError("New password and confirmation do not match");
                    return;
                  }
                  if (fg.new_password.length < 8) {
                    setFgError("New password must be at least 8 characters");
                    return;
                  }
                  try {
                    setFgLoading(true);
                    setFgError("");
                    const res = await fetch(`${API_BASE}/auth/reset-password`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: form.email,
                        code: fg.code,
                        newPassword: fg.new_password,
                      }),
                    });
                    const data = await res.json();
                    if (!data?.success)
                      throw new Error(
                        data?.message || "Failed to reset password"
                      );
                    setFg({ code: "", new_password: "", confirm: "" });
                    setFgSent(false);
                    alert(
                      "Password reset successful. You can now sign in with the new password."
                    );
                  } catch (e) {
                    setFgError(e.message || "Failed to reset password");
                  } finally {
                    setFgLoading(false);
                  }
                }}
                disabled={fgLoading}
              >
                Reset Password
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
