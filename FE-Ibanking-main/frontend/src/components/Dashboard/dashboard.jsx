import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./dashboard.module.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/"); // quay lại login
  };

  // lấy token từ localStorage
  const accessToken = localStorage.getItem("accessToken");

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1>🎓 Student Dashboard</h1>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className={styles.content}>
        <h2>Welcome!</h2>
        <p>Current semester</p>
        <p>1st Semester / 2025 - 2026</p>

        {/* ✅ Show token để check */}
        {accessToken ? (
          <div className={styles.tokenBox}>
            <h3>🔑 Your Access Token:</h3>
            <code>{accessToken}</code>
          </div>
        ) : (
          <p className={styles.error}>⚠️ No token found. Please login again.</p>
        )}

        <div className={styles.actions}>
          <button onClick={() => navigate("/payment")}>💳 Pay Tuition</button>
          <button onClick={() => navigate("/transactions")}>📄 View Transactions</button>
          <button onClick={() => navigate("/profile")}>👤 Profile</button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
