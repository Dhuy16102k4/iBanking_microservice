import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./dashboard.module.css";
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login"); // quay lại login
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      // chưa login → về trang login
      navigate("/login");
      return;
    }

    // gọi API profile
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:4000/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Profile fetch error:", err.response?.data || err.message);
        localStorage.clear();
        navigate("/login");
      }
    };

    fetchProfile();
  }, [navigate]);

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1>🎓 Student Dashboard</h1>

        <div className={styles.userBox}>
          {user && <span>Xin chào, <b>{user.fullName}</b></span>}
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className={styles.content}>
        <h2>Welcome!</h2>
        <p>Current semester</p>
        <p>1st Semester / 2025 - 2026</p>

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
