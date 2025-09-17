import { Client } from "@stomp/stompjs";
import { getToken } from "./LocalStorageService";
import SockJS from "sockjs-client";

const token = getToken();

let stompClient = null;

export const connectNotificationSocket = (onMessageReceived) => {
  stompClient = new Client({
    webSocketFactory: () =>
      new SockJS(
        `/api/notification/ws/ws-notification?token=${token}`
      ),
    onConnect: () => {
      console.log("Connected to notification socket");
      stompClient.subscribe(`/topic/notification`, (message) => {
        const notification = JSON.parse(message.body);
        onMessageReceived(notification);
      });
    },
    onStompError: (frame) => {
      console.error("STOMP error", frame);
    },
    onDisconnect: () => {
      console.log("Disconnected from notification socket");
    },
  });

  stompClient.activate();
};

export const disconnectNotificationSocket = () => {
  if (stompClient && stompClient.connected) {
    stompClient.deactivate();
    console.log("Disconnected from notification socket");
  }
};
