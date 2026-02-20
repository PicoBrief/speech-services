import type {
    AzureConfig,
    AzureTranscribeOptions,
    TranscribeResult,
    TranscribedWord,
} from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { isUrl, poll } from "../../utils.js";
import type { AzureBatchTranscriptionResult } from "./types.js";

export async function transcribeBatch(
    config: AzureConfig,
    audio: Buffer | string,
    languages: string[] | undefined,
    options: AzureTranscribeOptions,
): Promise<TranscribeResult> {
    const {
        profanityFilter = "none",
        pollInterval = 5000,
        timeout = 300_000,
    } = options;

    // Batch mode requires a URL
    if (Buffer.isBuffer(audio)) {
        throw new SpeechServiceError(
            'Azure batch transcription requires a URL. Pass a URL string or use mode: "fast" for Buffer inputs.',
            "INVALID_INPUT",
            "azure",
        );
    }

    if (typeof audio !== "string" || !isUrl(audio)) {
        throw new SpeechServiceError(
            "audio must be a public URL for batch transcription",
            "INVALID_INPUT",
            "azure",
        );
    }

    const profanityMap: Record<string, string> = {
        none: "None",
        masked: "Masked",
        removed: "Removed",
    };

    // Submit batch job
    const submitUrl = `https://${config.region}.api.cognitive.microsoft.com/speechtotext/transcriptions:submit?api-version=2025-10-15`;

    const primaryLocale = languages?.[0] ?? "en-US";

    const body: Record<string, unknown> = {
        contentUrls: [audio],
        locale: primaryLocale,
        displayName: `transcription-${Date.now()}`,
        properties: {
            wordLevelTimestampsEnabled: true,
            punctuationMode: "DictatedAndAutomatic",
            profanityFilterMode: profanityMap[profanityFilter] ?? "None",
            timeToLiveHours: 48,
        },
    };

    // Azure batch language identification: 2-10 candidate locales, no duplicate base languages
    if (!languages || languages.length !== 1) {
        let candidateLocales: string[];

        if (languages && languages.length > 1) {
            candidateLocales = languages.slice(0, 10);
        } else {
            candidateLocales = ["en-US", "es-ES", "fr-FR", "de-DE", "zh-CN", "ja-JP"];
        }

        if (!candidateLocales.includes(primaryLocale)) {
            candidateLocales = [primaryLocale, ...candidateLocales.slice(0, 9)];
        }

        (body.properties as Record<string, unknown>).languageIdentification = {
            candidateLocales,
            mode: "Continuous",
        };
    }

    const submitResponse = await fetch(submitUrl, {
        method: "POST",
        headers: {
            "Ocp-Apim-Subscription-Key": config.subscriptionKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        throw new SpeechServiceError(
            `Azure batch transcription submission failed: ${errorText}`,
            "API_ERROR",
            "azure",
            submitResponse.status,
        );
    }

    const submitResult = (await submitResponse.json()) as { self: string };
    const transcriptionUrl = submitResult.self;

    // Poll for completion
    const finalStatus = await poll(
        async () => {
            const res = await fetch(transcriptionUrl, {
                headers: { "Ocp-Apim-Subscription-Key": config.subscriptionKey },
            });
            if (!res.ok) {
                throw new SpeechServiceError(
                    `Azure batch polling failed: ${res.status}`,
                    "API_ERROR",
                    "azure",
                    res.status,
                );
            }
            return res.json() as Promise<{ status: string; links?: { files: string } }>;
        },
        (result) => result.status === "Succeeded" || result.status === "Failed",
        pollInterval,
        timeout,
        "azure",
    );

    if (finalStatus.status === "Failed") {
        throw new SpeechServiceError(
            "Azure batch transcription failed",
            "TRANSCRIPTION_FAILED",
            "azure",
        );
    }

    // Fetch the result files
    const filesUrl = finalStatus.links?.files;
    if (!filesUrl) {
        throw new SpeechServiceError(
            "Azure batch transcription returned no file links",
            "API_ERROR",
            "azure",
        );
    }

    const filesResponse = await fetch(filesUrl, {
        headers: { "Ocp-Apim-Subscription-Key": config.subscriptionKey },
    });
    const filesResult = (await filesResponse.json()) as {
        values: Array<{ kind: string; links: { contentUrl: string } }>;
    };

    const transcriptionFile = filesResult.values.find((f) => f.kind === "Transcription");
    if (!transcriptionFile) {
        throw new SpeechServiceError(
            "Azure batch transcription returned no transcription file",
            "API_ERROR",
            "azure",
        );
    }

    const contentResponse = await fetch(transcriptionFile.links.contentUrl);
    const content = (await contentResponse.json()) as AzureBatchTranscriptionResult;

    // Normalize: Azure batch uses ticks (100-nanosecond units)
    const TICKS_PER_SECOND = 10_000_000;
    const words: TranscribedWord[] = [];
    let detectedLanguage = primaryLocale;

    for (const phrase of content.recognizedPhrases ?? []) {
        if (!detectedLanguage && phrase.locale) {
            detectedLanguage = phrase.locale;
        }
        const best = phrase.nBest?.[0];
        if (best?.words) {
            for (const word of best.words) {
                words.push({
                    text: word.word,
                    startTime: word.offsetInTicks / TICKS_PER_SECOND,
                    endTime: (word.offsetInTicks + word.durationInTicks) / TICKS_PER_SECOND,
                    confidence: word.confidence,
                });
            }
        }
    }

    const text =
        content.combinedRecognizedPhrases?.map((p) => p.display).join(" ") ?? "";

    return {
        text,
        words,
        language: detectedLanguage,
        duration: (content.durationMilliseconds ?? 0) / 1000,
    };
}
