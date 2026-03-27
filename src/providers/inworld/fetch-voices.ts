import type { InworldConfig, VoiceInfo } from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { normalizeLanguageCode } from "../../utils.js";
import { BASE_URL } from "./types.js";
import type { InworldVoiceEntry } from "./types.js";

export async function fetchVoices(config: InworldConfig): Promise<VoiceInfo[]> {
    const response = await fetch(`${BASE_URL}/tts/v1/voices`, {
        headers: { "Authorization": `Basic ${config.apiKey}` },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `Inworld voice listing failed: ${errorText}`,
            "API_ERROR",
            "inworld",
            response.status,
        );
    }

    const result = (await response.json()) as { voices: InworldVoiceEntry[] };

    return (result.voices ?? []).map((v) => {
        const gender = v.tags?.includes("male") ? "male" as const
            : v.tags?.includes("female") ? "female" as const
            : undefined;

        return {
            id: v.voiceId,
            name: v.displayName,
            gender,
            locale: normalizeLanguageCode(v.languages?.[0] ?? ""),
            provider: "inworld" as const,
        };
    });
}
