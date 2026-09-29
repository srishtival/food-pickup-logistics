import { VEHICLE_ORDER, VEHICLE_SPECS, VehicleType } from '../domain/models.js';

// «AI module» from the class diagram.
// v1 is a transparent rule set so the recommendation can be explained.
// predictVehicle() keeps the same signature, so a trained model can replace
// the rules later without touching the services that call it.
export class AIVehicleRecommender {
  constructor() {
    this.modelVersion = 'rules-v1';
    this.accuracy = null; // share of completed pickups where the team followed the recommendation
  }

  explain(qty, vessels, distanceKm) {
    let chosen = VEHICLE_ORDER.find((t) => {
      const s = VEHICLE_SPECS[t];
      return qty <= s.capacityKg && vessels <= s.maxVessels && distanceKm <= s.maxKm;
    });
    const multiTrip = !chosen;
    if (!chosen) chosen = VehicleType.MINI_TRUCK;

    const spec = VEHICLE_SPECS[chosen];
    const reasons = multiTrip
      ? [`${qty} kg in ${vessels} vessels is more than any single vehicle can take. Plan two trips.`]
      : [
          `Smallest vehicle that carries ${qty} kg in ${vessels} ${vessels === 1 ? 'vessel' : 'vessels'} over ${distanceKm} km.`,
          `${spec.label} takes up to ${spec.capacityKg} kg and ${spec.maxVessels} vessels.`,
        ];
    return {
      vehicleType: chosen,
      reasons,
      multiTrip,
      distanceKm,
      weightFit: qty / spec.capacityKg,
      vesselFit: vessels / spec.maxVessels,
    };
  }

  predictVehicle(qty, vessels, distanceKm) {
    return this.explain(qty, vessels, distanceKm).vehicleType;
  }

  trainModel(history) {
    const done = history.filter((a) => a.status === 'COMPLETED' && a.recommendedType);
    if (!done.length) return;
    this.accuracy = done.filter((a) => a.recommendedType === a.vehicleType).length / done.length;
  }
}
