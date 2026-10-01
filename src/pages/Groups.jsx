import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useAuth, useSocket } from '../context';
import { Card, ChatThread, Empty, Field, PageHead, norm, useAction, useUsers } from '../components';

export default function Groups() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { users, nameOf } = useUsers();
  const [run, busy] = useAction();
  const [groups, setGroups] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState({});
  const [form, setForm] = useState({ name: '', description: '', category: 'general', subCategory: '', memberIds: [] });
  const [creating, setCreating] = useState(false);
  const [addId, setAddId] = useState('');
  const [joinId, setJoinId] = useState('');
  const activeRef = useRef(null);

  const active = groups.find((g) => g._id === activeId);
  activeRef.current = activeId;

  const load = () => run(async () => setGroups(await api.userGroups(user._id)));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // join every group room on the socket so messages arrive live
  useEffect(() => {
    if (socket && groups.length) socket.emit('join_groups', { groupIds: groups.map((g) => g._id) });
  }, [socket, groups.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!socket) return undefined;
    const onMsg = (m) => {
      if ((m.groupId || m.group) === activeRef.current) setMessages((prev) => (prev.some((x) => norm(x).id === norm(m).id) ? prev : [...prev, m]));
    };
    const onTyping = (d) => {
      if (d.groupId !== activeRef.current || d.userId === user._id) return;
      setTyping((t) => ({ ...t, [d.userId]: d.isTyping }));
    };
    socket.on('receive_group_message', onMsg);
    socket.on('group_typing', onTyping);
    return () => { socket.off('receive_group_message', onMsg); socket.off('group_typing', onTyping); };
  }, [socket, user._id]);

  const open = (g) => {
    if (activeId) socket?.emit('leave_group', { groupId: activeId });
    setActiveId(g._id);
    setTyping({});
    setMessages([]);
    socket?.emit('join_group', { groupId: g._id });
    run(async () => setMessages(await api.groupMessages(g._id)));
  };

  const create = (e) => {
    e.preventDefault();
    run(async () => {
      const g = await api.createGroup({ ...form, adminId: user._id });
      setCreating(false);
      setForm({ name: '', description: '', category: 'general', subCategory: '', memberIds: [] });
      await load();
      open(g);
    }, 'Group created');
  };

  const send = ({ message, type, attachment }) =>
    socket?.emit('send_group_message', { groupId: activeId, message, type, attachment });

  const replaceGroup = (g) => setGroups((gs) => gs.map((x) => (x._id === g._id ? g : x)));
  const typers = Object.entries(typing).filter(([, v]) => v).map(([id]) => nameOf(id));
  const isAdmin = active && (active.admin?._id || active.admin) === user._id;
  const memberId = (m) => m._id || m;

  return (
    <>
      <PageHead title="Groups" sub="Private group conversations" />
      <div className="grid-chat">
        <div className="stack">
          <Card title="My groups" actions={<button className="ghost" onClick={() => setCreating(!creating)}>{creating ? 'Cancel' : 'New group'}</button>}>
            {creating && (
              <form className="stack sub" onSubmit={create}>
                <Field label="Name"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Description"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
                <div className="two">
                  <Field label="Category"><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
                  <Field label="Sub-category"><input value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })} /></Field>
                </div>
                <Field label="Members (hold Ctrl/Cmd to select several)">
                  <select multiple size={5} value={form.memberIds} onChange={(e) => setForm({ ...form, memberIds: [...e.target.selectedOptions].map((o) => o.value) })}>
                    {users.filter((u) => u._id !== user._id).map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </select>
                </Field>
                <button disabled={busy}>Create group</button>
              </form>
            )}
            <form className="row" onSubmit={(e) => { e.preventDefault(); run(async () => { await api.joinGroup(joinId.trim(), user._id); setJoinId(''); await load(); }, 'Joined group'); }}>
              <input placeholder="Join by group ID" value={joinId} onChange={(e) => setJoinId(e.target.value)} required />
              <button className="ghost" disabled={busy}>Join</button>
            </form>
            {groups.length === 0 && <Empty>No groups yet.</Empty>}
            <ul className="list">
              {groups.map((g) => (
                <li key={g._id} className={`item ${g._id === activeId ? 'sel' : ''}`} onClick={() => open(g)}>
                  <div className="grow"><b>{g.name}</b>
                    <div className="muted small">{g.category}{g.subCategory && ` / ${g.subCategory}`} · {g.members?.length ?? 0} members</div></div>
                </li>
              ))}
            </ul>
          </Card>

          {active && (
            <Card title="Members">
              <ul className="list">
                {active.members?.map((m) => {
                  const id = memberId(m);
                  return (
                    <li key={id} className="item">
                      <div className="grow">{m.name || nameOf(id)}{id === (active.admin?._id || active.admin) && <span className="tag">admin</span>}</div>
                      {isAdmin && id !== user._id && (
                        <button className="ghost danger-text" onClick={() => run(async () => replaceGroup(await api.removeGroupMember(active._id, id)), 'Member removed')}>Remove</button>
                      )}
                    </li>
                  );
                })}
              </ul>
              {isAdmin && (
                <form className="row" onSubmit={(e) => { e.preventDefault(); run(async () => { replaceGroup(await api.addGroupMember(active._id, addId)); setAddId(''); }, 'Member added'); }}>
                  <select required value={addId} onChange={(e) => setAddId(e.target.value)}>
                    <option value="">Add a member…</option>
                    {users.filter((u) => !active.members?.some((m) => memberId(m) === u._id)).map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </select>
                  <button disabled={busy}>Add</button>
                </form>
              )}
            </Card>
          )}
        </div>

        <Card title={active ? active.name : 'Conversation'}>
          {!active ? <Empty>Select or create a group to start chatting.</Empty> : (
            <ChatThread
              messages={messages}
              meId={user._id}
              nameOf={nameOf}
              onSend={send}
              onTyping={(isTyping) => socket?.emit('group_typing', { groupId: active._id, isTyping })}
              typingLabel={typers.length ? `${typers.join(', ')} typing…` : ''}
            />
          )}
        </Card>
      </div>
    </>
  );
}
