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
    created_at: Date;
}