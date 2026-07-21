# Here are your Instructions

## Offline build & run

To build a fully offline distributable of the frontend and serve it locally:

1. In the `frontend` folder install dependencies and build:

```bash
cd frontend
yarn install
yarn build
```

2. The production build is placed in `frontend/build`. The build includes the vendored
	Tailwind CSS and font files so the app does not require external network access.

3. To serve the build locally (for testing):

```bash
cd frontend/build
python3 -m http.server 5000
# then open http://127.0.0.1:5000
```

Notes:
- Fonts are vendored into `frontend/public/fonts` and copied to `frontend/build/fonts`.
- `frontend/public/tailwind.css` is generated at build time and included in the build.

If you want an automated smoke test that loads the app in a headless browser and verifies
that no external network requests occur, run the `e2e-check.js` script in `frontend/scripts`.

