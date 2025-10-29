import { useState } from "react";

export default function SignIn({ onForgot }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [user, setUser] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        setUser(data.user);
        setMessage({ type: "success", text: "Signed in successfully." });
      } else {
        setMessage({ type: "error", text: data.message || "Sign in failed" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Sign In</h2>

      <form onSubmit={onSubmit} className="form">
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

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div style={{ marginTop: 8 }}>
        <button
          type="button"
          className="link-button"
          onClick={() => onForgot && onForgot()}
        >
          Forgot password?
        </button>
      </div>

      {message && (
        <p className={message.type === "error" ? "error" : "success"}>
          {message.text}
        </p>
      )}

      {user && (
        <div className="result">
          <h4>User</h4>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
