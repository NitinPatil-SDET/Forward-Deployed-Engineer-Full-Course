from chat_controller import ChatController
from chat_service import ChatService


chat_service = ChatService()
chat_controller = ChatController(chat_service)


def chat(message):
    return chat_controller.chat(message)
