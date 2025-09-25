import React, { useEffect, useState } from "react";
import styles from "./transactions.module.css";
import { useNavigate } from "react-router-dom";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch("http://localhost:4003/transactions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch");
        setTransactions(data);
      } catch (err) {
        alert("❌ " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [token]);

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <header className={styles.header}>
        <h1>📄 Transactions</h1>
        <button onClick={() => navigate("/dashboard")} className={styles.logoutBtn}>
          ⬅ Back
        </button>
      </header>

      {/* Content */}
      <main className={styles.content}>
        {loading ? (
          <p>⏳ Đang tải dữ liệu...</p>
        ) : transactions.length === 0 ? (
          <p>😢 Chưa có giao dịch nào</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Student ID</th>
                <th>Tuition ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id}>
                  <td>{tx._id}</td>
                  <td>{tx.studentId}</td>
                  <td>{tx.tuitionId}</td>
                  <td>{Number(tx.amount).toLocaleString("vi-VN")} VND</td>
                  <td>{tx.status}</td>
                  <td>{new Date(tx.createdAt).toLocaleString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
};

export default Transactions;
