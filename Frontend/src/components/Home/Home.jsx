export default function Home({ user, onSignOut }) {
  const name = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
    : "";
  return (
    <div className="auth-card">
      <h2>Welcome{name ? `, ${name}` : ""}!</h2>
      {user && (
        <div className="result">
          <h4>Profile</h4>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <button className="secondary" onClick={onSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
