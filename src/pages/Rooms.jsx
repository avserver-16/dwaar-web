import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context';
import { Card, ChatThread, Empty, PageHead, useAction, useUsers, fmtTime } from '../components';

export default function Rooms() {
  const { user } = useAuth();
  const { nameOf } = useUsers();
  const [run, busy] = useAction();
  const [rooms, setRooms] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [roomId, setRoomId] = useState('');

  const load = () => run(async () => setRooms((await api.joinedRooms()).joinedRooms || []));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (room) => {
    setActive(room);
    run(async () => setMessages(await api.roomMessages(room._id)));
  };

  const join = (e) => {
    e.preventDefault();
    run(async () => { await api.joinRoom(roomId.trim()); setRoomId(''); await load(); }, 'Joined room');
  };

  return (
    <>
      <PageHead title="Rooms" sub="Location-based rooms you have joined" />
      <div className="grid-chat">
        <Card title="My rooms">
          <form className="row" onSubmit={join}>
            <input required placeholder="Room ID" value={roomId} onChange={(e) => setRoomId(e.target.value)} />
            <button disabled={busy}>Join</button>
          </form>
          {rooms.length === 0 && <Empty>You haven't joined any rooms. Find some in Explore.</Empty>}
          <ul className="list">
            {rooms.map(({ roomId: r, joinedAt }) => r && (
              <li key={r._id} className={`item ${active?._id === r._id ? 'sel' : ''}`} onClick={() => open(r)}>
                <div className="grow">
                  <b>{r.name}</b>
                  <div className="muted small">{r.category} · {r.members?.length ?? 0}/{r.maxMembers} members · joined {fmtTime(joinedAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title={active ? active.name : 'Messages'}>
          {!active ? <Empty>Select a room to read its messages.</Empty> : (
            <>
              {active.description && <p className="muted">{active.description}</p>}
              <ChatThread messages={messages} meId={user._id} nameOf={nameOf} readOnly empty="No public messages in this room yet." />
            </>
          )}
        </Card>
      </div>
    </>
  );
}
