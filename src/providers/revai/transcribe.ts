import type {
    RevAIConfig,
    RevAITranscribeOptions,
    TranscribeResult,
    TranscribedWord,
} from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { isUrl, poll } from "../../utils.js";
import { BASE_URL } from "./types.js";
import type { RevAIJob, RevAITranscript } from "./types.js";

export async function transcribe(
    config: RevAIConfig,
    audio: Buffer | string,
    languages: string[] | undefined,
    options: RevAITranscribeOptions = {},
): Promise<TranscribeResult> {
    const {
        skipDiarization = false,
        skipPunctuation = false,
        filterProfanity = false,
        pollInterval = 5000,
        timeout = 300_000,
    } = options;

    const language = languages?.[0] ?? "en";

    const jobOptions: Record<string, unknown> = {
        language,
        skip_diarization: skipDiarization,
        skip_punctuation: skipPunctuation,
        filter_profanity: filterProfanity,
    };

    // Step 1: Submit job
    let submitResponse: Response;

    if (typeof audio === "string" && isUrl(audio)) {
        // URL input: JSON body
        submitResponse = await fetch(`${BASE_URL}/jobs`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                source_config: { url: audio },
                ...jobOptions,
            }),
        });
    } else if (Buffer.isBuffer(audio)) {
        // Buffer input: multipart with media + options
        const formData = new FormData();
        formData.append("media", new Blob([new Uint8Array(audio)]), "audio.mp3");
        formData.append("options", JSON.stringify(jobOptions));

        submitResponse = await fetch(`${BASE_URL}/jobs`, {
            method: "POST",
            headers: { Authorization: `Bearer ${config.apiKey}` },
            body: formData,
        });
    } else {
        throw new SpeechServiceError(
            "audio must be a Buffer or a URL string",
            "INVALID_INPUT",
            "revai",
        );
    }

    if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        throw new SpeechServiceError(
            `Rev.ai job submission failed: ${errorText}`,
            "API_ERROR",
            "revai",
            submitResponse.status,
        );
    }

    const job = (await submitResponse.json()) as RevAIJob;

    // Step 2: Poll until complete
    const finalJob = await poll(
        async () => {
            const res = await fetch(`${BASE_URL}/jobs/${job.id}`, {
                headers: { Authorization: `Bearer ${config.apiKey}` },
            });
            if (!res.ok) {
                throw new SpeechServiceError(
                    `Rev.ai polling failed: ${res.status}`,
                    "API_ERROR",
                    "revai",
                    res.status,
                );
            }
            return res.json() as Promise<RevAIJob>;
        },
        (result) => result.status === "transcribed" || result.status === "failed",
        pollInterval,
        timeout,
        "revai",
    );

    if (finalJob.status === "failed") {
        throw new SpeechServiceError(
            `Rev.ai transcription failed: ${finalJob.failure ?? finalJob.failure_detail ?? "Unknown error"}`,
            "TRANSCRIPTION_FAILED",
            "revai",
        );
    }

    // Step 3: Fetch transcript
    const transcriptResponse = await fetch(`${BASE_URL}/jobs/${job.id}/transcript`, {
        headers: {
            Authorization: `Bearer ${config.apiKey}`,
            Accept: "application/vnd.rev.transcript.v1.0+json",
        },
    });

    if (!transcriptResponse.ok) {
        const errorText = await transcriptResponse.text();
        throw new SpeechServiceError(
            `Rev.ai transcript fetch failed: ${errorText}`,
            "API_ERROR",
            "revai",
            transcriptResponse.status,
        );
    }

    const transcript = (await transcriptResponse.json()) as RevAITranscript;

    // Step 4: Normalize
    const words: TranscribedWord[] = [];
    const textParts: string[] = [];

    for (const monologue of transcript.monologues ?? []) {
        for (const element of monologue.elements) {
            if (element.type === "text") {
                words.push({
                    text: element.value,
                    startTime: element.ts ?? 0,
                    endTime: element.end_ts ?? 0,
                    confidence: element.confidence,
                    speaker: String(monologue.speaker),
                });
            }
            textParts.push(element.value);
        }
    }

    return {
        text: textParts.join("").trim(),
        words,
        language: finalJob.language ?? language,
        duration: finalJob.duration_seconds ?? 0,
    };
}
