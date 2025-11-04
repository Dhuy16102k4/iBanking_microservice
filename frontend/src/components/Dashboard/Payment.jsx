import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./payment.module.css";
import axios from "axios";
import Notification from "./Notification";

const Payment = () => {
  const [studentId, setStudentId] = useState("");
  const [tuitionInfo, setTuitionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [transactionToken, setTransactionToken] = useState(null); // ✅ save transaction token
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [notification, setNotification] = useState({ message: "", type: "" });

  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };

  const formatMoney = (num) =>
    Number(num).toLocaleString("en-US", { minimumFractionDigits: 0 });

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    const now = new Date();
    const deadline = new Date(dateStr);
    return deadline < now; // return true if overdue
  };

  // 🔎 Fetch tuition info
  const handleFetchTuition = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const normalizedId = studentId.toUpperCase();
      const { data } = await axios.get(
        `http://localhost:4000/tuition/student/${normalizedId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTuitionInfo(data);
      showNotification("Tuition information retrieved successfully", "success");
    } catch (err) {
      showNotification(
        "❌ " + (err.response?.data?.message || err.message),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // 🏦 Step 1: Create transaction
  const handleCreateTransaction = async (tuitionId) => {
    try {
      const { data } = await axios.post(
        "http://localhost:4000/transaction/create",
        { tuitionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactionId(data.transactionId);
      setTransactionToken(data.token); // ✅ save transaction token
      showNotification("Transaction initialized successfully", "success");
    } catch (err) {
      showNotification(
        "❌ " + (err.response?.data?.message || err.message),
        "error"
      );
    }
  };

  // ✉️ Step 2: Send OTP
  const handleSendOTP = async () => {
    if (!transactionId || !transactionToken)
      return showNotification("Please create a transaction first", "warning");
    try {
      const { data } = await axios.post(
        "http://localhost:4000/transaction/send",
        { transactionId, token: transactionToken },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOtpSent(true);
      showNotification("✅ " + data.message, "success");
    } catch (err) {
      showNotification("" + (err.response?.data?.message || err.message), "error");
    }
  };

  // 🔐 Step 3: Verify OTP + Payment
  const handleConfirmPayment = async () => {
    if (!transactionId || !transactionToken)
      return showNotification("No transaction available for confirmation", "warning");

    try {
      const { data } = await axios.post(
        "http://localhost:4000/transaction/verify",
        { transactionId, code: otpCode, token: transactionToken },
        {
          headers: {
            Authorization: `Bearer ${token}`,

            "Idempotency-Key": transactionId, // ✅ ensures no duplicate payments
          },
        }
      );

      showNotification("🎉 " + data.message, "success");
      navigate("/transactions");
    } catch (err) {
      showNotification("" + (err.response?.data?.message || err.message), "error");
    }
  };

  return (
    <div className={styles.paymentContainer}>
      {/* ✅ Notification popup */}
      {notification.message && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ message: "", type: "" })}
        />
      )}

      <header className={styles.dd}>
        <h1>💳 Tuition Payment</h1>
        <button onClick={() => navigate("/dashboard")} className={styles.backBtn}>
          ⬅ Back
        </button>
      </header>

      <div className={styles.formGroup}>
        <label>Student ID</label>
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="Enter Student ID (e.g., 522H0038)"
        />
        <button onClick={handleFetchTuition} disabled={loading}>
          {loading ? "Fetching..." : "Search Tuition"}
        </button>
      </div>

      {tuitionInfo?.student && (
        <div className={styles.tuitionBox}>
          <h3>Student Information</h3>
          <table className={styles.studentTable}>
            <tbody>
              <tr>
                <th>Full Name</th>
                <td>{tuitionInfo.student.fullName}</td>
              </tr>
              <tr>
                <th>Email</th>
                <td>{tuitionInfo.student.email}</td>
              </tr>
              <tr>
                <th>Phone</th>
                <td>{tuitionInfo.student.phone}</td>
              </tr>
            </tbody>
          </table>

          <h3>Tuition Details</h3>
          <table className={styles.tuitionTable}>
            <thead>
              <tr>
                <th>Semester</th>
                <th>Amount</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tuitionInfo.tuitions.map((t) => (
                <tr key={t._id}>
                  <td>{t.semester}</td>
                  <td>{formatMoney(t.amount)} VND</td>
                  <td style={{ fontWeight: "600" }}>
                    {isOverdue(t.deadline) ? (
                      <span style={{ color: "red" }}>
                        ⏰ Overdue ({formatDate(t.deadline)})
                      </span>
                    ) : (
                      <span style={{ color: "lightcoral" }}>
                        {formatDate(t.deadline)}
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        color: t.status === "PAID" ? "lightgreen" : "orange",
                        fontWeight: "600",
                      }}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td>
                    {t.status === "PAID" ? (
                      <span style={{ color: "lightgreen", fontWeight: "600" }}>
                        ✅ Paid
                      </span>
                    ) : isOverdue(t.deadline) ? (
                      <span style={{ color: "red", fontWeight: "600" }}>
                        ❌ Overdue — cannot pay
                      </span>
                    ) : !transactionId ? (
                      <button
                        onClick={() => handleCreateTransaction(t._id)}
                        className={styles.payBtn}
                      >
                        Create Transaction
                      </button>
                    ) : !otpSent ? (
                      <button
                        onClick={() => {
                          if (t.status === "OTP_SENT") {
                            showNotification("Transaction already processing, please wait", "warning");
                          } else {
                            handleSendOTP();
                          }
                        }}
                        className={styles.payBtn}
                      >
                        {t.status === "OTP_SENT" ? "Processing..." : "Send OTP"}
                      </button>
                    ) : (
                      <div className={styles.otpBox}>
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter OTP"
                        />
                        <button
                          onClick={handleConfirmPayment}
                          disabled={!otpCode}
                          className={styles.confirmBtn}
                        >
                          Confirm Payment
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Payment;
