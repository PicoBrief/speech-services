import type { AzureConfig } from "../../types.js";
import { getBaseLanguage } from "../../utils.js";
import { runFastTranscription } from "./transcribe.js";

export async function detectLanguages(
    config: AzureConfig,
    audio: Buffer | string,
): Promise<Map<string, number>> {
    // Run fast transcription with no locales -> triggers multilingual model
    const result = await runFastTranscription(config, audio, undefined);

    const counts = new Map<string, number>();
    for (const phrase of result.phrases ?? []) {
        if (phrase.locale) {
            const base = getBaseLanguage(phrase.locale);
            counts.set(base, (counts.get(base) ?? 0) + 1);
        }
    }

    return counts;
}
