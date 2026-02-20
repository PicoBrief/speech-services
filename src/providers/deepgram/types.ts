export const BASE_URL = "https://api.deepgram.com";

export interface DeepgramResponse {
    metadata?: { duration?: number; channels?: number; request_id?: string };
    results?: {
        channels?: Array<{
            alternatives?: Array<{
                transcript?: string;
                confidence?: number;
                words?: DeepgramWord[];
            }>;
            detected_language?: string;
        }>;
    };
}

export interface DeepgramWord {
    word: string;
    start: number;
    end: number;
    confidence: number;
    punctuated_word?: string;
    speaker?: number;
}

export interface DeepgramTTSModel {
    name: string;
    canonical_name: string;
    architecture?: string;
    languages?: string[];
    version?: string;
    uuid?: string;
    metadata?: { accent?: string; tags?: string[] };
}
