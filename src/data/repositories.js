import { Repository } from './Repository.js';
import * as seed from './seed.js';

class PickupRepository extends Repository {
  nextDonationId() {
    return this.items.reduce((m, p) => Math.max(m, p.donationId), 5000) + 1;
  }
}

export const donorRepository = new Repository('donors', 'donorId', seed.donors);
export const pickupRepository = new PickupRepository('pickups', 'requestId', seed.pickups);
export const vesselRepository = new Repository('vessels', 'vesselId', seed.vessels);
export const vesselAssignmentRepository = new Repository('vesselAssignments', 'assignmentId', seed.none);
export const vehicleRepository = new Repository('vehicles', 'vehicleId', seed.vehicles);
export const vehicleAssignmentRepository = new Repository('vehicleAssignments', 'assignmentId', seed.none);
export const notificationRepository = new Repository('notifications', 'id', seed.none);
