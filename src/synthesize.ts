import type { ClientConfig, SynthesizeParams, SynthesizeResult, VoiceInfo } from "./types.js";
import { SpeechServiceError } from "./errors.js";
import { VoiceCache } from "./voice-cache.js";
import { resolveVoice, validateRecommendedVoices, type RecommendedVoice } from "./voice-resolver.js";
import { AZURE_RECOMMENDED_VOICES } from "./providers/azure/recommended-voices.js";
import * as azure from "./providers/azure/index.js";
import * as cartesia from "./providers/cartesia/index.js";
import * as deepgram from "./providers/deepgram/index.js";
import * as elevenlabs from "./providers/elevenlabs/index.js";
import * as google from "./providers/google/index.js";
import * as inworld from "./providers/inworld/index.js";
import * as openai from "./providers/openai/index.js";
import * as playht from "./providers/playht/index.js";

export async function synthesize(
    config: ClientConfig,
    params: SynthesizeParams,
    voiceCache?: VoiceCache,
): Promise<SynthesizeResult> {
    const cache = voiceCache ?? new VoiceCache();

    switch (params.provider) {
        case "azure": {
            const cfg = requireConfig(config, "azure", "Azure");
            const resolvedVoice = await resolveVoiceForProvider(
                cache, () => azure.fetchVoices(cfg), `azure:${cfg.region}`, params,
                AZURE_RECOMMENDED_VOICES,
            );
            return azure.synthesize(cfg, params.text, resolvedVoice, params.languages?.[0], params.providerOptions);
        }
        case "cartesia": {
            const cfg = requireConfig(config, "cartesia", "Cartesia");
            const resolvedVoice = await resolveVoiceForProvider(
                cache, () => cartesia.fetchVoices(cfg), "cartesia", params,
            );
            return cartesia.synthesize(cfg, params.text, resolvedVoice, params.languages?.[0], params.providerOptions);
        }
        case "deepgram": {
            const cfg = requireConfig(config, "deepgram", "Deepgram");
            const resolvedVoice = await resolveVoiceForProvider(
                cache, () => deepgram.fetchVoices(cfg), "deepgram", params,
            );
            return deepgram.synthesize(cfg, params.text, resolvedVoice, params.languages?.[0], params.providerOptions);
        }
        case "elevenlabs": {
            const cfg = requireConfig(config, "elevenlabs", "ElevenLabs");
            const resolvedVoice = await resolveVoiceForProvider(
                cache, () => elevenlabs.fetchVoices(cfg), "elevenlabs", params,
            );
            return elevenlabs.synthesize(cfg, params.text, resolvedVoice, params.languages?.[0], params.providerOptions);
        }
        case "google": {
            const cfg = requireConfig(config, "google", "Google");
            const resolvedVoice = await resolveVoiceForProvider(
                cache, () => google.fetchVoices(cfg), "google", params,
            );
            return google.synthesize(cfg, params.text, resolvedVoice, params.languages?.[0], params.providerOptions);
        }
        case "inworld": {
            const cfg = requireConfig(config, "inworld", "Inworld");
            const resolvedVoice = await resolveVoiceForProvider(
                cache, () => inworld.fetchVoices(cfg), "inworld", params,
            );
            return inworld.synthesize(cfg, params.text, resolvedVoice, params.languages?.[0], params.providerOptions);
        }
        case "openai": {
            const cfg = requireConfig(config, "openai", "OpenAI");
            const resolvedVoice = await resolveVoiceForProvider(
                cache, () => openai.fetchVoices(cfg), "openai", params,
            );
            return openai.synthesize(cfg, params.text, resolvedVoice, params.languages?.[0], params.providerOptions);
        }
        case "playht": {
            const cfg = requireConfig(config, "playht", "PlayHT");
            const resolvedVoice = await resolveVoiceForProvider(
                cache, () => playht.fetchVoices(cfg), "playht", params,
            );
            return playht.synthesize(cfg, params.text, resolvedVoice, params.languages?.[0], params.providerOptions);
        }
        default:
            throw new SpeechServiceError(
                `Unknown TTS provider: ${(params as SynthesizeParams).provider}`,
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

async function resolveVoiceForProvider(
    cache: VoiceCache,
    fetchFn: () => Promise<VoiceInfo[]>,
    cacheKey: string,
    params: SynthesizeParams,
    recommendedVoices?: RecommendedVoice[],
): Promise<string> {
    let voices = cache.get(cacheKey);
    if (!voices) {
        voices = await fetchFn();
        cache.set(cacheKey, voices);
        if (recommendedVoices) {
            validateRecommendedVoices(voices, recommendedVoices);
        }
    }

    const resolved = resolveVoice(voices, {
        voice: params.voice,
        language: params.languages?.[0],
        gender: params.gender,
    }, recommendedVoices);

    return resolved.id;
}
