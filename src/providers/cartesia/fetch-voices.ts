import type { CartesiaConfig, VoiceInfo } from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { BASE_URL, API_VERSION } from "./types.js";
import type { CartesiaVoice, CartesiaVoiceListResponse } from "./types.js";

export async function fetchVoices(config: CartesiaConfig): Promise<VoiceInfo[]> {
    const voices: CartesiaVoice[] = [];
    let cursor: string | undefined;

    while (true) {
        const params = new URLSearchParams({ limit: "100" });
        if (cursor) params.set("starting_after", cursor);

        const response = await fetch(`${BASE_URL}/voices?${params}`, {
            headers: {
                "X-API-Key": config.apiKey,
                "Cartesia-Version": API_VERSION,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new SpeechServiceError(
                `Cartesia voice listing failed: ${errorText}`,
                "API_ERROR",
                "cartesia",
                response.status,
            );
        }

        const result = (await response.json()) as CartesiaVoiceListResponse;
        const page = result.data ?? [];
        voices.push(...page);

        if (!result.has_more || page.length === 0) break;
        cursor = page[page.length - 1].id;
    }

    return voices.map((v) => ({
        id: v.id,
        name: v.name,
        gender: v.gender === "masculine" ? "male" as const
            : v.gender === "feminine" ? "female" as const
            : undefined,
        locale: v.language ?? "en",
        provider: "cartesia" as const,
    }));
}
