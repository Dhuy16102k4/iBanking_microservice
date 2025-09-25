import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./payment.module.css";

const Payment = () => {
  const [studentId, setStudentId] = useState("");
  const [tuitionInfo, setTuitionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [selectedTuitionId, setSelectedTuitionId] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  const formatMoney = (num) =>
    Number(num).toLocaleString("vi-VN", { minimumFractionDigits: 0 });

  // Tra cứu học phí
  const handleFetchTuition = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const normalizedId = studentId.toUpperCase();
      const res = await fetch(`http://localhost:4005/${normalizedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTuitionInfo(data);
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Gửi OTP
  const handleSendOTP = async (tuitionId) => {
    try {
      if (!tuitionInfo?.student?.email) {
        return alert("❌ Không tìm thấy email của sinh viên");
      }
      const res = await fetch("http://localhost:4006/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: studentId.toUpperCase(),
          email: tuitionInfo.student.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOtpSent(true);
      setSelectedTuitionId(tuitionId);
      alert("✅ OTP đã được gửi đến email: " + tuitionInfo.student.email);
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  // Xác nhận OTP + Thanh toán
  const handleConfirmPayment = async () => {
  try {
    const res = await fetch("http://localhost:4003/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        studentId: studentId.toUpperCase(),
        tuitionId: tuitionInfo.tuitions[0]._id, // 👈 gửi kèm tuitionId
        otp: otpCode,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    alert("🎉 Thanh toán thành công!");
  } catch (err) {
    alert("❌ " + err.message);
  }
};


  return (
    <div className={styles.paymentContainer}>
      <header className={styles.header}>
        <h1>💳 Tuition Payment</h1>
        <button onClick={() => navigate("/dashboard")} className={styles.backBtn}>
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

      {tuitionInfo && tuitionInfo.student && (
        <div className={styles.tuitionBox}>
          <h3>Thông tin sinh viên</h3>
          <p><b>Tên:</b> {tuitionInfo.student.fullName}</p>
          <p><b>Email:</b> {tuitionInfo.student.email}</p>
          <p><b>Phone:</b> {tuitionInfo.student.phone}</p>

          <h3>Học phí</h3>
          {tuitionInfo.tuitions.map((t) => (
            <div key={t._id} className={styles.tuitionItem}>
              <p><b>Semester:</b> {t.semester}</p>
              <p><b>Amount:</b> {formatMoney(t.amount)} VND</p>
              <p><b>Paid:</b> {formatMoney(t.paidAmount)} VND</p>
              <p><b>Remaining:</b> {formatMoney(t.remaining)} VND</p>
              <p><b>Status:</b> {t.status}</p>

              {!otpSent ? (
                <button
                  onClick={() => handleSendOTP(t._id)}
                  className={styles.payBtn}
                >
                  Gửi OTP để thanh toán
                </button>
              ) : (
                selectedTuitionId === t._id && (
                  <div className={styles.formGroup}>
                    <label>Nhập OTP</label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="OTP"
                    />
                    <button
                      onClick={handleConfirmPayment}
                      disabled={!otpCode}
                      className={styles.confirmBtn}
                    >
                      Xác nhận thanh toán
                    </button>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Payment;
