export const BASE_URL = "https://api.assemblyai.com";

export interface AssemblyAITranscriptResponse {
    id: string;
    status: "queued" | "processing" | "completed" | "error";
    text: string | null;
    words: AssemblyAIWord[] | null;
    language_code: string;
    audio_duration: number | null;
    error?: string;
}

export interface AssemblyAIWord {
    text: string;
    start: number;
    end: number;
    confidence: number;
    speaker: string | null;
}
