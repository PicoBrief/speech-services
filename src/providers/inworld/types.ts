export const BASE_URL = "https://api.inworld.ai";

export interface InworldTTSResponse {
    audioContent: string;
    usage?: {
        processedCharactersCount?: number;
        modelId?: string;
    };
    timestampInfo?: {
        wordAlignment?: {
            words: string[];
            wordStartTimeSeconds: number[];
            wordEndTimeSeconds: number[];
        };
        characterAlignment?: {
            characters: string[];
            characterStartTimeSeconds: number[];
            characterEndTimeSeconds: number[];
        };
    };
}

export interface InworldSTTResponse {
    transcription: {
        transcript: string;
        isFinal: boolean;
        wordTimestamps?: Array<{
            word: string;
            startOffsetMs: number;
            endOffsetMs: number;
        }>;
    };
    usage?: {
        transcribedAudioMs?: number;
        modelId?: string;
    };
}

export interface InworldVoiceEntry {
    voiceId: string;
    displayName: string;
    languages: string[];
    description?: string;
    tags?: string[];
    isCustom?: boolean;
}
