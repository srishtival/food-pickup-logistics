import {
  AssignmentStatus,
  PickupStatus,
  createPickupRequest,
  createVessel,
} from '../domain/models.js';

export class PickupRequestService {
  constructor({ donorRepo, pickupRepo, vesselRepo, vehicleRepo, vehicleAssignmentRepo, vesselService, notifier }) {
    this.donors = donorRepo;
    this.pickups = pickupRepo;
    this.vessels = vesselRepo;
    this.vehicles = vehicleRepo;
    this.vehicleAssignments = vehicleAssignmentRepo;
    this.vesselService = vesselService;
    this.notifier = notifier;
  }

  listRequests() {
    return this.pickups.findAll().sort((a, b) => a.pickupDateTime.localeCompare(b.pickupDateTime));
  }

  listForDonor(donorId) {
    return this.listRequests().filter((r) => r.donorId === donorId);
  }

  // createRequest(): validates the form, saves the request and one vessel record per vessel.
  createRequest(input) {
    const donor = this.donors.findById(Number(input.donorId));
    if (!donor) throw new Error('Choose a donor first.');

    const qty = Number(input.foodQty);
    const n = Number(input.qtyOfFoodVessels);
    if (!(qty > 0)) throw new Error('Enter the food quantity in kg.');
    if (!Number.isInteger(n) || n < 1) throw new Error('Enter how many vessels the food is in.');
    if (!input.pickupAddress?.trim()) throw new Error('Enter the pickup address.');
    const when = new Date(input.pickupDateTime);
    if (Number.isNaN(when.getTime())) throw new Error('Choose a pickup date and time.');
    if (when.getTime() < Date.now() - 60000) throw new Error('Choose a pickup time in the future.');

    const donationId = this.pickups.nextDonationId();
    const pickupDateTime = when.toISOString();
    const request = this.pickups.save(
      createPickupRequest({
        donationId,
        donorId: donor.donorId,
        donorName: donor.donorName,
        foodType: input.foodType,
        foodQty: qty,
        qtyOfFoodVessels: n,
        pickupAddress: input.pickupAddress.trim(),
        pickupDateTime,
      }),
    );

    const perVessel = Math.round((qty / n) * 10) / 10;
    for (let i = 0; i < n; i += 1) {
      this.vessels.save(
        createVessel({
          donationId,
          functionOwnerId: donor.donorId,
          foodType: input.foodType,
          quantity: perVessel,
          pickupAddress: request.pickupAddress,
          pickupDateTime,
        }),
      );
    }

    this.notifier.send('SMS', donor.donorPhone, `Pickup request #${request.requestId} received. We will confirm a vehicle soon.`);
    return request;
  }

  // Everything the screens need about one pickup.
  getBundle(requestId) {
    const request = this.pickups.findById(requestId);
    if (!request) return null;
    const assignment = this.vehicleAssignments
      .findWhere((a) => a.pickupId === requestId && a.status !== AssignmentStatus.CANCELLED)
      .at(-1);
    return {
      request,
      donor: this.donors.findById(request.donorId),
      vessels: this.vesselService.vesselsForDonation(request.donationId),
      assignment: assignment ?? null,
      vehicle: assignment ? this.vehicles.findById(assignment.vehicleId) : null,
    };
  }

  updateStatus(requestId, status, patch = {}) {
    const request = this.pickups.findById(requestId);
    return this.pickups.save({ ...request, ...patch, status });
  }

  cancel(requestId) {
    const bundle = this.getBundle(requestId);
    if (!bundle) throw new Error('This pickup no longer exists.');
    const { request, assignment, vehicle, donor } = bundle;
    if (![PickupStatus.PENDING, PickupStatus.SCHEDULED].includes(request.status)) {
      throw new Error('Only pickups that have not started can be cancelled.');
    }
    if (assignment) {
      this.vehicleAssignments.save({ ...assignment, status: AssignmentStatus.CANCELLED });
      if (vehicle) this.vehicles.save({ ...vehicle, isAvailable: true });
    }
    this.updateStatus(requestId, PickupStatus.CANCELLED, { vehicleAssign: '' });
    this.notifier.send('SMS', donor.donorPhone, `Pickup request #${request.requestId} was cancelled.`);
  }
}
