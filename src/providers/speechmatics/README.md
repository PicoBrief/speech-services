# Speechmatics Provider

**Capabilities:** STT only

## Direct Usage

```typescript
import { transcribe, detectLanguages } from "@pico-brief/speech-services/providers/speechmatics";

const config = { apiKey: "your-speechmatics-key", region: "eu1" };

// Transcribe
const result = await transcribe(config, audioBuffer, ["en"], {
    operatingPoint: "enhanced",
    diarization: "speaker",
});

// Detect languages
const languages = await detectLanguages(config, audioBuffer);
```

## Notes

- **Auth**: `Authorization: Bearer <key>`
- **Regional endpoints**: `{region}.asr.api.speechmatics.com` (eu1, us1, au1)
- **Workflow**: Async polling — submit job with FormData, poll status, fetch transcript
- **Language auto-detect**: Set `language: "auto"` for per-word language detection
- **Operating points**: "standard" (faster) or "enhanced" (more accurate, default)
- **Timestamps**: Already in seconds
- **Text reconstruction**: Words with spaces, punctuation appended directly
