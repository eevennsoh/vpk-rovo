"use strict";

// Tiny Express server that serves the Next.js static export from ./public.
// Used only in production (inside the Docker container). Dev uses `next dev`.

const express = require("express");
const path = require("node:path");

const app = express();
const PORT = process.env.PORT || 8080;
const STATIC_DIR = path.join(__dirname, "public");

app.get("/api/health", (_req, res) => {
	res.json({ status: "ok", time: new Date().toISOString() });
});

app.use(express.static(STATIC_DIR));

// SPA-ish fallback: any unmatched GET returns the root index.html so the
// static export's client-side routing can take over.
app.get(/.*/, (_req, res) => {
	res.sendFile(path.join(STATIC_DIR, "index.html"));
});

app.listen(PORT, () => {
	console.log(`Serving static export from ${STATIC_DIR} on :${PORT}`);
});
