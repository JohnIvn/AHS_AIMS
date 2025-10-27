import { useState } from "react";

export default function SignUpStaff() {
  const [form, setForm] = useState({
    f_name: "",
    l_name: "",
    contact_number: "",
    email: "",
    password: "",
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

  const pushMsg = (type, text) =>
    setMessages((m) => [{ id: Date.now() + Math.random(), type, text }, ...m]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const checkEmail = async () => {
    setLoading((l) => ({ ...l, email: true }));
    try {
      const res = await fetch("/api/auth/check-email-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (data.success && data.isAvailable) {
        pushMsg("success", "Email is available");
      } else {
        pushMsg("error", data.message || "Email already registered");
      }
    } catch (e) {
      pushMsg("error", "Network error while checking email");
    } finally {
      setLoading((l) => ({ ...l, email: false }));
    }
  };

  const checkPhone = async () => {
    setLoading((l) => ({ ...l, phone: true }));
    try {
      const res = await fetch("/api/auth/check-phone-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_number: form.contact_number }),
      });
      const data = await res.json();
      if (data.success && data.isAvailable) {
        pushMsg("success", "Phone number is available");
      } else {
        pushMsg("error", data.message || "Phone already registered");
      }
    } catch (e) {
      pushMsg("error", "Network error while checking phone");
    } finally {
      setLoading((l) => ({ ...l, phone: false }));
    }
  };

  const sendCode = async () => {
    setLoading((l) => ({ ...l, code: true }));
    try {
      const res = await fetch("/api/auth/send-verification-staff", {
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

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading((l) => ({ ...l, signup: true }));
    setStaff(null);

    try {
      const res = await fetch("/api/auth/signupst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        setStaff(data.staff);
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
          </label>
          <label>
            Last name
            <input
              value={form.l_name}
              onChange={(e) => setField("l_name", e.target.value)}
              required
            />
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
            <button type="button" onClick={checkPhone} disabled={loading.phone}>
              {loading.phone ? "Checking…" : "Check"}
            </button>
          </div>
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
            <button type="button" onClick={checkEmail} disabled={loading.email}>
              {loading.email ? "Checking…" : "Check"}
            </button>
          </div>
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setField("password", e.target.value)}
            required
            placeholder="••••••••"
          />
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
        </label>

        <button type="submit" disabled={loading.signup}>
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
