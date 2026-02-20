import type {
    DeepgramConfig,
    DeepgramTranscribeOptions,
    TranscribeResult,
    TranscribedWord,
} from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { isUrl } from "../../utils.js";
import { BASE_URL } from "./types.js";
import type { DeepgramResponse } from "./types.js";

export async function transcribe(
    config: DeepgramConfig,
    audio: Buffer | string,
    languages: string[] | undefined,
    options: DeepgramTranscribeOptions = {},
): Promise<TranscribeResult> {
    const { model = "nova-2", smartFormat = true, diarize = false } = options;

    const params = new URLSearchParams({
        model,
        smart_format: String(smartFormat),
        diarize: String(diarize),
    });

    if (languages?.[0]) {
        params.set("language", languages[0]);
    }

    let body: Buffer | string;
    const headers: Record<string, string> = {
        Authorization: `Token ${config.apiKey}`,
    };

    if (typeof audio === "string" && isUrl(audio)) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({ url: audio });
    } else if (Buffer.isBuffer(audio)) {
        headers["Content-Type"] = "application/octet-stream";
        body = audio;
    } else {
        throw new SpeechServiceError(
            "audio must be a Buffer or a URL string",
            "INVALID_INPUT",
            "deepgram",
        );
    }

    const url = `${BASE_URL}/v1/listen?${params}`;

    const response = await fetch(url, { method: "POST", headers, body });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `Deepgram transcription failed: ${errorText}`,
            "API_ERROR",
            "deepgram",
            response.status,
        );
    }

    const result = (await response.json()) as DeepgramResponse;

    // Normalize: Deepgram timestamps are already in seconds
    const alt = result.results?.channels?.[0]?.alternatives?.[0];
    const words: TranscribedWord[] = (alt?.words ?? []).map((w) => ({
        text: w.punctuated_word ?? w.word,
        startTime: w.start,
        endTime: w.end,
        confidence: w.confidence,
        speaker: w.speaker !== undefined ? String(w.speaker) : undefined,
    }));

    const detectedLanguage =
        result.results?.channels?.[0]?.detected_language ?? languages?.[0] ?? "";

    return {
        text: alt?.transcript ?? "",
        words,
        language: detectedLanguage,
        duration: result.metadata?.duration ?? 0,
    };
}
