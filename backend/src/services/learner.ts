import dotenv from "dotenv";
dotenv.config({ path: "../../.env"});

import { GoogleGenAI, Type } from "@google/genai";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as dbQueries from "../db/queries.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODEL = "gemini-2.5-flash";

// prompts
const EXTRACTION_PROMPT_WITH_MANU = `
    Extract ALL numbered kitchen devices and their detailed descriptions from the following text.
    For each device, capture its type, dimensions (length, width, height) if present, else fill with 0.
    Further capture the entire device description, its manufacturer/brand, the model/type and the reported price if present.
`;

const EXTRACTION_PROMPT = `
    Extract ALL numbered kitchen devices and their detailed descriptions from the following text.
    For each device, capture its type, dimensions (length, width, height) if present, else fill with 0.
    Further capture the entire device description. Keep it all in german.
`;

const MATCHER_PROMPT = `
    You are an expert semantic matcher. Your task is to analyze a list of kitchen devices,
    their descriptions, and original names, and match them to the single most appropriate
    standardized device name from the provided GERAETE_LIST.
    For each device in the input, you MUST select a name from the GERAETE_LIST and
    add it under the new key 'device_matched'. Do not invent names. Keep all original keys and values.

    GERAETE_LIST:
    ---
    {geraete_list}
    ---

    INPUT DEVICES:
    ---
    {llm_devices_german_json}
    ---
`;

// load device catalog
const geraeteList = JSON.parse(
    readFileSync("../data/metadata_geraete_list.json", "utf-8")
);

// response schema for gemini structured output
const baseDeviceProperties = {
    device_raw: { type: Type.STRING },
    length: { type: Type.INTEGER },
    width: { type: Type.INTEGER },
    height: { type: Type.INTEGER },
    description: { type: Type.STRING },
    manufacturer: { type: Type.STRING },
    model: { type: Type.STRING },
    price: { type: Type.INTEGER },
}

const deviceSchema = {
    type: Type.OBJECT,
    properties: {
        devices: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    ...baseDeviceProperties
                },
                required: ["device_raw", "length", "width", "height", "description", "manufacturer", "model", "price"],
            },
        },
    },
    required: ["devices"],
};

const matchedDeviceSchema = {
    type: Type.OBJECT,
    properties: {
        devices: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    ...baseDeviceProperties,
                    device_matched: { type: Type.STRING },
                },
                required: ["device_raw", "length", "width", "height", "description", "manufacturer", "model", "price", "device_matched"],
            },
        },
    },
    required: ["devices"],
};

// module level cache
let extractedDeviceCache: any = null;

export async function extractDevices(pdfBase64: string, pdfWithModel: boolean) {
    const prompt = pdfWithModel ? EXTRACTION_PROMPT_WITH_MANU : EXTRACTION_PROMPT;

    const response = await ai.models.generateContent({
        model: MODEL,
        contents: [
            { inlineData: { mimeType: "application/pdf", data: pdfBase64 } },
            { text: prompt },
        ],
        config: {
            temperature: 0,
            responseMimeType: "application/json",
            responseSchema: deviceSchema,
            maxOutputTokens: 65536,
        },
    });

    const parsed = JSON.parse(response.text!);
    extractedDeviceCache = parsed;
    return parsed.devices;
}

export async function matchDevices() {
    const prompt = MATCHER_PROMPT
        .replace("{geraete_list}", JSON.stringify(geraeteList))
        .replace("{llm_devices_german_json}", JSON.stringify(extractedDeviceCache));

    const response = await ai.models.generateContent({
        model: MODEL,
        contents: [{ text: prompt }],
        config: {
            temperature: 0,
            responseMimeType: "application/json",
            responseSchema: matchedDeviceSchema,
            maxOutputTokens: 65536,
        },
    });

    const parsed = JSON.parse(response.text!);
    extractedDeviceCache = parsed;
    return parsed.devices;
}

export async function saveDevices() {
    for (const device of extractedDeviceCache.devices) {
        await dbQueries.createDevice(device);
    }
}

// read cached json files (when llm calls are disabled)
export function readCachedExtraction() {
    const data = JSON.parse(
        readFileSync("../data/extraction_node_output.json", "utf-8")
    );
    extractedDeviceCache = { "devices": data };
    return data;
}

export function readCachedMatching() {
    const data = JSON.parse(
        readFileSync("../data/matcher_node_output.json", "utf-8")
    );
    extractedDeviceCache = { devices: data };
    return data
}