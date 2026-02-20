import type { ClientConfig, TranscribeParams, TranscribeResult } from "./types.js";
import { SpeechServiceError } from "./errors.js";
import * as assemblyai from "./providers/assemblyai/index.js";
import * as azure from "./providers/azure/index.js";
import * as deepgram from "./providers/deepgram/index.js";
import * as elevenlabs from "./providers/elevenlabs/index.js";
import * as google from "./providers/google/index.js";
import * as openai from "./providers/openai/index.js";
import * as revai from "./providers/revai/index.js";
import * as speechmatics from "./providers/speechmatics/index.js";

export async function transcribe(config: ClientConfig, params: TranscribeParams): Promise<TranscribeResult> {
    switch (params.provider) {
        case "assemblyai": {
            const cfg = requireConfig(config, "assemblyai", "AssemblyAI");
            return assemblyai.transcribe(cfg, params.audio, params.languages, params.providerOptions);
        }
        case "azure": {
            const cfg = requireConfig(config, "azure", "Azure");
            return azure.transcribe(cfg, params.audio, params.languages, params.providerOptions);
        }
        case "deepgram": {
            const cfg = requireConfig(config, "deepgram", "Deepgram");
            return deepgram.transcribe(cfg, params.audio, params.languages, params.providerOptions);
        }
        case "elevenlabs": {
            const cfg = requireConfig(config, "elevenlabs", "ElevenLabs");
            return elevenlabs.transcribe(cfg, params.audio, params.languages, params.providerOptions);
        }
        case "google": {
            const cfg = requireConfig(config, "google", "Google");
            return google.transcribe(cfg, params.audio, params.languages, params.providerOptions);
        }
        case "openai": {
            const cfg = requireConfig(config, "openai", "OpenAI");
            return openai.transcribe(cfg, params.audio, params.languages, params.providerOptions);
        }
        case "revai": {
            const cfg = requireConfig(config, "revai", "Rev.ai");
            return revai.transcribe(cfg, params.audio, params.languages, params.providerOptions);
        }
        case "speechmatics": {
            const cfg = requireConfig(config, "speechmatics", "Speechmatics");
            return speechmatics.transcribe(cfg, params.audio, params.languages, params.providerOptions);
        }
        default:
            throw new SpeechServiceError(
                `Unknown transcription provider: ${(params as TranscribeParams).provider}`,
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
