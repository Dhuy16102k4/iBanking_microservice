import React, { useEffect, useState } from "react";
import styles from "./transactions.module.css";
import { useNavigate } from "react-router-dom";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch("http://localhost:4000/transaction", {
          headers: { Authorization: `Bearer ${token}` },
        });

        let data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to fetch transactions");

        // 🔄 Sort newest first
        data = data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        const enriched = await Promise.all(
          data.map(async (tx) => {
            try {
              const tuitionRes = await fetch(
                `http://localhost:4000/tuition/id/${tx.tuitionId}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const tuition = await tuitionRes.json();
              return {
                ...tx,
                mssv: tuition?.studentId || "N/A",
                amount: tuition?.amount || 0,
                semester: tuition?.semester || "N/A",
              };
            } catch {
              return { ...tx, mssv: "N/A", amount: 0, semester: "N/A" };
            }
          })
        );

        setTransactions(enriched);
      } catch (err) {
        alert("❌ " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [token]);

  // 📌 Pagination logic
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentTransactions = transactions.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <header className={styles.header}>
        <h1>Transactions</h1>
        <button
          onClick={() => navigate("/dashboard")}
          className={styles.logoutBtn}
        >
          ⬅ Back
        </button>
      </header>

      {/* Main Content */}
      <main className={styles.content}>
        {loading ? (
          <p>Loading data...</p>
        ) : transactions.length === 0 ? (
          <p>No transactions found</p>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Student ID</th>
                    <th>Semester</th>
                    <th>Amount (VND)</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransactions.map((tx, index) => (
                    <tr key={tx._id}>
                      <td>{indexOfFirst + index + 1}</td>
                      <td>{tx.mssv}</td>
                      <td>{tx.semester}</td>
                      <td>
                        {tx.amount
                          ? Number(tx.amount).toLocaleString("vi-VN")
                          : "N/A"}
                      </td>
                      <td
                        style={{
                          color:
                            tx.status === "SUCCESS"
                              ? "lightgreen"
                              : tx.status === "FAILED"
                              ? "red"
                              : "orange",
                          fontWeight: "600",
                        }}
                      >
                        {tx.status}
                      </td>
                      <td>{new Date(tx.createdAt).toLocaleString("vi-VN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className={styles.pagination}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ⬅ Prev
              </button>
              <span>
                Page {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next ➡
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Transactions;
