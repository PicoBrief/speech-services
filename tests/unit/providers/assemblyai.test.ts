import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { transcribe } from "../../../src/providers/assemblyai/transcribe.js";

describe("AssemblyAI transcribe", () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it("uploads buffer and polls until complete", async () => {
        let callIndex = 0;

        globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
            const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

            if (url.includes("/v2/upload")) {
                callIndex++;
                return new Response(JSON.stringify({ upload_url: "https://cdn.assemblyai.com/upload/123" }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                });
            }

            if (url.includes("/v2/transcript") && init?.method === "POST") {
                callIndex++;
                const body = JSON.parse(init.body as string);
                assert.equal(body.audio_url, "https://cdn.assemblyai.com/upload/123");
                assert.equal(body.speech_model, "universal");
                assert.equal(body.language_detection, true);
                return new Response(JSON.stringify({ id: "tx-123", status: "queued" }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                });
            }

            if (url.includes("/v2/transcript/tx-123")) {
                callIndex++;
                return new Response(JSON.stringify({
                    id: "tx-123",
                    status: "completed",
                    text: "Hello world",
                    words: [
                        { text: "Hello", start: 500, end: 1000, confidence: 0.95, speaker: null },
                        { text: "world", start: 1100, end: 1500, confidence: 0.92, speaker: null },
                    ],
                    language_code: "en_us",
                    audio_duration: 2.0,
                }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                });
            }

            throw new Error(`Unexpected fetch: ${url}`);
        };

        const result = await transcribe(
            { apiKey: "test-key" },
            Buffer.from("fake audio"),
            undefined,
            { pollInterval: 1 },
        );

        assert.equal(result.text, "Hello world");
        assert.equal(result.words.length, 2);
        assert.equal(result.words[0].startTime, 0.5); // ms to seconds
        assert.equal(result.words[0].endTime, 1.0);
        assert.equal(result.language, "en-US");
        assert.equal(result.duration, 2.0);
        assert.ok(callIndex >= 3); // upload + submit + poll
    });

    it("uses URL directly without uploading", async () => {
        let uploadCalled = false;

        globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
            const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

            if (url.includes("/v2/upload")) {
                uploadCalled = true;
                return new Response("", { status: 200 });
            }

            if (url.includes("/v2/transcript") && init?.method === "POST") {
                const body = JSON.parse(init.body as string);
                assert.equal(body.audio_url, "https://example.com/audio.mp3");
                return new Response(JSON.stringify({ id: "tx-456", status: "queued" }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                });
            }

            if (url.includes("/v2/transcript/tx-456")) {
                return new Response(JSON.stringify({
                    id: "tx-456",
                    status: "completed",
                    text: "Test",
                    words: [],
                    language_code: "en",
                    audio_duration: 1.0,
                }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                });
            }

            throw new Error(`Unexpected fetch: ${url}`);
        };

        const result = await transcribe(
            { apiKey: "test-key" },
            "https://example.com/audio.mp3",
            undefined,
            { pollInterval: 1 },
        );

        assert.equal(uploadCalled, false);
        assert.equal(result.text, "Test");
    });

    it("sets language_code for single language", async () => {
        globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
            const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

            if (url.includes("/v2/transcript") && init?.method === "POST") {
                const body = JSON.parse(init.body as string);
                assert.equal(body.language_code, "en_us");
                assert.equal(body.language_detection, undefined);
                return new Response(JSON.stringify({ id: "tx-789", status: "queued" }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                });
            }

            if (url.includes("/v2/transcript/tx-789")) {
                return new Response(JSON.stringify({
                    status: "completed", text: "", words: [], language_code: "en_us", audio_duration: 0,
                }), { status: 200, headers: { "Content-Type": "application/json" } });
            }

            if (url.includes("/v2/upload")) {
                return new Response(JSON.stringify({ upload_url: "https://cdn.assemblyai.com/upload/x" }), {
                    status: 200, headers: { "Content-Type": "application/json" },
                });
            }

            throw new Error(`Unexpected fetch: ${url}`);
        };

        await transcribe({ apiKey: "k" }, Buffer.from("audio"), ["en-US"], { pollInterval: 1 });
    });
});
