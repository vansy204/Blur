import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Card,
  CardBody,
  Input,
  Text,
  Avatar,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  IconButton,
  Flex,
  Stack,
  Divider,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  List,
  ListItem,
  InputGroup,
  InputLeftElement,
  useToast,
} from "@chakra-ui/react";
import { Plus, Send, RefreshCw, MessageCircle, Search, Wifi, WifiOff } from "lucide-react";
import { getMyConversations } from "../../api/messageAPi";
import { searchUsersByUserName } from "../../api/userApi";
import axios from "axios";
import { getToken } from "../../service/LocalStorageService";
import { io } from "socket.io-client";

export default function MessagePage() {
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messagesMap, setMessagesMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const messageContainerRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const toast = useToast();

  // Giữ nguyên định dạng ngày giờ để tránh lỗi sort/duplicate
  const normalizeDate = (dateStr) => dateStr || new Date().toISOString();

  const getCurrentUser = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:8888/api/user/profile", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });
      if (response.data?.result?.userId) {
        setCurrentUserId(response.data.result.userId);
      }
    } catch (error) {
      console.error("Failed to get current user:", error);
    }
  }, []);

  // Lưu tham chiếu hàm handler để off/on listener đúng cách
  const messageHandlerRef = useRef(null);

  useEffect(() => {
    const initializeSocket = () => {
      const token = getToken();
      if (!token) return;

      // Nếu socket trước đó tồn tại, gỡ hết listener rồi disconnect
      if (socketRef.current) {
        try {
          socketRef.current.removeAllListeners?.();
        } catch (_) {}
        socketRef.current.disconnect();
      }

      const connectionUrl = `http://localhost:8099?token=${token}`;
      socketRef.current = io(connectionUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
        forceNew: true,
      });

      const socket = socketRef.current;

      messageHandlerRef.current = (messageData) => {
        try {
          const msgObj = typeof messageData === "string" ? JSON.parse(messageData) : messageData;
          if (msgObj && msgObj.conversationId && (msgObj.message || msgObj.text)) {
            const normalized = {
              ...msgObj,
              message: msgObj.message ?? msgObj.text,
            };
            handleIncomingMessage(normalized);
          }
        } catch (err) {
          console.error("Error processing incoming message:", err);
        }
      };

      socket.on("connect", () => {
        setIsConnected(true);
        toast({
          title: "Connected",
          description: "Real-time messaging is active",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        socket.off("message", messageHandlerRef.current);
        socket.on("message", messageHandlerRef.current);
      });

      socket.on("disconnect", (reason) => {
        setIsConnected(false);
        if (reason === "io server disconnect") {
          socket.connect();
        }
      });

      socket.on("connect_error", () => {
        setIsConnected(false);
        toast({
          title: "Connection Error",
          description: "Failed to connect to real-time messaging",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      });

      socket.on("reconnect", () => {
        setIsConnected(true);
        toast({
          title: "Reconnected",
          description: "Real-time messaging restored",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        socket.off("message", messageHandlerRef.current);
        socket.on("message", messageHandlerRef.current);
      });

      // Các sự kiện khác có thể xử lý...
      socket.on("user_typing", () => {});
      socket.on("message_status", () => {});
    };

    initializeSocket();
    getCurrentUser();

    return () => {
      if (socketRef.current) {
        try {
          socketRef.current.removeAllListeners?.();
        } catch (_) {}
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [getCurrentUser, toast]);

  // Cập nhật lại cờ me khi có currentUserId mới
  useEffect(() => {
    if (!currentUserId) return;
    setMessagesMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((cid) => {
        next[cid] = (next[cid] || []).map((m) => ({
          ...m,
          me: m.senderId ? m.senderId === currentUserId : !!m.me,
        }));
      });
      return next;
    });
  }, [currentUserId]);

  const handleIncomingMessage = useCallback(
    (message) => {
      if (!message.conversationId || !message.message) return;

      const normalizedMessage = {
        ...message,
        createdDate: normalizeDate(message.createdDate || message.created_at || new Date().toISOString()),
        me: currentUserId ? message.senderId === currentUserId : !!message.me,
      };

      setMessagesMap((prevMessagesMap) => {
        const conversationId = normalizedMessage.conversationId;
        const existingMessages = prevMessagesMap[conversationId] || [];

        // Kiểm tra trùng chỉ dựa trên id hoặc clientId
        const isDuplicate = existingMessages.some((existingMsg) => {
          if (normalizedMessage.id && existingMsg.id) {
            return existingMsg.id === normalizedMessage.id;
          }
          if (normalizedMessage.clientId && existingMsg.clientId) {
            return existingMsg.clientId === normalizedMessage.clientId;
          }
          return false;
        });

        if (isDuplicate) return prevMessagesMap;

        // Thay thế bản optimistic bằng bản server theo clientId nếu có
        let merged = existingMessages;
        if (normalizedMessage.clientId) {
          merged = existingMessages.filter(
            (m) => m.clientId !== normalizedMessage.clientId && m.id !== normalizedMessage.id
          );
        }

        const updatedMessages = [...merged, normalizedMessage].sort(
          (a, b) => new Date(a.createdDate || 0) - new Date(b.createdDate || 0)
        );

        return {
          ...prevMessagesMap,
          [conversationId]: updatedMessages,
        };
      });

      // Cập nhật danh sách hội thoại
      setConversations((prevConversations) => {
        let found = false;
        const updated = prevConversations.map((conv) => {
          if (conv.id === normalizedMessage.conversationId) {
            found = true;
            const isCurrentConversation = selectedConversation?.id === conv.id;
            const isFromCurrentUser = currentUserId === normalizedMessage.senderId;
            return {
              ...conv,
              lastMessage: normalizedMessage.message,
              lastTimestamp: new Date(normalizedMessage.createdDate).toLocaleString(),
              modifiedDate: normalizedMessage.createdDate,
              unread: isCurrentConversation || isFromCurrentUser ? 0 : (conv.unread || 0) + 1,
            };
          }
          return conv;
        });

        if (!found) {
          const isFromCurrentUser = currentUserId === normalizedMessage.senderId;
          const newConversation = {
            id: normalizedMessage.conversationId,
            lastMessage: normalizedMessage.message,
            unread:
              selectedConversation?.id === normalizedMessage.conversationId || isFromCurrentUser ? 0 : 1,
            modifiedDate: normalizedMessage.createdDate,
            conversationName:
              normalizedMessage.sender?.firstName || normalizedMessage.sender?.username || "New Contact",
            conversationAvatar: normalizedMessage.sender?.avatar || normalizedMessage.sender?.imageUrl || "",
          };
          updated.unshift(newConversation);
        }

        return updated.sort((a, b) => new Date(b.modifiedDate || 0) - new Date(a.modifiedDate || 0));
      });

      // Hiện thông báo nếu không phải tin nhắn của user hiện tại trong hội thoại đang mở
      if (currentUserId !== normalizedMessage.senderId && selectedConversation?.id !== normalizedMessage.conversationId) {
        toast({
          title: `New message from ${normalizedMessage.sender?.firstName || "Unknown"}`,
          description:
            normalizedMessage.message.length > 50
              ? normalizedMessage.message.substring(0, 50) + "..."
              : normalizedMessage.message,
          status: "info",
          duration: 4000,
          isClosable: true,
        });
      }
    },
    [selectedConversation?.id, currentUserId, toast]
  );

  // Tạo message mới, gửi kèm clientId để server trả về tương ứng
  const createMessage = async ({ conversationId, message, clientId }) => {
    try {
      const response = await axios.post(
        `http://localhost:8888/api/chat/messages/create`,
        { conversationId, message, clientId },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = response.data;
      if (data.code !== 1000) throw new Error(data.message || "Failed to send message");
      return {
        ...data.result,
        clientId,
        createdDate: normalizeDate(data.result?.createdDate),
      };
    } catch (error) {
      throw error;
    }
  };

  // Retry gửi lại tin nhắn thất bại
  const retryFailedMessage = useCallback(
    async (failedMessage) => {
      if (!failedMessage || !selectedConversation) return;

      setMessagesMap((prev) => {
        const existingMessages = prev[selectedConversation.id] || [];
        const updatedMessages = existingMessages.map((msg) =>
          msg.id === failedMessage.id || msg.clientId === failedMessage.clientId
            ? { ...msg, pending: true, failed: false }
            : msg
        );
        return {
          ...prev,
          [selectedConversation.id]: updatedMessages,
        };
      });

      try {
        const sentMessage = await createMessage({
          conversationId: selectedConversation.id,
          message: failedMessage.message,
          clientId: failedMessage.clientId || `temp-${Date.now()}-${Math.random()}`,
        });

        if (socketRef.current && isConnected) {
          socketRef.current.emit("send_message", {
            conversationId: selectedConversation.id,
            message: failedMessage.message,
            messageId: sentMessage.id,
            clientId: sentMessage.clientId,
          });
        }

        setMessagesMap((prev) => {
          const existingMessages = prev[selectedConversation.id] || [];
          const updatedMessages = existingMessages
            .filter((msg) => msg.clientId !== sentMessage.clientId && msg.id !== sentMessage.id)
            .concat({ ...sentMessage, me: true, pending: false, failed: false })
            .sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));
          return { ...prev, [selectedConversation.id]: updatedMessages };
        });
      } catch (error) {
        setMessagesMap((prev) => {
          const existingMessages = prev[selectedConversation.id] || [];
          const updatedMessages = existingMessages.map((msg) =>
            msg.id === failedMessage.id || msg.clientId === failedMessage.clientId
              ? { ...msg, failed: true, pending: false }
              : msg
          );
          return { ...prev, [selectedConversation.id]: updatedMessages };
        });
      }
    },
    [selectedConversation, isConnected]
  );

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation) return;

    const clientId = `temp-${Date.now()}-${Math.random()}`;
    const currentTime = new Date().toISOString();
    const messageToSend = message.trim();

    const optimisticMessage = {
      id: null,
      clientId,
      message: messageToSend,
      createdDate: currentTime,
      me: true,
      pending: true,
      conversationId: selectedConversation.id,
      senderId: currentUserId,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [selectedConversation.id]: [...(prev[selectedConversation.id] || []), optimisticMessage],
    }));

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id ? { ...conv, lastMessage: messageToSend, modifiedDate: currentTime } : conv
      )
    );

    setMessage("");

    try {
      const sentMessage = await createMessage({
        conversationId: selectedConversation.id,
        message: messageToSend,
        clientId,
      });

      if (socketRef.current && isConnected) {
        socketRef.current.emit("send_message", {
          conversationId: selectedConversation.id,
          message: messageToSend,
          messageId: sentMessage.id,
          clientId,
        });
      }

      setMessagesMap((prev) => {
        const existingMessages = prev[selectedConversation.id] || [];
        const updatedMessages = existingMessages
          .filter((msg) => msg.clientId !== clientId && msg.id !== sentMessage.id)
          .concat({ ...sentMessage, me: true, pending: false })
          .sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));
        return { ...prev, [selectedConversation.id]: updatedMessages };
      });

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id
            ? { ...conv, lastMessage: sentMessage.message, modifiedDate: sentMessage.createdDate }
            : conv
        )
      );
    } catch (error) {
      setMessagesMap((prev) => {
        const existingMessages = prev[selectedConversation.id] || [];
        const updatedMessages = existingMessages.map((msg) =>
          msg.clientId === clientId ? { ...msg, failed: true, pending: false } : msg
        );
        return { ...prev, [selectedConversation.id]: updatedMessages };
      });

      toast({
        title: "Failed to send message",
        description: "Please check your connection and try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const formatMessageDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("vi-VN", { hour12: false });
  };

  const [filteredUsers, setFilteredUsers] = useState([]);
  const searchUsers = async (query) => {
    setSearchQuery(query);
    try {
      const res = await searchUsersByUserName(query);
      setFilteredUsers(res || []);
    } catch (_) {
      setFilteredUsers([]);
    }
  };

  const scrollToBottom = useCallback(() => {
    if (messageContainerRef.current) {
      const scrollElement = messageContainerRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
      requestAnimationFrame(() => {
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }
      });
    }
  }, []);

  const getMessages = async (conversationId) => {
    try {
      const res = await axios.get(`http://localhost:8888/api/chat/messages`, {
        params: { conversationId },
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });
      const data = res.data;
      if (data?.code !== 1000) throw new Error(data?.message || "Failed to fetch messages");
      const messages = (data?.result || [])
        .map((m) => ({
          ...m,
          createdDate: normalizeDate(m.createdDate),
          me: currentUserId ? m.senderId === currentUserId : !!m.me,
        }))
        .sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));
      return messages;
    } catch (err) {
      throw err;
    }
  };

  const handleSelectNewChatUser = async (user) => {
    try {
      const data = {
        type: "DIRECT",
        participantsIds: [user.userId],
      };
      const response = await axios.post(
        "http://localhost:8888/api/chat/conversations/create",
        {
          type: data.type,
          participantIds: data.participantsIds,
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      const newConversation = response?.data?.result;
      const existingConversation = conversations.find((conv) => conv.id === newConversation.id);
      if (existingConversation) {
        setSelectedConversation(existingConversation);
      } else {
        setConversations((prev) => [newConversation, ...prev]);
        setSelectedConversation(newConversation);
      }
      setSearchQuery("");
      onClose();
    } catch (error) {}
  };

  const handleModalClose = () => {
    setSearchQuery("");
    setFilteredUsers([]);
    onClose();
  };

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMyConversations();
      const conversationsData = response?.data?.result || [];
      setConversations(conversationsData);
    } catch (err) {
      setError("Failed to load conversations. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  useEffect(() => {
    const fetchMessages = async (conversationId) => {
      try {
        if (!messagesMap[conversationId]) {
          const messages = await getMessages(conversationId);
          if (messages && Array.isArray(messages)) {
            setMessagesMap((prev) => ({
              ...prev,
              [conversationId]: messages,
            }));
          }
        }
        setConversations((prev) => prev.map((conv) => (conv.id === conversationId ? { ...conv, unread: 0 } : conv)));
      } catch (err) {}
    };
    if (selectedConversation?.id) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id, messagesMap, currentUserId]);

  const currentMessages = selectedConversation ? messagesMap[selectedConversation.id] || [] : [];

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages.length, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation, scrollToBottom]);

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="w-full h-[calc(100vh-2rem)] max-w-7xl mx-auto shadow-2xl rounded-2xl overflow-hidden">
        <CardBody p={0} className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 bg-gradient-to-b from-blue-50 to-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <Flex align="center" gap={2}>
                <Text fontSize="xl" fontWeight="bold" color="blue.600">
                  Chats
                </Text>
                {/* Connection status indicator */}
                {isConnected ? (
                  <Wifi size={16} className="text-green-500" />
                ) : (
                  <WifiOff size={16} className="text-red-500" />
                )}
              </Flex>
              <IconButton
                colorScheme="blue"
                size="sm"
                icon={<Plus size={18} />}
                variant="ghost"
                onClick={onOpen}
                borderRadius="full"
                aria-label="new-chat"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center p-10">
                  <Spinner size="lg" thickness="3px" color="blue.500" />
                </div>
              ) : error ? (
                <div className="p-6">
                  <Alert status="error" borderRadius="lg">
                    <AlertIcon />
                    <Box>
                      <Text fontSize="sm">{error}</Text>
                      <Button
                        size="sm"
                        leftIcon={<RefreshCw size={14} />}
                        onClick={fetchConversations}
                        mt={2}
                        colorScheme="red"
                      >
                        Retry
                      </Button>
                    </Box>
                  </Alert>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <Text color="gray.500" fontSize="sm">
                    No conversations yet. Start a new chat.
                  </Text>
                </div>
              ) : (
                <div>
                  {conversations.map((conversation, idx) => (
                    <div key={conversation.id}>
                      <div
                        className={`px-4 py-3 cursor-pointer transition-colors rounded-md mx-2 my-1 ${
                          selectedConversation?.id === conversation.id
                            ? "bg-blue-100 border-l-4 border-blue-500"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleConversationSelect(conversation)}
                      >
                        <Flex align="center" gap={3}>
                          <div className="relative">
                            <Avatar src={conversation.conversationAvatar} size="md" />
                            {conversation.unread > 0 && (
                              <Badge
                                colorScheme="red"
                                borderRadius="full"
                                position="absolute"
                                top="-1"
                                right="-1"
                                fontSize="xs"
                                minW="5"
                                h="5"
                              >
                                {conversation.unread}
                              </Badge>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Flex justify="space-between" align="center" mb={1}>
                              <Text
                                fontWeight={conversation.unread > 0 ? "bold" : "medium"}
                                fontSize="sm"
                                noOfLines={1}
                              >
                                {conversation.conversationName}
                              </Text>
                              <Text fontSize="xs" color="gray.400">
                                {new Date(conversation.modifiedDate).toLocaleDateString("vi-VN").replace(/\//g, "-")}
                              </Text>
                            </Flex>
                            <Text fontSize="xs" color="gray.600" noOfLines={1} italic>
                              {conversation.lastMessage || "Say hi 👋"}
                            </Text>
                          </div>
                        </Flex>
                      </div>
                      {idx < conversations.length - 1 && <Divider />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedConversation ? (
              <>
                {/* Header Chat */}
                <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-gray-50">
                  <Avatar src={selectedConversation.conversationAvatar} size="md" />
                  <div className="flex-1">
                    <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                      {selectedConversation.conversationName}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {isConnected ? "Online" : "Connecting..."}
                    </Text>
                  </div>
                </div>

                {/* Messages */}
                <div ref={messageContainerRef} className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
                  <div className="flex flex-col space-y-4">
                    {currentMessages.map((msg) => (
                      <div key={msg.id || msg.clientId} className={`flex ${msg.me ? "justify-end" : "justify-start"}`}>
                        {!msg.me && (
                          <Avatar src={msg.sender?.avatar} size="sm" mr={2} alignSelf="flex-end" />
                        )}
                        <Box
                          maxW="70%"
                          px={4}
                          py={3}
                          borderRadius="2xl"
                          shadow="sm"
                          bg={msg.me ? (msg.failed ? "red.100" : "blue.500") : "gray.200"}
                          color={msg.me ? "white" : "black"}
                          opacity={msg.pending ? 0.7 : 1}
                          cursor={msg.failed ? "pointer" : "default"}
                          onClick={msg.failed ? () => retryFailedMessage(msg) : undefined}
                          _hover={msg.failed ? { opacity: 0.8 } : {}}
                        >
                          <Text fontSize="sm">{msg.message}</Text>
                          <Text fontSize="xs" color={msg.me ? "blue.100" : "gray.600"} mt={1} textAlign="right">
                            {msg.failed ? "❌ Failed (tap to retry)" : msg.pending ? "⏳ Sending..." : formatMessageDate(msg.createdDate)}
                          </Text>
                        </Box>
                        {msg.me && (
                          <Avatar size="sm" ml={2} bg="blue.600" color="white">
                            Me
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 flex gap-2 items-center bg-white">
                  <Input
                    placeholder={"Type something..."}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    size="md"
                    borderRadius="full"
                    focusBorderColor="blue.500"
                    boxShadow="sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <IconButton
                    colorScheme="blue"
                    icon={<Send size={18} />}
                    onClick={handleSendMessage}
                    isDisabled={!message.trim()}
                    borderRadius="full"
                    aria-label="send"
                    _hover={{ transform: "scale(1.1)" }}
                    transition="all 0.2s ease"
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Stack align="center" spacing={4}>
                  <MessageCircle size={72} className="text-gray-300" />
                  <Text fontSize="lg" color="gray.500">
                    Select a conversation to start chatting ✨
                  </Text>
                </Stack>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* New Chat Modal with Search */}
      <Modal isOpen={isOpen} onClose={handleModalClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent borderRadius="2xl" boxShadow="2xl">
          <ModalHeader>Start New Chat</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <InputGroup mb={4}>
              <InputLeftElement pointerEvents="none">
                <Search size={16} className="text-gray-400" />
              </InputLeftElement>
              <Input
                placeholder="Search users..."
                onChange={(e) => searchUsers(e.target.value)}
                borderRadius="full"
                value={searchQuery}
                bg="gray.50"
              />
            </InputGroup>
            {filteredUsers.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">
                  {searchQuery ? "No users found" : "Search for users to start chatting"}
                </Text>
              </Box>
            ) : (
              <List spacing={3} maxH="300px" overflowY="auto">
                {filteredUsers.map((user) => (
                  <ListItem key={user.userId}>
                    <Flex
                      align="center"
                      p={3}
                      borderRadius="xl"
                      cursor="pointer"
                      _hover={{ bg: "blue.50" }}
                      onClick={() => handleSelectNewChatUser(user)}
                    >
                      <Avatar src={user.imageUrl} size="sm" mr={3} />
                      <Text>
                        {user.firstName} {user.lastName}
                      </Text>
                    </Flex>
                  </ListItem>
                ))}
              </List>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
