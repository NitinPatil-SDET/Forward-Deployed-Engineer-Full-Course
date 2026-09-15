import { ChatController } from "./ChatController.js";
import { ChatService } from "./ChatService.js";

const chatService = new ChatService();
const chatController = new ChatController(chatService);

export function chat(message) {
    return chatController.chat(message);
}
