import { useEffect, useState } from "react";
import "./App.css";
import SignIn from "./components/Auth/SignIn";
import SignUpStaff from "./components/Auth/SignUpStaff";
import ForgotPassword from "./components/Auth/ForgotPassword";
import Home from "./components/Home/Home";

function App() {
  const [tab, setTab] = useState("signin");
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    return token ? { token, user: user ? JSON.parse(user) : null } : null;
  });

  useEffect(() => {
    if (auth?.token) {
      setTab("home");
    } else if (tab === "home") {
      setTab("signin");
    }
  }, [auth]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth(null);
    setTab("signin");
  };

  return (
    <div className="container">
      <header>
        <h1>AHS AIMS Auth Demo</h1>
        {!auth?.token ? (
          <nav className="tabs">
            <button
              className={tab === "signin" ? "active" : ""}
              onClick={() => setTab("signin")}
            >
              Sign In
            </button>
            <button
              className={tab === "signup" ? "active" : ""}
              onClick={() => setTab("signup")}
            >
              Staff Sign Up
            </button>
          </nav>
        ) : (
          <div className="tabs">
            <button
              className={tab === "home" ? "active" : ""}
              onClick={() => setTab("home")}
            >
              Home
            </button>
            <button className="secondary" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        )}
      </header>

      <main>
        {tab === "signin" && (
          <SignIn
            onForgot={() => setTab("forgot")}
            onSuccess={(user) =>
              setAuth({ token: localStorage.getItem("token"), user })
            }
          />
        )}
        {tab === "signup" && (
          <SignUpStaff
            onSuccess={(user) =>
              setAuth({ token: localStorage.getItem("token"), user })
            }
          />
        )}
        {tab === "forgot" && <ForgotPassword onBack={() => setTab("signin")} />}
        {tab === "home" && <Home user={auth?.user} onSignOut={handleSignOut} />}
      </main>
    </div>
  );
}

export default App;
