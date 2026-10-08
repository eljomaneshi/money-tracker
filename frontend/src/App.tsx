import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import { Skeleton } from "./components/ui/Skeleton";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const Register = lazy(() => import("./pages/Register"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Balance = lazy(() => import("./pages/Balance"));
const Settings = lazy(() => import("./pages/Settings"));
const Notes = lazy(() => import("./pages/Notes"));

const Landing = lazy(() => import("./pages/Landing"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Security = lazy(() => import("./pages/Security"));

function RouteLoadingFallback() {
  return (
    <div className="w-full space-y-6 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-2xl" />
        <Skeleton className="h-8 w-48 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-3xl" />
    </div>
  );
}

function App() {
  const { token } = useAuth();

  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      {token ? (
        <Routes>
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/security" element={<Security />} />
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
          <Route path="/" element={<Landing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/security" element={<Security />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </Suspense>
  );
}

export default App;