import { NavLink, useNavigate, Link, Outlet } from "react-router-dom";
import {
  ChartNoAxesColumn,
  LayoutDashboard,
  LogOut,
  Mail,
  NotebookText,
  Repeat,
  Settings,
  WalletCards,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ThemeToggle } from "./theme-toggle";
import { MobileBottomNav } from "./MobileBottomNav";
import { QuickAction } from "./QuickAction";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/balances", label: "Balances", icon: WalletCards },
  { to: "/activity", label: "Activity", icon: ChartNoAxesColumn },
  { to: "/subscriptions", label: "Subscriptions", icon: Repeat },
  { to: "/notes", label: "Notes", icon: NotebookText },
];

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `group relative flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-medium tracking-[0.01em] transition-all duration-150 border ${
      isActive
        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.12)] font-semibold"
        : "text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200"
    }`;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 dark:bg-[#070b14] dark:text-slate-100">
      <div className="flex min-h-screen">
        {/* Desktop Obsidian Sidebar (Sticky) */}
        <aside
          aria-label="Sidebar Navigation"
          className="hidden w-72 shrink-0 border-r border-white/8 bg-[#070b14] text-slate-100 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col"
        >
          <div className="flex h-screen flex-col px-5 py-6">
            {/* Brand Header */}
            <div>
              <Link
                to="/dashboard"
                className="flex items-center gap-3.5 group transition-opacity hover:opacity-95"
              >
                <div className="relative">
                  <img
                    src="/logo.png"
                    alt="Money Tracker logo"
                    className="h-11 w-11 rounded-2xl object-contain ring-1 ring-white/10 shadow-md transition-transform group-hover:scale-105"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#070b14] bg-emerald-500" />
                </div>
                <div>
                  <span className="block text-base font-extrabold tracking-tight text-white leading-tight">
                    Money Tracker
                  </span>
                  <span className="block text-[11px] font-medium text-slate-400 tracking-wider uppercase">
                    Privacy-First FinTech
                  </span>
                </div>
              </Link>

              {/* Quick Action Button */}
              <div className="mt-6">
                <QuickAction variant="sidebar" />
              </div>

              {/* Main Navigation */}
              <div className="mt-6">
                <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Workspace
                </p>
                <nav className="space-y-1.5" aria-label="Main menu">
                  {navItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={linkClasses}
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              className={`h-5 w-5 shrink-0 transition-transform ${
                                isActive ? "scale-105 text-emerald-400" : "text-slate-400 group-hover:text-slate-200"
                              }`}
                            />
                            <span className="flex-1">{item.label}</span>
                            {isActive && (
                              <span
                                aria-hidden="true"
                                className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                              />
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Sidebar Footer Controls */}
            <div className="mt-auto space-y-2 border-t border-white/8 pt-4">
              <NavLink to="/settings" className={linkClasses}>
                {({ isActive }) => (
                  <>
                    <Settings
                      className={`h-5 w-5 shrink-0 transition-transform ${
                        isActive ? "scale-105 text-emerald-400" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    <span className="flex-1">Settings</span>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                      />
                    )}
                  </>
                )}
              </NavLink>

              <a
                href="mailto:founder@moneytracker.online?subject=Money%20Tracker%20Feedback"
                className="group flex items-center gap-3.5 rounded-2xl border border-transparent px-4 py-2.5 text-sm font-medium tracking-[0.01em] text-slate-400 transition-all duration-150 hover:bg-white/5 hover:text-slate-200"
              >
                <Mail className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-slate-200" />
                <span>Feedback & Support</span>
              </a>

              <div className="flex items-center gap-2 pt-2">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:border-rose-500/30 hover:bg-rose-500/15 hover:text-rose-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                  aria-label="Log out of application"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Wrapper */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Sleek Mobile Top Bar */}
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-white/8 dark:bg-[#070b14]/85 lg:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <Link to="/dashboard" className="flex min-w-0 items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="Money Tracker logo"
                  className="h-9 w-9 rounded-xl object-contain ring-1 ring-slate-200 dark:ring-white/10"
                />
                <span className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  Money Tracker
                </span>
              </Link>

              <div className="flex items-center gap-2">
                <QuickAction variant="compact" />
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Main View Container with safe bottom spacing for mobile bottom dock */}
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 pb-28 lg:pb-8">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Dock */}
      <MobileBottomNav />
    </div>
  );
}