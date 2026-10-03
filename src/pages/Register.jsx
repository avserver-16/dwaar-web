import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context';
import { Field, useAction } from '../components';
import AuthLayout from './AuthLayout';

export default function Register() {
  const { login } = useAuth();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [phoneState, setPhoneState] = useState(null);
  const [run, busy] = useAction();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const checkPhone = async () => {
    if (!f.phone.trim()) return;
    try {
      const r = await api.checkPhone(f.phone.trim());
      setPhoneState(r.exists ? 'taken' : 'free');
    } catch { setPhoneState(null); }
  };

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      await api.register({ ...f, phone: f.phone.trim() });
      await login({ phone: f.phone.trim(), password: f.password });
    }, 'Account created');
  };

  return (
    <AuthLayout subtitle="Create your account" onSubmit={submit}>
      <Field label="Full name">
        <input required autoComplete="name" value={f.name} onChange={set('name')} />
      </Field>
      <Field label="Email">
        <input required type="email" autoComplete="email" value={f.email} onChange={set('email')} />
      </Field>
      <Field label="Phone">
        <input
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          aria-invalid={phoneState === 'taken'}
          value={f.phone}
          onChange={(e) => { set('phone')(e); setPhoneState(null); }}
          onBlur={checkPhone}
        />
        <span aria-live="polite">
          {phoneState === 'taken' && <small className="err-text">This phone number is already registered.</small>}
          {phoneState === 'free' && <small className="ok-text">Phone number is available.</small>}
        </span>
      </Field>
      <Field label="Password">
        <input required type="password" minLength={6} autoComplete="new-password"
          value={f.password} onChange={set('password')} />
      </Field>

      <button disabled={busy || phoneState === 'taken'}>{busy ? 'Creating…' : 'Create account'}</button>

      <p className="muted center auth-foot">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}