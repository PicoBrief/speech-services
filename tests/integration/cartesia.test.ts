import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadEnv } from "./helpers.js";
import { synthesize } from "../../src/providers/cartesia/synthesize.js";
import { fetchVoices } from "../../src/providers/cartesia/fetch-voices.js";

const env = loadEnv();
const apiKey = env.CARTESIA_API_KEY;

describe("Cartesia integration", { skip: !apiKey }, () => {
    if (!apiKey) {
        console.log("Since CARTESIA_API_KEY is not defined in .env, the test for Cartesia is skipped");
    }

    let voiceId: string | undefined;

    it("fetches voices", async () => {
        const voices = await fetchVoices({ apiKey: apiKey! });
        assert.ok(voices.length > 0, "Should return voices");
        assert.ok(voices[0].id, "Voice should have id");
        assert.equal(voices[0].provider, "cartesia");
        voiceId = voices[0].id;
    });

    it("synthesizes speech", async () => {
        const voice = voiceId ?? "a0e99841-438c-4a64-b679-ae501e7d6091"; // default Cartesia voice
        const result = await synthesize({ apiKey: apiKey! }, "Hello world", voice, "en", {
            container: "mp3",
        });
        assert.ok(result.audio.length > 0, "Should return audio");
        assert.equal(result.format, "mp3");
    });
});
