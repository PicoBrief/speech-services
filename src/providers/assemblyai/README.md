# AssemblyAI Provider

**Capabilities:** STT only

## Direct Usage

```typescript
import { transcribe } from "@pico-brief/speech-services/providers/assemblyai";

const result = await transcribe(
    { apiKey: "your-assemblyai-key" },
    audioBuffer, // or URL string
    ["en"],      // or omit for auto-detection
    { speechModel: "universal" },
);

console.log(result.text);
console.log(result.words); // word-level timestamps
```

## Unified Usage

```typescript
import { createSpeechClient } from "@pico-brief/speech-services";

const client = createSpeechClient({
    assemblyai: { apiKey: "your-assemblyai-key" },
});

const result = await client.transcribe({
    provider: "assemblyai",
    audio: audioBuffer,
    languages: ["en"],
});
```

## Notes

- **Auth**: API key passed directly in `Authorization` header (no "Bearer" prefix)
- **Workflow**: Async polling — upload/submit, then poll until complete
- **Language detection**: Supports 99+ languages via auto-detection (omit `languages`)
- **Code-switching**: Pass 2 languages (one must be "en") for bilingual detection
- **Timestamps**: Returned in milliseconds, normalized to seconds
- **Max audio**: No hard limit, but very long files may take a while to process
