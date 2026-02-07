import { eq } from "drizzle-orm";
import { db } from "./client.js";
import { devices } from "./schema.js";

// create new device
export async function createDevice(data: typeof devices.$inferInsert) {
    const result = await db.insert(devices).values(data).returning();
    return result[0];
}

// get single device by id
export async function getDevice(id: number) {
    const result = await db.select().from(devices).where(eq(devices.id, id));
    return result[0] ?? null;
}

// get all devices
export async function getAllDevices() {
    return db.select().from(devices);
}

// get devices by matched group
export async function getDevicesByGroup(deviceMatched: string) {
    return db.select().from(devices).where(eq(devices.device_matched, deviceMatched));
}

// delete a devices
export async function deleteDevice(id: number) {
    return db.delete(devices).where(eq(devices.id, id));
}