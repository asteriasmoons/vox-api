export interface ChatMessage {
    role: "user" | "model";
    parts: {
        text: string;
    }[];
}
export declare function runMoodChat(messages: ChatMessage[]): Promise<string>;
//# sourceMappingURL=moodChatService.d.ts.map