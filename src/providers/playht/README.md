# PlayHT Provider

**Capabilities:** TTS only

## Direct Usage

```typescript
import { synthesize, fetchVoices } from "@pico-brief/speech-services/providers/playht";

const config = { apiKey: "your-playht-key", userId: "your-user-id" };

const voices = await fetchVoices(config);
const result = await synthesize(config, "Hello!", voices[0].id, "en", {
    voiceEngine: "Play3.0-mini",
    outputFormat: "mp3",
});
```

## Notes

- **Auth**: Dual headers — `X-USER-ID` and `AUTHORIZATION` (raw key, no "Bearer" prefix)
- **Voice engine**: Defaults to "Play3.0-mini"
- **Speed**: 0.1 to 5.0
- **Quality**: "draft", "low", "medium", "high", "premium"
