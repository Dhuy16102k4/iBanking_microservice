import React, { useState } from "react";
import styles from "./login.module.css";
import img from "../../assets/img.png";
import logo from "../../assets/logo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:4002/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || "❌ Login failed", "error");
      } else {
        // lưu token vào localStorage
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);

        showToast("✅ Login successful!", "success");

        // điều hướng sang dashboard
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
    } catch (err) {
      showToast("❌ Error: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <div className={styles.loginContainer}>
      {/* Toast Popup */}
      {toast && (
        <div
          className={`${styles.toast} ${
            toast.type === "success" ? styles.success : styles.error
          }`}
        >
          <div className={styles.toastContent}>{toast.msg}</div>
          <div className={styles.progress}></div>
        </div>
      )}

      <div className={styles.loginBox}>
        {/* Left Side */}
        <div className={styles.loginLeft}>
          <img src={img} alt="Login illustration" />
          <div className={styles.overlay}></div>
        </div>

        {/* Right Side */}
        <div className={styles.loginRight}>
          <h2>Student Login</h2>
          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <i className="fas fa-envelope"></i>
              <input name="username" placeholder="Student ID" required />
            </div>
            <div className={styles.inputGroup}>
              <i className="fas fa-lock"></i>
              <input
                type={passwordVisible ? "text" : "password"}
                name="password"
                placeholder="Password"
                required
              />
              <span
                className={styles.togglePassword}
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <button type="submit" className={styles.btnLogin} disabled={loading}>
              {loading ? "Logging in..." : "LOGIN"}
            </button>
          </form>

          <div className={styles.logo}>
            <img src={logo} alt="Logo" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
