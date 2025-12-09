import { AxiosResponse } from "axios"
import { API } from "../service/configuration"
import httpClient from "../service/httpClient"
import { getToken } from "../service/LocalStorageService"

interface ConversationData {
    type: string
    participantsIds: string[]
}

interface ChatMessageData {
    conversationId: string
    message: string
}

export const getMyConversations = async (token: string): Promise<AxiosResponse> => {
    return await httpClient.get(API.MY_CONVERSATIONS, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
}

export const createConversation = async (data: ConversationData): Promise<AxiosResponse> => {
    return await httpClient.post(
        API.CREATE_CONVERSATION,
        {
            type: data.type,
            paticipantsIds: data.participantsIds,
        },
        {
            headers: {
                Authorization: `Bearer ${getToken()}`,
                "Content-Type": "application/json",
            },
        }
    )
}

export const createChatMessage = async (data: ChatMessageData): Promise<AxiosResponse> => {
    return await httpClient.post(
        API.CREATE_CHATMESSAGE,
        {
            conversationId: data.conversationId,
            message: data.message
        },
        {
            headers: {
                Authorization: `Bearer ${getToken()}`,
                "Content-Type": "application/json"
            },
        }
    )
}
