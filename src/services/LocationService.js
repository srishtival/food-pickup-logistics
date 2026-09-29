// External service stand-in: GPS / Location.
// Swap the internals for Google Maps / Mapbox later; keep the method names.
export class LocationService {
  // Straight-line distance (haversine) with a 1.3x factor to approximate roads.
  distanceKm(a, b) {
    if (!a || !b) return 0;
    const R = 6371;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    const km = 2 * R * Math.asin(Math.sqrt(h));
    return Math.round(km * 1.3 * 10) / 10;
  }

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Location is not available in this browser.'));
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) }),
        () => reject(new Error('Could not read your location. Enter the coordinates by hand.')),
        { timeout: 8000 },
      );
    });
  }
}
