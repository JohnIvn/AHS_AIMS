import { useMemo, useState, useEffect } from "react";
import { getApiUrl } from "../../utils/api";

export default function SignUpStaff({ onSuccess }) {
  const [form, setForm] = useState({
    f_name: "",
    l_name: "",
    contact_number: "",
    email: "",
    password: "",
    confirmPassword: "",
    verificationCode: "",
  });
  const [loading, setLoading] = useState({
    email: false,
    phone: false,
    code: false,
    signup: false,
  });
  const [messages, setMessages] = useState([]);
  const [staff, setStaff] = useState(null);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [availability, setAvailability] = useState({
    email: null,
    phone: null,
  });

  const pushMsg = (type, text) =>
    setMessages((m) => [{ id: Date.now() + Math.random(), type, text }, ...m]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validators = {
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || ""),
    password: (v) =>
      typeof v === "string" &&
      v.length >= 8 &&
      /[A-Za-z]/.test(v) &&
      /\d/.test(v),
    confirmPassword: (v) => v === form.password,
    contact_number: (v) => /^09\d{9}$/.test((v || "").replace(/\s+/g, "")),
    f_name: (v) => (v || "").trim().length > 0,
    l_name: (v) => (v || "").trim().length > 0,
    verificationCode: (v) => (v || "").trim().length > 0,
  };

  const validateAll = () => {
    const next = {};
    if (!validators.f_name(form.f_name)) next.f_name = "First name is required";
    if (!validators.l_name(form.l_name)) next.l_name = "Last name is required";
    if (!validators.contact_number(form.contact_number))
      next.contact_number = "Use PH mobile format: 09XXXXXXXXX";
    if (!validators.email(form.email)) next.email = "Enter a valid email";
    if (!validators.password(form.password))
      next.password = "Min 8 chars, include letters and numbers";
    if (!validators.confirmPassword(form.confirmPassword))
      next.confirmPassword = "Passwords do not match";
    if (!validators.verificationCode(form.verificationCode))
      next.verificationCode = "Verification code is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const canSubmit = useMemo(() => validateAll(), [form]);

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

  const checkEmail = async () => {
    if (!validators.email(form.email)) {
      setErrors((e) => ({ ...e, email: "Enter a valid email" }));
      setAvailability((a) => ({ ...a, email: null }));
      return;
    }
    setLoading((l) => ({ ...l, email: true }));
    try {
      const res = await fetch(getApiUrl("/api/auth/check-email-staff"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      setAvailability((a) => ({
        ...a,
        email: !!(data.success && data.isAvailable),
      }));
      if (!(data.success && data.isAvailable)) {
        setErrors((e) => ({
          ...e,
          email: data.message || "Email already registered",
        }));
      }
    } catch (e) {
      setAvailability((a) => ({ ...a, email: null }));
      setErrors((er) => ({
        ...er,
        email: "Network error while checking email",
      }));
    } finally {
      setLoading((l) => ({ ...l, email: false }));
    }
  };

  const checkPhone = async () => {
    if (!validators.contact_number(form.contact_number)) {
      setErrors((e) => ({
        ...e,
        contact_number: "Use PH mobile format: 09XXXXXXXXX",
      }));
      setAvailability((a) => ({ ...a, phone: null }));
      return;
    }
    setLoading((l) => ({ ...l, phone: true }));
    try {
      const res = await fetch(getApiUrl("/api/auth/check-phone-staff"), {
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
      setErrors((er) => ({
        ...er,
        contact_number: "Network error while checking phone",
      }));
    } finally {
      setLoading((l) => ({ ...l, phone: false }));
    }
  };

  const sendCode = async () => {
    if (!validators.email(form.email)) {
      setErrors((e) => ({ ...e, email: "Enter a valid email" }));
      return;
    }
    setLoading((l) => ({ ...l, code: true }));
    try {
      const res = await fetch(getApiUrl("/api/auth/send-verification-staff"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (data.success) {
        pushMsg("success", "Verification code sent to your email");
      } else {
        pushMsg("error", data.message || "Failed to send verification code");
      }
    } catch (e) {
      pushMsg("error", "Network error while sending code");
    } finally {
      setLoading((l) => ({ ...l, code: false }));
    }
  };

  // Debounced real-time availability checks
  // Trigger when email/contact_number changes and inputs are valid
  // Email debounce
  useEffect(() => {
    if (!validators.email(form.email)) {
      setAvailability((a) => ({ ...a, email: null }));
      return;
    }
    const t = setTimeout(() => {
      checkEmail();
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.email]);

  // Phone debounce
  useEffect(() => {
    if (!validators.contact_number(form.contact_number)) {
      setAvailability((a) => ({ ...a, phone: null }));
      return;
    }
    const t = setTimeout(() => {
      checkPhone();
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.contact_number]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    // Optional: block on known-taken states
    if (availability.email === false || availability.phone === false) {
      pushMsg("error", "Please resolve availability issues before signing up");
      return;
    }
    setLoading((l) => ({ ...l, signup: true }));
    setStaff(null);

    try {
      const res = await fetch(getApiUrl("/api/auth/signupst"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        if (data.staff) {
          localStorage.setItem(
            "user",
            JSON.stringify({
              email: data.staff.email,
              first_name: data.staff.first_name,
              last_name: data.staff.last_name,
            })
          );
        }
        setStaff(data.staff);
        if (onSuccess) onSuccess(data.staff);
        pushMsg("success", "Account created successfully!");
      } else {
        pushMsg("error", data.message || "Sign up failed");
      }
    } catch (err) {
      pushMsg("error", "Network error. Please try again.");
    } finally {
      setLoading((l) => ({ ...l, signup: false }));
    }
  };

  return (
    <div className="auth-card">
      <h2>Staff Sign Up</h2>
      <form onSubmit={onSubmit} className="form">
        <div className="grid">
          <label>
            First name
            <input
              value={form.f_name}
              onChange={(e) => setField("f_name", e.target.value)}
              required
            />
            {errors.f_name && <div className="error">{errors.f_name}</div>}
          </label>
          <label>
            Last name
            <input
              value={form.l_name}
              onChange={(e) => setField("l_name", e.target.value)}
              required
            />
            {errors.l_name && <div className="error">{errors.l_name}</div>}
          </label>
        </div>

        <label>
          Contact number
          <div className="inline">
            <input
              value={form.contact_number}
              onChange={(e) => setField("contact_number", e.target.value)}
              required
              placeholder="09XXXXXXXXX"
            />
            <span style={{ minWidth: 120, textAlign: "right", fontSize: 12 }}>
              {loading.phone ? (
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

        <label>
          Email
          <div className="inline">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              required
              placeholder="you@example.com"
            />
            <span style={{ minWidth: 120, textAlign: "right", fontSize: 12 }}>
              {loading.email ? (
                "Checking…"
              ) : availability.email === true ? (
                <span className="success">Available ✓</span>
              ) : availability.email === false ? (
                <span className="error">Already registered</span>
              ) : null}
            </span>
          </div>
          {errors.email && <div className="error">{errors.email}</div>}
        </label>

        <label>
          Password
          <div className="inline">
            <input
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              required
              placeholder="••••••••"
            />
            <button
              type="button"
              className="secondary"
              onClick={() => setShowPwd((s) => !s)}
            >
              {showPwd ? "Hide" : "Show"}
            </button>
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>
            Min 8 chars, include letters and numbers
          </div>
          {form.password && (
            <div
              style={{
                fontSize: 12,
                color:
                  passwordStrength(form.password).score >= 3
                    ? "#2a7"
                    : passwordStrength(form.password).score === 2
                    ? "#c77d00"
                    : "#b33",
              }}
            >
              Strength: {passwordStrength(form.password).label}
            </div>
          )}
          {errors.password && <div className="error">{errors.password}</div>}
        </label>

        <label>
          Confirm password
          <div className="inline">
            <input
              type={showConfirmPwd ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => setField("confirmPassword", e.target.value)}
              required
              placeholder="••••••••"
            />
            <button
              type="button"
              className="secondary"
              onClick={() => setShowConfirmPwd((s) => !s)}
            >
              {showConfirmPwd ? "Hide" : "Show"}
            </button>
          </div>
          {errors.confirmPassword && (
            <div className="error">{errors.confirmPassword}</div>
          )}
        </label>

        <label>
          Verification code
          <div className="inline">
            <input
              value={form.verificationCode}
              onChange={(e) => setField("verificationCode", e.target.value)}
              required
              placeholder="Enter the code"
            />
            <button
              type="button"
              onClick={sendCode}
              disabled={loading.code || !form.email}
            >
              {loading.code ? "Sending…" : "Send code"}
            </button>
          </div>
          {errors.verificationCode && (
            <div className="error">{errors.verificationCode}</div>
          )}
        </label>

        <button
          type="submit"
          disabled={
            loading.signup || !canSubmit || loading.email || loading.phone
          }
        >
          {loading.signup ? "Creating account…" : "Sign Up"}
        </button>
      </form>

      {messages.length > 0 && (
        <ul className="messages">
          {messages.map((m) => (
            <li key={m.id} className={m.type === "error" ? "error" : "success"}>
              {m.text}
            </li>
          ))}
        </ul>
      )}

      {staff && (
        <div className="result">
          <h4>Created Staff</h4>
          <pre>{JSON.stringify(staff, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
