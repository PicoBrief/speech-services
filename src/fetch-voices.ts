import type { ClientConfig, FetchVoicesProvider, VoiceInfo } from "./types.js";
import { SpeechServiceError } from "./errors.js";
import * as azure from "./providers/azure/index.js";
import * as cartesia from "./providers/cartesia/index.js";
import * as deepgram from "./providers/deepgram/index.js";
import * as elevenlabs from "./providers/elevenlabs/index.js";
import * as google from "./providers/google/index.js";
import * as openai from "./providers/openai/index.js";
import * as playht from "./providers/playht/index.js";

export async function fetchVoices(config: ClientConfig, provider: FetchVoicesProvider): Promise<VoiceInfo[]> {
    switch (provider) {
        case "azure": {
            const cfg = requireConfig(config, "azure", "Azure");
            return azure.fetchVoices(cfg);
        }
        case "cartesia": {
            const cfg = requireConfig(config, "cartesia", "Cartesia");
            return cartesia.fetchVoices(cfg);
        }
        case "deepgram": {
            const cfg = requireConfig(config, "deepgram", "Deepgram");
            return deepgram.fetchVoices(cfg);
        }
        case "elevenlabs": {
            const cfg = requireConfig(config, "elevenlabs", "ElevenLabs");
            return elevenlabs.fetchVoices(cfg);
        }
        case "google": {
            const cfg = requireConfig(config, "google", "Google");
            return google.fetchVoices(cfg);
        }
        case "openai": {
            const cfg = requireConfig(config, "openai", "OpenAI");
            return openai.fetchVoices(cfg);
        }
        case "playht": {
            const cfg = requireConfig(config, "playht", "PlayHT");
            return playht.fetchVoices(cfg);
        }
        default:
            throw new SpeechServiceError(
                `Unknown TTS provider: ${provider as string}`,
                "UNKNOWN_PROVIDER",
            );
    }
}

function requireConfig<K extends keyof ClientConfig>(
    config: ClientConfig,
    provider: K,
    displayName: string,
): NonNullable<ClientConfig[K]> {
    const providerConfig = config[provider];
    if (!providerConfig) {
        throw new SpeechServiceError(
            `${displayName} is not configured. Add "${provider}" to your config.`,
            "NOT_CONFIGURED",
            provider,
        );
    }
    return providerConfig as NonNullable<ClientConfig[K]>;
}
