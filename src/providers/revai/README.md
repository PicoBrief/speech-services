# Rev.ai Provider

**Capabilities:** STT only

## Direct Usage

```typescript
import { transcribe } from "@pico-brief/speech-services/providers/revai";

const result = await transcribe(
    { apiKey: "your-revai-key" },
    audioBuffer,
    ["en"],
    { skipDiarization: false },
);
```

## Notes

- **Auth**: `Authorization: Bearer <key>`
- **Workflow**: Async polling — submit job, poll status, fetch transcript
- **Buffer input**: Multipart with `media` + `options` JSON fields
- **URL input**: JSON body with `source_config.url`
- **Transcript format**: Monologue structure with speaker + elements array
- **Timestamps**: Already in seconds
