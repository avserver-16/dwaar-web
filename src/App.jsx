import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
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

const NAV = [
  ['/explore', 'Explore'],
  ['/rooms', 'Rooms'],
  ['/groups', 'Groups'],
  ['/messages', 'Messages'],
  ['/users', 'People'],
  ['/upload', 'Upload'],
  ['/status', 'Status'],
  ['/', 'Profile'],
];

function Shell() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">Dwaar</div>
        <nav>
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <div className="who">
            <span className={`dot ${connected ? 'on' : ''}`} title={connected ? 'Realtime connected' : 'Realtime offline'} />
            <span>{user.name}</span>
          </div>
          <button className="ghost" onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
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
