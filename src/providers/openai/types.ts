export const BASE_URL = "https://api.openai.com/v1";

export interface OpenAITranscriptionResponse {
    text?: string;
    language?: string;
    duration?: number;
    words?: Array<{
        word: string;
        start: number;
        end: number;
    }>;
    segments?: Array<{
        id: number;
        start: number;
        end: number;
        text: string;
    }>;
}
