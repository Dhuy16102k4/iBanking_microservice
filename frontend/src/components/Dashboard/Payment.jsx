import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./payment.module.css";
import axios from "axios";
import Notification from "./Notification";

/** ===== Idempotency helpers (giữ nguyên) ===== */
function getIdemKey(action, id) {
  const storageKey = `idem:${action}:${id}`;
  let val = localStorage.getItem(storageKey);
  if (!val) {
    const rnd = (() => {
      if (window.crypto?.getRandomValues) {
        const a = new Uint32Array(2);
        window.crypto.getRandomValues(a);
        return `${a[0].toString(16)}${a[1].toString(16)}`;
      }
      return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    })();
    val = `${action}-${id}-${rnd}`;
    localStorage.setItem(storageKey, val);
  }
  return val;
}
function clearIdemKey(action, id) {
  localStorage.removeItem(`idem:${action}:${id}`);
}

const Payment = () => {
  const [studentId, setStudentId] = useState("");
  const [tuitionInfo, setTuitionInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ State theo dòng
  const [active, setActive] = useState(null); // { tuitionId, transactionId, token }
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
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    const now = new Date();
    const deadline = new Date(dateStr);
    return deadline < now;
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
      // Reset context khi tìm mới
      setActive(null);
      setOtpSent(false);
      setOtpCode("");
    } catch (err) {
      showNotification(" " + (err.response?.data?.message || err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  // 🏦 Step 1: Create transaction (per-row)
  const handleCreateTransaction = async (tuitionId) => {
    try {
      const idemKey = getIdemKey("create", tuitionId);
      const { data } = await axios.post(
        "http://localhost:4000/transaction/create",
        { tuitionId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Idempotency-Key": idemKey,
          },
        }
      );

      // 🔒 Chỉ active cho đúng dòng
      setActive({
        tuitionId,
        transactionId: data.transactionId,
        token: data.token,
      });
      setOtpSent(false);
      setOtpCode("");

      showNotification("Transaction initialized successfully", "success");
      clearIdemKey("create", tuitionId);
    } catch (err) {
      showNotification(" " + (err.response?.data?.message || err.message), "error");
    }
  };

  // ✉️ Step 2: Send OTP (only for active row)
  const handleSendOTP = async () => {
    if (!active?.transactionId || !active?.token)
      return showNotification("Please create a transaction first", "warning");
    try {
      const idemKey = getIdemKey("send", active.transactionId);
      const { data } = await axios.post(
        "http://localhost:4000/transaction/send",
        { transactionId: active.transactionId, token: active.token },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Idempotency-Key": idemKey,
          },
        }
      );
      setOtpSent(true);
      showNotification(" " + data.message, "success");
      clearIdemKey("send", active.transactionId);
    } catch (err) {
      showNotification("" + (err.response?.data?.message || err.message), "error");
    }
  };

  //  Step 3: Verify OTP + Payment (only for active row)
  const handleConfirmPayment = async () => {
    if (!active?.transactionId || !active?.token)
      return showNotification("No transaction available for confirmation", "warning");
    try {
      const idemKey = getIdemKey("verify", active.transactionId);
      const { data } = await axios.post(
        "http://localhost:4000/transaction/verify",
        { transactionId: active.transactionId, code: otpCode, token: active.token },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Idempotency-Key": idemKey,
          },
        }
      );

      showNotification(" " + data.message, "success");

      // Clear các key liên quan transaction hiện tại
      clearIdemKey("verify", active.transactionId);
      clearIdemKey("send", active.transactionId);

      // Reset context sau khi thanh toán xong
      setActive(null);
      setOtpSent(false);
      setOtpCode("");

      navigate("/transactions");
    } catch (err) {
      showNotification("" + (err.response?.data?.message || err.message), "error");
    }
  };

  return (
    <div className={styles.paymentContainer}>
      {notification.message && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ message: "", type: "" })}
        />
      )}

      <header className={styles.dd}>
        <h1> Tuition Payment</h1>
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
              {tuitionInfo.tuitions.map((t) => {
                const isActive = active?.tuitionId === t._id; 
                return (
                  <tr key={t._id}>
                    <td>{t.semester}</td>
                    <td>{formatMoney(t.amount)} VND</td>
                    <td style={{ fontWeight: "600" }}>
                      {isOverdue(t.deadline) ? (
                        <span style={{ color: "red" }}> Overdue ({formatDate(t.deadline)})</span>
                      ) : (
                        <span style={{ color: "lightcoral" }}>{formatDate(t.deadline)}</span>
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
                        <span style={{ color: "lightgreen", fontWeight: "600" }}> Paid</span>
                      ) : isOverdue(t.deadline) ? (
                        <span style={{ color: "red", fontWeight: "600" }}> Overdue — cannot pay</span>
                      ) : !isActive ? (
                        // 🔹 Chưa active dòng này → chỉ cho "Create Transaction"
                        <button
                          onClick={() => handleCreateTransaction(t._id)}
                          className={styles.payBtn}
                        >
                          Create Transaction
                        </button>
                      ) : !otpSent ? (
                        // 🔹 Đúng dòng active và chưa gửi OTP
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
                        // 🔹 Đúng dòng active và đã gửi OTP → hiển thị ô nhập OTP
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Payment;
