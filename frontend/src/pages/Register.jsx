import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import useSlowHint from '../hooks/useSlowHint';

const EMAIL_RX = /^\S+@\S+\.\S+$/;

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const slow = useSlowHint(submitting);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return 'Please enter your name.';
    if (!EMAIL_RX.test(form.email.trim())) return 'Please enter a valid email.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    setError(problem);
    if (problem) return;
    setSubmitting(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      toast.success('Account created. Welcome!');
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="It takes less than a minute.">
      <form className="form" onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>Name</span>
          <input name="name" autoComplete="name" placeholder="Your name" value={form.name} onChange={onChange} maxLength={60} />
        </label>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={onChange} />
        </label>
        <label className="field">
          <span>Password</span>
          <PasswordInput name="password" autoComplete="new-password" placeholder="At least 6 characters" value={form.password} onChange={onChange} />
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting && <LoaderCircle className="spin" size={18} />}
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
        {slow && <p className="hint">Waking up the server (free hosting), this can take up to a minute…</p>}
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
