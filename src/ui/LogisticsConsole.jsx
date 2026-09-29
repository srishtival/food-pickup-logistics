import { useState } from 'react';
import { useDb } from '../hooks.js';
import { logisticsService, notificationService, pickupService, recommender } from '../services/index.js';
import { PickupStatus, VEHICLE_SPECS, VOLUNTEERS } from '../domain/models.js';
import { fmtDateTime, toLocalInput } from '../format.js';
import StatusChip from './StatusChip.jsx';

const GROUPS = [
  [PickupStatus.PENDING, 'Waiting for a vehicle'],
  [PickupStatus.SCHEDULED, 'Vehicle assigned'],
  [PickupStatus.IN_TRANSIT, 'On the way'],
  [PickupStatus.COMPLETED, 'Collected'],
  [PickupStatus.CANCELLED, 'Cancelled'],
];

export default function LogisticsConsole() {
  useDb();
  const requests = pickupService.listRequests();
  const vehicles = logisticsService.listVehicles();
  const [selectedId, setSelectedId] = useState(null);
  const selected =
    requests.find((r) => r.requestId === selectedId) ?? requests.find((r) => r.status === PickupStatus.PENDING) ?? requests[0] ?? null;

  const count = (s) => requests.filter((r) => r.status === s).length;
  const free = vehicles.filter((v) => v.isAvailable).length;

  return (
    <div className="console">
      <ul className="tally">
        <li><b>{count(PickupStatus.PENDING)}</b> waiting</li>
        <li><b>{count(PickupStatus.SCHEDULED)}</b> assigned</li>
        <li><b>{count(PickupStatus.IN_TRANSIT)}</b> on the way</li>
        <li><b>{count(PickupStatus.COMPLETED)}</b> collected</li>
        <li><b>{free}</b> of {vehicles.length} vehicles free</li>
        <li>
          Recommendation followed{' '}
          <b>{recommender.accuracy == null ? 'n/a' : `${Math.round(recommender.accuracy * 100)}%`}</b>
        </li>
      </ul>

      <div className="console-grid">
        <section className="panel queue">
          <div className="panel-head"><h2>Pickup requests</h2></div>
          {requests.length === 0 && <p className="empty">No requests yet. Donors will appear here once they send one.</p>}
          {GROUPS.map(([status, label]) => {
            const items = requests.filter((r) => r.status === status);
            if (!items.length) return null;
            return (
              <div key={status} className="group">
                <h3>{label} ({items.length})</h3>
                <ul className="cards tight">
                  {items.map((r) => (
                    <li key={r.requestId}>
                      <button
                        className={`row-btn ${selected?.requestId === r.requestId ? 'active' : ''}`}
                        onClick={() => setSelectedId(r.requestId)}
                      >
                        <span><strong>#{r.requestId}</strong> {r.donorName}</span>
                        <span className="muted">{r.foodQty} kg, {r.qtyOfFoodVessels} {r.qtyOfFoodVessels === 1 ? 'vessel' : 'vessels'} · {fmtDateTime(r.pickupDateTime)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>

        <section className="panel detail">
          {selected ? <PickupDetail key={selected.requestId} requestId={selected.requestId} /> : <p className="empty">Select a request to plan its pickup.</p>}
        </section>
      </div>

      <div className="console-grid lower">
        <FleetPanel vehicles={vehicles} />
        <NotificationPanel />
      </div>
    </div>
  );
}

function Gauge({ label, value, max, unit }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const over = value > max;
  return (
    <div className="gauge">
      <div className="gauge-label"><span>{label}</span><span className={over ? 'bad' : ''}>{value} of {max} {unit}</span></div>
      <div className="gauge-track" role="img" aria-label={`${label}: ${value} of ${max} ${unit}`}>
        <div className={`gauge-fill ${over ? 'over' : pct > 85 ? 'tight' : ''}`} style={{ width: `${over ? 100 : pct}%` }} />
      </div>
    </div>
  );
}

function PickupDetail({ requestId }) {
  useDb();
  const { request, donor, vessels, assignment, vehicle } = pickupService.getBundle(requestId);
  const isPending = request.status === PickupStatus.PENDING;
  const vehicles = logisticsService.listVehicles();
  const rec = isPending ? logisticsService.recommendVehicle(requestId) : null;

  const suggested = rec && vehicles.find((v) => v.isAvailable && v.vehicleType === rec.vehicleType);
  const [vehicleId, setVehicleId] = useState(null);
  const [volunteerId, setVolunteerId] = useState(VOLUNTEERS[0].id);
  const [when, setWhen] = useState(toLocalInput(new Date(request.pickupDateTime)));
  const [error, setError] = useState('');

  const chosenId = vehicleId ?? suggested?.vehicleId ?? null;
  const chosen = vehicles.find((v) => v.vehicleId === chosenId);

  const run = (fn) => {
    try {
      fn();
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const volunteer = assignment && VOLUNTEERS.find((v) => v.id === assignment.volunteerId);

  return (
    <div className="stack">
      <div className="panel-head">
        <h2>Pickup #{request.requestId}</h2>
        <StatusChip status={request.status} />
      </div>
      <p>
        <strong>{request.donorName}</strong>, {request.foodType}<br />
        <span className="muted">{request.pickupAddress}<br />{fmtDateTime(request.pickupDateTime)} · {donor?.donorPhone}</span>
      </p>

      <table className="table">
        <caption className="sr">Vessels in this pickup</caption>
        <thead><tr><th>Vessel</th><th>Food</th><th>Quantity</th><th>Status</th></tr></thead>
        <tbody>
          {vessels.map((v) => (
            <tr key={v.vesselId}><td>#{v.vesselId}</td><td>{v.foodType}</td><td>{v.quantity} kg</td><td>{v.status.toLowerCase()}</td></tr>
          ))}
        </tbody>
      </table>

      {isPending && rec && (
        <>
          <div className="rec">
            <div>
              <p className="rec-title">Recommended: <strong>{VEHICLE_SPECS[rec.vehicleType].label}</strong></p>
              {rec.reasons.map((r) => <p key={r} className="muted">{r}</p>)}
              <p className="muted">Model {recommender.modelVersion}, {rec.distanceKm} km from the hub.</p>
            </div>
          </div>

          <fieldset className="pick">
            <legend>Choose a vehicle</legend>
            <div className="vehicle-list">
              {vehicles.map((v) => {
                const tooSmall = request.foodQty > v.capacityKg || request.qtyOfFoodVessels > v.maxVessels;
                const disabled = !v.isAvailable;
                return (
                  <label key={v.vehicleId} className={`vehicle ${chosenId === v.vehicleId ? 'active' : ''} ${disabled || tooSmall ? 'dim' : ''}`}>
                    <input type="radio" name="vehicle" checked={chosenId === v.vehicleId} disabled={disabled} onChange={() => setVehicleId(v.vehicleId)} />
                    <span>
                      <strong>{VEHICLE_SPECS[v.vehicleType].label}</strong> {v.registrationNo}
                      <span className="muted"> {v.capacityKg} kg, {v.maxVessels} {v.maxVessels === 1 ? 'vessel' : 'vessels'}</span>
                    </span>
                    <span className="tag">
                      {disabled ? 'Not available' : tooSmall ? 'Too small' : v.vehicleType === rec.vehicleType ? 'Recommended' : ''}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {chosen && (
            <div className="gauges">
              <Gauge label="Weight" value={request.foodQty} max={chosen.capacityKg} unit="kg" />
              <Gauge label="Vessels" value={request.qtyOfFoodVessels} max={chosen.maxVessels} unit="" />
            </div>
          )}

          <div className="row2">
            <label className="field">
              <span>Volunteer</span>
              <select value={volunteerId} onChange={(e) => setVolunteerId(Number(e.target.value))}>
                {VOLUNTEERS.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </label>
            <label className="field"><span>Scheduled time</span><input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></label>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          <button
            className="btn primary"
            disabled={!chosen}
            onClick={() => run(() => logisticsService.assignVehicle({ requestId, vehicleId: chosenId, volunteerId, scheduledTime: when }))}
          >
            Assign vehicle and notify donor
          </button>
        </>
      )}

      {assignment && (
        <div className="rec">
          <p className="rec-title">
            <strong>{vehicle ? `${VEHICLE_SPECS[vehicle.vehicleType].label} ${vehicle.registrationNo}` : 'Vehicle'}</strong> with {volunteer?.name ?? 'volunteer'}
          </p>
          <p className="muted">Scheduled {fmtDateTime(assignment.scheduledTime)}</p>
        </div>
      )}

      {!isPending && error && <p className="error" role="alert">{error}</p>}
      <div className="actions">
        {request.status === PickupStatus.SCHEDULED && (
          <button className="btn primary" onClick={() => run(() => logisticsService.startPickup(requestId))}>Start pickup</button>
        )}
        {request.status === PickupStatus.IN_TRANSIT && (
          <button className="btn primary" onClick={() => run(() => logisticsService.completePickup(requestId))}>Mark food collected</button>
        )}
        {[PickupStatus.PENDING, PickupStatus.SCHEDULED].includes(request.status) && (
          <button className="btn ghost danger" onClick={() => run(() => pickupService.cancel(requestId))}>Cancel pickup</button>
        )}
      </div>
    </div>
  );
}

function FleetPanel({ vehicles }) {
  const [error, setError] = useState('');
  return (
    <section className="panel">
      <div className="panel-head"><h2>Fleet</h2></div>
      <table className="table">
        <thead><tr><th>Vehicle</th><th>Capacity</th><th>State</th><th /></tr></thead>
        <tbody>
          {vehicles.map((v) => {
            const active = logisticsService.activeAssignmentForVehicle(v.vehicleId);
            return (
              <tr key={v.vehicleId}>
                <td><strong>{VEHICLE_SPECS[v.vehicleType].label}</strong><br /><span className="muted">{v.registrationNo}</span></td>
                <td>{v.capacityKg} kg<br /><span className="muted">{v.maxVessels} {v.maxVessels === 1 ? 'vessel' : 'vessels'}</span></td>
                <td>{active ? `On pickup #${active.pickupId}` : v.isAvailable ? 'Available' : 'Off duty'}</td>
                <td>
                  <button
                    className="link"
                    disabled={!!active}
                    onClick={() => {
                      try { logisticsService.setVehicleAvailability(v.vehicleId, !v.isAvailable); setError(''); } catch (e) { setError(e.message); }
                    }}
                  >
                    {v.isAvailable ? 'Take off duty' : 'Put on duty'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}

function NotificationPanel() {
  const items = notificationService.recent(8);
  return (
    <section className="panel">
      <div className="panel-head"><h2>Messages sent</h2></div>
      {items.length === 0 ? (
        <p className="empty">Nothing sent yet. Donor and volunteer messages appear here as you assign and complete pickups.</p>
      ) : (
        <ul className="cards tight">
          {items.map((n) => (
            <li key={n.id} className="msg">
              <span className="tag">{n.channel}</span>
              <span><strong>{n.to}</strong><br /><span className="muted">{n.message}</span></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
