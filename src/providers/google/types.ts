export const STT_BASE_URL = "https://speech.googleapis.com/v1";
export const TTS_BASE_URL = "https://texttospeech.googleapis.com/v1";

export interface GoogleRecognizeResponse {
    results?: GoogleSttResult[];
    totalBilledTime?: string;
}

export interface GoogleSttResult {
    alternatives?: GoogleSttAlternative[];
    channelTag?: number;
    resultEndTime?: string;
    languageCode?: string;
}

export interface GoogleSttAlternative {
    transcript?: string;
    confidence?: number;
    words?: GoogleWordInfo[];
}

export interface GoogleWordInfo {
    word: string;
    startTime?: string;
    endTime?: string;
    startOffset?: string;
    endOffset?: string;
    confidence?: number;
    speakerLabel?: string;
    speakerTag?: number;
}

export interface GoogleVoiceEntry {
    name: string;
    languageCodes?: string[];
    ssmlGender?: string;
    naturalSampleRateHertz?: number;
}

export interface GoogleLongRunningOperation {
    name: string;
    done?: boolean;
    error?: { code: number; message: string };
    response?: GoogleRecognizeResponse;
}
