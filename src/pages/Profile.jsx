import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuthStore } from '../stores/useAuthStore';
import { useSocketStore } from '../stores/useSocketStore';
import {
  useUpdateUserMutation,
  useSaveLocationMutation,
  useDeleteUserMutation,
} from '../queries/useAuthQueries';
import { Card, Field, PageHead, fmtTime } from '../components';
import { toast } from '../stores/useToastStore';

const EMPTY_LOC = { latitude: '', longitude: '', city: '', region: '', country: '' };

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const updateSocketLocation = useSocketStore((s) => s.updateLocation);

  const updateUserMutation = useUpdateUserMutation();
  const saveLocationMutation = useSaveLocationMutation();
  const deleteUserMutation = useDeleteUserMutation();

  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [loc, setLoc] = useState(user?.location ? { ...EMPTY_LOC, ...user.location } : EMPTY_LOC);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email });
      if (user.location) setLoc({ ...EMPTY_LOC, ...user.location });
    }
  }, [user]);

  useEffect(() => {
    api.getLocation()
      .then((r) => r.location && setLoc({ ...EMPTY_LOC, ...r.location }))
      .catch(() => {});
  }, []);

  const saveProfile = (e) => {
    e.preventDefault();
    if (!user?._id) return;
    updateUserMutation.mutate({ id: user._id, data: form });
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast('Geolocation is not supported by your browser', 'err');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const coords = { latitude: p.coords.latitude, longitude: p.coords.longitude };
        setLoc((l) => ({ ...l, ...coords }));
        updateSocketLocation(p.coords.latitude, p.coords.longitude, p.coords.accuracy);
        toast('Device coordinates acquired', 'ok');
      },
      (err) => toast(err.message, 'err')
    );
  };

  const saveLocation = (e) => {
    e.preventDefault();
    const payload = {
      ...loc,
      latitude: Number(loc.latitude),
      longitude: Number(loc.longitude),
    };

    saveLocationMutation.mutate(payload, {
      onSuccess: () => {
        updateSocketLocation(payload.latitude, payload.longitude);
      },
    });
  };

  const removeAccount = () => {
    if (!window.confirm('Permanently delete your account? This cannot be undone.')) return;
    deleteUserMutation.mutate(user._id);
  };

  const setL = (k) => (e) => setLoc({ ...loc, [k]: e.target.value });

  return (
    <>
      <PageHead
        title="Profile"
        sub={`Member since ${fmtTime(user?.createdAt)}`}
      />

      <div className="grid2">
        <Card title="Account Information">
          <form onSubmit={saveProfile} className="stack">
            <Field label="Full Name">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>

            <Field label="Email Address">
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>

            <Field label="Phone (Read-only)">
              <input disabled value={user?.phone || ''} />
            </Field>

            <button disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </Card>

        <Card
          title="My Location"
          actions={
            <button className="ghost" type="button" onClick={detectLocation}>
              Use my device
            </button>
          }
        >
          <form onSubmit={saveLocation} className="stack">
            <div className="two">
              <Field label="Latitude">
                <input
                  required
                  type="number"
                  step="any"
                  value={loc.latitude}
                  onChange={setL('latitude')}
                />
              </Field>

              <Field label="Longitude">
                <input
                  required
                  type="number"
                  step="any"
                  value={loc.longitude}
                  onChange={setL('longitude')}
                />
              </Field>
            </div>

            <div className="two">
              <Field label="City">
                <input value={loc.city || ''} onChange={setL('city')} />
              </Field>

              <Field label="Region / State">
                <input value={loc.region || ''} onChange={setL('region')} />
              </Field>
            </div>

            <Field label="Country">
              <input value={loc.country || ''} onChange={setL('country')} />
            </Field>

            {loc.updatedAt && (
              <small className="muted">Last updated {fmtTime(loc.updatedAt)}</small>
            )}

            <button disabled={saveLocationMutation.isPending}>
              {saveLocationMutation.isPending ? 'Saving…' : 'Save location'}
            </button>
          </form>
        </Card>
      </div>

      <Card title="Danger Zone">
        <p className="muted">Deleting your account removes all your data permanently from Dwaar.</p>
        <button
          className="danger"
          type="button"
          disabled={deleteUserMutation.isPending}
          onClick={removeAccount}
        >
          {deleteUserMutation.isPending ? 'Deleting…' : 'Delete account'}
        </button>
      </Card>
    </>
  );
}
