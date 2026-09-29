import { useState } from 'react';
import { useDb } from '../hooks.js';
import { donorService, locationService, pickupService } from '../services/index.js';
import { fmtDateTime, toLocalInput } from '../format.js';
import { PickupStatus } from '../domain/models.js';
import StatusChip from './StatusChip.jsx';

const FOOD_TYPES = ['Cooked meals', 'Rice and biryani', 'Curries and gravies', 'Breads and snacks', 'Sweets', 'Fruits and vegetables', 'Packaged food'];
const STEPS = [
  [PickupStatus.PENDING, 'Requested'],
  [PickupStatus.SCHEDULED, 'Vehicle assigned'],
  [PickupStatus.IN_TRANSIT, 'On the way'],
  [PickupStatus.COMPLETED, 'Collected'],
];

export default function DonorPortal() {
  useDb();
  const donors = donorService.listDonors();
  const [donorId, setDonorId] = useState(donors[0]?.donorId ?? null);
  const [registering, setRegistering] = useState(donors.length === 0);
  const donor = donors.find((d) => d.donorId === donorId) ?? donors[0] ?? null;

  return (
    <div className="donor-grid">
      <section className="panel">
        <div className="panel-head">
          <h2>{registering ? 'Register a donor' : 'Request a pickup'}</h2>
          {donors.length > 0 && (
            <button className="link" onClick={() => setRegistering((r) => !r)}>
              {registering ? 'Back to pickup request' : 'Register a new donor'}
            </button>
          )}
        </div>

        {registering ? (
          <RegisterForm
            onDone={(d) => {
              setDonorId(d.donorId);
              setRegistering(false);
            }}
          />
        ) : (
          <>
            <label className="field">
              <span>Donating as</span>
              <select value={donor?.donorId ?? ''} onChange={(e) => setDonorId(Number(e.target.value))}>
                {donors.map((d) => (
                  <option key={d.donorId} value={d.donorId}>
                    {d.donorName}
                  </option>
                ))}
              </select>
            </label>
            {donor && <RequestForm key={donor.donorId} donor={donor} />}
          </>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>{donor && !registering ? `${donor.donorName}'s pickups` : 'Your pickups'}</h2>
        </div>
        {donor && !registering ? <MyRequests donorId={donor.donorId} /> : <p className="empty">Register a donor to start requesting pickups.</p>}
      </section>
    </div>
  );
}

function RegisterForm({ onDone }) {
  const [f, setF] = useState({ donorName: '', donorPhone: '', donorAddress: '', functionHallAddress: '', lat: '12.9716', lng: '77.5946' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const useMyLocation = async () => {
    try {
      const p = await locationService.getCurrentPosition();
      setF((s) => ({ ...s, lat: String(p.lat), lng: String(p.lng) }));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    try {
      onDone(donorService.registerDonor(f));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={submit} className="stack">
      <div className="row2">
        <label className="field"><span>Name</span><input value={f.donorName} onChange={set('donorName')} autoComplete="name" /></label>
        <label className="field"><span>Phone</span><input value={f.donorPhone} onChange={set('donorPhone')} inputMode="tel" autoComplete="tel" /></label>
      </div>
      <label className="field"><span>Home address</span><input value={f.donorAddress} onChange={set('donorAddress')} /></label>
      <label className="field"><span>Function hall address</span><input value={f.functionHallAddress} onChange={set('functionHallAddress')} /></label>
      <div className="row3">
        <label className="field"><span>Latitude</span><input value={f.lat} onChange={set('lat')} inputMode="decimal" /></label>
        <label className="field"><span>Longitude</span><input value={f.lng} onChange={set('lng')} inputMode="decimal" /></label>
        <button type="button" className="btn ghost" onClick={useMyLocation}>Use my location</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn primary">Save donor</button>
    </form>
  );
}

function RequestForm({ donor }) {
  const tomorrowNoon = new Date();
  tomorrowNoon.setDate(tomorrowNoon.getDate() + 1);
  tomorrowNoon.setHours(12, 0, 0, 0);

  const [f, setF] = useState({
    foodType: FOOD_TYPES[0],
    foodQty: '',
    qtyOfFoodVessels: '',
    pickupAddress: donor.functionHallAddress,
    pickupDateTime: toLocalInput(tomorrowNoon),
  });
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    try {
      const r = pickupService.createRequest({ ...f, donorId: donor.donorId });
      setDone(r);
      setError('');
      setF((s) => ({ ...s, foodQty: '', qtyOfFoodVessels: '' }));
    } catch (err) {
      setDone(null);
      setError(err.message);
    }
  };

  return (
    <form onSubmit={submit} className="stack">
      <label className="field">
        <span>Type of food</span>
        <select value={f.foodType} onChange={set('foodType')}>{FOOD_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
      </label>
      <div className="row2">
        <label className="field"><span>Total quantity (kg)</span><input type="number" min="1" step="0.5" value={f.foodQty} onChange={set('foodQty')} /></label>
        <label className="field"><span>Number of vessels</span><input type="number" min="1" step="1" value={f.qtyOfFoodVessels} onChange={set('qtyOfFoodVessels')} /></label>
      </div>
      <label className="field"><span>Pickup address</span><input value={f.pickupAddress} onChange={set('pickupAddress')} /></label>
      <label className="field"><span>Pickup date and time</span><input type="datetime-local" value={f.pickupDateTime} onChange={set('pickupDateTime')} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      {done && <p className="ok" role="status">Request #{done.requestId} sent. We will text you when a vehicle is assigned.</p>}
      <button className="btn primary">Send pickup request</button>
    </form>
  );
}

function MyRequests({ donorId }) {
  const list = pickupService.listForDonor(donorId).reverse();
  if (!list.length) return <p className="empty">No pickups yet. Send a request and it will show up here.</p>;

  return (
    <ul className="cards">
      {list.map((r) => {
        const idx = STEPS.findIndex(([s]) => s === r.status);
        const cancellable = [PickupStatus.PENDING, PickupStatus.SCHEDULED].includes(r.status);
        return (
          <li key={r.requestId} className="card">
            <div className="card-top">
              <strong>#{r.requestId} · {r.foodType}</strong>
              <StatusChip status={r.status} />
            </div>
            <p className="muted">{r.foodQty} kg in {r.qtyOfFoodVessels} {r.qtyOfFoodVessels === 1 ? 'vessel' : 'vessels'}, {fmtDateTime(r.pickupDateTime)}</p>
            {r.vehicleAssign && <p className="muted">Vehicle: {r.vehicleAssign}</p>}
            {idx >= 0 && (
              <ol className="steps" aria-label="Pickup progress">
                {STEPS.map(([s, label], i) => (
                  <li key={s} className={i <= idx ? 'done' : ''}>{label}</li>
                ))}
              </ol>
            )}
            {cancellable && (
              <button
                className="link danger"
                onClick={() => {
                  try { pickupService.cancel(r.requestId); } catch (err) { window.alert(err.message); }
                }}
              >
                Cancel this pickup
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
