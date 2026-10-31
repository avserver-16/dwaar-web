import { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useJoinedRoomsQuery, useJoinRoomMutation, useRoomMessagesQuery } from '../queries/useRoomQueries';
import { Card, ChatThread, Empty, PageHead, useUsers, fmtTime } from '../components';

export default function Rooms() {
  const user = useAuthStore((s) => s.user);
  const { nameOf } = useUsers();

  const { data: rooms = [], isLoading: roomsLoading } = useJoinedRoomsQuery();
  const joinMutation = useJoinRoomMutation();

  const [active, setActive] = useState(null);
  const [roomId, setRoomId] = useState('');

  const { data: messages = [] } = useRoomMessagesQuery(active?._id, !!active);

  const join = (e) => {
    e.preventDefault();
    if (!roomId.trim()) return;
    joinMutation.mutate(roomId.trim(), {
      onSuccess: () => setRoomId(''),
    });
  };

  return (
    <>
      <PageHead
        title="Rooms"
        sub="Hyperlocal rooms tied to buildings and campuses"
      />

      <div className="grid-chat">
        <Card title="My rooms">
          <form className="row" onSubmit={join}>
            <input
              required
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <button disabled={joinMutation.isPending}>
              {joinMutation.isPending ? 'Joining…' : 'Join'}
            </button>
          </form>

          {roomsLoading ? (
            <p className="muted">Loading rooms…</p>
          ) : rooms.length === 0 ? (
            <Empty>You haven't joined any rooms yet. Discover rooms in the Explore tab.</Empty>
          ) : (
            <ul className="list">
              {rooms.map(({ roomId: r, joinedAt }) =>
                r && (
                  <li
                    key={r._id}
                    className={`item ${active?._id === r._id ? 'sel' : ''}`}
                    onClick={() => setActive(r)}
                  >
                    <div className="grow">
                      <b>{r.name}</b>
                      <div className="muted small">
                        {r.category || 'general'} · {r.members?.length ?? 0}/{r.maxMembers ?? 100} members · joined {fmtTime(joinedAt)}
                      </div>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}
        </Card>

        <Card title={active ? active.name : 'Messages'}>
          {!active ? (
            <Empty>Select a room to read public announcements and messages.</Empty>
          ) : (
            <>
              {active.description && <p className="muted">{active.description}</p>}
              <ChatThread
                messages={messages}
                meId={user?._id}
                nameOf={nameOf}
                readOnly
                empty="No public messages in this room yet."
              />
            </>
          )}
        </Card>
      </div>
    </>
  );
}
