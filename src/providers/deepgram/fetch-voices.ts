import type { DeepgramConfig, VoiceInfo } from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { BASE_URL } from "./types.js";
import type { DeepgramTTSModel } from "./types.js";

export async function fetchVoices(config: DeepgramConfig): Promise<VoiceInfo[]> {
    const response = await fetch(`${BASE_URL}/v1/models`, {
        headers: { Authorization: `Token ${config.apiKey}` },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `Deepgram voice listing failed: ${errorText}`,
            "API_ERROR",
            "deepgram",
            response.status,
        );
    }

    const result = (await response.json()) as {
        tts?: DeepgramTTSModel[];
    };

    return (result.tts ?? []).map((v) => {
        const lang = v.languages?.[0] ?? "en";
        const tags = v.metadata?.tags ?? [];
        const gender = tags.includes("feminine") ? "female" as const
            : tags.includes("masculine") ? "male" as const
            : undefined;

        return {
            id: v.canonical_name,
            name: v.name,
            gender,
            locale: lang,
            provider: "deepgram" as const,
        };
    });
}
