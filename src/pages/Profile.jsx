import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context';
import { Card, Field, PageHead, useAction, fmtTime } from '../components';

const EMPTY_LOC = { latitude: '', longitude: '', city: '', region: '', country: '' };

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const [run, busy] = useAction();
  const [form, setForm] = useState({ name: user.name, email: user.email });
  const [loc, setLoc] = useState(user.location ? { ...EMPTY_LOC, ...user.location } : EMPTY_LOC);

  useEffect(() => {
    api.getLocation().then((r) => r.location && setLoc({ ...EMPTY_LOC, ...r.location })).catch(() => {});
  }, []);

  const save = (e) => {
    e.preventDefault();
    run(async () => { await api.updateUser(user._id, form); await refreshUser(); }, 'Profile updated');
  };

  const detect = () => {
    if (!navigator.geolocation) return run(async () => { throw new Error('Geolocation is not supported'); });
    navigator.geolocation.getCurrentPosition(
      (p) => setLoc((l) => ({ ...l, latitude: p.coords.latitude, longitude: p.coords.longitude })),
      (err) => run(async () => { throw new Error(err.message); }),
    );
  };

  const saveLoc = (e) => {
    e.preventDefault();
    run(async () => {
      await api.addLocation({ ...loc, latitude: Number(loc.latitude), longitude: Number(loc.longitude) });
      await refreshUser();
    }, 'Location saved');
  };

  const remove = () => {
    if (!window.confirm('Permanently delete your account? This cannot be undone.')) return;
    run(async () => { await api.deleteUser(user._id); await logout(); }, 'Account deleted');
  };

  const setL = (k) => (e) => setLoc({ ...loc, [k]: e.target.value });

  return (
    <>
      <PageHead title="Profile" sub={`Member since ${fmtTime(user.createdAt)}`} />
      <div className="grid2">
        <Card title="Account">
          <form onSubmit={save} className="stack">
            <Field label="Name"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email"><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone"><input disabled value={user.phone} /></Field>
            <button disabled={busy}>Save changes</button>
          </form>
        </Card>

        <Card title="My location" actions={<button className="ghost" type="button" onClick={detect}>Use my device</button>}>
          <form onSubmit={saveLoc} className="stack">
            <div className="two">
              <Field label="Latitude"><input required type="number" step="any" value={loc.latitude} onChange={setL('latitude')} /></Field>
              <Field label="Longitude"><input required type="number" step="any" value={loc.longitude} onChange={setL('longitude')} /></Field>
            </div>
            <div className="two">
              <Field label="City"><input value={loc.city} onChange={setL('city')} /></Field>
              <Field label="Region"><input value={loc.region} onChange={setL('region')} /></Field>
            </div>
            <Field label="Country"><input value={loc.country} onChange={setL('country')} /></Field>
            {loc.updatedAt && <small className="muted">Last updated {fmtTime(loc.updatedAt)}</small>}
            <button disabled={busy}>Save location</button>
          </form>
        </Card>
      </div>

      <Card title="Danger zone">
        <p className="muted">Deleting your account removes your profile permanently.</p>
        <button className="danger" onClick={remove} disabled={busy}>Delete account</button>
      </Card>
    </>
  );
}
