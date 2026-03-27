import type {
    InworldConfig,
    InworldTranscribeOptions,
    TranscribeResult,
    TranscribedWord,
} from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { isUrl, normalizeLanguageCode } from "../../utils.js";
import { BASE_URL } from "./types.js";
import type { InworldSTTResponse } from "./types.js";

export async function transcribe(
    config: InworldConfig,
    audio: Buffer | string,
    languages: string[] | undefined,
    options: InworldTranscribeOptions = {},
): Promise<TranscribeResult> {
    const {
        modelId = "groq/whisper-large-v3",
        audioEncoding = "AUTO_DETECT",
        sampleRateHertz = 16000,
        includeWordTimestamps = true,
    } = options;

    let audioBase64: string;

    if (Buffer.isBuffer(audio)) {
        audioBase64 = audio.toString("base64");
    } else if (typeof audio === "string" && isUrl(audio)) {
        const audioResponse = await fetch(audio);
        if (!audioResponse.ok) {
            throw new SpeechServiceError(
                `Failed to fetch audio from URL: ${audioResponse.status}`,
                "INVALID_INPUT",
                "inworld",
            );
        }
        const arrayBuffer = await audioResponse.arrayBuffer();
        audioBase64 = Buffer.from(arrayBuffer).toString("base64");
    } else {
        throw new SpeechServiceError(
            "audio must be a Buffer or a URL string",
            "INVALID_INPUT",
            "inworld",
        );
    }

    const transcribeConfig: Record<string, unknown> = {
        modelId,
        audioEncoding,
        sampleRateHertz,
        includeWordTimestamps,
    };

    if (languages?.[0]) {
        transcribeConfig.language = languages[0];
    }

    const body = {
        transcribeConfig,
        audioData: { content: audioBase64 },
    };

    const response = await fetch(`${BASE_URL}/stt/v1/transcribe`, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${config.apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `Inworld transcription failed: ${errorText}`,
            "API_ERROR",
            "inworld",
            response.status,
        );
    }

    const result = (await response.json()) as InworldSTTResponse;

    const words: TranscribedWord[] = (result.transcription.wordTimestamps ?? []).map((w) => ({
        text: w.word,
        startTime: w.startOffsetMs / 1000,
        endTime: w.endOffsetMs / 1000,
    }));

    const duration = words.length > 0 ? words[words.length - 1].endTime : 0;

    return {
        text: result.transcription.transcript,
        words,
        language: normalizeLanguageCode(languages?.[0] ?? ""),
        duration,
    };
}
