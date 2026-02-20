# Azure Provider

**Capabilities:** STT (fast + batch) + TTS

## Direct Usage

```typescript
import { transcribe, synthesize, fetchVoices, detectLanguages } from "@pico-brief/speech-services/providers/azure";

const config = { subscriptionKey: "your-key", region: "eastus" };

// Fast transcription (synchronous)
const transcript = await transcribe(config, audioBuffer, ["en-US"]);

// Batch transcription (async, URL-only)
const transcript2 = await transcribe(config, "https://example.com/audio.wav", ["en-US", "fr-FR"], {
    mode: "batch",
});

// Synthesize with expressive style
const result = await synthesize(config, "Hello!", "en-US-AriaNeural", "en-US", {
    style: "cheerful",
});

// List voices
const voices = await fetchVoices(config);

// Detect languages
const languages = await detectLanguages(config, audioBuffer);
```

## Unified Usage

```typescript
import { createSpeechClient } from "@pico-brief/speech-services";

const client = createSpeechClient({
    azure: { subscriptionKey: "your-key", region: "eastus" },
});

const result = await client.transcribe({
    provider: "azure",
    audio: audioBuffer,
    languages: ["en-US"],
});
```

## Notes

- **Fast mode**: Synchronous, supports both Buffer and URL input, max 300MB/2 hours
- **Batch mode**: Async polling, URL-only, uses ticks (100ns units) for timestamps
- **TTS**: SSML-based with optional `mstts:express-as` for styled speech
- **Language detection**: Fast transcription with no locales triggers multilingual model
- **Batch language ID**: 2-10 candidate locales, no duplicate base languages, primary must be included
