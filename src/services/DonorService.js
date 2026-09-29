import { createDonor } from '../domain/models.js';

export class DonorService {
  constructor(donorRepo) {
    this.donors = donorRepo;
  }

  listDonors() {
    return this.donors.findAll();
  }

  getDonor(id) {
    return this.donors.findById(id);
  }

  registerDonor(input) {
    const required = [
      ['donorName', 'name'],
      ['donorPhone', 'phone number'],
      ['donorAddress', 'address'],
      ['functionHallAddress', 'function hall address'],
    ];
    for (const [key, label] of required) {
      if (!input[key]?.trim()) throw new Error(`Enter the donor's ${label}.`);
    }
    const lat = Number(input.lat);
    const lng = Number(input.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw new Error('Enter valid GPS coordinates, for example 12.97 and 77.59.');
    }
    return this.donors.save(createDonor({ ...input, gpsLoc: { lat, lng } }));
  }
}
