# FINN — Investor desk

A mobile-first financial filing filter and source-grounded research prototype for the ENAM Holdings build challenge.

This project is being moved to Codex Cloud. **Start with [CLOUD_HANDOFF.md](CLOUD_HANDOFF.md)** for the current state, setup, completed checks and remaining work. The complete build brief is in [MISSION.md](MISSION.md).

```sh
npm install
npm run dev
```

Open http://localhost:3000. The committed snapshot needs no API keys or upstream services. Python is needed only for live ingestion and data refresh; install `pipeline/requirements.txt` separately. See `.env.example` for optional provider configuration.

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm start
```

The application is not yet a verified final delivery. Production/offline visual QA, complete write-up and deployment remain open; the handoff lists known limitations.
