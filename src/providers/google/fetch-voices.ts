import type { GoogleConfig, VoiceInfo } from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import { TTS_BASE_URL } from "./types.js";
import type { GoogleVoiceEntry } from "./types.js";

export async function fetchVoices(config: GoogleConfig): Promise<VoiceInfo[]> {
    const response = await fetch(`${TTS_BASE_URL}/voices?key=${config.apiKey}`);

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `Google voice listing failed: ${errorText}`,
            "API_ERROR",
            "google",
            response.status,
        );
    }

    const result = (await response.json()) as { voices: GoogleVoiceEntry[] };

    // Google voices can have multiple languageCodes — create one entry per locale
    const voices: VoiceInfo[] = [];

    for (const v of result.voices ?? []) {
        const gender = v.ssmlGender?.toLowerCase() === "male" ? "male" as const
            : v.ssmlGender?.toLowerCase() === "female" ? "female" as const
            : undefined;

        for (const locale of v.languageCodes ?? []) {
            voices.push({
                id: v.name,
                name: v.name,
                gender,
                locale,
                provider: "google" as const,
            });
        }
    }

    return voices;
}
