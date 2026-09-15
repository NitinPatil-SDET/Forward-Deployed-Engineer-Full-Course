export class ChatController {
    constructor(chatService) {
        this.chatService = chatService;
    }

    chat(message) {
        return this.chatService.chat(message);
    }
}
