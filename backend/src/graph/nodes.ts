import { interrupt } from "@langchain/langgraph";
import type { GraphState } from "./state.js";
import * as learner from "../services/learner.js";
import * as dbQueries from "../db/queries.js";

export async function startNode(state: GraphState): Promise<Partial<GraphState>> {
    return {
        logs: "Start node finished,\n",
        pdfToFill: state.pdfToFill,
        pdfBase64: state.pdfBase64,
        enableLlmCalls: state.enableLlmCalls,
        devices: [],
        matchedDevices: [],
        availableDevices: [],
        currentDeviceGroupIndex: 0,
        selectedDevicesForOutput: [],
    };
}

export async function extractionNode(state: GraphState): Promise<Partial<GraphState>> {
    let devices;

    if (state.enableLlmCalls) {
        console.log("Extracting devices with LLM...");
        devices = await learner.extractDevices(state.pdfBase64, state.pdfToFill);
    } else {
        console.log("Reading devices from cached JSON...");
        devices = learner.readCachedExtraction();
    }

    console.log(`Extracted ${devices.length} devices`);
    return { devices };
}

export async function matcherNode(state: GraphState): Promise<Partial<GraphState>> {
    let matchedDevices;

    if (state.enableLlmCalls) {
        console.log("Matching devices with LLM...");
        matchedDevices = await learner.matchDevices();
    } else {
        console.log("Reading matches from cached JSON...");
        matchedDevices = learner.readCachedMatching();
    }

    console.log(`Matched ${matchedDevices.length} devices`);
    return { matchedDevices };
}

export async function saverNode(state: GraphState): Promise<Partial<GraphState>> {
    console.log("Saving devices to database...");
    await learner.saveDevices();
    return { logs: "Devices saved.\n" };
}

export async function findDevicesPrep(state: GraphState): Promise<Partial<GraphState>> {
    const groupIdx = state.currentDeviceGroupIndex!;
    const device = state.matchedDevices[groupIdx];

    console.log(`Looking up devices for group: ${device.device_matched}`);
    const availableDevices = await dbQueries.getDevicesByGroup(device.device_matched);

    return { availableDevices };
}

export async function humanSelectDevice(state: GraphState): Promise<Partial<GraphState>> {
    const groupIdx = state.currentDeviceGroupIndex!;
    const devicesFromDb = state.availableDevices;

    const message = `Select one device from group ${groupIdx}: ` +
        devicesFromDb.map(d => `${d.device_raw} (ID: ${d.id})`).join(", ");

    // interrupts graph until resumed
    const selectedId = interrupt(message) as number;

    const selectedDevice = devicesFromDb.find(d => d.id === selectedId);
    if (!selectedDevice) {
        throw new Error(`Device with ID ${selectedId} not found`);
    }

    return {
        availableDevices: [],
        currentDeviceGroupIndex: groupIdx + 1,
        selectedDevicesForOutput: [...state.selectedDevicesForOutput, selectedDevice],
    };
}