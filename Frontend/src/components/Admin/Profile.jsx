import { useEffect, useMemo, useState } from "react";
import { getApiUrl } from "../../utils/api";

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
  const [showPw, setShowPw] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [pwErrors, setPwErrors] = useState({});

  // Forgot-password flow (email code)
  const [fgLoading, setFgLoading] = useState(false);
  const [fgError, setFgError] = useState("");
  const [fgSent, setFgSent] = useState(false);
  const [fg, setFg] = useState({ code: "", new_password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [availability, setAvailability] = useState({ phone: null });
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [originalPhone, setOriginalPhone] = useState("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchProfile = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetch(getApiUrl(`/api/profile/me`), {
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
      setOriginalPhone(u.contact_number || "");
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
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validators = {
    first_name: (v) => (v || "").trim().length > 0,
    last_name: (v) => (v || "").trim().length > 0,
    contact_number: (v) => /^09\d{9}$/.test((v || "").replace(/\s+/g, "")),
  };

  const validateAll = () => {
    const next = {};
    if (!validators.first_name(form.first_name))
      next.first_name = "First name is required";
    if (!validators.last_name(form.last_name))
      next.last_name = "Last name is required";
    if (!validators.contact_number(form.contact_number))
      next.contact_number = "Use PH mobile format: 09XXXXXXXXX";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const canSave = useMemo(() => validateAll(), [form]);

  const onSave = async () => {
    if (!token) {
      setError("Not authenticated");
      return;
    }
    if (!validateAll()) return;
    // if number changed, ensure not currently taken
    if (
      form.contact_number !== originalPhone &&
      (availability.phone === false || phoneLoading)
    ) {
      setError("Please resolve contact number availability before saving");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await fetch(getApiUrl(`/api/profile`), {
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
    if (!validatePw()) return;
    try {
      setPwLoading(true);
      setPwError("");
      setPwSaved(false);
      const res = await fetch(getApiUrl(`/api/profile/change-password`), {
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

  const passwordStrength = (value) => {
    let score = 0;
    if (!value) return { label: "", score };
    if (value.length >= 8) score += 1;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    const label =
      score <= 1
        ? "Weak"
        : score === 2
        ? "Fair"
        : score === 3
        ? "Good"
        : "Strong";
    return { label, score };
  };

  const validatePw = () => {
    const next = {};
    if (!pw.current_password)
      next.current_password = "Current password is required";
    if (!pw.new_password) next.new_password = "New password is required";
    if (pw.new_password && pw.new_password.length < 8)
      next.new_password = "At least 8 characters";
    if (
      pw.new_password &&
      !(/[A-Za-z]/.test(pw.new_password) && /\d/.test(pw.new_password))
    )
      next.new_password =
        (next.new_password ? next.new_password + "; " : "") +
        "Include letters and numbers";
    if (!pw.confirm) next.confirm = "Please confirm your new password";
    if (pw.new_password && pw.confirm && pw.new_password !== pw.confirm)
      next.confirm = "Passwords do not match";
    setPwErrors(next);
    if (Object.keys(next).length > 0) setPwError("Please fix the errors below");
    else setPwError("");
    return Object.keys(next).length === 0;
  };

  const { label: strengthLabel, score: strengthScore } = passwordStrength(
    pw.new_password
  );
  const canChangePw = useMemo(
    () =>
      !!pw.current_password &&
      !!pw.new_password &&
      !!pw.confirm &&
      pw.new_password === pw.confirm &&
      pw.new_password.length >= 8 &&
      /[A-Za-z]/.test(pw.new_password) &&
      /\d/.test(pw.new_password) &&
      !pwLoading,
    [pw, pwLoading]
  );

  // Debounced phone availability checker (skip when unchanged)
  useEffect(() => {
    if (!form.contact_number || form.contact_number === originalPhone) {
      setAvailability((a) => ({ ...a, phone: null }));
      return;
    }
    // basic format validation first
    if (!/^09\d{9}$/.test((form.contact_number || "").replace(/\s+/g, ""))) {
      setAvailability((a) => ({ ...a, phone: null }));
      return;
    }
    const t = setTimeout(async () => {
      try {
        setPhoneLoading(true);
        const res = await fetch(getApiUrl(`/api/auth/check-phone-staff`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contact_number: form.contact_number }),
        });
        const data = await res.json();
        setAvailability((a) => ({
          ...a,
          phone: !!(data.success && data.isAvailable),
        }));
        if (!(data.success && data.isAvailable)) {
          setErrors((e) => ({
            ...e,
            contact_number: data.message || "Phone already registered",
          }));
        }
      } catch (e) {
        setAvailability((a) => ({ ...a, phone: null }));
      } finally {
        setPhoneLoading(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [form.contact_number, originalPhone]);

  return (
    <div className="auth-card">
      <h2>Admin Profile</h2>
      {error && (
        <div className="error" style={{ marginBottom: 8 }}>
          {error}
        </div>
      )}
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        <div className="grid">
          <label>
            First Name
            <input
              name="first_name"
              value={form.first_name}
              onChange={onChange}
              disabled={loading}
            />
            {errors.first_name && (
              <div className="error">{errors.first_name}</div>
            )}
          </label>
          <label>
            Last Name
            <input
              name="last_name"
              value={form.last_name}
              onChange={onChange}
              disabled={loading}
            />
            {errors.last_name && (
              <div className="error">{errors.last_name}</div>
            )}
          </label>
        </div>

        <label>
          Email
          <input name="email" type="email" value={form.email} readOnly />
        </label>

        <label>
          Contact Number
          <div className="inline">
            <input
              name="contact_number"
              value={form.contact_number}
              onChange={onChange}
              disabled={loading}
              placeholder="09XXXXXXXXX"
            />
            <span style={{ minWidth: 120, textAlign: "right", fontSize: 12 }}>
              {form.contact_number === originalPhone ? (
                <span className="success">Unchanged ✓</span>
              ) : phoneLoading ? (
                "Checking…"
              ) : availability.phone === true ? (
                <span className="success">Available ✓</span>
              ) : availability.phone === false ? (
                <span className="error">Already registered</span>
              ) : null}
            </span>
          </div>
          {errors.contact_number && (
            <div className="error">{errors.contact_number}</div>
          )}
        </label>

        <button
          type="submit"
          disabled={
            loading || !canSave || phoneLoading || availability.phone === false
          }
        >
          {loading ? "Saving…" : "Save"}
        </button>
        {saved && <span style={{ marginLeft: 8, color: "#2a7" }}>Saved ✓</span>}
      </form>

      <div
        style={{ marginTop: 24, borderTop: "1px solid #eee", paddingTop: 16 }}
      >
        <h3>Change Password</h3>
        {pwError && (
          <div className="error" style={{ marginBottom: 8 }}>
            {pwError}
          </div>
        )}
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            onChangePw();
          }}
          style={{ opacity: pwLoading ? 0.7 : 1 }}
        >
          <label>
            Current Password
            <div className="inline">
              <input
                type={showPw.current ? "text" : "password"}
                name="current_password"
                value={pw.current_password}
                onChange={(e) => {
                  setPw((p) => ({ ...p, current_password: e.target.value }));
                  setPwSaved(false);
                  setPwError("");
                  setPwErrors((er) => ({ ...er, current_password: undefined }));
                }}
                disabled={pwLoading}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setShowPw((s) => ({ ...s, current: !s.current }))
                }
              >
                {showPw.current ? "Hide" : "Show"}
              </button>
            </div>
            {pwErrors.current_password && (
              <div className="error">{pwErrors.current_password}</div>
            )}
          </label>

          <div className="grid">
            <label>
              New Password
              <div className="inline">
                <input
                  type={showPw.next ? "text" : "password"}
                  name="new_password"
                  value={pw.new_password}
                  onChange={(e) => {
                    setPw((p) => ({ ...p, new_password: e.target.value }));
                    setPwSaved(false);
                    setPwError("");
                    setPwErrors((er) => ({ ...er, new_password: undefined }));
                  }}
                  disabled={pwLoading}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowPw((s) => ({ ...s, next: !s.next }))}
                >
                  {showPw.next ? "Hide" : "Show"}
                </button>
              </div>
              <div style={{ fontSize: 12, color: "#666" }}>
                Min 8 chars, include letters and numbers
              </div>
              {strengthLabel && (
                <div
                  style={{
                    fontSize: 12,
                    color:
                      strengthScore >= 3
                        ? "#2a7"
                        : strengthScore === 2
                        ? "#c77d00"
                        : "#b33",
                  }}
                >
                  Strength: {strengthLabel}
                </div>
              )}
              {pwErrors.new_password && (
                <div className="error">{pwErrors.new_password}</div>
              )}
            </label>

            <label>
              Confirm New Password
              <div className="inline">
                <input
                  type={showPw.confirm ? "text" : "password"}
                  name="confirm"
                  value={pw.confirm}
                  onChange={(e) => {
                    setPw((p) => ({ ...p, confirm: e.target.value }));
                    setPwSaved(false);
                    setPwError("");
                    setPwErrors((er) => ({ ...er, confirm: undefined }));
                  }}
                  disabled={pwLoading}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    setShowPw((s) => ({ ...s, confirm: !s.confirm }))
                  }
                >
                  {showPw.confirm ? "Hide" : "Show"}
                </button>
              </div>
              {pwErrors.confirm && (
                <div className="error">{pwErrors.confirm}</div>
              )}
            </label>
          </div>

          <button type="submit" disabled={!canChangePw || pwLoading}>
            {pwLoading ? "Updating…" : "Change Password"}
          </button>
          {pwSaved && (
            <span style={{ marginLeft: 8, color: "#2a7" }}>
              Password changed ✓ (email sent)
            </span>
          )}
        </form>
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
              const res = await fetch(getApiUrl(`/api/auth/forgot-password`), {
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
                onChange={(e) => setFg((s) => ({ ...s, code: e.target.value }))}
                disabled={fgLoading}
                placeholder="6-digit code"
              />
            </label>
            <label>
              <div>New Password</div>
              <div className="inline">
                <input
                  type={showPw.next ? "text" : "password"}
                  name="fg_new_password"
                  value={fg.new_password}
                  onChange={(e) =>
                    setFg((s) => ({ ...s, new_password: e.target.value }))
                  }
                  disabled={fgLoading}
                />
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowPw((s) => ({ ...s, next: !s.next }))}
                >
                  {showPw.next ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            <label>
              <div>Confirm New Password</div>
              <div className="inline">
                <input
                  type={showPw.confirm ? "text" : "password"}
                  name="fg_confirm"
                  value={fg.confirm}
                  onChange={(e) =>
                    setFg((s) => ({ ...s, confirm: e.target.value }))
                  }
                  disabled={fgLoading}
                />
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    setShowPw((s) => ({ ...s, confirm: !s.confirm }))
                  }
                >
                  {showPw.confirm ? "Hide" : "Show"}
                </button>
              </div>
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
                if (
                  !(
                    /[A-Za-z]/.test(fg.new_password) &&
                    /\d/.test(fg.new_password)
                  )
                ) {
                  setFgError("New password must include letters and numbers");
                  return;
                }
                try {
                  setFgLoading(true);
                  setFgError("");
                  const res = await fetch(getApiUrl(`/api/auth/reset-password`), {
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
  );
}
