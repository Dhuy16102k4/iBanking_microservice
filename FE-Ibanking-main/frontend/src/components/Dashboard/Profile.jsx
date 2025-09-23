import React, { useEffect, useState } from "react";
import styles from "./profile.module.css";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch("http://localhost:4001/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch profile");
        setProfile(data);
      } catch (err) {
        console.error("Profile fetch error:", err.message);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className={styles.profileContainer}>
      <header className={styles.header}>
        <h1>👤 Profile</h1>
        <button className={styles.backBtn} onClick={() => navigate("/dashboard")}>
          ⬅ Back
        </button>
      </header>

      <main className={styles.content}>
        {profile ? (
          <div className={styles.profileCard}>
            <h2>Student Information</h2>
            <div className={styles.infoRow}>
              <span>Username:</span> <span>{profile.username}</span>
            </div>
            <div className={styles.infoRow}>
              <span>Full Name:</span> <span>{profile.fullName}</span>
            </div>
            <div className={styles.infoRow}>
              <span>Email:</span> <span>{profile.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span>Phone:</span> <span>{profile.phone}</span>
            </div>
            <div className={styles.infoRow}>
              <span>Balance:</span> <span>{profile.balance.toLocaleString("vi-VN")} VND</span>
            </div>
          </div>
        ) : (
          <p>Loading profile...</p>
        )}
      </main>
    </div>
  );
};

export default Profile;
