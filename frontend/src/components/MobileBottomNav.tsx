import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  WalletCards,
  ChartNoAxesColumn,
  Repeat,
  MoreHorizontal,
  NotebookText,
  Settings,
  Mail,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ThemeToggle } from "./theme-toggle";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const primaryNavItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/balances", label: "Balances", icon: WalletCards },
  { to: "/activity", label: "Activity", icon: ChartNoAxesColumn },
  { to: "/subscriptions", label: "Subscriptions", icon: Repeat },
];

export function MobileBottomNav() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Close sheet on route change
  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  // Handle Escape key to close sheet
  useEffect(() => {
    if (!isMoreOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMoreOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMoreOpen]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isMoreOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMoreOpen]);

  const handleLogout = () => {
    setIsMoreOpen(false);
    logout();
    navigate("/login");
  };

  const isMoreActive =
    location.pathname === "/notes" || location.pathname === "/settings";

  return (
    <>
      {/* Mobile Bottom Dock (visible only on mobile viewports) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#070b14]/90 lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="grid grid-cols-5 items-center px-2 py-1.5">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-2xl py-1 text-[11px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                  isActive
                    ? "font-semibold text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : ""}`} />
                <span className="truncate max-w-[58px] text-center leading-none">
                  {item.label}
                </span>

                {/* Active indicator dot */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  />
                )}
              </NavLink>
            );
          })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            aria-expanded={isMoreOpen}
            aria-controls="mobile-more-sheet"
            aria-label="More navigation options"
            className={`relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-2xl py-1 text-[11px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
              isMoreActive || isMoreOpen
                ? "font-semibold text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <MoreHorizontal
              className={`h-5 w-5 transition-transform ${
                isMoreActive || isMoreOpen ? "scale-110" : ""
              }`}
            />
            <span className="truncate max-w-[58px] text-center leading-none">More</span>

            {isMoreActive && (
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
              />
            )}
          </button>
        </div>
      </nav>

      {/* More Bottom Sheet Modal */}
      {isMoreOpen && (
        <div
          id="mobile-more-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-more-sheet-title"
          className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMoreOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet Panel */}
          <div className="relative z-10 w-full rounded-t-[32px] border-t border-slate-200 bg-white p-6 shadow-2xl transition-transform duration-200 dark:border-white/10 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 max-h-[85vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            {/* Grab Handle */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />

            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
              <div>
                <h3
                  id="mobile-more-sheet-title"
                  className="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
                >
                  Menu & Settings
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Additional tools, workspace settings, and preferences
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-1">
              <NavLink
                to="/notes"
                onClick={() => setIsMoreOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                  }`
                }
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  <NotebookText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div>Notes & Memos</div>
                  <div className="text-xs font-normal text-slate-400">
                    Financial thoughts and planning
                  </div>
                </div>
              </NavLink>

              <NavLink
                to="/settings"
                onClick={() => setIsMoreOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                  }`
                }
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  <Settings className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div>Settings</div>
                  <div className="text-xs font-normal text-slate-400">
                    Preferences, security, and AI insights
                  </div>
                </div>
              </NavLink>

              <a
                href="mailto:founder@moneytracker.online?subject=Money%20Tracker%20Feedback"
                className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5 transition-all duration-150"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div>Feedback & Support</div>
                  <div className="text-xs font-normal text-slate-400">
                    Contact the founder directly
                  </div>
                </div>
              </a>
            </div>

            {/* Bottom Controls */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/[0.03]">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Theme Appearance
                </span>
                <ThemeToggle />
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MobileBottomNav;
