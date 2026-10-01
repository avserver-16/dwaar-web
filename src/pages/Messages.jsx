import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth, useSocket } from '../context';
import { Card, ChatThread, Empty, PageHead, norm, useAction, useUsers, fmtTime } from '../components';

export default function Messages() {
  const { user } = useAuth();
  const { socket, online } = useSocket();
  const { users, nameOf } = useUsers();
  const [params, setParams] = useSearchParams();
  const [run] = useAction();
  const [convos, setConvos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [peerTyping, setPeerTyping] = useState(false);
  const peerId = params.get('to');
  const peerRef = useRef(peerId);
  peerRef.current = peerId;

  const loadConvos = () => run(async () => setConvos(await api.conversations(user._id)));
  useEffect(() => { loadConvos(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setMessages([]);
    setPeerTyping(false);
    if (peerId) run(async () => setMessages(await api.privateMessages(peerId, user._id)));
  }, [peerId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!socket) return undefined;
    const onMsg = (m) => {
      const n = norm(m);
      const other = n.senderId === user._id ? (m.recipientId || m.recipient) : n.senderId;
      if (other === peerRef.current || n.senderId === peerRef.current) {
        setMessages((prev) => (prev.some((x) => norm(x).id === n.id) ? prev : [...prev, m]));
      }
      loadConvos();
    };
    const onTyping = (d) => {
      if ((d.senderId || d.userId || d.from) === peerRef.current) setPeerTyping(!!d.isTyping);
    };
    const onErr = (e) => run(async () => { throw new Error(e?.message || e?.error || 'Message failed to send'); });
    socket.on('receive_private_message', onMsg);
    socket.on('private_typing', onTyping);
    socket.on('private_message_error', onErr);
    return () => {
      socket.off('receive_private_message', onMsg);
      socket.off('private_typing', onTyping);
      socket.off('private_message_error', onErr);
    };
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = ({ message, type, attachment }) => {
    socket?.emit('send_private_message', { recipientId: peerId, message, type, attachment });
    // Optimistic append in case the server only echoes to the recipient.
    setMessages((prev) => [...prev, { id: `tmp-${Date.now()}`, senderId: user._id, content: message, type, attachment, createdAt: new Date().toISOString(), tmp: true }]);
  };

  const open = (id) => setParams({ to: id });
  const peer = users.find((u) => u._id === peerId);
  const convoPeers = new Set(convos.map((c) => c._id));

  return (
    <>
      <PageHead title="Messages" sub="Direct conversations" />
      <div className="grid-chat">
        <div className="stack">
          <Card title="Conversations">
            {convos.length === 0 && <Empty>No conversations yet.</Empty>}
            <ul className="list">
              {convos.map((c) => (
                <li key={c._id} className={`item ${c._id === peerId ? 'sel' : ''}`} onClick={() => open(c._id)}>
                  <span className={`dot ${online.includes(c._id) ? 'on' : ''}`} />
                  <div className="grow">
                    <b>{c.participants?.find((p) => p._id === c._id)?.name || nameOf(c._id)}</b>
                    <div className="muted small clip">{c.lastMessage?.message || '📎 Attachment'}</div>
                  </div>
                  <small className="muted">{fmtTime(c.lastMessage?.createdAt)}</small>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Start a new chat">
            <select value="" onChange={(e) => e.target.value && open(e.target.value)}>
              <option value="">Choose a person…</option>
              {users.filter((u) => u._id !== user._id && !convoPeers.has(u._id)).map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </Card>
        </div>

        <Card title={peer ? peer.name : peerId ? nameOf(peerId) : 'Conversation'} actions={peerId && <span className="muted small">{online.includes(peerId) ? 'Online' : 'Offline'}</span>}>
          {!peerId ? <Empty>Pick a conversation or start a new one.</Empty> : (
            <ChatThread
              messages={messages}
              meId={user._id}
              nameOf={nameOf}
              onSend={send}
              onTyping={(isTyping) => socket?.emit('private_typing', { recipientId: peerId, isTyping })}
              typingLabel={peerTyping ? `${nameOf(peerId)} is typing…` : ''}
            />
          )}
        </Card>
      </div>
    </>
  );
}
