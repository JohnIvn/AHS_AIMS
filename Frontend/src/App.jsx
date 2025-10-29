import { useState } from "react";
import "./App.css";
import SignIn from "./components/Auth/SignIn";
import SignUpStaff from "./components/Auth/SignUpStaff";
import ForgotPassword from "./components/Auth/ForgotPassword";

function App() {
  const [tab, setTab] = useState("signin");

  return (
    <div className="container">
      <header>
        <h1>AHS AIMS Auth Demo</h1>
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
      </header>

      <main>
        {tab === "signin" && <SignIn onForgot={() => setTab("forgot")} />}
        {tab === "signup" && <SignUpStaff />}
        {tab === "forgot" && <ForgotPassword onBack={() => setTab("signin")} />}
      </main>
    </div>
  );
}

export default App;
