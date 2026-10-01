import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context';
import { Card, Empty, Field, PageHead, useAction } from '../components';

function Buildings({ list }) {
  if (!list) return null;
  if (list.length === 0) return <Empty>No buildings found in this radius.</Empty>;
  return (
    <ul className="list">
      {list.map((b, i) => (
        <li key={b.id || i} className="item">
          <div className="grow"><b>{b.name || 'Unnamed building'}</b>
            <div className="muted small">{b.latitude}, {b.longitude}</div></div>
          <a className="ghost btn" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${b.latitude}&mlon=${b.longitude}#map=18/${b.latitude}/${b.longitude}`}>Map</a>
        </li>
      ))}
    </ul>
  );
}

export default function Explore() {
  const { user } = useAuth();
  const [run, busy] = useAction();
  const [radius, setRadius] = useState(500);
  const [mine, setMine] = useState(null);

  const [q, setQ] = useState({ lat: user.location?.latitude ?? '', lon: user.location?.longitude ?? '', radius: 500 });
  const [buildings, setBuildings] = useState(null);
  const [rooms, setRooms] = useState(null);

  const setQv = (k) => (e) => setQ({ ...q, [k]: e.target.value });
  const body = () => ({ lat: Number(q.lat), lon: Number(q.lon), radius: Number(q.radius) });

  const useDevice = () => navigator.geolocation?.getCurrentPosition(
    (p) => setQ((s) => ({ ...s, lat: p.coords.latitude, lon: p.coords.longitude })),
    (e) => run(async () => { throw new Error(e.message); }),
  );

  const joinRoom = (id) => run(() => api.joinRoom(id), 'Joined room');

  return (
    <>
      <PageHead title="Explore" sub="Find buildings and rooms around you" />

      <Card title="Around my saved location">
        {!user.location && <p className="muted">Save a location on your Profile first.</p>}
        <form className="row wrap" onSubmit={(e) => { e.preventDefault(); run(async () => setMine(await api.nearbyBuildings(Number(radius)))); }}>
          <Field label="Radius (m)"><input type="number" min="1" max="50000" value={radius} onChange={(e) => setRadius(e.target.value)} /></Field>
          <button disabled={busy || !user.location}>Find buildings</button>
        </form>
        {mine && <p className="muted small">{mine.buildingCount} building(s) within {mine.radius} m of {mine.userLocation?.city || 'you'}</p>}
        <Buildings list={mine?.buildings} />
      </Card>

      <Card title="Search any coordinates">
        <div className="row wrap">
          <Field label="Latitude"><input type="number" step="any" min="-90" max="90" value={q.lat} onChange={setQv('lat')} /></Field>
          <Field label="Longitude"><input type="number" step="any" min="-180" max="180" value={q.lon} onChange={setQv('lon')} /></Field>
          <Field label="Radius (m)"><input type="number" min="1" max="50000" value={q.radius} onChange={setQv('radius')} /></Field>
          <button className="ghost" type="button" onClick={useDevice}>Use my device</button>
        </div>
        <div className="row wrap">
          <button disabled={busy || q.lat === '' || q.lon === ''} onClick={() => run(async () => setBuildings((await api.spatialNearby(body())).data))}>Nearby buildings</button>
          <button disabled={busy || q.lat === '' || q.lon === ''} onClick={() => run(async () => setRooms(await api.spatialNearbyRooms(body())))}>Nearby rooms</button>
        </div>
      </Card>

      {buildings && <Card title={`Buildings (${buildings.length})`}><Buildings list={buildings} /></Card>}

      {rooms && (
        <Card title={`Rooms (${rooms.summary?.total_rooms ?? rooms.data.length})`}>
          {rooms.summary && <p className="muted small">{rooms.summary.full_rooms} full · {rooms.summary.partial_rooms} partial</p>}
          {rooms.data.length === 0 && <Empty>No rooms nearby.</Empty>}
          <ul className="list">
            {rooms.data.map((r) => (
              <li key={r._id} className="item">
                <div className="grow"><b>{r.name}</b><div className="muted small">{r.description}</div></div>
                <button className="ghost" onClick={() => joinRoom(r._id)}>Join</button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
