export interface LearnedDevice {
    device_raw: string;
    length: number;
    width: number;
    height: number;
    description: string;
    manufacturer: string;
    model: string;
    price: number;
}

export interface MatchedLearnedDevice extends LearnedDevice {
    device_matched: string;
}

export interface DeviceFromDb extends MatchedLearnedDevice {
    id: number;
    marge: number | null;
    created_at: string;
}

// what api returns on start/resume
export interface SessionResponse {
    sessionId?: string;
    status: "interrupted" | "completed";
    currentDeviceIndex?: number;
    totalDevices?: number;
    deviceBeingMatched?: MatchedLearnedDevice;
    availableDevices?: DeviceFromDb[];
    selectedSoFar?: DeviceFromDb[];
    selectedDevices?: DeviceFromDb[];
    message?: string;
}