import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sun, Moon, Settings as SettingsIcon, Archive as ArchiveIcon, Mail } from "lucide-react";
import { useTheme } from "../store/theme";
import useAuth from "../store/auth";
import useInvites from "../store/invites";

export default function Header() {
  const { theme, toggle } = useTheme();
  const { currentUser, logout } = useAuth();
  const { myInvites, fetchMyInvites } = useInvites();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser) {
      fetchMyInvites();
    }
  }, [currentUser, fetchMyInvites]);

  return (
    <header className="nav-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Link
        to={currentUser ? "/app" : "/"}
        className="flex w-full items-center justify-center gap-3 sm:w-auto sm:justify-start"
      >
        <span className="auth-icon text-xl">🛒</span>
        <div className="leading-tight">
          <p className="text-sm font-medium text-muted">FamilyCart</p>
          <p className="text-lg font-semibold">Shopping Planner</p>
        </div>
      </Link>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
        {currentUser && (
          <>
            <Link
              to="/invites"
              className="btn-secondary flex items-center gap-2 text-sm shrink-0"
            >
              <Mail size={16} />
              Invites
              {myInvites.length > 0 && (
                <span className="rounded-full bg-[#635bff] px-2 py-0.5 text-xs font-semibold text-white">
                  {myInvites.length}
                </span>
              )}
            </Link>
            <Link
              to="/settings"
              className="btn-secondary flex items-center gap-2 text-sm shrink-0"
            >
              <SettingsIcon size={16} />
              Settings
            </Link>
            <Link
              to="/archive"
              className="btn-secondary flex items-center gap-2 text-sm shrink-0"
            >
              <ArchiveIcon size={16} />
              Archive
            </Link>
          </>
        )}

        <button
          onClick={toggle}
          className="btn-secondary px-3 py-2 shrink-0"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {!currentUser ? (
          <Link to="/login" className="btn shrink-0">
            Sign In
          </Link>
        ) : (
          <button
            className="btn shrink-0"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Sign Out
          </button>
        )}
      </div>
    </header>
  );
}
