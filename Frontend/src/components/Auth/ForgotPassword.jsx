import { useState } from "react";

export default function ForgotPassword({ onBack }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPwd, setShowPwd] = useState(false);

  const sendCode = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({
          type: "success",
          text: "If the email exists, a code was sent.",
        });
        setStep(2);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to send code",
        });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Network error while sending code" });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({
          type: "success",
          text: "Password reset successful. You can now sign in.",
        });
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to reset password",
        });
      }
    } catch (e) {
      setMessage({
        type: "error",
        text: "Network error while resetting password",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Forgot Password</h2>

      {step === 1 && (
        <div className="form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>

          <div className="inline">
            <button
              type="button"
              onClick={sendCode}
              disabled={loading || !email}
            >
              {loading ? "Sending…" : "Send reset code"}
            </button>
            <button type="button" className="secondary" onClick={onBack}>
              Back to Sign In
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form className="form" onSubmit={resetPassword}>
          <label>
            Email
            <input type="email" value={email} readOnly />
          </label>

          <label>
            Code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="6-digit code"
            />
          </label>

          <label>
            New password
            <div className="inline">
              <input
                type={showPwd ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
          </label>

          <div className="inline">
            <button type="submit" disabled={loading}>
              {loading ? "Resetting…" : "Reset password"}
            </button>
            <button type="button" className="secondary" onClick={onBack}>
              Back to Sign In
            </button>
          </div>
        </form>
      )}

      {message && (
        <p className={message.type === "error" ? "error" : "success"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
