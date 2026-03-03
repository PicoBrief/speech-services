// ─── Client ─────────────────────────────────────────────────────────────────
export { createSpeechClient } from "./client.js";

// ─── Standalone Functions ───────────────────────────────────────────────────
export { transcribe } from "./transcribe.js";
export { synthesize } from "./synthesize.js";
export { detectLocales } from "./detect-locale.js";
export { fetchVoices } from "./fetch-voices.js";

// ─── Core ───────────────────────────────────────────────────────────────────
export { SpeechServiceError } from "./errors.js";
export { VoiceCache } from "./voice-cache.js";
export { resolveVoice } from "./voice-resolver.js";

// ─── Utilities ──────────────────────────────────────────────────────────────
export { groupWordsToSnippets } from "./utils.js";

// ─── Types ──────────────────────────────────────────────────────────────────
export type {
    // Client
    ClientConfig,
    SpeechClient,
    // Provider configs
    AssemblyAIConfig,
    AzureConfig,
    CartesiaConfig,
    DeepgramConfig,
    ElevenLabsConfig,
    GoogleConfig,
    OpenAIConfig,
    PlayHTConfig,
    RevAIConfig,
    SpeechmaticsConfig,
    // Transcript snippets
    TranscriptSnippet,
    GroupWordsOptions,
    // Transcribe
    TranscribeParams,
    TranscribeResult,
    TranscribedWord,
    TranscribeProvider,
    AssemblyAITranscribeOptions,
    AzureTranscribeOptions,
    DeepgramTranscribeOptions,
    ElevenLabsTranscribeOptions,
    GoogleTranscribeOptions,
    OpenAITranscribeOptions,
    RevAITranscribeOptions,
    SpeechmaticsTranscribeOptions,
    // Synthesize
    SynthesizeParams,
    SynthesizeResult,
    SynthesizeProvider,
    VoiceInfo,
    AzureSynthesizeOptions,
    CartesiaSynthesizeOptions,
    DeepgramSynthesizeOptions,
    ElevenLabsSynthesizeOptions,
    GoogleSynthesizeOptions,
    OpenAISynthesizeOptions,
    PlayHTSynthesizeOptions,
    // Detect Locales
    DetectLocalesParams,
    DetectLocalesProvider,
    // Fetch Voices
    FetchVoicesProvider,
} from "./types.js";
