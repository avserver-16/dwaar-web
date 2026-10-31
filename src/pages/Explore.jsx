import { useState } from 'react';
import { api } from '../api';
import { useAuthStore } from '../stores/useAuthStore';
import { useSocketStore } from '../stores/useSocketStore';
import { useJoinRoomMutation } from '../queries/useRoomQueries';
import { toast } from '../stores/useToastStore';
import { Card, Empty, Field, PageHead } from '../components';

function Buildings({ list }) {
  if (!list) return null;
  if (list.length === 0) return <Empty>No buildings found in this radius.</Empty>;
  return (
    <ul className="list">
      {list.map((b, i) => (
        <li key={b.id || i} className="item">
          <div className="grow">
            <b>{b.name || 'Unnamed building'}</b>
            <div className="muted small">
              {b.latitude}, {b.longitude}
            </div>
          </div>
          <a
            className="ghost btn"
            target="_blank"
            rel="noreferrer"
            href={`https://www.openstreetmap.org/?mlat=${b.latitude}&mlon=${b.longitude}#map=18/${b.latitude}/${b.longitude}`}
          >
            Map
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function Explore() {
  const user = useAuthStore((s) => s.user);
  const updateLocation = useSocketStore((s) => s.updateLocation);
  const joinRoomMutation = useJoinRoomMutation();

  const [radius, setRadius] = useState(500);
  const [mineLoading, setMineLoading] = useState(false);
  const [mine, setMine] = useState(null);

  const [q, setQ] = useState({
    lat: user?.location?.latitude ?? '',
    lon: user?.location?.longitude ?? '',
    radius: 500,
  });

  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [buildings, setBuildings] = useState(null);
  const [rooms, setRooms] = useState(null);

  const setQv = (k) => (e) => setQ({ ...q, [k]: e.target.value });
  const body = () => ({ lat: Number(q.lat), lon: Number(q.lon), radius: Number(q.radius) });

  const useDevice = () => {
    if (!navigator.geolocation) {
      toast('Geolocation is not supported by your browser', 'err');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setQ((s) => ({ ...s, lat: p.coords.latitude, lon: p.coords.longitude }));
        updateLocation(p.coords.latitude, p.coords.longitude, p.coords.accuracy);
        toast('Device coordinates acquired and synced', 'ok');
      },
      (e) => toast(e.message, 'err')
    );
  };

  const findSavedBuildings = async (e) => {
    e.preventDefault();
    if (!user?.location) return;
    setMineLoading(true);
    try {
      const res = await api.nearbyBuildings(Number(radius));
      setMine(res);
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setMineLoading(false);
    }
  };

  const findNearbyBuildings = async () => {
    setBuildingsLoading(true);
    try {
      const res = await api.spatialNearby(body());
      setBuildings(res?.data || []);
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setBuildingsLoading(false);
    }
  };

  const findNearbyRooms = async () => {
    setRoomsLoading(true);
    try {
      const res = await api.spatialNearbyRooms(body());
      setRooms(res);
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setRoomsLoading(false);
    }
  };

  return (
    <>
      <PageHead title="Explore" sub="Hyperlocal building and room discovery based on proximity" />

      <Card title="Around my saved location">
        {!user?.location && <p className="muted">Save a location on your Profile first.</p>}
        <form className="row wrap" onSubmit={findSavedBuildings}>
          <Field label="Radius (m)">
            <input
              type="number"
              min="1"
              max="50000"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
            />
          </Field>
          <button disabled={mineLoading || !user?.location}>
            {mineLoading ? 'Searching…' : 'Find buildings'}
          </button>
        </form>
        {mine && (
          <p className="muted small">
            {mine.buildingCount} building(s) within {mine.radius} m of {mine.userLocation?.city || 'you'}
          </p>
        )}
        <Buildings list={mine?.buildings} />
      </Card>

      <Card title="Search any coordinates">
        <details className="coordinate-dropdown" open>
          <summary>
            <span>Configure search coordinates</span>
            <span className="dropdown-arrow">⌄</span>
          </summary>

          <div className="coordinate-content">
            <div className="row wrap">
              <Field label="Latitude">
                <input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={q.lat}
                  onChange={setQv('lat')}
                />
              </Field>

              <Field label="Longitude">
                <input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={q.lon}
                  onChange={setQv('lon')}
                />
              </Field>

              <Field label="Radius (m)">
                <input
                  type="number"
                  min="1"
                  max="50000"
                  value={q.radius}
                  onChange={setQv('radius')}
                />
              </Field>

              <button className="ghost" type="button" onClick={useDevice}>
                Use my device
              </button>
            </div>

            <div className="row wrap coordinate-actions">
              <button
                disabled={buildingsLoading || q.lat === '' || q.lon === ''}
                onClick={findNearbyBuildings}
              >
                {buildingsLoading ? 'Searching…' : 'Nearby buildings'}
              </button>

              <button
                disabled={roomsLoading || q.lat === '' || q.lon === ''}
                onClick={findNearbyRooms}
              >
                {roomsLoading ? 'Searching…' : 'Nearby rooms'}
              </button>
            </div>
          </div>
        </details>
      </Card>

      {buildings && (
        <Card title={`Buildings (${buildings.length})`}>
          <details className="coordinate-dropdown" open>
            <summary>
              <span>View searched buildings</span>
              <span className="dropdown-arrow">⌄</span>
            </summary>

            <div className="coordinate-content">
              <Buildings list={buildings} />
            </div>
          </details>
        </Card>
      )}

      {rooms && (
        <Card title={`Rooms (${rooms.summary?.total_rooms ?? rooms.data?.length ?? 0})`}>
          <details className="coordinate-dropdown" open>
            <summary>
              <span>View nearby rooms</span>
              <span className="dropdown-arrow">⌄</span>
            </summary>

            <div className="coordinate-content">
              {rooms.summary && (
                <p className="muted small">
                  {rooms.summary.full_rooms} full · {rooms.summary.partial_rooms} partial
                </p>
              )}

              {!rooms.data || rooms.data.length === 0 ? (
                <Empty>No rooms nearby.</Empty>
              ) : (
                <ul className="list">
                  {rooms.data.map((r) => (
                    <li key={r._id} className="item">
                      <div className="grow">
                        <b>{r.name}</b>
                        <div className="muted small">{r.description || r.category}</div>
                      </div>

                      <button
                        type="button"
                        className="ghost"
                        disabled={joinRoomMutation.isPending}
                        onClick={() => joinRoomMutation.mutate(r._id)}
                      >
                        {joinRoomMutation.isPending ? 'Joining…' : 'Join'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        </Card>
      )}
    </>
  );
}
