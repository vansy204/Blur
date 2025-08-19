import { API } from "../service/configuration";
import httpClient from "../service/httpClient";
import { getToken } from "../service/LocalStorageService";
export const getMyConversations = async () => {
  return await httpClient.get(API.MY_CONVERSATIONS, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};
export const createConversation = async (data) => {
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
  );
};
