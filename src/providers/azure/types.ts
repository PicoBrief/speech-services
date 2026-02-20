export interface AzureFastTranscriptionResponse {
    durationMilliseconds: number;
    combinedPhrases?: Array<{ text: string; channel?: number }>;
    phrases?: Array<{
        offsetMilliseconds: number;
        durationMilliseconds: number;
        text: string;
        locale?: string;
        confidence?: number;
        words?: Array<{
            text: string;
            offsetMilliseconds: number;
            durationMilliseconds: number;
        }>;
    }>;
}

export interface AzureVoiceListEntry {
    ShortName: string;
    DisplayName: string;
    Locale: string;
    Gender?: string;
    VoiceType?: string;
}

export interface AzureBatchTranscriptionResult {
    durationMilliseconds?: number;
    combinedRecognizedPhrases?: Array<{ display: string }>;
    recognizedPhrases?: Array<{
        offsetInTicks: number;
        durationInTicks: number;
        text: string;
        locale?: string;
        nBest?: Array<{
            display: string;
            words?: Array<{
                word: string;
                offsetInTicks: number;
                durationInTicks: number;
                confidence: number;
            }>;
        }>;
    }>;
}
