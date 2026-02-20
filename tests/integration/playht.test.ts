import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadEnv } from "./helpers.js";
import { synthesize } from "../../src/providers/playht/synthesize.js";
import { fetchVoices } from "../../src/providers/playht/fetch-voices.js";

const env = loadEnv();
const apiKey = env.PLAYHT_API_KEY;
const userId = env.PLAYHT_USER_ID;

describe("PlayHT integration", { skip: !apiKey || !userId }, () => {
    if (!apiKey || !userId) {
        console.log("Since PLAYHT_API_KEY or PLAYHT_USER_ID is not defined in .env, the test for PlayHT is skipped");
    }

    let voiceId: string | undefined;

    it("fetches voices", async () => {
        const voices = await fetchVoices({ apiKey: apiKey!, userId: userId! });
        assert.ok(voices.length > 0, "Should return voices");
        assert.ok(voices[0].id, "Voice should have id");
        assert.equal(voices[0].provider, "playht");
        voiceId = voices[0].id;
    });

    it("synthesizes speech", async () => {
        const voice = voiceId ?? "s3://voice-cloning-zero-shot/775ae416-49bb-4fb6-bd45-740f205d20a1/jennifersaad/manifest.json";
        const result = await synthesize({ apiKey: apiKey!, userId: userId! }, "Hello world", voice, "en");
        assert.ok(result.audio.length > 0, "Should return audio");
        assert.equal(result.format, "mp3");
    });
});
