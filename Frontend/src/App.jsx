import { useEffect, useState } from "react";
import "./App.css";
import SignIn from "./components/Auth/SignIn";
import SignUpStaff from "./components/Auth/SignUpStaff";
import ForgotPassword from "./components/Auth/ForgotPassword";
import Home from "./components/Home/Home";
import Appointments from "./components/Admin/Appointments";
import Profile from "./components/Admin/Profile";

function App() {
  const [tab, setTab] = useState("signin");
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    return token ? { token, user: user ? JSON.parse(user) : null } : null;
  });

  useEffect(() => {
    if (auth?.token) {
      if (tab === "signin" || tab === "signup" || tab === "forgot") {
        setTab("home");
      }
    } else if (["home", "appointments", "profile"].includes(tab)) {
      setTab("signin");
    }
  }, [auth]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth(null);
    setTab("signin");
  };

  const handleUpdateUser = (nextUser) => {
    setAuth((prev) => (prev ? { ...prev, user: nextUser } : prev));
  };

  return (
    <div className="container">
      <header>
        <h1>AHS AIMS</h1>
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
          <div className="tabs" style={{ flexWrap: "wrap" }}>
            <button
              className={tab === "home" ? "active" : ""}
              onClick={() => setTab("home")}
            >
              Dashboard
            </button>
            <button
              className={tab === "appointments" ? "active" : ""}
              onClick={() => setTab("appointments")}
            >
              Appointments
            </button>
            <button
              className={tab === "profile" ? "active" : ""}
              onClick={() => setTab("profile")}
            >
              Profile
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
        {tab === "home" && (
          <Home
            user={auth?.user}
            onSignOut={handleSignOut}
            onNavigate={(t) => setTab(t)}
          />
        )}
        {tab === "appointments" && <Appointments />}
        {tab === "profile" && (
          <Profile user={auth?.user} onUpdateUser={handleUpdateUser} />
        )}
      </main>
    </div>
  );
}

export default App;
