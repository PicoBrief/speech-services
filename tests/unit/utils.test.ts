import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeLanguageCode, getBaseLanguage, isUrl, detectFormatFromString, groupWordsToSnippets } from "../../src/utils.js";

describe("normalizeLanguageCode", () => {
    it("converts ISO 639-3 to 639-1", () => {
        assert.equal(normalizeLanguageCode("eng"), "en");
        assert.equal(normalizeLanguageCode("spa"), "es");
        assert.equal(normalizeLanguageCode("fra"), "fr");
        assert.equal(normalizeLanguageCode("deu"), "de");
        assert.equal(normalizeLanguageCode("zho"), "zh");
        assert.equal(normalizeLanguageCode("cmn"), "zh");
    });

    it("converts underscore format to BCP-47", () => {
        assert.equal(normalizeLanguageCode("en_us"), "en-US");
        assert.equal(normalizeLanguageCode("fr_FR"), "fr-FR");
        assert.equal(normalizeLanguageCode("zh_cn"), "zh-CN");
    });

    it("normalizes lowercase BCP-47", () => {
        assert.equal(normalizeLanguageCode("en-us"), "en-US");
        assert.equal(normalizeLanguageCode("fr-fr"), "fr-FR");
    });

    it("passes through proper BCP-47", () => {
        assert.equal(normalizeLanguageCode("en-US"), "en-US");
        assert.equal(normalizeLanguageCode("zh-CN"), "zh-CN");
    });

    it("returns base codes as-is", () => {
        assert.equal(normalizeLanguageCode("en"), "en");
        assert.equal(normalizeLanguageCode("fr"), "fr");
    });

    it("handles empty string", () => {
        assert.equal(normalizeLanguageCode(""), "");
    });
});

describe("getBaseLanguage", () => {
    it("extracts base from BCP-47", () => {
        assert.equal(getBaseLanguage("en-US"), "en");
        assert.equal(getBaseLanguage("zh-CN"), "zh");
    });

    it("extracts base from underscore format", () => {
        assert.equal(getBaseLanguage("en_US"), "en");
    });

    it("returns base code as-is", () => {
        assert.equal(getBaseLanguage("en"), "en");
    });

    it("handles empty string", () => {
        assert.equal(getBaseLanguage(""), "");
    });
});

describe("isUrl", () => {
    it("detects http URLs", () => {
        assert.equal(isUrl("http://example.com/audio.mp3"), true);
    });

    it("detects https URLs", () => {
        assert.equal(isUrl("https://example.com/audio.mp3"), true);
    });

    it("detects gs:// URIs", () => {
        assert.equal(isUrl("gs://bucket/audio.mp3"), true);
    });

    it("rejects non-URLs", () => {
        assert.equal(isUrl("/path/to/file.mp3"), false);
        assert.equal(isUrl("file.mp3"), false);
    });
});

describe("detectFormatFromString", () => {
    it("detects mp3", () => {
        assert.equal(detectFormatFromString("mp3"), "mp3");
        assert.equal(detectFormatFromString("audio/mpeg"), "mp3");
        assert.equal(detectFormatFromString("mp3_44100_128"), "mp3");
    });

    it("detects wav", () => {
        assert.equal(detectFormatFromString("wav"), "wav");
        assert.equal(detectFormatFromString("pcm"), "wav");
        assert.equal(detectFormatFromString("riff-16khz-16bit-mono-pcm"), "wav");
        assert.equal(detectFormatFromString("linear16"), "wav");
    });

    it("detects ogg", () => {
        assert.equal(detectFormatFromString("ogg"), "ogg");
        assert.equal(detectFormatFromString("opus"), "ogg");
        assert.equal(detectFormatFromString("OGG_OPUS"), "ogg");
    });

    it("detects flac", () => {
        assert.equal(detectFormatFromString("flac"), "flac");
    });

    it("detects webm", () => {
        assert.equal(detectFormatFromString("webm"), "webm");
    });

    it("defaults to mp3 for unknown formats", () => {
        assert.equal(detectFormatFromString("unknown"), "mp3");
    });
});

// ─── groupWordsToSnippets ───────────────────────────────────────────────────

function word(text: string, startTime: number, endTime: number) {
    return { text, startTime, endTime };
}

describe("groupWordsToSnippets", () => {
    it("returns empty array for empty input", () => {
        assert.deepEqual(groupWordsToSnippets([]), []);
    });

    it("groups a single word into one snippet", () => {
        const result = groupWordsToSnippets([word("hello", 0, 0.5)]);
        assert.deepEqual(result, [{ text: "hello", time: 0, duration: 0.5 }]);
    });

    it("groups consecutive words with small gaps into one snippet", () => {
        const words = [
            word("hello", 0, 0.3),
            word("how", 0.35, 0.6),
            word("are", 0.65, 0.9),
            word("you", 0.95, 1.2),
        ];
        const result = groupWordsToSnippets(words);
        assert.equal(result.length, 1);
        assert.equal(result[0].text, "hello how are you");
        assert.equal(result[0].time, 0);
        assert.equal(result[0].duration, 1.2);
    });

    it("splits on gap exceeding 0.4s default threshold", () => {
        const words = [
            word("hello", 0, 0.3),
            word("world", 0.35, 0.6),
            // gap of 0.5s (> 0.4)
            word("how", 1.1, 1.4),
            word("are", 1.45, 1.7),
        ];
        const result = groupWordsToSnippets(words);
        assert.equal(result.length, 2);
        assert.equal(result[0].text, "hello world");
        assert.equal(result[0].time, 0);
        assert.equal(result[1].text, "how are");
        assert.equal(result[1].time, 1.1);
    });

    it("splits when snippet duration exceeds 10s default threshold", () => {
        // Build words spanning >10s with no gaps
        const words = [];
        for (let i = 0; i < 30; i++) {
            words.push(word(`w${i}`, i * 0.4, i * 0.4 + 0.35));
        }
        const result = groupWordsToSnippets(words);
        assert.ok(result.length > 1, "should split into multiple snippets");
        // First snippet should not exceed ~10s
        assert.ok(result[0].duration <= 10.5);
    });

    it("respects custom gap threshold", () => {
        const words = [
            word("a", 0, 0.3),
            // gap of 0.3s — below default 0.4, but above custom 0.2
            word("b", 0.6, 0.9),
            word("c", 0.95, 1.2),
        ];
        const result = groupWordsToSnippets(words, { gap: 0.2 });
        assert.equal(result.length, 2);
        assert.equal(result[0].text, "a");
        assert.equal(result[1].text, "b c");
    });

    it("respects custom existingDuration threshold", () => {
        // Words spanning ~6s with no gaps
        const words = [];
        for (let i = 0; i < 20; i++) {
            words.push(word(`w${i}`, i * 0.35, i * 0.35 + 0.3));
        }
        const defaultResult = groupWordsToSnippets(words);
        const shortResult = groupWordsToSnippets(words, { existingDuration: 2 });
        assert.ok(shortResult.length > defaultResult.length, "shorter duration should produce more snippets");
    });

    it("does not split on gap exactly at threshold", () => {
        const words = [
            word("a", 0, 0.5),
            // gap of exactly 0.4 — should NOT split (> 0.4, not >=)
            word("b", 0.9, 1.2),
        ];
        const result = groupWordsToSnippets(words);
        assert.equal(result.length, 1);
        assert.equal(result[0].text, "a b");
    });

    it("computes correct time and duration for each snippet", () => {
        const words = [
            word("one", 1.0, 1.5),
            word("two", 1.6, 2.0),
            // gap > 0.4
            word("three", 3.0, 3.5),
        ];
        const result = groupWordsToSnippets(words);
        assert.equal(result.length, 2);
        assert.equal(result[0].time, 1.0);
        assert.equal(result[0].duration, 1.0); // 2.0 - 1.0
        assert.equal(result[1].time, 3.0);
        assert.equal(result[1].duration, 0.5); // 3.5 - 3.0
    });
});
