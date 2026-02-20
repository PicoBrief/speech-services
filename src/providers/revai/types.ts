export const BASE_URL = "https://api.rev.ai/speechtotext/v1";

export interface RevAIJob {
    id: string;
    status: "in_progress" | "transcribed" | "failed";
    language?: string;
    duration_seconds?: number;
    failure?: string;
    failure_detail?: string;
}

export interface RevAITranscript {
    monologues?: Array<{
        speaker: number;
        elements: RevAIElement[];
    }>;
}

export interface RevAIElement {
    type: "text" | "punct" | "unknown";
    value: string;
    ts?: number;
    end_ts?: number;
    confidence?: number;
}
