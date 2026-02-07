import type { GraphState } from "./state.js";

export function lookupOrSave(state: GraphState): "lookup" | "save" {
    return state.pdfToFill ? "lookup" : "save";
}

export function continueOrEnd(state: GraphState): "continue" | "end" {
    return state.matchedDevices.length > (state.currentDeviceGroupIndex ?? 0)
        ? "continue"
        : "end";
}

