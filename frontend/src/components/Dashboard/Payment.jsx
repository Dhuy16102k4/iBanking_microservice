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
  const [transactionToken, setTransactionToken] = useState(null); // ✅ lưu transaction token
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
    Number(num).toLocaleString("vi-VN", { minimumFractionDigits: 0 });

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    const now = new Date();
    const deadline = new Date(dateStr);
    return deadline < now; // true nếu quá hạn
  };

  // 🔎 Tra cứu học phí
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
      showNotification("✅ Tra cứu học phí thành công", "success");
    } catch (err) {
      showNotification(
        "❌ " + (err.response?.data?.message || err.message),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // 🏦 B1: Tạo transaction
  const handleCreateTransaction = async (tuitionId) => {
    try {
      const { data } = await axios.post(
        "http://localhost:4000/transaction/create",
        { tuitionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactionId(data.transactionId);
      setTransactionToken(data.token); // ✅ lưu transaction token
      showNotification("✅ Giao dịch đã được khởi tạo", "success");
    } catch (err) {
      showNotification(
        "❌ " + (err.response?.data?.message || err.message),
        "error"
      );
    }
  };

  // ✉️ B2: Gửi OTP
  const handleSendOTP = async () => {
    if (!transactionId || !transactionToken)
      return showNotification("⚠️ Bạn cần tạo giao dịch trước", "warning");
    try {
      const { data } = await axios.post(
        "http://localhost:4000/transaction/send",
        { transactionId, token: transactionToken }, // ✅ gửi transaction token
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOtpSent(true);
      showNotification("✅ " + data.message, "success");
    } catch (err) {
      showNotification(
        "❌ " + (err.response?.data?.message || err.message),
        "error"
      );
    }
  };

  // 🔐 B3: Xác thực OTP + Thanh toán
  const handleConfirmPayment = async () => {
    if (!transactionId || !transactionToken)
      return showNotification("⚠️ Chưa có giao dịch để xác thực", "warning");
    try {
      const { data } = await axios.post(
        "http://localhost:4000/transaction/verify",
        { transactionId, code: otpCode, token: transactionToken }, // ✅ thêm token
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showNotification("🎉 " + data.message, "success");
      navigate("/transactions");
    } catch (err) {
      showNotification(
        "❌ " + (err.response?.data?.message || err.message),
        "error"
      );
    }
  };

  return (
    <div className={styles.paymentContainer}>
      {/* ✅ Popup */}
      {notification.message && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ message: "", type: "" })}
        />
      )}

      <header className={styles.dd}>
        <h1>💳 Tuition Payment</h1>
        <button
          onClick={() => navigate("/dashboard")}
          className={styles.backBtn}
        >
          ⬅ Back
        </button>
      </header>

      <div className={styles.formGroup}>
        <label>Student ID (MSSV)</label>
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="Nhập MSSV (vd: 522H0038)"
        />
        <button onClick={handleFetchTuition} disabled={loading}>
          {loading ? "Đang tra cứu..." : "Tra cứu học phí"}
        </button>
      </div>

      {tuitionInfo?.student && (
        <div className={styles.tuitionBox}>
          <h3>Thông tin sinh viên</h3>
          <table className={styles.studentTable}>
            <tbody>
              <tr>
                <th>Tên</th>
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

          <h3>Học phí</h3>
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
                        ⏰ Quá hạn ({formatDate(t.deadline)})
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
                        ✅ Đã thanh toán
                      </span>
                    ) : isOverdue(t.deadline) ? (
                      <span style={{ color: "red", fontWeight: "600" }}>
                        ❌ Quá hạn, không thể thanh toán
                      </span>
                    ) : !transactionId ? (
                      <button
                        onClick={() => handleCreateTransaction(t._id)}
                        className={styles.payBtn}
                      >
                        Tạo giao dịch
                      </button>
                    ) : !otpSent ? (
                      <button onClick={handleSendOTP} className={styles.payBtn}>
                        Gửi OTP
                      </button>
                    ) : (
                      <div className={styles.otpBox}>
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Nhập OTP"
                        />
                        <button
                          onClick={handleConfirmPayment}
                          disabled={!otpCode}
                          className={styles.confirmBtn}
                        >
                          Xác nhận
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
