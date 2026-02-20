import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { transcribe } from "../../../src/providers/deepgram/transcribe.js";
import { synthesize } from "../../../src/providers/deepgram/synthesize.js";
import { fetchVoices } from "../../../src/providers/deepgram/fetch-voices.js";

describe("Deepgram", () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    describe("transcribe", () => {
        it("sends buffer as raw bytes with correct headers", async () => {
            globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
                const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
                assert.ok(url.includes("/v1/listen"));
                assert.ok(url.includes("model=nova-2"));
                assert.ok(url.includes("smart_format=true"));
                assert.equal((init?.headers as Record<string, string>)["Content-Type"], "application/octet-stream");
                assert.equal((init?.headers as Record<string, string>)["Authorization"], "Token test-key");

                return new Response(JSON.stringify({
                    metadata: { duration: 5.0 },
                    results: {
                        channels: [{
                            alternatives: [{
                                transcript: "Hello world",
                                words: [
                                    { word: "Hello", punctuated_word: "Hello", start: 0.5, end: 1.0, confidence: 0.98 },
                                    { word: "world", punctuated_word: "world", start: 1.1, end: 1.5, confidence: 0.95 },
                                ],
                            }],
                            detected_language: "en",
                        }],
                    },
                }), { status: 200, headers: { "Content-Type": "application/json" } });
            };

            const result = await transcribe({ apiKey: "test-key" }, Buffer.from("audio"), undefined);
            assert.equal(result.text, "Hello world");
            assert.equal(result.words.length, 2);
            assert.equal(result.words[0].text, "Hello");
            assert.equal(result.words[0].startTime, 0.5);
            assert.equal(result.language, "en");
            assert.equal(result.duration, 5.0);
        });

        it("sends URL as JSON body", async () => {
            globalThis.fetch = async (_input: string | URL | Request, init?: RequestInit) => {
                assert.equal((init?.headers as Record<string, string>)["Content-Type"], "application/json");
                const body = JSON.parse(init?.body as string);
                assert.equal(body.url, "https://example.com/audio.mp3");

                return new Response(JSON.stringify({
                    metadata: { duration: 1.0 },
                    results: { channels: [{ alternatives: [{ transcript: "Test", words: [] }] }] },
                }), { status: 200, headers: { "Content-Type": "application/json" } });
            };

            const result = await transcribe({ apiKey: "k" }, "https://example.com/audio.mp3", undefined);
            assert.equal(result.text, "Test");
        });

        it("prefers punctuated_word over word", async () => {
            globalThis.fetch = async () => {
                return new Response(JSON.stringify({
                    metadata: { duration: 1.0 },
                    results: {
                        channels: [{
                            alternatives: [{
                                transcript: "Hi.",
                                words: [{ word: "hi", punctuated_word: "Hi.", start: 0, end: 0.5, confidence: 0.9 }],
                            }],
                        }],
                    },
                }), { status: 200, headers: { "Content-Type": "application/json" } });
            };

            const result = await transcribe({ apiKey: "k" }, Buffer.from("x"), undefined);
            assert.equal(result.words[0].text, "Hi.");
        });
    });

    describe("synthesize", () => {
        it("sends correct request with voice as model query param", async () => {
            globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
                const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
                assert.ok(url.includes("model=aura-2-asteria-en"));
                assert.ok(url.includes("encoding=mp3"));
                const body = JSON.parse(init?.body as string);
                assert.equal(body.text, "Hello");

                return new Response(Buffer.from("fake-audio"), { status: 200 });
            };

            const result = await synthesize({ apiKey: "k" }, "Hello", "aura-2-asteria-en", undefined);
            assert.equal(result.format, "mp3");
            assert.equal(result.voice, "aura-2-asteria-en");
            assert.ok(result.audio.length > 0);
        });
    });

    describe("fetchVoices", () => {
        it("maps TTS models to VoiceInfo", async () => {
            globalThis.fetch = async () => {
                return new Response(JSON.stringify({
                    tts: [
                        {
                            name: "Asteria",
                            canonical_name: "aura-2-asteria-en",
                            languages: ["en"],
                            metadata: { tags: ["feminine"] },
                        },
                        {
                            name: "Orion",
                            canonical_name: "aura-2-orion-en",
                            languages: ["en"],
                            metadata: { tags: ["masculine"] },
                        },
                    ],
                }), { status: 200, headers: { "Content-Type": "application/json" } });
            };

            const voices = await fetchVoices({ apiKey: "k" });
            assert.equal(voices.length, 2);
            assert.equal(voices[0].id, "aura-2-asteria-en");
            assert.equal(voices[0].gender, "female");
            assert.equal(voices[1].gender, "male");
            assert.equal(voices[0].provider, "deepgram");
        });
    });
});
