
import './login.css';

/** Shared shell for the login and registration forms. */
export default function AuthLayout({ title, onSubmit, children }) {
  return (
    <div className="auth auth-particles">
      <section className="auth-intro" aria-label="Dwaar">
        <div className="auth-intro-brand">Dwaar</div>
      </section>
      <form className="card auth-card" onSubmit={onSubmit}>
        <header className="auth-head">
          <h1>{title}</h1>
        </header>
        {children}
      </form>
    </div>
  );
}
