import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Subscriptions from "./pages/Subscriptions";
import Register from "./pages/Register";
import Expenses from "./pages/Expenses";
import Balance from "./pages/Balance";
import Settings from "./pages/Settings";

function App() {
  const { token } = useAuth();

  return token ? (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/balance" element={<Balance />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  ) : (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;