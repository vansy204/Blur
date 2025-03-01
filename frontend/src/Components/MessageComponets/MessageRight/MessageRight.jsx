import { Client } from "@stomp/stompjs";
import React, { useEffect, useState } from "react";
import { AiFillPicture } from "react-icons/ai";
import { FaCircle, FaMicrophone, FaPhoneAlt, FaVideo } from "react-icons/fa";
import { FaCirclePlus } from "react-icons/fa6";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { IoSend } from "react-icons/io5";
import SockJS from "sockjs-client";

const MessageRight = () => {
  const [stompClient, setStompClient] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);
  const currentUser = queryParams.get("currentUser") || "user1";
  const recipientUser = queryParams.get("recipientUser") || "user2";

  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => console.log(str), // Log chi tiết STOMP
      onConnect: () => {
        console.log(`Connected as ${currentUser}`);
        setIsConnected(true);
        client.subscribe(`/user/${currentUser}/queue/private`, (msg) => {
          console.log(`Received message for ${currentUser}: ${msg.body}`);
          setMessages((prev) => [...prev, msg.body]);
        });
      },
      onStompError: (error) => {
        console.error("STOMP error:", error);
        setIsConnected(false);
      },
      onWebSocketClose: () => {
        console.log("Disconnected");
        setIsConnected(false);
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      if (client) client.deactivate();
    };
  }, [currentUser]);

  const sendMessage = () => {
    if (stompClient && isConnected) {
      console.log(`Sending message from ${currentUser} to ${recipientUser}: ${message}`);
      stompClient.publish({
        destination: "/app/private",
        body: message,
        headers: { username: recipientUser },
      });
      setMessages((prev) => [...prev, `You: ${message}`]);
      setMessage("");
    } else {
      console.error("Cannot send message: Not connected");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 h-[10%] bg-white z-10">
        <div className="flex mt-2 ml-2 relative items-center">
          <div className="relative h-12 w-12">
            <img
              className="h-12 w-12 rounded-full"
              src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
              alt=""
            />
            <FaCircle className="absolute bottom-0 right-0 text-green-500 text-[12px] bg-white rounded-full p-[1px]" />
          </div>
          <div className="ml-2">
            <p className="font-semibold text-lg">{recipientUser}</p>
            <p className="font-thin text-sm">online</p>
          </div>
          <FaPhoneAlt className="absolute mr-2 right-20 text-2xl text-gray-600 cursor-pointer" />
          <FaVideo className="absolute right-12 text-2xl text-gray-600 cursor-pointer" />
          <IoIosInformationCircleOutline className="absolute right-2 text-2xl text-gray-600 cursor-pointer" />
        </div>
      </div>
      <hr />
      <div className="h-[80%]">
        <div className="flex flex-col h-full">
          <div className="flex-grow h-full custom-scrollbar">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`${
                  msg.startsWith("You:") ? "ml-auto bg-blue-200" : "mr-auto bg-gray-200"
                } p-2 rounded-md w-[50%] mt-2`}
              >
                {msg}
              </div>
            ))}
          </div>
        </div>
      </div>
      <hr />
      <div className="sticky bottom-0 h-[10%] bg-white flex items-center justify-between px-2">
        <div className="flex items-center w-full">
          <FaCirclePlus className="text-2xl mr-2 cursor-pointer" />
          <AiFillPicture className="text-2xl mr-2 cursor-pointer" />
          <FaMicrophone className="text-2xl mr-2 cursor-pointer" />
          <input
            type="text"
            placeholder={`Chat with ${recipientUser}`}
            className="flex-grow h-12 p-2 border rounded-md"
            disabled={!isConnected}
            onChange={(e) => setMessage(e.target.value)}
            value={message}
          />
          <IoSend className="text-2xl ml-2 cursor-pointer" onClick={sendMessage} />
        </div>
      </div>
      <div className="text-sm text-gray-500">
        Logged in as: {currentUser} | Chatting with: {recipientUser}
      </div>
    </div>
  );
};

export default MessageRight;