import { Router } from "express";
import multer from "multer";
import { v4 as uuid } from "uuid";
import { Command } from "@langchain/langgraph";
import { buildGraph } from "../graph/builder.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// in-memory session store
const sessions = new Map<string, { graph: any; config: any}>();

// POST /api/session/start
router.post("/start", upload.single("pdf"), async (req, res) => {
    try {
        const sessionId = uuid();
        const pdfBuffer = req.file!.buffer;
        const pdfBase64 = pdfBuffer.toString("base64");
        const pdfToFill = req.body.pdfToFill === "true";
        const enableLlmCalls = req.body.enableLlmCalls === "true";

        const graph = buildGraph();
        const config = { configurable: { thread_id: sessionId } };

        sessions.set(sessionId, { graph, config});

        const result = await graph.invoke(
            { pdfToFill, pdfBase64, enableLlmCalls },
            config
        );

        // check if graph was interrupted
        const snapshot = await graph.getState(config);

        if (snapshot.tasks.some((t: any) => t.interrupts?.length > 0)) {
            const state = snapshot.values;
            return res.json({
                sessionId,
                status: "interrupted",
                currentDeviceIndex: state.currentDeviceGroupIndex,
                totalDevices: state.matchedDevices.length,
                devicesBeingMatched: state.matchedDevices[state.currentDeviceGroupIndex],
                availableDevices: state.availableDevices,
            });
        }

        return res.json({ sessionId, status: "completed", message: "Done." });
    } catch (error) {
        console.error("Error starting session:", error);
        return res.status(500).json({ error: "Failed to start session" });
    }
});

// POST /api/session/:id/resume
router.post("/:id/resume", async (req, res) => {
    try {
        const session = sessions.get(req.params.id);
        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        const { selectedDeviceId } = req.body;

        await session.graph.invoke(
            new Command({ resume: selectedDeviceId }),
            session.config
        );

        const snapshot = await session.graph.getState(session.config);

        if (snapshot.tasks.some((t: any) => t.interrupts?.length > 0)) {
            const state = snapshot.values;
            return res.json({
                status: "interrupted",
                currentDeviceIndex: state.currentDeviceGroupIndex,
                totalDevices: state.matchedDevices.length,
                devicesBeingMatched: state.matchedDevices[state.currentDeviceGroupIndex],
                availableDevices: state.availableDevices,
                selectedSoFar: state.selectedDevicesForOutput,
            });
        }

        const finalState = snapshot.values;
        return res.json({
            status: "completed",
            message: "All devices processed.",
            selectedDevices: finalState.selectedDevicesForOutput,
        });
    } catch (error) {
        console.error("Error resuming session:", error);
        return res.status(500).json({ error: "Failed to resume session "});
    }
});

// GET /api/session/:id/export
router.get("/:id/export", async (req, res) => {
    try {
        const session = sessions.get(req.params.id);
        if (! session) {
            return res.status(404).json({ error: "Session not found" });
        }

        const snapshot = await session.graph.getState(session.config);
        const selectedDevices = snapshot.values.selectedDevicesForOutput;

        return res.json({ devices: selectedDevices });
    } catch (error) {
        console.error("Error exporting:", error);
        return res.status(500).json({ error: "Failed to export" });
    }
});

export default router;