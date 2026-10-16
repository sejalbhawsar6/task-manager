import { CalendarClock, Filter, ShieldCheck } from 'lucide-react';
import Logo from './Logo';

const FEATURES = [
  { icon: ShieldCheck, text: 'Your own private task space' },
  { icon: Filter, text: 'Filter by status, priority and search' },
  { icon: CalendarClock, text: 'Due dates with overdue alerts' },
];

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <Logo />
        <div className="auth-brand-body">
          <h2>Organise your work, one task at a time.</h2>
          <p>Plan, prioritise and finish what matters with a clean, focused task board.</p>
          <ul>
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span className="auth-feature-icon"><Icon size={18} /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-mobile-logo"><Logo size={30} /></div>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
