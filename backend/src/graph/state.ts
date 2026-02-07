import { Annotation } from "@langchain/langgraph";
import type { LearnedDevice, MatchedLearnedDevice } from "../types/device.js";
import type { DeviceRow } from "../db/schema.js";

export const GraphAnnotation = Annotation.Root({
    logs: Annotation<string>(),
    pdfToFill: Annotation<boolean>(),
    pdfBase64: Annotation<string>(),
    enableLlmCalls: Annotation<boolean>(),
    devices: Annotation<LearnedDevice[]>(),
    matchedDevices: Annotation<MatchedLearnedDevice[]>(),
    availableDevices: Annotation<DeviceRow[]>(),
    currentDeviceGroupIndex: Annotation<number | null>(),
    selectedDevicesForOutput: Annotation<DeviceRow[]>(),
});

export type GraphState = typeof GraphAnnotation.State;