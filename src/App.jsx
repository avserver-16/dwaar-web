import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useSocket } from './context';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Users from './pages/Users';
import Explore from './pages/Explore';
import Rooms from './pages/Rooms';
import Groups from './pages/Groups';
import Messages from './pages/Messages';
import Upload from './pages/Upload';
import Status from './pages/Status';

// Pages grouped under a bottom tab (shown as small tabs at the top of the page)
const MESSAGE_PAGES = [
  ['/messages', 'Messages'],
  ['/rooms', 'Rooms'],
  ['/groups', 'Groups'],
  ['/users', 'People'],
];

const PROFILE_PAGES = [
  ['/', 'Profile'],
  ['/status', 'Status'],
];

const isActivePath = (pathname, p) =>
  p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(`${p}/`);

// TODO: replace with real values from the user's profile / settings
const LOCATION = 'Vasai, MH';
const RADIUS = '5km Radius';

const Icon = ({ children, size = 18, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

const PinIcon = () => (
  <Icon size={17}>
    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
);

const SearchIcon = () => (
  <Icon size={20}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Icon>
);

const BellIcon = () => (
  <Icon size={20}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Icon>
);

const UserIcon = () => (
  <Icon size={20}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);

const LogoMark = () => (
  <span className="logo-mark" aria-hidden="true">
    <Icon size={22} strokeWidth="2.4">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </Icon>
  </span>
);

const CompassIcon = () => (
  <Icon size={22}>
    <circle cx="12" cy="12" r="10" />
    <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12Z" />
  </Icon>
);

const ChatIcon = () => (
  <Icon size={22}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </Icon>
);

const UploadIcon = () => (
  <Icon size={22}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m17 8-5-5-5 5" />
    <path d="M12 3v12" />
  </Icon>
);

const ProfileIcon = () => (
  <Icon size={22}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);

const TABS = [
  { to: '/', label: 'Explore', icon: CompassIcon, paths: ['/explore'] },
  { to: '/messages', label: 'Messages', icon: ChatIcon, paths: MESSAGE_PAGES.map(([p]) => p) },
  { to: '/upload', label: 'Upload', icon: UploadIcon, paths: ['/upload'] },
  { to: '/profile', label: 'Profile', icon: ProfileIcon, paths: PROFILE_PAGES.map(([p]) => p) },
];

function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {TABS.map(({ to, label, icon: TabIcon, paths }) => {
        const active = paths.some((p) => isActivePath(pathname, p));
        return (
          <Link
            key={to}
            to={to}
            className={`tab ${active ? 'active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <TabIcon />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// Sub-tabs for the Messages group (Rooms / Groups / People) and Profile (Status)
function SectionTabs() {
  const { pathname } = useLocation();
  const pages = [MESSAGE_PAGES, PROFILE_PAGES].find((group) =>
    group.some(([to]) => isActivePath(pathname, to))
  );
  if (!pages) return null;
  return (
    <div className="section-tabs">
      {pages.map(([to, label]) => (
        <NavLink key={to} to={to} end={to === '/'}>
          {label}
        </NavLink>
      ))}
    </div>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const menuRef = useRef(null);

  const handle = user.username || user.handle || user.name.split(' ')[0].toLowerCase();

  // ⌘K / Ctrl+K focuses the search box
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close the user menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const onSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/explore?q=${encodeURIComponent(q)}` : '/explore');
  };

  return (
    <header className="navbar">
      <div className="topbar">
        <NavLink to="/explore" className="logo" aria-label="Dwaar home">
          <LogoMark />
          <span className="logo-word">DWAAR</span>
        </NavLink>

        <div className="pill pill-loc">
          <PinIcon />
          <span>{LOCATION}</span>
          <span className="pill-sep">•</span>
          <span className="pill-strong">{RADIUS}</span>
        </div>

        <form className="searchbar" onSubmit={onSearch} role="search">
          <SearchIcon />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search grid, dispatch, rooms..."
            aria-label="Search"
          />
          <kbd className="kbd">⌘K</kbd>
        </form>

        <div
          className={`pill pill-enc ${connected ? 'on' : ''}`}
          title={connected ? 'Realtime connected' : 'Realtime offline'}
        >
          <span className="enc-dot" />
          <span>ENCRYPTED &amp; PSEUDONYMOUS</span>
        </div>

        <button className="icon-btn icon-btn-disabled" aria-label="Notifications" title="Yet to be unlocked">
          <BellIcon />
        </button>

        <div className="user-wrap" ref={menuRef}>
          <button
            className="user-chip"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="avatar">
              <UserIcon />
              <span className={`avatar-dot ${connected ? 'on' : ''}`} />
            </span>
            <span className="user-text">
              <span className="user-name">{user.name}</span>
              <span className="user-handle">@{handle}</span>
            </span>
          </button>

          {menuOpen && (
            <div className="user-menu" role="menu">
              <NavLink to="/" end role="menuitem" onClick={() => setMenuOpen(false)}>
                Profile
              </NavLink>
              <button role="menuitem" className="menu-danger" onClick={logout}>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Shell() {
  return (
    <div className="shell">
      <Navbar />
      <main className="main">
        <SectionTabs />
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center muted">Loading…</div>;
  return user ? <Shell /> : <Navigate to="/login" replace />;
}

function Guest({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center muted">Loading…</div>;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Guest><Login /></Guest>} />
      <Route path="/register" element={<Guest><Register /></Guest>} />
      <Route element={<Protected />}>
        <Route path="explore" element={<Explore />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="groups" element={<Groups />} />
        <Route path="messages" element={<Messages />} />
        <Route path="users" element={<Users />} />
        <Route path="upload" element={<Upload />} />
        <Route path="status" element={<Status />} />
        <Route index element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}