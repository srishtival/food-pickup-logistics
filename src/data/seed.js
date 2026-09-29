import { PickupStatus, VesselStatus, VehicleType } from '../domain/models.js';

const inHours = (h) => new Date(Date.now() + h * 36e5).toISOString();

export const donors = () => [
  {
    donorId: 1001,
    donorName: 'Priya Nair',
    donorPhone: '+91 98450 11122',
    donorAddress: '12, 4th Block, Jayanagar, Bengaluru',
    functionHallAddress: 'Sri Lakshmi Kalyana Mantapa, Jayanagar 9th Block',
    gpsLoc: { lat: 12.925, lng: 77.5938 },
  },
  {
    donorId: 1002,
    donorName: 'Rahul Menon',
    donorPhone: '+91 99001 23456',
    donorAddress: '7, 12th Main, Indiranagar, Bengaluru',
    functionHallAddress: 'Palm Grove Banquet, Indiranagar',
    gpsLoc: { lat: 12.9784, lng: 77.6408 },
  },
  {
    donorId: 1003,
    donorName: 'Meera Shetty',
    donorPhone: '+91 97400 99881',
    donorAddress: '33, Whitefield Main Road, Bengaluru',
    functionHallAddress: 'Orchid Convention Hall, Whitefield',
    gpsLoc: { lat: 12.9698, lng: 77.75 },
  },
];

export const pickups = () => [
  {
    requestId: 1001,
    donationId: 5001,
    donorId: 1002,
    donorName: 'Rahul Menon',
    foodType: 'Cooked meals',
    foodQty: 180,
    qtyOfFoodVessels: 8,
    pickupAddress: 'Palm Grove Banquet, Indiranagar',
    pickupDateTime: inHours(26),
    vehicleAssign: '',
    status: PickupStatus.PENDING,
  },
  {
    requestId: 1002,
    donationId: 5002,
    donorId: 1001,
    donorName: 'Priya Nair',
    foodType: 'Fruits and vegetables',
    foodQty: 12,
    qtyOfFoodVessels: 1,
    pickupAddress: 'Sri Lakshmi Kalyana Mantapa, Jayanagar 9th Block',
    pickupDateTime: inHours(5),
    vehicleAssign: '',
    status: PickupStatus.PENDING,
  },
];

export const vessels = () => {
  const out = [];
  let id = 1000;
  pickups().forEach((p) => {
    for (let i = 0; i < p.qtyOfFoodVessels; i += 1) {
      id += 1;
      out.push({
        vesselId: id,
        donationId: p.donationId,
        functionOwnerId: p.donorId,
        foodType: p.foodType,
        quantity: Math.round((p.foodQty / p.qtyOfFoodVessels) * 10) / 10,
        pickupAddress: p.pickupAddress,
        pickupDateTime: p.pickupDateTime,
        status: VesselStatus.PENDING,
      });
    }
  });
  return out;
};

const veh = (vehicleId, vehicleType, capacityKg, maxVessels, registrationNo) => ({
  vehicleId, vehicleType, capacityKg, maxVessels, registrationNo, isAvailable: true,
});

export const vehicles = () => [
  veh(1001, VehicleType.BIKE, 15, 1, 'KA-01-HB-2201'),
  veh(1002, VehicleType.BIKE, 15, 1, 'KA-02-HC-4410'),
  veh(1003, VehicleType.AUTO, 150, 4, 'KA-05-AC-7788'),
  veh(1004, VehicleType.AUTO, 150, 4, 'KA-04-AD-1290'),
  veh(1005, VehicleType.VAN, 400, 10, 'KA-03-MN-1042'),
  veh(1006, VehicleType.TEMPO, 600, 14, 'KA-51-TT-3390'),
  veh(1007, VehicleType.MINI_TRUCK, 1200, 30, 'KA-01-AK-9021'),
];

export const none = () => [];
