
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context';
import { Field, useAction } from '../components';
import AuthLayout from './AuthLayout';

export default function Login() {
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [run, busy] = useAction();

  const submit = (e) => {
    e.preventDefault();

    run(() =>
      login({
        phone: phone.trim(),
        password,
      })
    );
  };

  return (
    <AuthLayout
      subtitle="Sign in to your account"
      onSubmit={submit}
    >
      

      <div className="login-fields">
        <Field label="Phone number">
          <div className="input-wrap">
            <span className="input-icon">+91</span>

            <input
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </Field>

        <Field label="Password">
          <div className="input-wrap">
            {/* <span className="input-icon password-icon">
              •••
            </span> */}

            <input
              required
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </Field>
      </div>

      <button
        type="submit"
        className="login-submit"
        disabled={busy}
      >
        <span>{busy ? 'Signing in…' : 'Sign in'}</span>
        {!busy && <span className="button-arrow">→</span>}
      </button>

      <div className="login-divider">
        <span />
        <p>New to Dwaar?</p>
        <span />
      </div>

      <Link to="/register" className="create-account">
        Create an account
        <span>→</span>
      </Link>

      <p className="login-privacy">
        By continuing, you agree to use Dwaar responsibly.
      </p>
    </AuthLayout>
  );
}
