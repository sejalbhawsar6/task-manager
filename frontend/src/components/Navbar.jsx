import { LogOut, Moon, Sun } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import useTheme from '../hooks/useTheme';

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Logo />
        <div className="navbar-actions">
          <button className="icon-btn" type="button" onClick={toggle} aria-label="Toggle dark mode" title="Toggle theme">
            <span key={theme} className="theme-icon">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </span>
          </button>
          <div className="user-chip" title={user?.email}>
            <span className="avatar">{initials(user?.name)}</span>
            <span className="user-name">{user?.name}</span>
          </div>
          <button className="icon-btn" type="button" onClick={logout} aria-label="Log out" title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
