import type {
    AzureConfig,
    AzureTranscribeOptions,
    TranscribeResult,
    TranscribedWord,
} from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { isUrl } from "../../utils.js";
import type { AzureFastTranscriptionResponse } from "./types.js";

export async function transcribe(
    config: AzureConfig,
    audio: Buffer | string,
    languages: string[] | undefined,
    options: AzureTranscribeOptions = {},
): Promise<TranscribeResult> {
    const { mode = "fast" } = options;

    if (mode === "batch") {
        const { transcribeBatch } = await import("./batch-transcribe.js");
        return transcribeBatch(config, audio, languages, options);
    }
    return transcribeFast(config, audio, languages, options);
}

// ─── Fast Transcription (shared API call) ───────────────────────────────────

export async function runFastTranscription(
    config: AzureConfig,
    audio: Buffer | string,
    languages: string[] | undefined,
    profanityFilter: string = "none",
): Promise<AzureFastTranscriptionResponse> {
    const profanityMap: Record<string, string> = {
        none: "None",
        masked: "Masked",
        removed: "Removed",
    };

    const definition: Record<string, unknown> = {
        profanityFilterMode: profanityMap[profanityFilter] ?? "None",
    };

    if (languages && languages.length > 0) {
        definition.locales = languages;
    }

    const formData = new FormData();

    if (typeof audio === "string" && isUrl(audio)) {
        definition.audioUrl = audio;
        formData.append("definition", JSON.stringify(definition));
    } else if (Buffer.isBuffer(audio)) {
        formData.append("audio", new Blob([new Uint8Array(audio)]), "audio");
        formData.append("definition", JSON.stringify(definition));
    } else {
        throw new SpeechServiceError(
            "audio must be a Buffer or a URL string",
            "INVALID_INPUT",
            "azure",
        );
    }

    const url = `https://${config.region}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2025-10-15`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Ocp-Apim-Subscription-Key": config.subscriptionKey,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `Azure fast transcription failed: ${errorText}`,
            "API_ERROR",
            "azure",
            response.status,
        );
    }

    return (await response.json()) as AzureFastTranscriptionResponse;
}

// ─── Fast Transcription (normalize result) ──────────────────────────────────

async function transcribeFast(
    config: AzureConfig,
    audio: Buffer | string,
    languages: string[] | undefined,
    options: AzureTranscribeOptions,
): Promise<TranscribeResult> {
    const result = await runFastTranscription(config, audio, languages, options.profanityFilter);

    const words: TranscribedWord[] = [];
    let detectedLanguage = languages?.[0] ?? "";

    for (const phrase of result.phrases ?? []) {
        if (!detectedLanguage && phrase.locale) {
            detectedLanguage = phrase.locale;
        }
        for (const word of phrase.words ?? []) {
            words.push({
                text: word.text,
                startTime: word.offsetMilliseconds / 1000,
                endTime: (word.offsetMilliseconds + word.durationMilliseconds) / 1000,
            });
        }
    }

    const text =
        result.combinedPhrases?.map((p) => p.text).join(" ") ?? "";

    return {
        text,
        words,
        language: detectedLanguage,
        duration: (result.durationMilliseconds ?? 0) / 1000,
    };
}
