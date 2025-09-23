import axios from "axios";

// Base URL cho Tuition Service
const API = axios.create({
  baseURL: "http://localhost:4005",
});

// 👉 Lấy học phí theo studentId
export const getStudentWithTuition = async (studentId, token) => {
  try {
    const res = await API.get(`/${studentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data; // { student, tuitions }
  } catch (err) {
    console.error("Fetch tuition error:", err.response ? err.response.data : err.message);
    throw err;
  }
};

// 👉 Tạo học phí mới
export const createTuition = async (data, token) => {
  try {
    const res = await API.post("/", data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err) {
    console.error("Create tuition error:", err.response ? err.response.data : err.message);
    throw err;
  }
};

// 👉 Xóa học phí theo id
export const deleteTuition = async (id, token) => {
  try {
    const res = await API.delete(`/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data; // { message: "Tuition deleted" }
  } catch (err) {
    console.error("Delete tuition error:", err.response ? err.response.data : err.message);
    throw err;
  }
};
