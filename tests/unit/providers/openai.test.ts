import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { transcribe } from "../../../src/providers/openai/transcribe.js";
import { synthesize } from "../../../src/providers/openai/synthesize.js";
import { fetchVoices } from "../../../src/providers/openai/fetch-voices.js";

describe("OpenAI", () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    describe("transcribe", () => {
        it("sends multipart form data with correct fields", async () => {
            globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
                const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
                assert.ok(url.includes("/audio/transcriptions"));
                assert.equal((init?.headers as Record<string, string>)["Authorization"], "Bearer test-key");

                // Check it's FormData
                assert.ok(init?.body instanceof FormData);

                return new Response(JSON.stringify({
                    text: "Hello world",
                    language: "en",
                    duration: 3.0,
                    words: [
                        { word: "Hello", start: 0.0, end: 0.5 },
                        { word: "world", start: 0.6, end: 1.0 },
                    ],
                }), { status: 200, headers: { "Content-Type": "application/json" } });
            };

            const result = await transcribe({ apiKey: "test-key" }, Buffer.from("audio"), ["en"]);
            assert.equal(result.text, "Hello world");
            assert.equal(result.words.length, 2);
            assert.equal(result.language, "en");
            assert.equal(result.duration, 3.0);
        });

        it("downloads URL before uploading", async () => {
            let fetchCallUrls: string[] = [];

            globalThis.fetch = async (input: string | URL | Request) => {
                const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
                fetchCallUrls.push(url);

                if (url === "https://example.com/audio.mp3") {
                    return new Response(Buffer.from("downloaded-audio"), { status: 200 });
                }

                if (url.includes("/audio/transcriptions")) {
                    return new Response(JSON.stringify({
                        text: "Test", language: "en", duration: 1.0, words: [],
                    }), { status: 200, headers: { "Content-Type": "application/json" } });
                }

                throw new Error(`Unexpected: ${url}`);
            };

            await transcribe({ apiKey: "k" }, "https://example.com/audio.mp3", undefined);
            assert.ok(fetchCallUrls.includes("https://example.com/audio.mp3"));
        });
    });

    describe("synthesize", () => {
        it("sends correct JSON body", async () => {
            globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
                const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
                assert.ok(url.includes("/audio/speech"));
                const body = JSON.parse(init?.body as string);
                assert.equal(body.model, "tts-1");
                assert.equal(body.input, "Hello");
                assert.equal(body.voice, "nova");
                assert.equal(body.response_format, "mp3");

                return new Response(Buffer.from("audio-data"), { status: 200 });
            };

            const result = await synthesize({ apiKey: "k" }, "Hello", "nova", undefined);
            assert.equal(result.format, "mp3");
            assert.equal(result.voice, "nova");
        });

        it("includes instructions only for gpt-4o-mini-tts", async () => {
            globalThis.fetch = async (_input: string | URL | Request, init?: RequestInit) => {
                const body = JSON.parse(init?.body as string);
                assert.equal(body.instructions, "Be cheerful");
                return new Response(Buffer.from("audio"), { status: 200 });
            };

            await synthesize({ apiKey: "k" }, "Hi", "nova", undefined, {
                model: "gpt-4o-mini-tts",
                instructions: "Be cheerful",
            });
        });

        it("excludes instructions for non-gpt-4o-mini-tts models", async () => {
            globalThis.fetch = async (_input: string | URL | Request, init?: RequestInit) => {
                const body = JSON.parse(init?.body as string);
                assert.equal(body.instructions, undefined);
                return new Response(Buffer.from("audio"), { status: 200 });
            };

            await synthesize({ apiKey: "k" }, "Hi", "nova", undefined, {
                model: "tts-1",
                instructions: "Be cheerful",
            });
        });
    });

    describe("fetchVoices", () => {
        it("returns hardcoded voice list", async () => {
            const voices = await fetchVoices({ apiKey: "k" });
            assert.ok(voices.length === 13);
            assert.ok(voices.some((v) => v.id === "nova"));
            assert.ok(voices.some((v) => v.id === "alloy"));
            assert.ok(voices.every((v) => v.provider === "openai"));
            assert.ok(voices.every((v) => v.locale === "en"));
        });
    });
});
