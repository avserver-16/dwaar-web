import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useAuthStore } from '../stores/useAuthStore';
import { useSocketStore } from '../stores/useSocketStore';
import {
  useUserGroupsQuery,
  useCreateGroupMutation,
  useJoinGroupMutation,
  useAddGroupMemberMutation,
  useRemoveGroupMemberMutation,
} from '../queries/useGroupQueries';
import { Card, ChatThread, Empty, Field, PageHead, norm, useUsers } from '../components';
import { toast } from '../stores/useToastStore';

export default function Groups() {
  const user = useAuthStore((s) => s.user);
  const socket = useSocketStore((s) => s.socket);
  const sendGroupMessage = useSocketStore((s) => s.sendGroupMessage);
  const sendGroupTyping = useSocketStore((s) => s.sendGroupTyping);
  const updateLocation = useSocketStore((s) => s.updateLocation);
  const lastLocation = useSocketStore((s) => s.lastLocation);

  const { users, nameOf } = useUsers();

  const { data: groups = [], isLoading: groupsLoading, refetch: refetchGroups } = useUserGroupsQuery(user?._id);
  const createGroupMutation = useCreateGroupMutation();
  const joinGroupMutation = useJoinGroupMutation();
  const addMemberMutation = useAddGroupMemberMutation();
  const removeMemberMutation = useRemoveGroupMemberMutation();

  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState({});
  const [creating, setCreating] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [addId, setAddId] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'general',
    subCategory: '',
    memberIds: [],
    radiusMeters: 1000,
  });

  const active = groups.find((g) => g._id === activeId);
  const activeRef = useRef(null);
  activeRef.current = activeId;

  // Auto-join groups when groups list loads
  useEffect(() => {
    if (socket?.connected && groups.length > 0) {
      socket.emit('join_groups');
    }
  }, [socket, groups.length]);

  // Real-time group messages and typing indicators
  useEffect(() => {
    if (!socket) return undefined;

    const onMsg = (m) => {
      const msgGroupId = m.groupId || m.group;
      if (msgGroupId === activeRef.current) {
        setMessages((prev) => {
          const normM = norm(m);
          if (prev.some((x) => norm(x).id === normM.id)) return prev;
          return [...prev, m];
        });
      }
    };

    const onTyping = (d) => {
      if (d.groupId !== activeRef.current || d.userId === user?._id) return;
      setTyping((t) => ({ ...t, [d.userId]: d.isTyping }));
    };

    socket.on('receive_group_message', onMsg);
    socket.on('group_typing', onTyping);

    return () => {
      socket.off('receive_group_message', onMsg);
      socket.off('group_typing', onTyping);
    };
  }, [socket, user?._id]);

  const open = async (g) => {
    if (activeId && socket?.connected) {
      socket.emit('leave_group', { groupId: activeId });
    }
    setActiveId(g._id);
    setTyping({});
    setMessages([]);

    if (socket?.connected) {
      socket.emit('join_group', { groupId: g._id });
    }

    try {
      const history = await api.groupMessages(g._id);
      setMessages(history || []);
    } catch (err) {
      toast(err.message, 'err');
    }
  };

  const syncGps = () => {
    if (!navigator.geolocation) {
      toast('Geolocation not supported', 'err');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
        toast('Location synchronized with server', 'ok');
      },
      (err) => toast(err.message, 'err')
    );
  };

  const create = (e) => {
    e.preventDefault();
    const lat = lastLocation?.lat ?? user?.location?.latitude;
    const lng = lastLocation?.lng ?? user?.location?.longitude;

    createGroupMutation.mutate(
      {
        ...form,
        adminId: user._id,
        lat: lat !== undefined ? Number(lat) : undefined,
        lng: lng !== undefined ? Number(lng) : undefined,
        radiusMeters: Number(form.radiusMeters || 1000),
      },
      {
        onSuccess: (newGroup) => {
          setCreating(false);
          setForm({
            name: '',
            description: '',
            category: 'general',
            subCategory: '',
            memberIds: [],
            radiusMeters: 1000,
          });
          refetchGroups().then(() => {
            if (newGroup?._id) open(newGroup);
          });
        },
      }
    );
  };

  const handleSend = ({ message, type, attachment }) => {
    if (!activeId) return;
    const ok = sendGroupMessage({ groupId: activeId, message, type, attachment });
    if (ok) {
      // Optimistic append
      setMessages((prev) => [
        ...prev,
        {
          id: `tmp-${Date.now()}`,
          senderId: user._id,
          content: message,
          type,
          attachment,
          createdAt: new Date().toISOString(),
          tmp: true,
        },
      ]);
    }
  };

  const handleTyping = (isTyping) => {
    if (activeId) {
      sendGroupTyping(activeId, isTyping);
    }
  };

  const typers = Object.entries(typing)
    .filter(([, v]) => v)
    .map(([id]) => nameOf(id));

  const isAdmin = active && (active.admin?._id || active.admin) === user?._id;
  const memberId = (m) => m?._id || m;

  return (
    <>
      <PageHead
        title="Groups"
        sub="Location-fenced community chat channels with real-time radius security"
      />

      <div className="grid-chat">
        <div className="stack">
          <Card
            title="My groups"
            actions={
              <div className="row">
                <button
                  type="button"
                  className="ghost small-btn"
                  title="Refresh GPS for radius verification"
                  onClick={syncGps}
                >
                  Sync GPS
                </button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setCreating(!creating)}
                >
                  {creating ? 'Cancel' : 'New group'}
                </button>
              </div>
            }
          >
            {creating && (
              <form className="stack sub" onSubmit={create}>
                <Field label="Group Name">
                  <input
                    required
                    value={form.name}
                    placeholder="e.g. Building A Residents"
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field label="Description">
                  <input
                    value={form.description}
                    placeholder="Brief description"
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </Field>
                <div className="two">
                  <Field label="Category">
                    <input
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    />
                  </Field>
                  <Field label="Radius (meters)">
                    <input
                      type="number"
                      min="100"
                      max="50000"
                      value={form.radiusMeters}
                      onChange={(e) => setForm({ ...form, radiusMeters: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Members (hold Ctrl/Cmd to select several)">
                  <select
                    multiple
                    size={4}
                    value={form.memberIds}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        memberIds: [...e.target.selectedOptions].map((o) => o.value),
                      })
                    }
                  >
                    {users
                      .filter((u) => u._id !== user._id)
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                </Field>
                <button disabled={createGroupMutation.isPending}>
                  {createGroupMutation.isPending ? 'Creating…' : 'Create group'}
                </button>
              </form>
            )}

            <form
              className="row"
              onSubmit={(e) => {
                e.preventDefault();
                if (!joinId.trim()) return;
                joinGroupMutation.mutate(
                  { groupId: joinId.trim(), userId: user._id },
                  {
                    onSuccess: () => {
                      setJoinId('');
                      refetchGroups();
                    },
                  }
                );
              }}
            >
              <input
                placeholder="Join by group ID"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                required
              />
              <button className="ghost" disabled={joinGroupMutation.isPending}>
                {joinGroupMutation.isPending ? 'Joining…' : 'Join'}
              </button>
            </form>

            {groupsLoading ? (
              <p className="muted">Loading groups…</p>
            ) : groups.length === 0 ? (
              <Empty>No groups yet. Create or join one.</Empty>
            ) : (
              <ul className="list">
                {groups.map((g) => (
                  <li
                    key={g._id}
                    className={`item ${g._id === activeId ? 'sel' : ''}`}
                    onClick={() => open(g)}
                  >
                    <div className="grow">
                      <b>{g.name}</b>
                      <div className="muted small">
                        {g.category}
                        {g.subCategory ? ` / ${g.subCategory}` : ''} · {g.members?.length ?? 0} members · {g.radiusMeters || 1000}m radius
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {active && (
            <Card title="Members">
              <ul className="list">
                {active.members?.map((m) => {
                  const id = memberId(m);
                  return (
                    <li key={id} className="item">
                      <div className="grow">
                        {m.name || nameOf(id)}
                        {id === (active.admin?._id || active.admin) && (
                          <span className="tag">admin</span>
                        )}
                      </div>
                      {isAdmin && id !== user._id && (
                        <button
                          className="ghost danger-text"
                          disabled={removeMemberMutation.isPending}
                          onClick={() =>
                            removeMemberMutation.mutate(
                              { groupId: active._id, userId: id },
                              { onSuccess: () => refetchGroups() }
                            )
                          }
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>

              {isAdmin && (
                <form
                  className="row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!addId) return;
                    addMemberMutation.mutate(
                      { groupId: active._id, userId: addId },
                      {
                        onSuccess: () => {
                          setAddId('');
                          refetchGroups();
                        },
                      }
                    );
                  }}
                >
                  <select
                    required
                    value={addId}
                    onChange={(e) => setAddId(e.target.value)}
                  >
                    <option value="">Add a member…</option>
                    {users
                      .filter((u) => !active.members?.some((m) => memberId(m) === u._id))
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                  <button disabled={addMemberMutation.isPending}>Add</button>
                </form>
              )}
            </Card>
          )}
        </div>

        <Card
          title={active ? active.name : 'Conversation'}
          actions={
            active && (
              <span className="muted small">
                {active.radiusMeters ? `${active.radiusMeters}m radius` : 'Location verified'}
              </span>
            )
          }
        >
          {!active ? (
            <Empty>Select or create a group to start chatting.</Empty>
          ) : (
            <ChatThread
              messages={messages}
              meId={user._id}
              nameOf={nameOf}
              onSend={handleSend}
              onTyping={handleTyping}
              typingLabel={typers.length ? `${typers.join(', ')} typing…` : ''}
            />
          )}
        </Card>
      </div>
    </>
  );
}
