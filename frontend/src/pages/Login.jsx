import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import useSlowHint from '../hooks/useSlowHint';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const slow = useSlowHint(submitting);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome back!');
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to see your tasks.">
      <form className="form" onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={onChange} />
        </label>
        <label className="field">
          <span>Password</span>
          <PasswordInput name="password" autoComplete="current-password" placeholder="Your password" value={form.password} onChange={onChange} />
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting && <LoaderCircle className="spin" size={18} />}
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
        {slow && <p className="hint">Waking up the server (free hosting), this can take up to a minute…</p>}
      </form>
      <p className="auth-switch">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
