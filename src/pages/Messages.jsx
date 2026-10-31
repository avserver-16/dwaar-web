import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuthStore } from '../stores/useAuthStore';
import { useSocketStore } from '../stores/useSocketStore';
import { useConversationsQuery } from '../queries/useMessageQueries';
import { useFriendsQuery, useSendFriendRequestMutation } from '../queries/useFriendQueries';
import { Card, ChatThread, Empty, PageHead, norm, useUsers, fmtTime } from '../components';
import { toast } from '../stores/useToastStore';

export default function Messages() {
  const user = useAuthStore((s) => s.user);
  const socket = useSocketStore((s) => s.socket);
  const online = useSocketStore((s) => s.online);
  const sendPrivateMessage = useSocketStore((s) => s.sendPrivateMessage);
  const sendPrivateTyping = useSocketStore((s) => s.sendPrivateTyping);

  const { users, nameOf } = useUsers();
  const [params, setParams] = useSearchParams();

  const peerId = params.get('to');
  const peerRef = useRef(peerId);
  peerRef.current = peerId;

  const { data: convos = [], refetch: refetchConvos, isLoading: convosLoading } = useConversationsQuery(user?._id);
  const { data: friendsList = [] } = useFriendsQuery();
  const sendFriendRequestMutation = useSendFriendRequestMutation();

  const [messages, setMessages] = useState([]);
  const [peerTyping, setPeerTyping] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [friendshipError, setFriendshipError] = useState(null);

  // Check if peer is an accepted friend
  const isFriend = Array.isArray(friendsList) && friendsList.some((f) => {
    const friendId = f.friend?._id || f.friend || f._id;
    return friendId === peerId;
  });

  // Fetch messages when peerId changes
  useEffect(() => {
    setMessages([]);
    setPeerTyping(false);
    setFriendshipError(null);

    if (!peerId || !user?._id) return;

    let cancelled = false;
    setLoadingMessages(true);

    api.privateMessages(peerId, user._id)
      .then((data) => {
        if (!cancelled) {
          setMessages(Array.isArray(data) ? data : []);
          setFriendshipError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err.message.includes('friend') || err.message.includes('NOT_FRIENDS')) {
            setFriendshipError('NOT_FRIENDS');
          } else if (err.message.includes('blocked') || err.message.includes('BLOCKED')) {
            setFriendshipError('BLOCKED');
          } else {
            toast(err.message, 'err');
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });

    return () => {
      cancelled = true;
    };
  }, [peerId, user?._id]);

  // Real-time private message delivery and typing indicators
  useEffect(() => {
    if (!socket) return undefined;

    const onMsg = (m) => {
      const n = norm(m);
      const other = n.senderId === user?._id ? (m.toUserId || m.recipientId || m.recipient) : n.senderId;

      if (other === peerRef.current || n.senderId === peerRef.current) {
        setMessages((prev) => {
          if (prev.some((x) => norm(x).id === n.id)) return prev;
          return [...prev, m];
        });
      }
      refetchConvos();
    };

    const onTyping = (d) => {
      const from = d.fromUserId || d.senderId || d.userId || d.from;
      if (from === peerRef.current) {
        setPeerTyping(!!d.isTyping);
      }
    };

    socket.on('receive_private_message', onMsg);
    socket.on('private_typing', onTyping);

    return () => {
      socket.off('receive_private_message', onMsg);
      socket.off('private_typing', onTyping);
    };
  }, [socket, user?._id, refetchConvos]);

  const handleSend = ({ message, type, attachment }) => {
    if (!peerId) return;

    const success = sendPrivateMessage({
      toUserId: peerId,
      message,
      type,
      attachment,
    });

    if (success) {
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
    if (peerId) {
      sendPrivateTyping(peerId, isTyping);
    }
  };

  const open = (id) => setParams({ to: id });
  const peer = users.find((u) => u._id === peerId);
  const convoPeers = new Set(convos.map((c) => c._id));
  const isPeerOnline = peerId ? online.includes(peerId) : false;

  return (
    <>
      <PageHead
        title="Messages"
        sub="Encrypted 1-on-1 private messaging between verified friends"
      />

      <div className="grid-chat">
        <div className="stack">
          <Card title="Conversations">
            {convosLoading ? (
              <p className="muted">Loading conversations…</p>
            ) : convos.length === 0 ? (
              <Empty>No conversations yet.</Empty>
            ) : (
              <ul className="list">
                {convos.map((c) => {
                  const partner = c.participants?.find((p) => p._id !== user._id) || c;
                  const partnerId = partner._id || c._id;
                  const isPartnerOnline = online.includes(partnerId);

                  return (
                    <li
                      key={c._id}
                      className={`item ${partnerId === peerId ? 'sel' : ''}`}
                      onClick={() => open(partnerId)}
                    >
                      <span className={`dot ${isPartnerOnline ? 'on' : ''}`} />
                      <div className="grow">
                        <b>{partner.name || nameOf(partnerId)}</b>
                        <div className="muted small clip">
                          {c.lastMessage?.message || (c.lastMessage?.attachment ? 'Attachment' : '—')}
                        </div>
                      </div>
                      <small className="muted">{fmtTime(c.lastMessage?.createdAt)}</small>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Start a new chat">
            <select value="" onChange={(e) => e.target.value && open(e.target.value)}>
              <option value="">Choose a person…</option>
              {users
                .filter((u) => u._id !== user?._id && !convoPeers.has(u._id))
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </Card>
        </div>

        <Card
          title={peer ? peer.name : peerId ? nameOf(peerId) : 'Conversation'}
          actions={
            peerId && (
              <span className={`pill-badge ${isPeerOnline ? 'online' : 'offline'}`}>
                {isPeerOnline ? 'Online' : 'Offline'}
              </span>
            )
          }
        >
          {!peerId ? (
            <Empty>Pick a conversation or select someone from People to start messaging.</Empty>
          ) : friendshipError === 'NOT_FRIENDS' ? (
            <div className="stack center pad">
              <p className="muted">
                Dwaar requires friendship verification before private messages can be sent.
              </p>
              <button
                disabled={sendFriendRequestMutation.isPending}
                onClick={() => sendFriendRequestMutation.mutate(peerId)}
              >
                {sendFriendRequestMutation.isPending ? 'Sending…' : 'Send Friend Request'}
              </button>
            </div>
          ) : friendshipError === 'BLOCKED' ? (
            <div className="stack center pad">
              <p className="err-text">This conversation is not accessible because a user is blocked.</p>
            </div>
          ) : loadingMessages ? (
            <p className="muted pad">Loading messages…</p>
          ) : (
            <ChatThread
              messages={messages}
              meId={user?._id}
              nameOf={nameOf}
              onSend={handleSend}
              onTyping={handleTyping}
              typingLabel={peerTyping ? `${peer?.name || nameOf(peerId)} is typing…` : ''}
              empty="No messages in this conversation yet. Say hello!"
            />
          )}
        </Card>
      </div>
    </>
  );
}
