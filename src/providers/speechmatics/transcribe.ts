import type {
    SpeechmaticsConfig,
    SpeechmaticsTranscribeOptions,
    TranscribeResult,
    TranscribedWord,
} from "../../types.js";
import { runTranscriptionJob } from "./helpers.js";

export async function transcribe(
    config: SpeechmaticsConfig,
    audio: Buffer | string,
    languages: string[] | undefined,
    options: SpeechmaticsTranscribeOptions = {},
): Promise<TranscribeResult> {
    const {
        operatingPoint = "enhanced",
        diarization = "none",
        pollInterval = 5000,
        timeout = 300_000,
    } = options;

    const language = languages?.[0] ?? "en";

    const jobConfig: Record<string, unknown> = {
        type: "transcription",
        transcription_config: {
            language,
            operating_point: operatingPoint,
            ...(diarization !== "none" ? { diarization: diarization } : {}),
        },
    };

    const transcript = await runTranscriptionJob(config, audio, jobConfig, pollInterval, timeout);

    // Normalize: build text and word list
    const words: TranscribedWord[] = [];
    const textParts: string[] = [];
    let detectedLanguage = language;
    let lastEndTime = 0;

    for (const result of transcript.results ?? []) {
        const alt = result.alternatives?.[0];
        if (!alt) continue;

        if (result.type === "word") {
            words.push({
                text: alt.content,
                startTime: result.start_time,
                endTime: result.end_time,
                confidence: alt.confidence,
                speaker: alt.speaker ?? result.speaker ?? undefined,
            });
            textParts.push(alt.content);

            if (alt.language) detectedLanguage = alt.language;
            if (result.end_time > lastEndTime) lastEndTime = result.end_time;
        } else if (result.type === "punctuation") {
            textParts.push(alt.content);
        }
    }

    // Build text: words separated by spaces, punctuation appended directly
    let text = "";
    for (const result of transcript.results ?? []) {
        const content = result.alternatives?.[0]?.content;
        if (!content) continue;
        if (result.type === "word") {
            text += (text.length > 0 ? " " : "") + content;
        } else if (result.type === "punctuation") {
            text += content;
        }
    }

    return {
        text,
        words,
        language: detectedLanguage,
        duration: transcript.job?.duration ?? lastEndTime,
    };
}
