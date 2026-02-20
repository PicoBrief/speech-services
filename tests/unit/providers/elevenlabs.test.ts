import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { transcribe } from "../../../src/providers/elevenlabs/transcribe.js";

describe("ElevenLabs transcribe", () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it("filters out spacing and audio_event words", async () => {
        globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
            const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
            assert.ok(url.includes("/v1/speech-to-text"));
            assert.equal((init?.headers as Record<string, string>)["xi-api-key"], "test-key");

            return new Response(JSON.stringify({
                text: "Hello world",
                language_code: "eng",
                words: [
                    { text: "Hello", type: "word", start: 0.5, end: 1.0 },
                    { text: " ", type: "spacing", start: 1.0, end: 1.1 },
                    { text: "world", type: "word", start: 1.1, end: 1.5 },
                    { text: "[laugh]", type: "audio_event", start: 1.5, end: 2.0 },
                ],
            }), { status: 200, headers: { "Content-Type": "application/json" } });
        };

        const result = await transcribe({ apiKey: "test-key" }, Buffer.from("audio"), undefined);
        assert.equal(result.words.length, 2); // only "word" type
        assert.equal(result.words[0].text, "Hello");
        assert.equal(result.words[1].text, "world");
        assert.equal(result.language, "en"); // ISO 639-3 normalized
    });

    it("handles null timestamps", async () => {
        globalThis.fetch = async () => {
            return new Response(JSON.stringify({
                text: "Test",
                language_code: "en",
                words: [
                    { text: "Test", type: "word", start: null, end: null },
                ],
            }), { status: 200, headers: { "Content-Type": "application/json" } });
        };

        const result = await transcribe({ apiKey: "k" }, Buffer.from("x"), undefined);
        assert.equal(result.words[0].startTime, 0);
        assert.equal(result.words[0].endTime, 0);
    });

    it("uses cloud_storage_url for URL input", async () => {
        globalThis.fetch = async (_input: string | URL | Request, init?: RequestInit) => {
            const formData = init?.body as FormData;
            assert.ok(formData instanceof FormData);

            return new Response(JSON.stringify({
                text: "Test",
                language_code: "en",
                words: [],
            }), { status: 200, headers: { "Content-Type": "application/json" } });
        };

        await transcribe({ apiKey: "k" }, "https://example.com/audio.mp3", undefined);
    });
});
