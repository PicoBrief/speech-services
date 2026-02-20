// ─── Provider Configuration ─────────────────────────────────────────────────

export interface AssemblyAIConfig {
    apiKey: string;
}

export interface AzureConfig {
    subscriptionKey: string;
    region: string;
}

export interface CartesiaConfig {
    apiKey: string;
}

export interface DeepgramConfig {
    apiKey: string;
}

export interface ElevenLabsConfig {
    apiKey: string;
}

export interface GoogleConfig {
    apiKey: string;
}

export interface OpenAIConfig {
    apiKey: string;
}

export interface PlayHTConfig {
    apiKey: string;
    userId: string;
}

export interface RevAIConfig {
    apiKey: string;
}

export interface SpeechmaticsConfig {
    apiKey: string;
    /** Regional endpoint. Default: "eu1". Options: "eu1", "us1", "au1" */
    region?: string;
}

export interface ClientConfig {
    assemblyai?: AssemblyAIConfig;
    azure?: AzureConfig;
    cartesia?: CartesiaConfig;
    deepgram?: DeepgramConfig;
    elevenlabs?: ElevenLabsConfig;
    google?: GoogleConfig;
    openai?: OpenAIConfig;
    playht?: PlayHTConfig;
    revai?: RevAIConfig;
    speechmatics?: SpeechmaticsConfig;
}

// ─── Transcribe (Speech-to-Text) ────────────────────────────────────────────

export interface AssemblyAITranscribeOptions {
    /** Speech model to use. Default: "universal" */
    speechModel?: string;
    /** How often to check if transcription is done (ms). Default: 3000 */
    pollInterval?: number;
    /** Max time to wait for transcription (ms). Default: 300000 (5 min) */
    timeout?: number;
}

export interface AzureTranscribeOptions {
    /** Transcription mode. "fast" is synchronous, "batch" requires a URL. Default: "fast" */
    mode?: "fast" | "batch";
    /** Profanity handling. Default: "none" */
    profanityFilter?: "none" | "masked" | "removed";
    /** How often to check if batch transcription is done (ms). Default: 5000 */
    pollInterval?: number;
    /** Max time to wait for batch transcription (ms). Default: 300000 (5 min) */
    timeout?: number;
}

export interface DeepgramTranscribeOptions {
    /** STT model. Default: "nova-2" */
    model?: string;
    /** Enable smart formatting (punctuation, capitalization, numerals). Default: true */
    smartFormat?: boolean;
    /** Enable speaker diarization. Default: false */
    diarize?: boolean;
}

export interface ElevenLabsTranscribeOptions {
    /** Speech-to-text model. Default: "scribe_v2" */
    model?: string;
}

export interface GoogleTranscribeOptions {
    /** Recognition model. Default: "latest_long" */
    model?: string;
    /** Audio encoding (only needed for raw audio without headers). Examples: "LINEAR16", "FLAC", "MP3" */
    encoding?: string;
    /** Sample rate in Hz (only needed for raw audio without headers). */
    sampleRateHertz?: number;
}

export interface OpenAITranscribeOptions {
    /** STT model. Default: "whisper-1". Options: "whisper-1", "gpt-4o-transcribe", "gpt-4o-mini-transcribe" */
    model?: string;
    /** Optional prompt to guide the model's style. */
    prompt?: string;
    /** Sampling temperature (0 to 1). Default: 0 */
    temperature?: number;
}

export interface RevAITranscribeOptions {
    /** Skip speaker diarization. Default: false */
    skipDiarization?: boolean;
    /** Skip punctuation. Default: false */
    skipPunctuation?: boolean;
    /** Filter profanity. Default: false */
    filterProfanity?: boolean;
    /** How often to check if transcription is done (ms). Default: 5000 */
    pollInterval?: number;
    /** Max time to wait for transcription (ms). Default: 300000 (5 min) */
    timeout?: number;
}

export interface SpeechmaticsTranscribeOptions {
    /** Operating point. "standard" is faster, "enhanced" is more accurate. Default: "enhanced" */
    operatingPoint?: "standard" | "enhanced";
    /** Enable speaker diarization. Default: false */
    diarization?: "none" | "speaker";
    /** How often to check if transcription is done (ms). Default: 5000 */
    pollInterval?: number;
    /** Max time to wait for transcription (ms). Default: 300000 (5 min) */
    timeout?: number;
}

export type TranscribeProvider = "assemblyai" | "azure" | "deepgram" | "elevenlabs" | "google" | "openai" | "revai" | "speechmatics";

export type TranscribeParams =
    | ({
            provider: "assemblyai";
            audio: Buffer | string;
            /** BCP-47 language codes. One → sets language, multiple → enables code-switching. Omit for auto-detection. */
            languages?: string[];
            providerOptions?: AssemblyAITranscribeOptions;
        })
    | ({
            provider: "azure";
            audio: Buffer | string;
            /** BCP-47 language codes. Passed as candidate locales for language identification. Omit for multilingual model. */
            languages?: string[];
            providerOptions?: AzureTranscribeOptions;
        })
    | ({
            provider: "deepgram";
            audio: Buffer | string;
            /** Language code (e.g. "en", "en-US", "multi"). Default: "en". */
            languages?: string[];
            providerOptions?: DeepgramTranscribeOptions;
        })
    | ({
            provider: "elevenlabs";
            audio: Buffer | string;
            /** BCP-47 language codes. Only the first one is used (ElevenLabs accepts a single language). Omit for auto-detection. */
            languages?: string[];
            providerOptions?: ElevenLabsTranscribeOptions;
        })
    | ({
            provider: "google";
            audio: Buffer | string;
            /** BCP-47 language codes. First is primary, rest are alternatives (up to 3 extra). Required by Google — defaults to ["en-US"]. */
            languages?: string[];
            providerOptions?: GoogleTranscribeOptions;
        })
    | ({
            provider: "openai";
            audio: Buffer | string;
            /** ISO 639-1 language code (e.g. "en", "es"). Omit for auto-detection. Only the first element is used. */
            languages?: string[];
            providerOptions?: OpenAITranscribeOptions;
        })
    | ({
            provider: "revai";
            audio: Buffer | string;
            /** ISO 639-1 language code. Only the first element is used. Default: "en". */
            languages?: string[];
            providerOptions?: RevAITranscribeOptions;
        })
    | ({
            provider: "speechmatics";
            audio: Buffer | string;
            /** Language code (e.g. "en", "fr", "auto"). Only the first element is used. Default: "en". */
            languages?: string[];
            providerOptions?: SpeechmaticsTranscribeOptions;
        });

export interface TranscribedWord {
    text: string;
    /** Start time in seconds */
    startTime: number;
    /** End time in seconds */
    endTime: number;
    /** Confidence score (0 to 1). Not all providers return this. */
    confidence?: number;
    /** Speaker label, if diarization was enabled. */
    speaker?: string;
}

export interface TranscribeResult {
    /** Full transcript text */
    text: string;
    /** Word-level timestamps */
    words: TranscribedWord[];
    /** Detected or specified language (normalized to BCP-47, e.g. "en-US") */
    language: string;
    /** Audio duration in seconds */
    duration: number;
}

// ─── Voice Info ─────────────────────────────────────────────────────────────

export interface VoiceInfo {
    /** The value to pass to the provider (Azure ShortName, ElevenLabs voice_id, Google name) */
    id: string;
    /** Human-readable display name */
    name: string;
    /** Voice gender, if known */
    gender?: "male" | "female";
    /** BCP-47 locale like "en-US" */
    locale: string;
    /** Which TTS provider this voice belongs to */
    provider: SynthesizeProvider;
}

// ─── Synthesize (Text-to-Speech) ────────────────────────────────────────────

export type SynthesizeProvider = "azure" | "cartesia" | "deepgram" | "elevenlabs" | "google" | "openai" | "playht";

export interface AzureSynthesizeOptions {
    /** Azure output format string. Default: "audio-24khz-160kbitrate-mono-mp3" */
    outputFormat?: string;
    /** Speaking rate. Examples: "-5%", "+10%", "slow", "fast". Default: "-5%" */
    speed?: string;
    /** Pitch adjustment. Examples: "+5%", "-10%" */
    pitch?: string;
    /** Speaking style. Examples: "cheerful", "sad", "angry" */
    style?: string;
}

export interface CartesiaSynthesizeOptions {
    /** Model ID. Default: "sonic-3" */
    modelId?: string;
    /** Output container format. Default: "wav" */
    container?: "wav" | "mp3" | "raw";
    /** PCM encoding (for wav/raw containers). Default: "pcm_s16le" */
    encoding?: string;
    /** Sample rate in Hz. Default: 24000 */
    sampleRate?: number;
    /** Speech speed (0.6 to 1.5). Default: 1.0 */
    speed?: number;
    /** Emotion. Default: "neutral". Options: "neutral", "happy", "sad", "angry", "surprised", etc. */
    emotion?: string;
}

export interface DeepgramSynthesizeOptions {
    /** Audio encoding. Default: "mp3". Options: "mp3", "linear16", "mulaw", "alaw", "opus", "flac", "aac" */
    encoding?: string;
    /** Audio container. Examples: "wav", "ogg". Only needed for certain encodings. */
    container?: string;
    /** Sample rate in Hz. */
    sampleRate?: number;
}

export interface ElevenLabsSynthesizeOptions {
    /** TTS model. Default: "eleven_multilingual_v2" */
    modelId?: string;
    /** Output format. Default: "mp3_44100_128" */
    outputFormat?: string;
    /** Voice consistency (0 to 1). Lower = more expressive. Default: 0.5 */
    stability?: number;
    /** Voice similarity (0 to 1). Higher = closer to original voice. Default: 0.75 */
    similarityBoost?: number;
    /** Style exaggeration (0 to 1). Higher = more expressive but slower. Default: 0 */
    style?: number;
    /** Speech speed (0.7 to 1.2). Default: 1.0 */
    speed?: number;
}

export interface GoogleSynthesizeOptions {
    /** Audio encoding. Default: "MP3". Options: "MP3", "LINEAR16", "OGG_OPUS" */
    audioEncoding?: string;
    /** Speaking rate (0.25 to 2.0). Default: 1.0 */
    speakingRate?: number;
    /** Pitch in semitones (-20 to 20). Default: 0 */
    pitch?: number;
}

export interface OpenAISynthesizeOptions {
    /** TTS model. Default: "tts-1". Options: "tts-1", "tts-1-hd", "gpt-4o-mini-tts" */
    model?: string;
    /** Output format. Default: "mp3". Options: "mp3", "opus", "aac", "flac", "wav", "pcm" */
    responseFormat?: string;
    /** Speech speed (0.25 to 4.0). Default: 1.0 */
    speed?: number;
    /** Instructions for tone/style. Only works with gpt-4o-mini-tts. */
    instructions?: string;
}

export interface PlayHTSynthesizeOptions {
    /** Voice engine. Default: "Play3.0-mini" */
    voiceEngine?: string;
    /** Output format. Default: "mp3". Options: "mp3", "wav", "ogg", "flac", "mulaw" */
    outputFormat?: string;
    /** Speech speed (0.1 to 5.0). Default: 1.0 */
    speed?: number;
    /** Sample rate in Hz (8000 to 48000). */
    sampleRate?: number;
    /** Audio quality. Options: "draft", "low", "medium", "high", "premium" */
    quality?: string;
}

export type SynthesizeParams =
    | ({
            provider: "azure";
            text: string;
            voice?: string;
            gender?: "male" | "female";
            languages?: string[];
            providerOptions?: AzureSynthesizeOptions;
        })
    | ({
            provider: "cartesia";
            text: string;
            voice?: string;
            gender?: "male" | "female";
            languages?: string[];
            providerOptions?: CartesiaSynthesizeOptions;
        })
    | ({
            provider: "deepgram";
            text: string;
            voice?: string;
            gender?: "male" | "female";
            languages?: string[];
            providerOptions?: DeepgramSynthesizeOptions;
        })
    | ({
            provider: "elevenlabs";
            text: string;
            voice?: string;
            gender?: "male" | "female";
            languages?: string[];
            providerOptions?: ElevenLabsSynthesizeOptions;
        })
    | ({
            provider: "google";
            text: string;
            voice?: string;
            gender?: "male" | "female";
            languages?: string[];
            providerOptions?: GoogleSynthesizeOptions;
        })
    | ({
            provider: "openai";
            text: string;
            voice?: string;
            gender?: "male" | "female";
            languages?: string[];
            providerOptions?: OpenAISynthesizeOptions;
        })
    | ({
            provider: "playht";
            text: string;
            voice?: string;
            gender?: "male" | "female";
            languages?: string[];
            providerOptions?: PlayHTSynthesizeOptions;
        });

export interface SynthesizeResult {
    /** Audio data as a Buffer */
    audio: Buffer;
    /** Audio format (e.g. "mp3", "wav", "ogg") */
    format: string;
    /** The resolved voice ID that was used for synthesis */
    voice: string;
}

// ─── Detect Locales ─────────────────────────────────────────────────────────

export type DetectLocalesProvider = "assemblyai" | "azure" | "deepgram" | "elevenlabs" | "openai" | "speechmatics";

export interface DetectLocalesParams {
    /** Audio to analyze. Buffer or URL string. */
    audio: Buffer | string;
    /** STT provider to use for language detection. Must support auto-detection. */
    provider: DetectLocalesProvider;
    /**
     * Path to ffmpeg binary. Enables efficient sampling for long audio files.
     * Short clips (~10s each) are extracted from different positions in the audio
     * and language detection runs on each clip. ffprobe must be in the same directory.
     *
     * Without ffmpeg, only the first portion of the audio is analyzed (see maxBytes).
     */
    ffmpegPath?: string;
    /**
     * Maximum bytes of audio to analyze when ffmpeg is not available.
     * Truncates the Buffer to save cost on long files. Only applies to Buffer input.
     * Default: 500_000 (~30 seconds of 128kbps MP3). Ignored when ffmpegPath is provided.
     */
    maxBytes?: number;
}

// ─── Fetch Voices ───────────────────────────────────────────────────────────

export type FetchVoicesProvider = SynthesizeProvider;

// ─── Speech Client Interface ────────────────────────────────────────────────

export interface SpeechClient {
    transcribe(params: TranscribeParams): Promise<TranscribeResult>;
    synthesize(params: SynthesizeParams): Promise<SynthesizeResult>;
    detectLocales(params: DetectLocalesParams): Promise<Map<string, number>>;
    fetchVoices(provider: FetchVoicesProvider): Promise<VoiceInfo[]>;
}
