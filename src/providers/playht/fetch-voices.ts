import type { PlayHTConfig, VoiceInfo } from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { BASE_URL } from "./types.js";
import type { PlayHTVoice } from "./types.js";

export async function fetchVoices(config: PlayHTConfig): Promise<VoiceInfo[]> {
    const response = await fetch(`${BASE_URL}/voices`, {
        headers: {
            "X-USER-ID": config.userId,
            AUTHORIZATION: config.apiKey,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `PlayHT voice listing failed: ${errorText}`,
            "API_ERROR",
            "playht",
            response.status,
        );
    }

    const voices = (await response.json()) as PlayHTVoice[];

    return voices.map((v) => ({
        id: v.id,
        name: v.name,
        gender: v.gender?.toLowerCase() === "male" ? "male" as const
            : v.gender?.toLowerCase() === "female" ? "female" as const
            : undefined,
        locale: v.language_code ?? v.language ?? "en",
        provider: "playht" as const,
    }));
}
