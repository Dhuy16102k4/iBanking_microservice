import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/LoginPage/login";         // đảm bảo file tên Login.jsx
import Dashboard from "./components/Dashboard/dashboard"; // đảm bảo viết hoa
import Profile from "./components/Dashboard/Profile";
import Payment from "./components/Dashboard/Payment";
import Transactions from "./components/Dashboard/Transactions";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang Login */}
        <Route path="/" element={<Login />} />

        {/* Sau khi login */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/transactions" element={<Transactions />} />

        {/* Nếu path không khớp thì quay về login */}
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
