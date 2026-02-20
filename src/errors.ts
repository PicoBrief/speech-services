export class SpeechServiceError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly provider?: string,
        public readonly statusCode?: number,
    ) {
        super(message);
        this.name = "SpeechServiceError";
    }
}
