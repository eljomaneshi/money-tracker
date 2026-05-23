import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  Repeat,
  Receipt,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ThemeToggle } from "./theme-toggle";

type LayoutProps = {
  children: ReactNode;
};

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/balance", label: "Balance", icon: Wallet },
  { to: "/subscriptions", label: "Subscriptions", icon: Repeat },
  { to: "/expenses", label: "Expenses", icon: Receipt },
];

export default function Layout({ children }: LayoutProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate("/login");
  };

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold tracking-[0.01em] transition-all duration-200 ${isActive
      ? "bg-emerald-500/90 text-white shadow-[0_10px_30px_rgba(16,185,129,0.18)]"
      : "text-white/75 hover:bg-white/8 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 bg-gradient-to-b from-slate-900 via-[#12213d] to-[#18345f] text-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
          <div className="flex h-screen flex-col px-6 py-8">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Money Tracker logo"
                  className="h-12 w-12 rounded-2xl object-contain"
                />
                <span className="text-xl font-semibold tracking-tight text-white">
                  Money Tracker
                </span>
              </div>

              <div className="mt-10">
                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === "/"}
                        className={linkClasses}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            </div>

            <div className="mt-auto space-y-3 border-t border-white/10 pt-5">
              <div className="flex justify-start">
                <ThemeToggle />
              </div>

              <NavLink to="/settings" className={linkClasses}>
                <SettingsIcon className="h-5 w-5 shrink-0" />
                <span>Settings</span>
              </NavLink>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 lg:hidden">
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Money Tracker logo"
                  className="h-11 w-11 rounded-2xl object-contain"
                />
                <span className="truncate text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                  Money Tracker
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle />

                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  aria-label="Open menu"
                >
                  Menu
                </button>
              </div>
            </div>
          </header>

          {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-gradient-to-b from-slate-900 via-[#12213d] to-[#18345f] px-5 py-6 text-white shadow-2xl dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="/logo.png"
                      alt="Money Tracker logo"
                      className="h-11 w-11 rounded-2xl object-contain"
                    />
                    <span className="text-lg font-semibold tracking-tight text-white">
                      Money Tracker
                    </span>
                  </div>

                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/15"
                    aria-label="Close menu"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-6 flex justify-start">
                  <ThemeToggle />
                </div>

                <div className="mt-8">
                  <nav className="space-y-2">
                    {navItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.to === "/"}
                          className={linkClasses}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </nav>
                </div>

                <div className="mt-auto space-y-3 border-t border-white/10 pt-5">
                  <NavLink
                    to="/settings"
                    className={linkClasses}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <SettingsIcon className="h-5 w-5 shrink-0" />
                    <span>Settings</span>
                  </NavLink>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    <LogOut className="h-5 w-5 shrink-0" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}