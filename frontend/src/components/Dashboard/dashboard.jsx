import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./dashboard.module.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:4000/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch profile");

        setName(data.fullName || data.username);
        localStorage.setItem("fullName", data.fullName);
        localStorage.setItem("username", data.username);
      } catch (err) {
        console.error("Failed to fetch profile:", err.message);
        localStorage.clear();
        navigate("/login");
      }
    };

    fetchProfile();
  }, [navigate]);

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1>Student Dashboard</h1>

        <div className={styles.rightSection}>
          <span className={styles.greeting}>
            Hello, <b>{name}</b>
          </span>

          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className={styles.content}>
        <div className={styles.hero}>
          <h2>Welcome back!</h2>
          <p>Manage your tuition payments and student services easily.</p>
        </div>

        <div className={styles.semesterBox}>
          <h3>Current Semester</h3>
          <p>1st Semester / 2025 - 2026</p>
        </div>

        <div className={styles.cards}>
          <div className={styles.card} onClick={() => navigate("/payment")}>
            <span className={styles.icon}>💳</span>
            <h4>Pay Tuition</h4>
            <p>Quickly settle your tuition fees online.</p>
          </div>

          <div
            className={styles.card}
            onClick={() => navigate("/transactions")}
          >
            <span className={styles.icon}>📄</span>
            <h4>Transactions</h4>
            <p>View your payment history.</p>
          </div>

          <div className={styles.card} onClick={() => navigate("/profile")}>
            <span className={styles.icon}>👤</span>
            <h4>Profile</h4>
            <p>View and manage your personal details.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
