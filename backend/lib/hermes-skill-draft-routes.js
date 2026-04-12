function registerHermesSkillDraftRoutes(app, {
	archiveSkillImpl,
	createSkillFromBundleImpl,
	draftManager,
	syncThreadPendingSkillDraftIdsImpl,
	updateSkillFromBundleImpl,
} = {}) {
	app.get("/api/skills/drafts", async (req, res) => {
		try {
			const status = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;
			const sourceThreadId =
				(Array.isArray(req.query.threadId) ? req.query.threadId[0] : req.query.threadId)
				?? (Array.isArray(req.query.sourceThreadId) ? req.query.sourceThreadId[0] : req.query.sourceThreadId);
			const drafts = await draftManager.listDrafts({
				sourceThreadId,
				status,
			});
			return res.json({ drafts });
		} catch (error) {
			return res.status(500).json({
				error: "Failed to list Hermes skill drafts",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	});

	app.get("/api/skills/drafts/:id", async (req, res) => {
		try {
			const draft = await draftManager.getDraft(req.params.id);
			if (!draft) {
				return res.status(404).json({ error: "Hermes skill draft not found" });
			}
			return res.json({ draft });
		} catch (error) {
			return res.status(500).json({
				error: "Failed to load Hermes skill draft",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	});

	app.post("/api/skills/drafts/:id/approve", async (req, res) => {
		try {
			const draft = await draftManager.approveDraft(req.params.id, {
				createSkillFromBundleImpl,
				updateSkillFromBundleImpl,
				archiveSkillImpl,
			});
			if (draft?.sourceThreadId) {
				await syncThreadPendingSkillDraftIdsImpl(draft.sourceThreadId);
			}
			return res.json({ draft });
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const statusCode = /not found/i.test(message) ? 404 : 400;
			return res.status(statusCode).json({
				error: "Failed to approve Hermes skill draft",
				details: message,
			});
		}
	});

	app.post("/api/skills/drafts/:id/reject", async (req, res) => {
		try {
			const draft = await draftManager.rejectDraft(req.params.id);
			if (draft?.sourceThreadId) {
				await syncThreadPendingSkillDraftIdsImpl(draft.sourceThreadId);
			}
			return res.json({ draft });
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const statusCode = /not found/i.test(message) ? 404 : 400;
			return res.status(statusCode).json({
				error: "Failed to reject Hermes skill draft",
				details: message,
			});
		}
	});

	app.delete("/api/skills/drafts/:id", async (req, res) => {
		try {
			const draft = await draftManager.deleteDraft(req.params.id);
			if (!draft) {
				return res.status(404).json({ error: "Hermes skill draft not found" });
			}
			if (draft.sourceThreadId) {
				await syncThreadPendingSkillDraftIdsImpl(draft.sourceThreadId);
			}
			return res.json({ draft });
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return res.status(400).json({
				error: "Failed to delete Hermes skill draft",
				details: message,
			});
		}
	});
}

module.exports = {
	registerHermesSkillDraftRoutes,
};
