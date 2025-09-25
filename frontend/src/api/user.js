import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4001", // User Service
});

// 👉 lấy profile user
export const getProfile = async () => {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("⚠️ No token found, please login");

  try {
    const res = await API.get("/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err) {
    console.error("Get profile error:", err.response ? err.response.data : err.message);
    throw err;
  }
};
