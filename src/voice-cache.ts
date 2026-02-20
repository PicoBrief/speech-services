import type { VoiceInfo } from "./types.js";

interface CacheEntry {
    voices: VoiceInfo[];
    expires: number;
}

export class VoiceCache {
    private cache = new Map<string, CacheEntry>();
    private ttl: number;

    constructor(ttl = 3_600_000) {
        this.ttl = ttl;
    }

    get(key: string): VoiceInfo[] | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;
        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return undefined;
        }
        return entry.voices;
    }

    set(key: string, voices: VoiceInfo[]): void {
        this.cache.set(key, { voices, expires: Date.now() + this.ttl });
    }
}
