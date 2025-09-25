import React, { useEffect, useState } from "react";
import styles from "./profile.module.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          console.warn("⚠️ No token found, redirect to login");
          navigate("/login");
          return;
        }

        const res = await axios.get("http://localhost:4000/users/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProfile(res.data);
      } catch (err) {
        console.error("Profile fetch error:", err.response?.data || err.message);
        if (err.response?.status === 401 || err.response?.status === 403) {
          // token hết hạn hoặc không hợp lệ → logout
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          navigate("/login");
        }
      }
    };

    fetchProfile();
  }, [navigate]);

  return (
    <div className={styles.profileContainer}>
      <header className={styles.hh}>
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
              <span>Balance:</span>{" "}
              <span>
                {profile.balance.toLocaleString("vi-VN")} VND
              </span>
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
