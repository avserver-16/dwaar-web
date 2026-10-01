import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context';
import { Field, useAction } from '../components';

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
    <div className="auth">
      <form className="card auth-card" onSubmit={submit}>
        <div className="brand big">Dwaar</div>
        <p className="muted">Create your account</p>
        <Field label="Full name"><input required value={f.name} onChange={set('name')} /></Field>
        <Field label="Email"><input required type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Phone">
          <input required type="tel" value={f.phone} onChange={(e) => { set('phone')(e); setPhoneState(null); }} onBlur={checkPhone} />
          {phoneState === 'taken' && <small className="err-text">This phone number is already registered.</small>}
          {phoneState === 'free' && <small className="ok-text">Phone number is available.</small>}
        </Field>
        <Field label="Password"><input required type="password" minLength={6} value={f.password} onChange={set('password')} /></Field>
        <button disabled={busy || phoneState === 'taken'}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="muted center">Already registered? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
