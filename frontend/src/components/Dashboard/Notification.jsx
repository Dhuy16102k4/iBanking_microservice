// src/components/Notification.jsx
import React, { useEffect } from "react";
import styles from "./notification.module.css";

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // 3 giây tự ẩn
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      {message}
    </div>
  );
};

export default Notification;
