import type {
    ElevenLabsConfig,
    ElevenLabsTranscribeOptions,
    TranscribeResult,
    TranscribedWord,
} from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { isUrl, normalizeLanguageCode } from "../../utils.js";
import { BASE_URL } from "./types.js";
import type { ElevenLabsTranscriptionResponse } from "./types.js";

export async function transcribe(
    config: ElevenLabsConfig,
    audio: Buffer | string,
    languages: string[] | undefined,
    options: ElevenLabsTranscribeOptions = {},
): Promise<TranscribeResult> {
    const { model = "scribe_v2" } = options;

    const formData = new FormData();
    formData.append("model_id", model);
    formData.append("timestamps_granularity", "word");

    if (typeof audio === "string" && isUrl(audio)) {
        formData.append("cloud_storage_url", audio);
    } else if (Buffer.isBuffer(audio)) {
        formData.append("file", new Blob([new Uint8Array(audio)]), "audio.mp3");
    } else {
        throw new SpeechServiceError(
            "audio must be a Buffer or a URL string",
            "INVALID_INPUT",
            "elevenlabs",
        );
    }

    // ElevenLabs accepts a single language code (ISO 639-1, 2-letter)
    if (languages?.[0]) {
        formData.append("language_code", languages[0].split("-")[0].toLowerCase());
    }

    const response = await fetch(`${BASE_URL}/v1/speech-to-text`, {
        method: "POST",
        headers: { "xi-api-key": config.apiKey },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `ElevenLabs transcription failed: ${errorText}`,
            "API_ERROR",
            "elevenlabs",
            response.status,
        );
    }

    const result = (await response.json()) as ElevenLabsTranscriptionResponse;

    // Filter to "word" type only (exclude "spacing" and "audio_event")
    const words: TranscribedWord[] = (result.words ?? [])
        .filter((w) => w.type === "word")
        .map((w) => ({
            text: w.text,
            startTime: w.start ?? 0,
            endTime: w.end ?? 0,
            speaker: w.speaker_id ?? undefined,
        }));

    // Duration: use last word's endTime
    const duration = words.length > 0 ? words[words.length - 1].endTime : 0;

    return {
        text: result.text,
        words,
        language: normalizeLanguageCode(result.language_code ?? ""),
        duration,
    };
}
