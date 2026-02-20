export interface SpeechmaticsJobResponse {
    job?: {
        id: string;
        status: "running" | "done" | "rejected";
        duration?: number;
    };
}

export interface SpeechmaticsTranscript {
    results?: SpeechmaticsResult[];
    job?: { duration?: number };
}

export interface SpeechmaticsResult {
    type: "word" | "punctuation" | "entity";
    start_time: number;
    end_time: number;
    channel?: string;
    speaker?: string;
    alternatives?: Array<{
        content: string;
        confidence: number;
        language?: string;
        speaker?: string;
    }>;
}
