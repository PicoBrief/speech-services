import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeLanguageCode, getBaseLanguage, isUrl, detectFormatFromString } from "../../src/utils.js";

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
