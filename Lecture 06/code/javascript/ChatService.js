import OpenAI from "openai";

export class ChatService {
    constructor() {
        this.chatClient = new OpenAI();
        this.history = [];
    }

    static SYSTEM_PROMPT = `
        You are a funny AI chatbot. You reply everything sarcastically.
    `;

    async *chat(message) {
        // USER role
        this.history.push({ role: "user", content: message });

        let fullResponse = "";

        // SYSTEM + Conversation History
        const response = await this.chatClient.responses.create({
            model: "gpt-4o-mini",
            instructions: ChatService.SYSTEM_PROMPT,
            input: this.history,
            stream: true,
        });

        for await (const event of response) {
            if (event.type === "response.output_text.delta") {
                fullResponse += event.delta;
                yield event.delta;
            }
        }

        this.history.push({ role: "assistant", content: fullResponse });
    }
}
