import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useSocketStore } from '../stores/useSocketStore';
import { useUsersQuery, useUserDetailQuery } from '../queries/useUserQueries';
import {
  useFriendsQuery,
  useFriendRequestsQuery,
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
  useUnfriendMutation,
  useBlockUserMutation,
} from '../queries/useFriendQueries';
import { Card, Empty, PageHead } from '../components';

export default function Users() {
  const me = useAuthStore((s) => s.user);
  const online = useSocketStore((s) => s.online);
  const nav = useNavigate();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'friends' | 'requests'
  const [q, setQ] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);

  const { data: users = [], isLoading: usersLoading } = useUsersQuery();
  const { data: userDetail } = useUserDetailQuery(selectedUserId);

  const { data: friends = [] } = useFriendsQuery();
  const { data: friendRequests = { received: [], sent: [] } } = useFriendRequestsQuery();

  const sendFriendRequest = useSendFriendRequestMutation();
  const acceptFriendRequest = useAcceptFriendRequestMutation();
  const rejectFriendRequest = useRejectFriendRequestMutation();
  const unfriend = useUnfriendMutation();
  const blockUser = useBlockUserMutation();

  // Normalize friends ID set
  const friendIdSet = new Set(
    (Array.isArray(friends) ? friends : []).map((f) => (f.friend?._id || f.friend || f._id)?.toString())
  );

  // Normalize received and sent request maps
  const receivedRequests = Array.isArray(friendRequests?.received) ? friendRequests.received : [];
  const sentRequests = Array.isArray(friendRequests?.sent) ? friendRequests.sent : [];
  const sentRequestUserIds = new Set(
    sentRequests.map((r) => (r.recipient?._id || r.recipient)?.toString())
  );

  const filteredUsers = users.filter((u) => {
    const text = `${u.name} ${u.email} ${u.phone}`.toLowerCase();
    const matchesSearch = text.includes(q.toLowerCase());

    if (activeTab === 'friends') {
      return matchesSearch && friendIdSet.has(u._id.toString());
    }
    return matchesSearch;
  });

  return (
    <>
      <PageHead
        title="People & Friends"
        sub={`${users.length} members · ${online.length} online · ${friendIdSet.size} friends`}
      />

      <div className="section-tabs" style={{ marginBottom: '1rem' }}>
        <button
          className={activeTab === 'all' ? 'active' : ''}
          onClick={() => setActiveTab('all')}
        >
          All People ({users.length})
        </button>
        <button
          className={activeTab === 'friends' ? 'active' : ''}
          onClick={() => setActiveTab('friends')}
        >
          Friends ({friendIdSet.size})
        </button>
        <button
          className={activeTab === 'requests' ? 'active' : ''}
          onClick={() => setActiveTab('requests')}
        >
          Requests ({receivedRequests.length})
        </button>
      </div>

      {activeTab === 'requests' ? (
        <div className="stack">
          <Card title={`Pending Friend Requests (${receivedRequests.length})`}>
            {receivedRequests.length === 0 ? (
              <Empty>No incoming friend requests.</Empty>
            ) : (
              <ul className="list">
                {receivedRequests.map((req) => {
                  const requester = req.requester || {};
                  return (
                    <li key={req._id} className="item">
                      <div className="grow">
                        <b>{requester.name || 'Someone'}</b>
                        <div className="muted small">{requester.email}</div>
                      </div>
                      <div className="row">
                        <button
                          disabled={acceptFriendRequest.isPending}
                          onClick={() => acceptFriendRequest.mutate(req._id)}
                        >
                          Accept
                        </button>
                        <button
                          className="ghost"
                          disabled={rejectFriendRequest.isPending}
                          onClick={() => rejectFriendRequest.mutate(req._id)}
                        >
                          Decline
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {sentRequests.length > 0 && (
            <Card title={`Sent Requests (${sentRequests.length})`}>
              <ul className="list">
                {sentRequests.map((req) => {
                  const recipient = req.recipient || {};
                  return (
                    <li key={req._id} className="item">
                      <div className="grow">
                        <b>{recipient.name || 'Someone'}</b>
                        <div className="muted small">{recipient.email}</div>
                      </div>
                      <span className="muted small">Pending acceptance</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>
      ) : (
        <>
          <input
            className="search"
            placeholder="Search by name, email or phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <div className="grid2">
            <Card title={activeTab === 'friends' ? 'Friends Directory' : 'Community Directory'}>
              {usersLoading ? (
                <p className="muted">Loading directory…</p>
              ) : filteredUsers.length === 0 ? (
                <Empty>No matching people found.</Empty>
              ) : (
                <ul className="list">
                  {filteredUsers.map((u) => {
                    const isMe = u._id === me?._id;
                    const isOnline = online.includes(u._id);
                    const isFriend = friendIdSet.has(u._id.toString());
                    const hasSentRequest = sentRequestUserIds.has(u._id.toString());

                    return (
                      <li
                        key={u._id}
                        className={`item ${selectedUserId === u._id ? 'sel' : ''}`}
                        onClick={() => setSelectedUserId(u._id)}
                      >
                        <span className={`dot ${isOnline ? 'on' : ''}`} />
                        <div className="grow">
                          <b>
                            {u.name}
                            {isMe && ' (you)'}
                          </b>
                          <div className="muted small">
                            {u.email} {isFriend && '· Friend'}
                          </div>
                        </div>

                        {!isMe && (
                          <div className="row" onClick={(e) => e.stopPropagation()}>
                            {isFriend ? (
                              <button
                                className="ghost"
                                onClick={() => nav(`/messages?to=${u._id}`)}
                              >
                                Message
                              </button>
                            ) : hasSentRequest ? (
                              <span className="muted small">Requested</span>
                            ) : (
                              <button
                                className="ghost"
                                disabled={sendFriendRequest.isPending}
                                onClick={() => sendFriendRequest.mutate(u._id)}
                              >
                                Add Friend
                              </button>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card title="Profile Details">
              {!userDetail ? (
                <Empty>Select a person from the list to see their details.</Empty>
              ) : (
                <div className="stack">
                  <dl className="kv">
                    <dt>Name</dt>
                    <dd>{userDetail.name}</dd>
                    <dt>Email</dt>
                    <dd>{userDetail.email}</dd>
                    <dt>Phone</dt>
                    <dd>{userDetail.phone}</dd>
                    <dt>Location</dt>
                    <dd>
                      {userDetail.location
                        ? [
                            userDetail.location.city,
                            userDetail.location.region,
                            userDetail.location.country,
                          ]
                            .filter(Boolean)
                            .join(', ') ||
                          `${userDetail.location.latitude}, ${userDetail.location.longitude}`
                        : '—'}
                    </dd>
                    <dt>Rooms joined</dt>
                    <dd>{userDetail.joinedRooms?.length ?? 0}</dd>
                  </dl>

                  {userDetail._id !== me?._id && (
                    <div className="row wrap" style={{ marginTop: '1rem' }}>
                      {friendIdSet.has(userDetail._id.toString()) ? (
                        <>
                          <button onClick={() => nav(`/messages?to=${userDetail._id}`)}>
                            Start Chat
                          </button>
                          <button
                            className="ghost danger-text"
                            disabled={unfriend.isPending}
                            onClick={() => unfriend.mutate(userDetail._id)}
                          >
                            Unfriend
                          </button>
                        </>
                      ) : (
                        <button
                          disabled={sendFriendRequest.isPending || sentRequestUserIds.has(userDetail._id.toString())}
                          onClick={() => sendFriendRequest.mutate(userDetail._id)}
                        >
                          {sentRequestUserIds.has(userDetail._id.toString()) ? 'Request Sent' : 'Add Friend'}
                        </button>
                      )}

                      <button
                        className="ghost danger-text"
                        disabled={blockUser.isPending}
                        onClick={() => blockUser.mutate(userDetail._id)}
                      >
                        Block
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
