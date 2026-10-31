import { API_URL as BASE } from '../api';
import { useSocketStore } from '../stores/useSocketStore';
import { useHealthQuery } from '../queries/useHealthQuery';
import { Card, PageHead, fmtTime } from '../components';

export default function Status() {
  const connected = useSocketStore((s) => s.connected);
  const online = useSocketStore((s) => s.online);
  const lastLocation = useSocketStore((s) => s.lastLocation);

  const { data: health, error, isLoading, refetch, isFetching } = useHealthQuery();

  return (
    <>
      <PageHead
        title="System Status"
        sub="Backend connectivity, health checks, and Socket.IO connection monitoring"
      />

      <div className="grid2">
        <Card
          title="Backend API"
          actions={
            <button className="ghost" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? 'Checking…' : 'Recheck'}
            </button>
          }
        >
          <dl className="kv">
            <dt>Base URL</dt>
            <dd>{BASE}</dd>

            <dt>Health Status</dt>
            <dd>
              {isLoading ? (
                <span className="muted">Checking…</span>
              ) : health ? (
                <span className="ok-text">{health.status || 'OK'}</span>
              ) : (
                <span className="err-text">{error?.message || 'Unavailable'}</span>
              )}
            </dd>

            {health && (
              <>
                <dt>Uptime</dt>
                <dd>{Math.round(health.uptime)} seconds</dd>
                <dt>Server Timestamp</dt>
                <dd>{fmtTime(health.timestamp)}</dd>
              </>
            )}
          </dl>

          <a href={`${BASE}/docs`} target="_blank" rel="noreferrer" style={{ marginTop: '0.75rem', display: 'inline-block' }}>
            Open interactive API documentation (/docs) →
          </a>
        </Card>

        <Card title="Real-Time Engine">
          <dl className="kv">
            <dt>Socket.IO</dt>
            <dd>
              {connected ? (
                <span className="ok-text">Connected</span>
              ) : (
                <span className="err-text">Disconnected</span>
              )}
            </dd>

            <dt>Users Online</dt>
            <dd>{online.length} user(s)</dd>

            <dt>Local GPS Synced</dt>
            <dd>
              {lastLocation
                ? `${lastLocation.lat.toFixed(4)}, ${lastLocation.lng.toFixed(4)}`
                : 'Not synced'}
            </dd>
          </dl>
        </Card>
      </div>
    </>
  );
}
