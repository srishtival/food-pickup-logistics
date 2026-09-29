import {
  AssignmentStatus,
  NGO_HUB,
  PickupStatus,
  VEHICLE_SPECS,
  VOLUNTEERS,
  VesselStatus,
  createVehicleAssignment,
} from '../domain/models.js';

export class LogisticsService {
  constructor({ vehicleRepo, vehicleAssignmentRepo, pickupService, vesselService, recommender, location, notifier }) {
    this.vehicles = vehicleRepo;
    this.vehicleAssignments = vehicleAssignmentRepo;
    this.pickupService = pickupService;
    this.vesselService = vesselService;
    this.recommender = recommender;
    this.location = location;
    this.notifier = notifier;
  }

  listVehicles() {
    return this.vehicles.findAll();
  }

  activeAssignmentForVehicle(vehicleId) {
    return this.vehicleAssignments
      .findWhere(
        (a) =>
          a.vehicleId === vehicleId &&
          [AssignmentStatus.SCHEDULED, AssignmentStatus.IN_TRANSIT].includes(a.status),
      )
      .at(0);
  }

  // VehicleDetails.updateStatus()
  setVehicleAvailability(vehicleId, isAvailable) {
    if (this.activeAssignmentForVehicle(vehicleId)) throw new Error('This vehicle is on a pickup.');
    const v = this.vehicles.findById(vehicleId);
    this.vehicles.save({ ...v, isAvailable });
  }

  // VehicleAssignment.recommendVehicle()
  recommendVehicle(requestId) {
    const { request, donor } = this.pickupService.getBundle(requestId);
    const distanceKm = this.location.distanceKm(NGO_HUB, donor?.gpsLoc);
    return this.recommender.explain(request.foodQty, request.qtyOfFoodVessels, distanceKm);
  }

  // VehicleAssignment.assignVehicle()
  assignVehicle({ requestId, vehicleId, volunteerId, scheduledTime }) {
    const bundle = this.pickupService.getBundle(requestId);
    const vehicle = this.vehicles.findById(vehicleId);
    if (!bundle || bundle.request.status !== PickupStatus.PENDING) throw new Error('This pickup already has a vehicle or was closed.');
    if (!vehicle) throw new Error('Choose a vehicle.');
    if (!vehicle.isAvailable) throw new Error('That vehicle is not available.');

    const { request, donor } = bundle;
    if (request.foodQty > vehicle.capacityKg) {
      throw new Error(`${request.foodQty} kg is over this vehicle's ${vehicle.capacityKg} kg limit.`);
    }
    if (request.qtyOfFoodVessels > vehicle.maxVessels) {
      throw new Error(`${request.qtyOfFoodVessels} vessels is over this vehicle's limit of ${vehicle.maxVessels}.`);
    }
    const when = new Date(scheduledTime);
    if (Number.isNaN(when.getTime())) throw new Error('Choose a scheduled time.');

    const rec = this.recommendVehicle(requestId);
    this.vehicleAssignments.save(
      createVehicleAssignment({
        pickupId: requestId,
        vehicleId,
        vehicleType: vehicle.vehicleType,
        recommendedType: rec.vehicleType,
        volunteerId,
        scheduledTime: when.toISOString(),
      }),
    );
    this.vehicles.save({ ...vehicle, isAvailable: false });
    this.vesselService.assignVessels(request);
    this.pickupService.updateStatus(requestId, PickupStatus.SCHEDULED, {
      vehicleAssign: `${VEHICLE_SPECS[vehicle.vehicleType].label} ${vehicle.registrationNo}`,
    });

    const volunteer = VOLUNTEERS.find((v) => v.id === volunteerId);
    const time = when.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
    this.notifier.send('SMS', donor.donorPhone, `Pickup #${requestId} is set for ${time}. ${VEHICLE_SPECS[vehicle.vehicleType].label} ${vehicle.registrationNo} will arrive.`);
    this.notifier.send('PUSH', volunteer?.name ?? 'Volunteer', `You are assigned pickup #${requestId} at ${request.pickupAddress}, ${time}.`);
  }

  startPickup(requestId) {
    const { request, assignment, donor } = this.pickupService.getBundle(requestId);
    if (request.status !== PickupStatus.SCHEDULED) throw new Error('Assign a vehicle before starting the pickup.');
    this.vehicleAssignments.save({ ...assignment, status: AssignmentStatus.IN_TRANSIT });
    this.pickupService.updateStatus(requestId, PickupStatus.IN_TRANSIT);
    this.notifier.send('SMS', donor.donorPhone, `Your pickup #${requestId} is on the way.`);
  }

  completePickup(requestId) {
    const { request, assignment, vehicle, donor } = this.pickupService.getBundle(requestId);
    if (request.status !== PickupStatus.IN_TRANSIT) throw new Error('Start the pickup before marking it collected.');
    this.vehicleAssignments.save({ ...assignment, status: AssignmentStatus.COMPLETED });
    this.vehicles.save({ ...vehicle, isAvailable: true });
    this.vesselService.updateStatus(request, VesselStatus.COLLECTED);
    this.pickupService.updateStatus(requestId, PickupStatus.COMPLETED);
    this.notifier.send('SMS', donor.donorPhone, `Pickup #${requestId} is collected. Thank you for donating.`);
    this.recommender.trainModel(this.vehicleAssignments.findAll());
  }
}
