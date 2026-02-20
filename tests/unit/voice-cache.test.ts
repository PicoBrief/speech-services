import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VoiceCache } from "../../src/voice-cache.js";
import type { VoiceInfo } from "../../src/types.js";

const testVoices: VoiceInfo[] = [
    { id: "voice-1", name: "Voice 1", locale: "en-US", provider: "azure" },
    { id: "voice-2", name: "Voice 2", locale: "fr-FR", provider: "azure" },
];

describe("VoiceCache", () => {
    it("returns undefined for missing key", () => {
        const cache = new VoiceCache();
        assert.equal(cache.get("missing"), undefined);
    });

    it("stores and retrieves voices", () => {
        const cache = new VoiceCache();
        cache.set("azure:eastus", testVoices);
        const result = cache.get("azure:eastus");
        assert.deepEqual(result, testVoices);
    });

    it("returns undefined for expired entries", () => {
        // TTL of 1ms
        const cache = new VoiceCache(1);
        cache.set("key", testVoices);

        // Wait for expiry
        const start = Date.now();
        while (Date.now() - start < 5) { /* busy wait */ }

        assert.equal(cache.get("key"), undefined);
    });

    it("overwrites existing entries", () => {
        const cache = new VoiceCache();
        cache.set("key", testVoices);
        const newVoices = [testVoices[0]];
        cache.set("key", newVoices);
        assert.deepEqual(cache.get("key"), newVoices);
    });

    it("handles multiple keys independently", () => {
        const cache = new VoiceCache();
        const voices1 = [testVoices[0]];
        const voices2 = [testVoices[1]];
        cache.set("key1", voices1);
        cache.set("key2", voices2);
        assert.deepEqual(cache.get("key1"), voices1);
        assert.deepEqual(cache.get("key2"), voices2);
    });
});
