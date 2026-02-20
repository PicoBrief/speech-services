import type {
    AssemblyAIConfig,
    AssemblyAITranscribeOptions,
    TranscribeResult,
    TranscribedWord,
} from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { isUrl, normalizeLanguageCode, poll } from "../../utils.js";
import { BASE_URL } from "./types.js";
import type { AssemblyAITranscriptResponse } from "./types.js";

export async function transcribe(
    config: AssemblyAIConfig,
    audio: Buffer | string,
    languages: string[] | undefined,
    options: AssemblyAITranscribeOptions = {},
): Promise<TranscribeResult> {
    const {
        speechModel = "universal",
        pollInterval = 3000,
        timeout = 300_000,
    } = options;

    // Step 1: Get an audio URL
    let audioUrl: string;
    if (typeof audio === "string" && isUrl(audio)) {
        audioUrl = audio;
    } else if (Buffer.isBuffer(audio)) {
        audioUrl = await uploadAudio(config, audio);
    } else {
        throw new SpeechServiceError(
            "audio must be a Buffer or a URL string",
            "INVALID_INPUT",
            "assemblyai",
        );
    }

    // Step 2: Submit transcription
    const body: Record<string, unknown> = {
        audio_url: audioUrl,
        speech_model: speechModel,
    };

    if (languages && languages.length > 1) {
        body.language_codes = languages.map((l) => l.replace("-", "_").toLowerCase());
    } else if (languages && languages.length === 1) {
        body.language_code = languages[0].replace("-", "_").toLowerCase();
    } else {
        body.language_detection = true;
    }

    const submitResponse = await fetch(`${BASE_URL}/v2/transcript`, {
        method: "POST",
        headers: {
            Authorization: config.apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        throw new SpeechServiceError(
            `AssemblyAI transcription submission failed: ${errorText}`,
            "API_ERROR",
            "assemblyai",
            submitResponse.status,
        );
    }

    const submitResult = (await submitResponse.json()) as { id: string; status: string; error?: string };

    if (submitResult.status === "error") {
        throw new SpeechServiceError(
            `AssemblyAI transcription failed: ${submitResult.error}`,
            "TRANSCRIPTION_FAILED",
            "assemblyai",
        );
    }

    // Step 3: Poll until complete
    const transcriptId = submitResult.id;

    const finalResult = await poll(
        async () => {
            const res = await fetch(`${BASE_URL}/v2/transcript/${transcriptId}`, {
                headers: { Authorization: config.apiKey },
            });
            if (!res.ok) {
                throw new SpeechServiceError(
                    `AssemblyAI polling failed: ${res.status}`,
                    "API_ERROR",
                    "assemblyai",
                    res.status,
                );
            }
            return res.json() as Promise<AssemblyAITranscriptResponse>;
        },
        (result) => result.status === "completed" || result.status === "error",
        pollInterval,
        timeout,
        "assemblyai",
    );

    if (finalResult.status === "error") {
        throw new SpeechServiceError(
            `AssemblyAI transcription failed: ${finalResult.error}`,
            "TRANSCRIPTION_FAILED",
            "assemblyai",
        );
    }

    // Step 4: Normalize the result
    const words: TranscribedWord[] = (finalResult.words ?? []).map((w) => ({
        text: w.text,
        startTime: w.start / 1000,
        endTime: w.end / 1000,
        confidence: w.confidence,
        speaker: w.speaker ?? undefined,
    }));

    return {
        text: finalResult.text ?? "",
        words,
        language: normalizeLanguageCode(finalResult.language_code ?? ""),
        duration: finalResult.audio_duration ?? 0,
    };
}

async function uploadAudio(config: AssemblyAIConfig, audio: Buffer): Promise<string> {
    const response = await fetch(`${BASE_URL}/v2/upload`, {
        method: "POST",
        headers: {
            Authorization: config.apiKey,
            "Content-Type": "application/octet-stream",
        },
        body: audio,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `AssemblyAI upload failed: ${errorText}`,
            "UPLOAD_FAILED",
            "assemblyai",
            response.status,
        );
    }

    const result = (await response.json()) as { upload_url: string };
    return result.upload_url;
}
