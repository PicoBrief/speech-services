import type { SpeechmaticsConfig } from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { poll } from "../../utils.js";
import type { SpeechmaticsJobResponse, SpeechmaticsTranscript } from "./types.js";

function getBaseUrl(config: SpeechmaticsConfig): string {
    const region = config.region ?? "eu1";
    return `https://${region}.asr.api.speechmatics.com/v2`;
}

export async function runTranscriptionJob(
    config: SpeechmaticsConfig,
    audio: Buffer | string,
    jobConfig: Record<string, unknown>,
    pollInterval: number,
    timeout: number,
): Promise<SpeechmaticsTranscript> {
    const baseUrl = getBaseUrl(config);

    // Step 1: Submit job
    const formData = new FormData();
    formData.append("config", JSON.stringify(jobConfig));

    if (Buffer.isBuffer(audio)) {
        formData.append("data_file", new Blob([new Uint8Array(audio)]), "audio.mp3");
    } else if (typeof audio === "string") {
        // For URLs, use fetch_data in config instead of form data
        (jobConfig as Record<string, unknown>).fetch_data = { url: audio };
        formData.set("config", JSON.stringify(jobConfig));
    }

    const submitResponse = await fetch(`${baseUrl}/jobs/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${config.apiKey}` },
        body: formData,
    });

    if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        throw new SpeechServiceError(
            `Speechmatics job submission failed: ${errorText}`,
            "API_ERROR",
            "speechmatics",
            submitResponse.status,
        );
    }

    const jobResponse = (await submitResponse.json()) as SpeechmaticsJobResponse;
    const jobId = jobResponse.job?.id;

    if (!jobId) {
        throw new SpeechServiceError(
            "Speechmatics returned no job ID",
            "API_ERROR",
            "speechmatics",
        );
    }

    // Step 2: Poll until complete
    const finalJob = await poll(
        async () => {
            const res = await fetch(`${baseUrl}/jobs/${jobId}`, {
                headers: { Authorization: `Bearer ${config.apiKey}` },
            });
            if (!res.ok) {
                throw new SpeechServiceError(
                    `Speechmatics polling failed: ${res.status}`,
                    "API_ERROR",
                    "speechmatics",
                    res.status,
                );
            }
            return res.json() as Promise<SpeechmaticsJobResponse>;
        },
        (result) => result.job?.status === "done" || result.job?.status === "rejected",
        pollInterval,
        timeout,
        "speechmatics",
    );

    if (finalJob.job?.status === "rejected") {
        throw new SpeechServiceError(
            "Speechmatics transcription was rejected",
            "TRANSCRIPTION_FAILED",
            "speechmatics",
        );
    }

    // Step 3: Fetch transcript
    const transcriptResponse = await fetch(`${baseUrl}/jobs/${jobId}/transcript?format=json-v2`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
    });

    if (!transcriptResponse.ok) {
        const errorText = await transcriptResponse.text();
        throw new SpeechServiceError(
            `Speechmatics transcript fetch failed: ${errorText}`,
            "API_ERROR",
            "speechmatics",
            transcriptResponse.status,
        );
    }

    return (await transcriptResponse.json()) as SpeechmaticsTranscript;
}
