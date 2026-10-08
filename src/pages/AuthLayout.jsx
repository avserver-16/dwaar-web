
import { useEffect, useState } from 'react';
import ParticleNetwork from './components/Particles';
import './login.css';

const description =
  'A hyperlocal community platform connecting people to nearby groups through pseudonymous, real-time interactions.';
function AnimatedIntro() {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState('title');

  useEffect(() => {
    let timeout;

    // Type "Dwaar"
    if (phase === 'title') {
      if (text.length < 5) {
        timeout = setTimeout(() => {
          setText('Dwaar'.slice(0, text.length + 1));
        }, 180);
      } else {
        timeout = setTimeout(() => {
          setText('');
          setPhase('description');
        }, 1200);
      }
    }

    // Type description
    if (phase === 'description') {
      if (text.length < description.length) {
        timeout = setTimeout(() => {
          setText(description.slice(0, text.length + 1));
        }, 18);
      }
    }

    return () => clearTimeout(timeout);
  }, [text, phase]);

  return (
    <section className="auth-intro" aria-label="About Dwaar">
      <div className="auth-intro-brand">
        {phase === 'title' ? (
          <>
            <span>{text}</span>
            <span className="typing-cursor" />
          </>
        ) : (
          <span>Dwaar</span>
        )}
      </div>

      {phase === 'description' && (
        <p className="auth-intro-description">
          {text}
          <span className="typing-cursor" />
        </p>
      )}

      <div className="auth-intro-line" />
    </section>
  );
}

/** Shared shell for Login + Register: glow, particles, and the card. */
export default function AuthLayout({
  subtitle,
  onSubmit,
  children,
}) {
  return (
    <div className="auth auth-particles">
      {/* Background glow */}
      <div className="auth-fade" aria-hidden="true" />

      {/* Particle network */}
      <ParticleNetwork
        color="139, 0, 0"
        secondaryColor="75, 0, 130"
      />

      {/* Left-side animated product introduction */}
      <AnimatedIntro />

      {/* Auth card */}
      <form className="card auth-card" onSubmit={onSubmit}>
        <header className="auth-head">
          <p className="muted">{subtitle}</p>
        </header>

        {children}
      </form>
    </div>
  );
}
