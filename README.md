# Food pickup and logistics (prototype)

Prototype of the Pickup & Logistics module of the NGO food donor software.
React + Vite. No backend yet: data is saved in the browser (localStorage).

## Run locally

```bash
npm install
npm run dev
```

## Deploy on Vercel

Push the folder to GitHub, then import the repo in Vercel. It detects Vite on its own
(build command `vite build`, output folder `dist`). No config file is needed.

## How the code maps to the architecture diagram

| Layer in the diagram | Folder | Contents |
| --- | --- | --- |
| Presentation | `src/ui`, `src/App.jsx` | Donor UI, Logistics/Admin UI |
| Application / Service | `src/services` | DonorService, PickupRequestService, VesselAssignmentService, LogisticsService |
| Domain / Business | `src/domain/models.js` | Entities and enums from the class diagram |
| Data Access | `src/data` | One repository per entity, all built on `Repository.js` |
| Database | browser localStorage | Replace inside `Repository.js` |
| External services | `LocationService.js`, `NotificationService.js` | Mock GPS and SMS / email / push |
| AI module | `AIVehicleRecommender.js` | Rule-based `predictVehicle`, `trainModel` |

## Ways to grow it

- Real database: rewrite the method bodies in `src/data/Repository.js` to call API routes
  (Vercel serverless functions in an `api/` folder, backed by Postgres). Services and UI stay as they are.
- Real SMS / email / push: implement `NotificationService.send`.
- Real maps and geocoding: implement `LocationService`.
- Smarter recommendations: replace the body of `AIVehicleRecommender.explain` with a trained model.
- Login and roles: gate the two screens in `App.jsx`.
