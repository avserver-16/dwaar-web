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

  // Digits only, max 10 (the +91 prefix is shown separately)
  const onPhoneChange = (e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));

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
              autoFocus
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="10-digit mobile number"
              pattern="[0-9]{10}"
              maxLength={10}
              title="Enter a 10-digit mobile number"
              value={phone}
              onChange={onPhoneChange}
            />
          </div>
        </Field>

        <Field label="Password">
          <div className="input-wrap">
            {/* <span className="input-icon password-icon" aria-hidden="true">••••</span> */}

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
              aria-pressed={showPassword}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </Field>
      </div>

      <button
        type="submit"
        className="login-submit"
        disabled={busy || phone.length !== 10 || !password}
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
        Encrypted &amp; pseudonymous. By continuing, you agree to use Dwaar responsibly.
      </p>
    </AuthLayout>
  );
}