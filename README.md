# Frontend

React/Vite storefront and admin interface for Pandu.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The storefront runs at `http://localhost:5173`; the admin interface is at `http://localhost:5173/admin`.

Leave `VITE_API_URL` blank for local development through Vite's proxy. Set it to the Flask backend origin for an independent deployment.

Useful commands:

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint checks
