import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { GraphAnnotation } from "./state.js";
import {
    startNode,
    extractionNode,
    matcherNode,
    saverNode,
    findDevicesPrep,
    humanSelectDevice,
} from "./nodes.js";
import { lookupOrSave, continueOrEnd } from "./edges.js";

export function buildGraph() {
    const builder = new StateGraph(GraphAnnotation)
        .addNode("start_node", startNode)
        .addNode("extraction_node", extractionNode)
        .addNode("matcher_node", matcherNode)
        .addNode("saver_node", saverNode)
        .addNode("find_devices_prep", findDevicesPrep)
        .addNode("human_select_device", humanSelectDevice)
        .addEdge(START, "start_node")
        .addEdge("start_node", "extraction_node")
        .addEdge("extraction_node", "matcher_node")
        .addConditionalEdges("matcher_node", lookupOrSave, {
            save: "saver_node",
            lookup: "find_devices_prep", 
        })
        .addEdge("find_devices_prep", "human_select_device")
        .addConditionalEdges("human_select_device", continueOrEnd, {
            continue: "find_devices_prep",
            end: END,
        })
        .addEdge("saver_node", END);

    const checkpointer = new MemorySaver();
    return builder.compile({ checkpointer });
}