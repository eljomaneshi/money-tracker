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
import Notes from "./pages/Notes";

function App() {
  const { token } = useAuth();

  return token ? (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/balance" element={<Balance />} />
        <Route path="/balances" element={<Balance />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/activity" element={<Expenses />} />
        <Route path="/expenses" element={<Navigate to="/activity" replace />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  ) : (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;