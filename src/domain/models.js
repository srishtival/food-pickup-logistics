// Domain / Business layer: entities from the class diagram.
// Field names match the diagram so the code and the design stay in sync.

export const VehicleType = Object.freeze({
  BIKE: 'BIKE',
  AUTO: 'AUTO',
  TEMPO: 'TEMPO',
  MINI_TRUCK: 'MINI_TRUCK',
  VAN: 'VAN',
});

// Smallest to largest. The recommender walks this list in order.
export const VEHICLE_ORDER = [
  VehicleType.BIKE,
  VehicleType.AUTO,
  VehicleType.VAN,
  VehicleType.TEMPO,
  VehicleType.MINI_TRUCK,
];

export const VEHICLE_SPECS = {
  BIKE: { label: 'Bike', capacityKg: 15, maxVessels: 1, maxKm: 10 },
  AUTO: { label: 'Auto', capacityKg: 150, maxVessels: 4, maxKm: 25 },
  VAN: { label: 'Van', capacityKg: 400, maxVessels: 10, maxKm: 60 },
  TEMPO: { label: 'Tempo', capacityKg: 600, maxVessels: 14, maxKm: 80 },
  MINI_TRUCK: { label: 'Mini truck', capacityKg: 1200, maxVessels: 30, maxKm: 120 },
};

export const PickupStatus = Object.freeze({
  PENDING: 'PENDING',
  SCHEDULED: 'SCHEDULED',
  IN_TRANSIT: 'IN_TRANSIT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

export const VesselStatus = Object.freeze({
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  COLLECTED: 'COLLECTED',
});

export const AssignmentStatus = Object.freeze({
  SCHEDULED: 'SCHEDULED',
  IN_TRANSIT: 'IN_TRANSIT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

// The NGO's collection hub. Distances are measured from here.
export const NGO_HUB = { lat: 12.9716, lng: 77.5946, name: 'NGO hub' };

export const VOLUNTEERS = [
  { id: 1, name: 'Karthik R' },
  { id: 2, name: 'Divya S' },
  { id: 3, name: 'Imran K' },
  { id: 4, name: 'Ananya P' },
];

export const createDonor = (d) => ({
  donorId: null,
  donorName: d.donorName.trim(),
  donorPhone: d.donorPhone.trim(),
  donorAddress: d.donorAddress.trim(),
  functionHallAddress: d.functionHallAddress.trim(),
  gpsLoc: d.gpsLoc,
});

export const createPickupRequest = (r) => ({
  requestId: null,
  donationId: r.donationId,
  donorId: r.donorId,
  donorName: r.donorName,
  foodType: r.foodType,
  foodQty: r.foodQty,
  qtyOfFoodVessels: r.qtyOfFoodVessels,
  pickupAddress: r.pickupAddress,
  pickupDateTime: r.pickupDateTime,
  vehicleAssign: '',
  status: PickupStatus.PENDING,
});

export const createVessel = (v) => ({
  vesselId: null,
  donationId: v.donationId,
  functionOwnerId: v.functionOwnerId,
  foodType: v.foodType,
  quantity: v.quantity,
  pickupAddress: v.pickupAddress,
  pickupDateTime: v.pickupDateTime,
  status: VesselStatus.PENDING,
});

export const createVesselAssignment = (a) => ({
  assignmentId: null,
  pickupId: a.pickupId,
  vesselId: a.vesselId,
  quantity: a.quantity,
  itemType: a.itemType,
  status: VesselStatus.ASSIGNED,
});

export const createVehicleAssignment = (a) => ({
  assignmentId: null,
  pickupId: a.pickupId,
  vehicleId: a.vehicleId,
  vehicleType: a.vehicleType,
  recommendedType: a.recommendedType ?? null,
  volunteerId: a.volunteerId,
  scheduledTime: a.scheduledTime,
  status: AssignmentStatus.SCHEDULED,
});
