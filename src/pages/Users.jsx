import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth, useSocket } from '../context';
import { Card, Empty, PageHead, useAction } from '../components';

export default function Users() {
  const { user: me } = useAuth();
  const { online } = useSocket();
  const nav = useNavigate();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState(null);
  const [run] = useAction();

  useEffect(() => { run(async () => setUsers(await api.users())); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = users.filter((u) => `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHead title="People" sub={`${users.length} members · ${online.length} online`} />
      <input className="search" placeholder="Search by name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid2">
        <Card title="Directory">
          {shown.length === 0 && <Empty>No matching people.</Empty>}
          <ul className="list">
            {shown.map((u) => (
              <li key={u._id} className="item" onClick={() => run(async () => setDetail(await api.user(u._id)))}>
                <span className={`dot ${online.includes(u._id) ? 'on' : ''}`} />
                <div className="grow">
                  <b>{u.name}{u._id === me._id && ' (you)'}</b>
                  <div className="muted small">{u.email} · {u.phone}</div>
                </div>
                {u._id !== me._id && (
                  <button className="ghost" onClick={(e) => { e.stopPropagation(); nav(`/messages?to=${u._id}`); }}>Message</button>
                )}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Details">
          {!detail ? <Empty>Select a person to see their details.</Empty> : (
            <dl className="kv">
              <dt>Name</dt><dd>{detail.name}</dd>
              <dt>Email</dt><dd>{detail.email}</dd>
              <dt>Phone</dt><dd>{detail.phone}</dd>
              <dt>Location</dt>
              <dd>{detail.location ? [detail.location.city, detail.location.region, detail.location.country].filter(Boolean).join(', ') || `${detail.location.latitude}, ${detail.location.longitude}` : '—'}</dd>
              <dt>Rooms joined</dt><dd>{detail.joinedRooms?.length ?? 0}</dd>
            </dl>
          )}
        </Card>
      </div>
    </>
  );
}
