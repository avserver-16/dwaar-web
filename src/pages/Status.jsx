import { useEffect, useState } from 'react';
import { api, API_URL as BASE } from '../api';
import { useSocket } from '../context';
import { Card, PageHead, fmtTime } from '../components';

export default function Status() {
  const { connected, online } = useSocket();
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');

  const check = () => {
    setError('');
    api.health().then(setHealth).catch((e) => { setHealth(null); setError(e.message); });
  };
  useEffect(check, []);

  return (
    <>
      <PageHead title="Status" sub="Backend and realtime connection" />
      <div className="grid2">
        <Card title="API" actions={<button className="ghost" onClick={check}>Recheck</button>}>
          <dl className="kv">
            <dt>Base URL</dt><dd>{BASE}</dd>
            <dt>Health</dt><dd>{health ? <span className="ok-text">{health.status}</span> : <span className="err-text">{error || 'Checking…'}</span>}</dd>
            {health && <><dt>Uptime</dt><dd>{Math.round(health.uptime)} s</dd><dt>Server time</dt><dd>{fmtTime(health.timestamp)}</dd></>}
          </dl>
          <a href={`${BASE}/docs`} target="_blank" rel="noreferrer">Open interactive API docs →</a>
        </Card>
        <Card title="Realtime">
          <dl className="kv">
            <dt>Socket.IO</dt><dd>{connected ? <span className="ok-text">Connected</span> : <span className="err-text">Disconnected</span>}</dd>
            <dt>Users online</dt><dd>{online.length}</dd>
          </dl>
        </Card>
      </div>
    </>
  );
}
