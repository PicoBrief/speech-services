import type {
    GoogleConfig,
    GoogleTranscribeOptions,
    TranscribeResult,
    TranscribedWord,
} from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { isUrl, downloadAudio, poll } from "../../utils.js";
import { STT_BASE_URL } from "./types.js";
import type { GoogleRecognizeResponse, GoogleLongRunningOperation } from "./types.js";
import { parseGoogleDuration } from "./helpers.js";

export async function transcribe(
    config: GoogleConfig,
    audio: Buffer | string,
    languages: string[] | undefined,
    options: GoogleTranscribeOptions = {},
): Promise<TranscribeResult> {
    const { model = "latest_long", encoding, sampleRateHertz } = options;

    const primaryLanguage = languages?.[0] ?? "en-US";
    const altLanguages = languages?.slice(1, 4) ?? [];

    const recognitionConfig: Record<string, unknown> = {
        languageCode: primaryLanguage,
        model,
        enableWordTimeOffsets: true,
        enableWordConfidence: true,
        enableAutomaticPunctuation: true,
    };

    if (altLanguages.length > 0) {
        recognitionConfig.alternativeLanguageCodes = altLanguages;
    }
    if (encoding) recognitionConfig.encoding = encoding;
    if (sampleRateHertz) recognitionConfig.sampleRateHertz = sampleRateHertz;

    // Determine if we should use async mode (GCS URIs)
    if (typeof audio === "string" && audio.startsWith("gs://")) {
        return transcribeAsync(config, audio, recognitionConfig);
    }

    // Sync mode: Buffer or HTTP URL
    let audioBuffer: Buffer;
    if (Buffer.isBuffer(audio)) {
        audioBuffer = audio;
    } else if (typeof audio === "string" && isUrl(audio)) {
        audioBuffer = await downloadAudio(audio);
    } else {
        throw new SpeechServiceError(
            "audio must be a Buffer, HTTP URL, or gs:// URI",
            "INVALID_INPUT",
            "google",
        );
    }

    const body = {
        config: recognitionConfig,
        audio: { content: audioBuffer.toString("base64") },
    };

    const response = await fetch(`${STT_BASE_URL}/speech:recognize?key=${config.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `Google STT failed: ${errorText}`,
            "API_ERROR",
            "google",
            response.status,
        );
    }

    const result = (await response.json()) as GoogleRecognizeResponse;
    return normalizeResponse(result, primaryLanguage);
}

async function transcribeAsync(
    config: GoogleConfig,
    gcsUri: string,
    recognitionConfig: Record<string, unknown>,
): Promise<TranscribeResult> {
    const body = {
        config: recognitionConfig,
        audio: { uri: gcsUri },
    };

    const response = await fetch(`${STT_BASE_URL}/speech:longrunningrecognize?key=${config.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `Google async STT failed: ${errorText}`,
            "API_ERROR",
            "google",
            response.status,
        );
    }

    const operation = (await response.json()) as GoogleLongRunningOperation;

    const finalOp = await poll(
        async () => {
            const res = await fetch(
                `${STT_BASE_URL}/operations/${operation.name}?key=${config.apiKey}`,
            );
            if (!res.ok) {
                throw new SpeechServiceError(
                    `Google STT polling failed: ${res.status}`,
                    "API_ERROR",
                    "google",
                    res.status,
                );
            }
            return res.json() as Promise<GoogleLongRunningOperation>;
        },
        (op) => op.done === true,
        5000,
        300_000,
        "google",
    );

    if (finalOp.error) {
        throw new SpeechServiceError(
            `Google STT failed: ${finalOp.error.message}`,
            "TRANSCRIPTION_FAILED",
            "google",
        );
    }

    const primaryLanguage = (recognitionConfig.languageCode as string) ?? "en-US";
    return normalizeResponse(finalOp.response ?? {}, primaryLanguage);
}

function normalizeResponse(
    result: GoogleRecognizeResponse,
    primaryLanguage: string,
): TranscribeResult {
    const words: TranscribedWord[] = [];
    const textParts: string[] = [];
    let detectedLanguage = primaryLanguage;
    let lastEndTime = 0;

    for (const sttResult of result.results ?? []) {
        if (sttResult.languageCode) {
            detectedLanguage = sttResult.languageCode;
        }
        const alt = sttResult.alternatives?.[0];
        if (!alt) continue;

        if (alt.transcript) textParts.push(alt.transcript);

        for (const w of alt.words ?? []) {
            const startTime = parseGoogleDuration(w.startTime ?? w.startOffset);
            const endTime = parseGoogleDuration(w.endTime ?? w.endOffset);
            words.push({
                text: w.word,
                startTime,
                endTime,
                confidence: w.confidence,
                speaker: w.speakerLabel ?? (w.speakerTag ? String(w.speakerTag) : undefined),
            });
            if (endTime > lastEndTime) lastEndTime = endTime;
        }
    }

    return {
        text: textParts.join(" "),
        words,
        language: detectedLanguage,
        duration: lastEndTime,
    };
}
