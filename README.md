# @pico-brief/speech-services

Unified speech-to-text and text-to-speech library wrapping 10 provider APIs behind consistent interfaces. Zero external dependencies — Node.js 18+ built-ins only.

## Providers

| Provider | STT | TTS | Language Detection |
|----------|-----|-----|--------------------|
| AssemblyAI | Yes | - | Yes |
| Azure | Yes (fast + batch) | Yes | Yes |
| Cartesia | - | Yes | - |
| Deepgram | Yes | Yes | Yes |
| ElevenLabs | Yes | Yes | Yes |
| Google | Yes | Yes | - |
| OpenAI | Yes | Yes | Yes |
| PlayHT | - | Yes | - |
| Rev.ai | Yes | - | - |
| Speechmatics | Yes | - | Yes |

## Installation

```bash
npm install @pico-brief/speech-services
```

## Quick Start

### Client API (recommended)

```typescript
import { createSpeechClient } from "@pico-brief/speech-services";

const client = createSpeechClient({
    openai: { apiKey: "sk-..." },
    azure: { subscriptionKey: "...", region: "eastus" },
});

// Transcribe
const transcript = await client.transcribe({
    provider: "openai",
    audio: audioBuffer,
    languages: ["en"],
});
console.log(transcript.text);
console.log(transcript.words); // word-level timestamps

// Synthesize (voice auto-selected by language + gender)
const speech = await client.synthesize({
    provider: "azure",
    text: "Hello, world!",
    languages: ["en-US"],
    gender: "female",
});
// speech.audio is a Buffer, speech.voice is the resolved voice ID

// Detect languages
const languages = await client.detectLocales({
    provider: "openai",
    audio: audioBuffer,
});
// Map { "en" => 1 }
```

### Standalone Functions (tree-shakeable)

```typescript
import { transcribe, synthesize } from "@pico-brief/speech-services";

const result = await transcribe(
    { openai: { apiKey: "sk-..." } },
    { provider: "openai", audio: audioBuffer },
);
```

### Direct Provider Import

```typescript
import { transcribe } from "@pico-brief/speech-services/providers/deepgram";

const result = await transcribe(
    { apiKey: "your-deepgram-key" },
    audioBuffer,
    ["en"],
    { model: "nova-2", smartFormat: true },
);
```

## Audio Input

All transcription functions accept `Buffer | string` for audio:

- **Buffer**: Raw audio bytes (MP3, WAV, etc.)
- **String (URL)**: `https://...` or `gs://...` — each provider handles URLs natively where possible

## Voice Resolution

When synthesizing, the `voice` parameter is optional. If omitted, a voice is auto-selected based on `languages` and `gender`:

```typescript
// Explicit voice
await client.synthesize({ provider: "azure", text: "Hi", voice: "en-US-JennyNeural" });

// Auto-select: female English voice
await client.synthesize({ provider: "azure", text: "Hi", languages: ["en-US"], gender: "female" });

// Voice by name (fuzzy matched)
await client.synthesize({ provider: "azure", text: "Hi", voice: "Jenny" });
```

Resolution tiers: exact ID → exact name → locale extraction → base language fallback. Gender is a preference, not a hard filter.

## Provider Options

Each provider has specific options accessible via `providerOptions`:

```typescript
await client.transcribe({
    provider: "assemblyai",
    audio: audioBuffer,
    providerOptions: {
        speechModel: "universal",
        pollInterval: 3000,
        timeout: 300000,
    },
});

await client.synthesize({
    provider: "elevenlabs",
    text: "Hello",
    voice: "Rachel",
    providerOptions: {
        modelId: "eleven_multilingual_v2",
        stability: 0.5,
        similarityBoost: 0.75,
    },
});
```

## Language Detection

```typescript
// With ffmpeg (recommended for long audio — samples clips from different positions)
const languages = await client.detectLocales({
    provider: "azure",
    audio: audioBuffer,
    ffmpegPath: "/usr/local/bin/ffmpeg",
});

// Without ffmpeg (truncates to first ~30s)
const languages = await client.detectLocales({
    provider: "azure",
    audio: audioBuffer,
    maxBytes: 500_000,
});
```

## Error Handling

All errors are thrown as `SpeechServiceError` with structured fields:

```typescript
import { SpeechServiceError } from "@pico-brief/speech-services";

try {
    await client.transcribe({ provider: "openai", audio: buffer });
} catch (err) {
    if (err instanceof SpeechServiceError) {
        console.log(err.code);       // "API_ERROR", "TIMEOUT", "NOT_CONFIGURED", etc.
        console.log(err.provider);   // "openai"
        console.log(err.statusCode); // 401
    }
}
```

## License

MIT
