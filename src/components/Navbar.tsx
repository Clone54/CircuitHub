import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Cpu, Menu, X, LogIn, LogOut, LayoutDashboard, PlusCircle, Info, Mail, Compass, GraduationCap, Wrench, Calculator, Activity, BookOpen, ArrowLeft } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
    setIsOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? 'text-emerald-accent bg-navy-light/40'
        : 'text-slate-300 hover:text-emerald-accent hover:bg-navy-light/20'
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-navy-light bg-navy-dark/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Back button */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-accent/10 border border-emerald-accent/20 group-hover:border-emerald-accent/50 transition-colors">
                <Cpu className="h-5 w-5 text-emerald-accent animate-pulse" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-white group-hover:text-emerald-accent transition-colors">
                Circuit<span className="text-emerald-accent">Hub</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className={navLinkClass('/')}>
              Home
            </Link>
            <Link to="/explore" className={navLinkClass('/explore')}>
              <Compass className="h-4 w-4" />
              Explore
            </Link>
            <Link to="/tools" className={navLinkClass('/tools')}>
              <Wrench className="h-4 w-4" />
              Tools
            </Link>
            <Link to="/about" className={navLinkClass('/about')}>
              <Info className="h-4 w-4" />
              About
            </Link>
            <Link to="/contact" className={navLinkClass('/contact')}>
              <Mail className="h-4 w-4" />
              Contact
            </Link>

            {user ? (
              <Link to="/items/manage" className={navLinkClass('/items/manage')}>
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            ) : null}
          </div>

          {/* User Account / CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-light/40 border border-navy-light">
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                    alt={user.name}
                    className="h-6 w-6 rounded-full border border-emerald-accent/30"
                  />
                  <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-lg bg-emerald-accent px-4 py-2 text-sm font-semibold text-navy-dark hover:bg-emerald-hover shadow-lg shadow-emerald-accent/10 transition-all"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-navy-light hover:text-white transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-navy-light bg-navy-dark px-2 pt-2 pb-4 space-y-1">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="block rounded-md px-3 py-2 text-base font-medium text-slate-300 hover:bg-navy-light/50 hover:text-white"
          >
            Home
          </Link>
          <Link
            to="/explore"
            onClick={() => setIsOpen(false)}
            className="block rounded-md px-3 py-2 text-base font-medium text-slate-300 hover:bg-navy-light/50 hover:text-white"
          >
            Explore
          </Link>
          <Link
            to="/tools"
            onClick={() => setIsOpen(false)}
            className="block rounded-md px-3 py-2 text-base font-medium text-slate-300 hover:bg-navy-light/50 hover:text-white"
          >
            Tools
          </Link>
          <Link
            to="/about"
            onClick={() => setIsOpen(false)}
            className="block rounded-md px-3 py-2 text-base font-medium text-slate-300 hover:bg-navy-light/50 hover:text-white"
          >
            About
          </Link>
          <Link
            to="/contact"
            onClick={() => setIsOpen(false)}
            className="block rounded-md px-3 py-2 text-base font-medium text-slate-300 hover:bg-navy-light/50 hover:text-white"
          >
            Contact
          </Link>

          {user ? (
            <>
              <Link
                to="/items/manage"
                onClick={() => setIsOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium text-slate-300 hover:bg-navy-light/50 hover:text-white"
              >
                Dashboard
              </Link>
              <div className="border-t border-navy-light pt-4 mt-4 pb-2 px-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                    alt={user.name}
                    className="h-8 w-8 rounded-full border border-emerald-accent/30"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white">{user.name}</div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogoutClick}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="border-t border-navy-light pt-4 mt-4 px-3">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-accent py-2.5 text-sm font-semibold text-navy-dark hover:bg-emerald-hover shadow-lg"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
