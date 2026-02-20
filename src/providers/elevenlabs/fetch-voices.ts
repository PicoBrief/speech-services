import type { ElevenLabsConfig, VoiceInfo } from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { normalizeLanguageCode } from "../../utils.js";
import { BASE_URL } from "./types.js";
import type { ElevenLabsVoiceEntry } from "./types.js";

export async function fetchVoices(config: ElevenLabsConfig): Promise<VoiceInfo[]> {
    const response = await fetch(`${BASE_URL}/v1/voices`, {
        headers: { "xi-api-key": config.apiKey },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `ElevenLabs voice listing failed: ${errorText}`,
            "API_ERROR",
            "elevenlabs",
            response.status,
        );
    }

    const result = (await response.json()) as { voices: ElevenLabsVoiceEntry[] };

    return (result.voices ?? []).map((v) => {
        const rawLocale = v.fine_tuning?.language ?? v.labels?.accent ?? "";
        const gender = v.labels?.gender === "male" ? "male" as const
            : v.labels?.gender === "female" ? "female" as const
            : undefined;

        return {
            id: v.voice_id,
            name: v.name,
            gender,
            locale: normalizeLanguageCode(rawLocale),
            provider: "elevenlabs" as const,
        };
    });
}
