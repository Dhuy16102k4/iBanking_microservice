import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4002", // Auth Service
});

// 👉 gọi API login
export const login = async (username, password) => {
  try {
    const res = await API.post("/login", { username, password });

    // lưu token vào localStorage
    localStorage.setItem("accessToken", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);

    return res.data;
  } catch (err) {
    console.error("Login error:", err.response ? err.response.data : err.message);
    throw err;
  }
};

// 👉 gọi API refresh token
export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("No refresh token found");

    const res = await API.post("/refresh", { refreshToken });
    localStorage.setItem("accessToken", res.data.accessToken);
    return res.data;
  } catch (err) {
    console.error("Refresh token error:", err.response ? err.response.data : err.message);
    throw err;
  }
};

// 👉 gọi API logout
export const logout = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    await API.post("/logout", { refreshToken });
    localStorage.clear();
  } catch (err) {
    console.error("Logout error:", err.response ? err.response.data : err.message);
  }
};
