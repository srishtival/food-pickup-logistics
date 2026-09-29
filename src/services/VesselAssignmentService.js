import { VesselStatus, createVesselAssignment } from '../domain/models.js';

export class VesselAssignmentService {
  constructor({ vesselRepo, vesselAssignmentRepo }) {
    this.vessels = vesselRepo;
    this.assignments = vesselAssignmentRepo;
  }

  vesselsForDonation(donationId) {
    return this.vessels.findWhere((v) => v.donationId === donationId);
  }

  // assignVessel(): link every vessel of a pickup to that pickup.
  assignVessels(request) {
    this.vesselsForDonation(request.donationId).forEach((v) => {
      this.assignments.save(
        createVesselAssignment({
          pickupId: request.requestId,
          vesselId: v.vesselId,
          quantity: v.quantity,
          itemType: v.foodType,
        }),
      );
      this.vessels.save({ ...v, status: VesselStatus.ASSIGNED });
    });
  }

  // updateStatus(): move all vessels of a pickup to a new status.
  updateStatus(request, status) {
    this.vesselsForDonation(request.donationId).forEach((v) => this.vessels.save({ ...v, status }));
    this.assignments
      .findWhere((a) => a.pickupId === request.requestId)
      .forEach((a) => this.assignments.save({ ...a, status }));
  }

  // getAssignmentDetails()
  getAssignmentDetails(pickupId) {
    return this.assignments.findWhere((a) => a.pickupId === pickupId);
  }
}
