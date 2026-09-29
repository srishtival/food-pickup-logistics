// Composition root: builds every service once and wires in its repositories.
import * as repos from '../data/repositories.js';
import { AIVehicleRecommender } from './AIVehicleRecommender.js';
import { DonorService } from './DonorService.js';
import { LocationService } from './LocationService.js';
import { LogisticsService } from './LogisticsService.js';
import { NotificationService } from './NotificationService.js';
import { PickupRequestService } from './PickupRequestService.js';
import { VesselAssignmentService } from './VesselAssignmentService.js';

export const locationService = new LocationService();
export const notificationService = new NotificationService(repos.notificationRepository);
export const recommender = new AIVehicleRecommender();
recommender.trainModel(repos.vehicleAssignmentRepository.findAll());

export const donorService = new DonorService(repos.donorRepository);

export const vesselAssignmentService = new VesselAssignmentService({
  vesselRepo: repos.vesselRepository,
  vesselAssignmentRepo: repos.vesselAssignmentRepository,
});

export const pickupService = new PickupRequestService({
  donorRepo: repos.donorRepository,
  pickupRepo: repos.pickupRepository,
  vesselRepo: repos.vesselRepository,
  vehicleRepo: repos.vehicleRepository,
  vehicleAssignmentRepo: repos.vehicleAssignmentRepository,
  vesselService: vesselAssignmentService,
  notifier: notificationService,
});

export const logisticsService = new LogisticsService({
  vehicleRepo: repos.vehicleRepository,
  vehicleAssignmentRepo: repos.vehicleAssignmentRepository,
  pickupService,
  vesselService: vesselAssignmentService,
  recommender,
  location: locationService,
  notifier: notificationService,
});
