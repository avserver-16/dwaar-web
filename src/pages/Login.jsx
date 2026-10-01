import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context';
import { Field, useAction } from '../components';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [run, busy] = useAction();

  const submit = (e) => {
    e.preventDefault();
    run(() => login({ email: email.trim(), phone: phone.trim(), password }));
  };

  return (
    <div className="auth">
      <form className="card auth-card" onSubmit={submit}>
        <div className="brand big">Dwaar</div>
        <p className="muted">Sign in to your account</p>
        <Field label="Email">
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone number">
          <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Password">
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <button disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="muted center">New here? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}