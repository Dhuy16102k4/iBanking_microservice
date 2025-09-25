import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4003", // Transaction Service
});

export const confirmTransaction = (data, token) =>
  API.post("/confirm", data, { headers: { Authorization: `Bearer ${token}` } });
