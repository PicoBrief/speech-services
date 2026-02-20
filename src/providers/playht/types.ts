export const BASE_URL = "https://api.play.ht/api/v2";

export interface PlayHTVoice {
    id: string;
    name: string;
    language?: string;
    language_code?: string;
    gender?: string;
    accent?: string;
    sample?: string;
}
