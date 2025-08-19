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
} from "@chakra-ui/react";
import {
  Plus,
  Send,
  RefreshCw,
  MessageCircle,
  Search,
  Trophy,
} from "lucide-react";
import { createConversation, getMyConversations } from "../../api/messageAPi";
import { searchUsersByUserName } from "../../api/userApi";
import axios from "axios";
import { getToken } from "../../service/LocalStorageService";

// Mock data và services
const mockUsers = [
  {
    userId: "1",
    name: "John Doe",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
  },
  {
    userId: "2",
    name: "Jane Smith",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b9c56e28?w=150",
  },
  {
    userId: "3",
    name: "Mike Johnson",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  },
  {
    userId: "4",
    name: "Sarah Wilson",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
  },
  {
    userId: "5",
    name: "David Brown",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
  },
  {
    userId: "6",
    name: "Emily Davis",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
  },
];

const mockMessages = {
  1: [
    {
      id: "1",
      message: "Hi there! How are you?",
      createdDate: new Date(Date.now() - 3600000).toISOString(),
      me: false,
      sender: {
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      },
    },
    {
      id: "2",
      message: "I'm doing great, thanks for asking!",
      createdDate: new Date(Date.now() - 3000000).toISOString(),
      me: true,
    },
    {
      id: "3",
      message: "That's wonderful to hear!",
      createdDate: new Date(Date.now() - 1800000).toISOString(),
      me: false,
      sender: {
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      },
    },
  ],
  2: [
    {
      id: "4",
      message: "Are you free tomorrow?",
      createdDate: new Date(Date.now() - 86400000).toISOString(),
      me: false,
      sender: {
        avatar:
          "https://images.unsplash.com/photo-1494790108755-2616b9c56e28?w=150",
      },
    },
    {
      id: "5",
      message: "Yes, what time works for you?",
      createdDate: new Date(Date.now() - 86300000).toISOString(),
      me: true,
    },
  ],
  3: [
    {
      id: "6",
      message: "Thanks for helping me with the project!",
      createdDate: new Date(Date.now() - 172800000).toISOString(),
      me: false,
      sender: {
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      },
    },
  ],
};

const getMessages = async (conversationId) => {
  return new Promise((resolve) => {
    setTimeout(
      () => resolve({ data: { result: mockMessages[conversationId] || [] } }),
      300
    );
  });
};

const createMessage = async ({ conversationId, message }) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newMessage = {
        id: Date.now().toString(),
        message,
        createdDate: new Date().toISOString(),
        me: true,
      };
      resolve({ data: { result: newMessage } });
    }, 500);
  });
};

export default function MessagePage() {
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messagesMap, setMessagesMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const messageContainerRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [filteredUsers, setFilteredUsers] = useState([]);
  const searchUsers = async (query) => {
    const res = await searchUsersByUserName(query);
    console.log("Search results:", res);
    setFilteredUsers(res || []);
  };
  const scrollToBottom = useCallback(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;

      setTimeout(() => {
        if (messageContainerRef.current) {
          messageContainerRef.current.scrollTop =
            messageContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, []);

  const handleSelectNewChatUser = async (user) => {
    const data = {
      type: "DIRECT",
      participantsIds: [user.userId],
    };
    console.log("Creating conversation with data:", data);

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
    console.log("New conversation response:", response);

    const newConversation = response?.data?.result;
    const existingConversation = conversations.find(
      (conv) => conv.id === newConversation.id
    );

    if (existingConversation) {
      setSelectedConversation(existingConversation);
    } else {
      setConversations((prev) => [newConversation, ...prev]);
      setSelectedConversation(newConversation);
    }
    setSearchQuery(""); // Clear search when closing
    onClose();
  };

  const handleModalClose = () => {
    setSearchQuery(""); // Clear search when closing
    onClose();
  };

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMyConversations();
      setConversations(response?.data?.result || []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
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
          const response = await getMessages(conversationId);
          if (response?.data?.result) {
            const sortedMessages = [...response.data.result].sort(
              (a, b) => new Date(a.createdDate) - new Date(b.createdDate)
            );

            setMessagesMap((prev) => ({
              ...prev,
              [conversationId]: sortedMessages,
            }));
          }
        }

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId ? { ...conv, unread: 0 } : conv
          )
        );
      } catch (err) {
        console.error(
          `Error fetching messages for conversation ${conversationId}:`,
          err
        );
      }
    };

    if (selectedConversation?.id) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, messagesMap]);

  const currentMessages = selectedConversation
    ? messagesMap[selectedConversation.id] || []
    : [];

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation, scrollToBottom]);

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation) return;

    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempId,
      message: message,
      createdDate: new Date().toISOString(),
      me: true,
      pending: true,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [selectedConversation.id]: [
        ...(prev[selectedConversation.id] || []),
        newMessage,
      ],
    }));

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              lastMessage: message,
              modifiedDate: new Date().toISOString(),
            }
          : conv
      )
    );

    const messageToSend = message;
    setMessage("");

    try {
      const response = await createMessage({
        conversationId: selectedConversation.id,
        message: messageToSend,
      });

      if (response?.data?.result) {
        setMessagesMap((prev) => {
          const updatedMessages = prev[selectedConversation.id].filter(
            (msg) => msg.id !== tempId
          );
          return {
            ...prev,
            [selectedConversation.id]: [
              ...updatedMessages,
              response.data.result,
            ].sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate)),
          };
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessagesMap((prev) => {
        const updatedMessages = prev[selectedConversation.id].map((msg) =>
          msg.id === tempId ? { ...msg, failed: true, pending: false } : msg
        );
        return {
          ...prev,
          [selectedConversation.id]: updatedMessages,
        };
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="w-full h-[calc(100vh-2rem)] max-w-7xl mx-auto">
        <CardBody p={0} className="flex h-full">
          {/* Conversations List */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <Text fontSize="xl" fontWeight="bold">
                Chats
              </Text>
              <IconButton
                colorScheme="blue"
                size="sm"
                icon={<Plus size={16} />}
                onClick={onOpen}
                borderRadius="full"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center p-6">
                  <Spinner size="md" />
                </div>
              ) : error ? (
                <div className="p-4">
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <Text fontSize="sm">{error}</Text>
                      <Button
                        size="sm"
                        leftIcon={<RefreshCw size={14} />}
                        onClick={fetchConversations}
                        mt={2}
                      >
                        Retry
                      </Button>
                    </Box>
                  </Alert>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center">
                  <Text color="gray.500">
                    No conversations yet. Start a new chat to begin.
                  </Text>
                </div>
              ) : (
                <div>
                  {conversations.map((conversation, index) => (
                    <div key={conversation.id}>
                      <div
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                          selectedConversation?.id === conversation.id
                            ? "bg-blue-50"
                            : ""
                        }`}
                        onClick={() => handleConversationSelect(conversation)}
                      >
                        <Flex align="flex-start" gap={3}>
                          <div className="relative">
                            <Avatar
                              src={conversation.conversationAvatar}
                              size="md"
                            />
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
                                fontWeight={
                                  conversation.unread > 0 ? "bold" : "normal"
                                }
                                fontSize="sm"
                                noOfLines={1}
                              >
                                {conversation.conversationName}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {new Date(
                                  conversation.modifiedDate
                                ).toLocaleDateString("vi-VN")}
                              </Text>
                            </Flex>
                            <Text fontSize="sm" color="gray.600" noOfLines={1}>
                              {conversation.lastMessage ||
                                "Start a conversation"}
                            </Text>
                          </div>
                        </Flex>
                      </div>
                      {index < conversations.length - 1 && <Divider />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                  <Avatar
                    src={selectedConversation.conversationAvatar}
                    size="md"
                  />
                  <Text fontSize="lg" fontWeight="semibold">
                    {selectedConversation.conversationName}
                  </Text>
                </div>

                <div
                  ref={messageContainerRef}
                  className="flex-1 p-4 overflow-y-auto"
                  style={{ maxHeight: "calc(100vh - 240px)" }}
                >
                  <div className="flex flex-col space-y-4">
                    {currentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.me ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!msg.me && (
                          <Avatar
                            src={msg.sender?.avatar}
                            size="sm"
                            mr={2}
                            alignSelf="flex-end"
                          />
                        )}
                        <Box
                          maxW="70%"
                          p={3}
                          borderRadius="lg"
                          bg={
                            msg.me
                              ? msg.failed
                                ? "red.50"
                                : "blue.100"
                              : "gray.100"
                          }
                          opacity={msg.pending ? 0.7 : 1}
                        >
                          <Text fontSize="sm">{msg.message}</Text>
                          <Stack
                            direction="row"
                            spacing={2}
                            align="center"
                            justify="flex-end"
                            mt={2}
                          >
                            {msg.failed && (
                              <Text fontSize="xs" color="red.500">
                                Failed to send
                              </Text>
                            )}
                            {msg.pending && (
                              <Text fontSize="xs" color="gray.500">
                                Sending...
                              </Text>
                            )}
                            <Text fontSize="xs" color="gray.500">
                              {new Date(msg.createdDate).toLocaleString()}
                            </Text>
                          </Stack>
                        </Box>
                        {msg.me && (
                          <Avatar
                            size="sm"
                            ml={2}
                            alignSelf="flex-end"
                            bg="blue.500"
                            color="white"
                          >
                            You
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 border-t border-gray-200 flex gap-2">
                  <Input
                    placeholder="Type a message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    size="md"
                    borderRadius="full"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage();
                      }
                    }}
                  />
                  <IconButton
                    colorScheme="blue"
                    icon={<Send size={16} />}
                    onClick={handleSendMessage}
                    isDisabled={!message.trim()}
                    borderRadius="full"
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Stack align="center" spacing={4}>
                  <MessageCircle size={64} className="text-gray-400" />
                  <Text fontSize="lg" color="gray.500">
                    Select a conversation to start chatting
                  </Text>
                </Stack>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* New Chat Modal with Search */}
      <Modal isOpen={isOpen} onClose={handleModalClose}>
        <ModalOverlay />
        <ModalContent>
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
              />
            </InputGroup>

            {filteredUsers.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">
                  {searchQuery ? "No users found" : "No users available"}
                </Text>
              </Box>
            ) : (
              <List spacing={3} maxH="300px" overflowY="auto">
                {filteredUsers.map((user) => (
                  <ListItem key={user.userId}>
                    <Flex
                      align="center"
                      p={3}
                      borderRadius="md"
                      cursor="pointer"
                      _hover={{ bg: "gray.50" }}
                      onClick={(e) => handleSelectNewChatUser(user)}
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
