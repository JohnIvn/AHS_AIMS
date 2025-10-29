import { useEffect, useState } from "react";

export default function Profile({ user, onUpdateUser }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setSaved(false);
  };

  const onSave = () => {
    const next = { ...(user || {}), ...form };
    localStorage.setItem("user", JSON.stringify(next));
    if (onUpdateUser) onUpdateUser(next);
    setSaved(true);
  };

  return (
    <div className="auth-card">
      <h2>Admin Profile</h2>
      <div className="form-grid" style={{ display: "grid", gap: 12 }}>
        <label>
          <div>First Name</div>
          <input name="first_name" value={form.first_name} onChange={onChange} />
        </label>
        <label>
          <div>Last Name</div>
          <input name="last_name" value={form.last_name} onChange={onChange} />
        </label>
        <label>
          <div>Email</div>
          <input name="email" type="email" value={form.email} onChange={onChange} />
        </label>
        <label>
          <div>Phone</div>
          <input name="phone" value={form.phone} onChange={onChange} />
        </label>
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={onSave}>Save</button>
        {saved && <span style={{ alignSelf: "center", color: "#2a7" }}>Saved ✓</span>}
      </div>
      {user && (
        <div className="result" style={{ marginTop: 16 }}>
          <h4>Current Profile JSON</h4>
          <pre>{JSON.stringify({ ...(user || {}), ...form }, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
