import type { SpeechmaticsConfig } from "../../types.js";
import { getBaseLanguage } from "../../utils.js";
import { runTranscriptionJob } from "./helpers.js";

export async function detectLanguages(
    config: SpeechmaticsConfig,
    audio: Buffer | string,
): Promise<Map<string, number>> {
    const jobConfig: Record<string, unknown> = {
        type: "transcription",
        transcription_config: {
            language: "auto",
            operating_point: "standard",
        },
    };

    const transcript = await runTranscriptionJob(config, audio, jobConfig, 5000, 300_000);

    const counts = new Map<string, number>();
    for (const result of transcript.results ?? []) {
        if (result.type === "word") {
            const lang = result.alternatives?.[0]?.language;
            if (lang) {
                const base = getBaseLanguage(lang);
                counts.set(base, (counts.get(base) ?? 0) + 1);
            }
        }
    }

    return counts;
}
