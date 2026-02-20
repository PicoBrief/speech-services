import type { AzureConfig, VoiceInfo } from "../../types.js";
import { SpeechServiceError } from "../../errors.js";
import type { AzureVoiceListEntry } from "./types.js";

export async function fetchVoices(config: AzureConfig): Promise<VoiceInfo[]> {
    const url = `https://${config.region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;

    const response = await fetch(url, {
        headers: { "Ocp-Apim-Subscription-Key": config.subscriptionKey },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new SpeechServiceError(
            `Azure voice listing failed: ${errorText}`,
            "API_ERROR",
            "azure",
            response.status,
        );
    }

    const voices = (await response.json()) as AzureVoiceListEntry[];

    return voices.map((v) => ({
        id: v.ShortName,
        name: v.DisplayName,
        gender: v.Gender?.toLowerCase() === "male" ? "male" as const
            : v.Gender?.toLowerCase() === "female" ? "female" as const
            : undefined,
        locale: v.Locale,
        provider: "azure" as const,
    }));
}
