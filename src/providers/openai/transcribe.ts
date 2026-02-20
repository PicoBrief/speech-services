import type {
    OpenAIConfig,
    OpenAITranscribeOptions,
    TranscribeResult,
    TranscribedWord,
} from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { BASE_URL } from "./types.js";
import type { OpenAITranscriptionResponse } from "./types.js";

export async function transcribe(
    config: OpenAIConfig,
    audio: Buffer | string,
    languages: string[] | undefined,
    options: OpenAITranscribeOptions = {},
): Promise<TranscribeResult> {
    const { model = "whisper-1", prompt, temperature } = options;

    // OpenAI STT requires a file upload via multipart/form-data
    let audioBuffer: Buffer;
    if (Buffer.isBuffer(audio)) {
        audioBuffer = audio;
    } else if (typeof audio === "string") {
        // Download the URL first — OpenAI only accepts file uploads
        const res = await fetch(audio);
        if (!res.ok) {
            throw new SpeechServiceError(
                `Failed to download audio from ${audio}: ${res.status}`,
                "DOWNLOAD_FAILED",
                "openai",
            );
        }
        audioBuffer = Buffer.from(await res.arrayBuffer());
    } else {
        throw new SpeechServiceError(
            "audio must be a Buffer or a URL string",
            "INVALID_INPUT",
            "openai",
        );
    }

    const formData = new FormData();
    formData.append("file", new Blob([new Uint8Array(audioBuffer)]), "audio.mp3");
    formData.append("model", model);
    formData.append("response_format", "verbose_json");

    // Word-level timestamps only available with whisper-1
    if (model === "whisper-1") {
        formData.append("timestamp_granularities[]", "word");
    }

    if (languages?.[0]) {
        formData.append("language", languages[0].split("-")[0].toLowerCase());
    }
    if (prompt) formData.append("prompt", prompt);
    if (temperature !== undefined) formData.append("temperature", String(temperature));

    const response = await fetch(`${BASE_URL}/audio/transcriptions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${config.apiKey}` },
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `OpenAI transcription failed: ${errorText}`,
            "API_ERROR",
            "openai",
            response.status,
        );
    }

    const result = (await response.json()) as OpenAITranscriptionResponse;

    const words: TranscribedWord[] = (result.words ?? []).map((w) => ({
        text: w.word,
        startTime: w.start,
        endTime: w.end,
    }));

    return {
        text: result.text ?? "",
        words,
        language: result.language ?? languages?.[0] ?? "",
        duration: result.duration ?? 0,
    };
}
