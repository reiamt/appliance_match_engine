import type { SessionResponse } from "../types/device"

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function startSession(formData: FormData): Promise<SessionResponse> {
    const res = await fetch(`${BASE}/api/session/start`, {
        method: "POST",
        body: formData,
    });
    if (!res.ok) throw new Error("Failed to start session");
    return res.json();
}

export async function resumeSession(
    sessionId: string,
    selectedDeviceId: number
): Promise<SessionResponse> {
    const res = await fetch(`${BASE}/api/session/${sessionId}/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedDeviceId })
    });
    if (!res.ok) throw new Error("Failed to resume session");
    return res.json();
}

export async function exportDevices(sessionId: string): Promise<any> {
    const res = await fetch(`${BASE}/api/session/${sessionId}/export`);
    if (!res.ok) throw new Error("Failed to export");
    return res.json();
}