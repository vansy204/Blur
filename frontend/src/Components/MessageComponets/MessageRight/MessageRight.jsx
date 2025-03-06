import { Client } from "@stomp/stompjs";
import React, { useEffect, useState, useRef } from "react";
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

  const messagesEndRef = useRef(null);

  const queryParams = new URLSearchParams(window.location.search);
  const currentUser = queryParams.get("currentUser") || "user1";
  const recipientUser = queryParams.get("recipientUser") || "user2";

  useEffect(() => {
    const socket = new SockJS("http://localhost:8083/chat/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => console.log(str), // Log chi tiết STOMP
      onConnect: () => {
        console.log(`Connected as ${currentUser}`);
        setIsConnected(true);
        
        // Đảm bảo mỗi tab subscribe vào queue của currentUser
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

    // Activate the STOMP client
    client.activate();
    setStompClient(client);

    // Clean up on unmount
    return () => {
      if (client) client.deactivate();
    };
  }, [currentUser]);

  // Scroll to the bottom when a new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (stompClient && isConnected) {
      console.log(
        `Sending message from ${currentUser} to ${recipientUser}: ${message}`
      );
      // Gửi tin nhắn đến server
      stompClient.publish({
        destination: "/app/private",  // Destination phải đúng
        body: message,  // Nội dung tin nhắn
        headers: { username: recipientUser },  // Gửi tên người nhận
      });
      setMessages((prev) => [...prev, `You: ${message}`]); // Hiển thị tin nhắn gửi
      setMessage(""); // Xóa ô nhập sau khi gửi
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

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Thanh nhập tin nhắn */}
      <div className="fixed bottom-0 left-0 w-full h-[10%] bg-white flex items-center justify-between px-2">
        <div className="flex items-center w-full">
          <FaCirclePlus className="text-2xl mr-2 cursor-pointer" />
          <AiFillPicture className="text-2xl mr-2 cursor-pointer" />
          <FaMicrophone className="text-2xl mr-2 cursor-pointer" />

          {/* Thanh nhập tin nhắn */}
          <input
            type="text"
            placeholder={`Chat with ${recipientUser}`}
            className="flex-grow h-12 p-2 border rounded-md"
            disabled={!isConnected}
            onChange={(e) => setMessage(e.target.value)}
            value={message}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          <IoSend
            className="text-2xl ml-2 cursor-pointer"
            onClick={sendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default MessageRight;
