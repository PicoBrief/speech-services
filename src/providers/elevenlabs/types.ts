export const BASE_URL = "https://api.elevenlabs.io";

export interface ElevenLabsTranscriptionResponse {
    language_code: string;
    language_probability?: number;
    text: string;
    words?: ElevenLabsWord[];
}

export interface ElevenLabsWord {
    text: string;
    type: "word" | "spacing" | "audio_event";
    start?: number;
    end?: number;
    speaker_id?: string | null;
    logprob?: number;
}

export interface ElevenLabsVoiceEntry {
    voice_id: string;
    name: string;
    labels?: Record<string, string>;
    fine_tuning?: { language?: string };
}
