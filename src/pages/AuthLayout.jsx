
import ParticleNetwork from './components/Particles';
import './login.css';

/* "Dwaar" means door: an open arch with a knob */
function DoorMark() {
  return (
    <svg className="door-mark" viewBox="0 0 32 32" width="34" height="34" fill="none" aria-hidden="true">
      <path d="M7 27V14a9 9 0 0 1 18 0v13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M3.5 27h25" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="20.5" cy="20.5" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** Shared shell for Login + Register: glow, particles, and the card. */
export default function AuthLayout({ subtitle, onSubmit, children }) {
  return (
    <div className="auth auth-particles">
      {/* order matters: glow (back) -> particles -> card (front) */}
      <div className="auth-fade" aria-hidden="true" />
      <ParticleNetwork />
      <form className="card auth-card" onSubmit={onSubmit}>
        <header className="auth-head">
          {/* <div className="brand big"><DoorMark /><span>Dwaar</span></div> */}
          <p className="muted">{subtitle}</p>
        </header>
        {children}
      </form>
    </div>
  );
}