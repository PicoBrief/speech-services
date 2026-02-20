export const BASE_URL = "https://api.cartesia.ai";
export const API_VERSION = "2025-04-16";

export interface CartesiaVoiceListResponse {
    data?: CartesiaVoice[];
    has_more?: boolean;
}

export interface CartesiaVoice {
    id: string;
    name: string;
    language?: string;
    gender?: string;
    description?: string;
}
