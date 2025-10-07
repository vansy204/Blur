import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Textarea,
  useToast,
  useOutsideClick,
  Text,
} from "@chakra-ui/react";
import axios from "axios";
import { uploadToCloudnary } from "../../Config/UploadToCloudnary";
import { useEffect, useRef, useState } from "react";
import { getToken } from "../../service/LocalStorageService";
import { BsEmojiSmile, BsImage, BsCameraVideo } from "react-icons/bs";
import { MdClose } from "react-icons/md";
import EmojiPicker from "emoji-picker-react";

const CreatePostModal = ({ isOpen, onClose, onPostCreate = () => {} }) => {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const cancelRef = useRef();
  const emojiRef = useRef();
  const toast = useToast();
  const token = getToken();

  useOutsideClick({
    ref: emojiRef,
    handler: () => setShowEmojiPicker(false),
  });

  useEffect(() => {
    const newPreviewUrls = mediaFiles.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type,
    }));
    setPreviewUrls(newPreviewUrls);
  }, [mediaFiles]);

  const handleMediaChange = (e) => {
    setMediaFiles(Array.from(e.target.files));
  };

  const resetAndClose = () => {
    setContent("");
    setMediaFiles([]);
    setPreviewUrls([]);
    onClose();
  };

  const handleCloseAttempt = () => {
    if (content || mediaFiles.length > 0) {
      setIsConfirmOpen(true);
    } else {
      resetAndClose();
    }
  };

  const handleConfirmClose = () => {
    setIsConfirmOpen(false);
    resetAndClose();
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const mediaUrls =
        mediaFiles.length > 0
          ? await Promise.all(mediaFiles.map(uploadToCloudnary))
          : [];

      const newPost = { content, mediaUrls };
      const response = await axios.post(
        "http://localhost:8888/api/post/create",
        newPost,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        title: "Post created successfully.",
        status: "success",
        duration: 3000,
        position: "top-right",
        isClosable: true,
      });

      onPostCreate(response.data);
      resetAndClose();
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Failed to create post.",
        description: error?.response?.data?.message || error.message,
        status: "error",
        duration: 3000,
        position: "top-right",
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setContent((prev) => prev + emojiData.emoji);
  };

  const removeMedia = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleCloseAttempt} size="4xl" isCentered>
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.400" />
        <ModalContent borderRadius="2xl" overflow="hidden" shadow="2xl">
          {/* Header with gradient */}
          <ModalHeader 
            textAlign="center" 
            py={4}
            bgGradient="linear(to-r, sky.50, blue.50)"
            borderBottom="1px"
            borderColor="gray.100"
          >
            <Text fontSize="lg" fontWeight="bold" bgGradient="linear(to-r, sky.600, blue.600)" bgClip="text">
              Create New Post
            </Text>
          </ModalHeader>
          
          <ModalCloseButton 
            onClick={handleCloseAttempt}
            top={3}
            right={3}
            rounded="full"
            _hover={{ bg: "gray.100" }}
          />

          <ModalBody px={0} py={0}>
            <Box display="flex" flexDir={{ base: "column", md: "row" }} minH="500px" maxH="600px">
              {/* Left side - Media Preview */}
              <Box
                flex="1.5"
                bgGradient="linear(to-br, sky.50, blue.50, sky.100)"
                display="flex"
                justifyContent="center"
                alignItems="center"
                minH={{ base: "300px", md: "500px" }}
                maxH="600px"
                p={4}
                position="relative"
                overflow="hidden"
              >
                {previewUrls.length > 0 ? (
                  <Box position="relative" w="100%" h="100%" display="flex" alignItems="center" justifyContent="center">
                    {previewUrls.map((media, i) =>
                      media.type.startsWith("video") ? (
                        <Box key={i} position="relative" maxW="100%" maxH="100%" display="flex" alignItems="center" justifyContent="center">
                          <video
                            src={media.url}
                            controls
                            style={{
                              maxWidth: "100%",
                              maxHeight: "550px",
                              borderRadius: "12px",
                              objectFit: "contain",
                              boxShadow: "0 4px 20px rgba(14, 165, 233, 0.15)",
                            }}
                          />
                          <Button
                            position="absolute"
                            top={2}
                            right={2}
                            size="sm"
                            rounded="full"
                            colorScheme="red"
                            onClick={() => removeMedia(i)}
                            zIndex={2}
                            shadow="lg"
                            _hover={{ transform: "scale(1.05)" }}
                          >
                            <MdClose size={16} />
                          </Button>
                        </Box>
                      ) : (
                        <Box key={i} position="relative" maxW="100%" maxH="100%" display="flex" alignItems="center" justifyContent="center">
                          <Image
                            src={media.url}
                            maxW="100%"
                            maxH="550px"
                            borderRadius="xl"
                            objectFit="contain"
                            shadow="lg"
                          />
                          <Button
                            position="absolute"
                            top={2}
                            right={2}
                            size="sm"
                            rounded="full"
                            colorScheme="red"
                            onClick={() => removeMedia(i)}
                            zIndex={2}
                            shadow="lg"
                            _hover={{ transform: "scale(1.05)" }}
                          >
                            <MdClose size={16} />
                          </Button>
                        </Box>
                      )
                    )}
                  </Box>
                ) : (
                  <Box textAlign="center" color="gray.400">
                    <Box 
                      w="24" 
                      h="24" 
                      mx="auto" 
                      mb={4} 
                      rounded="full" 
                      bgGradient="linear(to-br, sky.400, blue.500)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      opacity={0.6}
                    >
                      <BsImage size={48} color="white" />
                    </Box>
                    <Text fontSize="sm" fontWeight="medium">No media selected</Text>
                    <Text fontSize="xs" mt={1}>Upload photos or videos to get started</Text>
                  </Box>
                )}
              </Box>

              {/* Right side - Form */}
              <Box 
                flex="1" 
                p={6} 
                display="flex" 
                flexDir="column" 
                gap={4} 
                bg="white"
                overflowY="auto"
                maxH="600px"
              >
                {/* Caption textarea with emoji */}
                <Box position="relative" flexShrink={0}>
                  <Textarea
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    minH="100px"
                    maxH="120px"
                    resize="none"
                    pr="40px"
                    borderColor="gray.200"
                    _hover={{ borderColor: "sky.300" }}
                    _focus={{ 
                      borderColor: "sky.400", 
                      boxShadow: "0 0 0 1px var(--chakra-colors-sky-400)",
                      outline: "none"
                    }}
                    borderRadius="xl"
                    fontSize="sm"
                  />
                  <Box
                    position="absolute"
                    top="10px"
                    right="10px"
                    cursor="pointer"
                    color="gray.400"
                    _hover={{ color: "sky.500" }}
                    transition="color 0.2s"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <BsEmojiSmile size={20} />
                  </Box>
                  {showEmojiPicker && (
                    <Box
                      ref={emojiRef}
                      position="absolute"
                      zIndex="10"
                      top="100%"
                      right="0"
                      mt={2}
                      boxShadow="xl"
                      borderRadius="xl"
                      overflow="hidden"
                    >
                      <EmojiPicker onEmojiClick={handleEmojiClick} height={300} width={280} />
                    </Box>
                  )}
                </Box>

                {/* Upload media button */}
                <Box flexShrink={0}>
                  <label htmlFor="upload-media">
                    <Box
                      cursor="pointer"
                      border="2px dashed"
                      borderColor="sky.200"
                      borderRadius="xl"
                      p={4}
                      textAlign="center"
                      transition="all 0.3s"
                      _hover={{ 
                        bg: "sky.50", 
                        borderColor: "sky.400",
                        transform: "translateY(-2px)"
                      }}
                    >
                      <Box
                        w="12"
                        h="12"
                        mx="auto"
                        mb={2}
                        rounded="full"
                        bgGradient="linear(to-br, sky.400, blue.500)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <BsCameraVideo size={24} color="white" />
                      </Box>
                      <Text fontWeight="semibold" color="gray.700" fontSize="sm">
                        {mediaFiles.length > 0 ? `${mediaFiles.length} file(s) selected` : "Select photos or videos"}
                      </Text>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Click to browse
                      </Text>
                      <Input
                        id="upload-media"
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        display="none"
                        onChange={handleMediaChange}
                      />
                    </Box>
                  </label>
                </Box>

    
              </Box>
            </Box>
          </ModalBody>

          <ModalFooter 
            justifyContent="space-between" 
            px={6} 
            py={4}
            borderTop="1px"
            borderColor="gray.100"
            bg="gray.50"
          >
            <Button 
              onClick={handleCloseAttempt} 
              variant="ghost" 
              rounded="full"
              fontWeight="semibold"
              color="gray.600"
              _hover={{ bg: "gray.200", color: "gray.800" }}
            >
              Cancel
            </Button>
            <Button
              bg="white"
              color="sky.600"
              onClick={handleSubmit}
              isLoading={isLoading}
              isDisabled={!content.trim() && mediaFiles.length === 0}
              rounded="full"
              px={8}
              fontWeight="bold"
              fontSize="md"
              border="2px solid"
              borderColor="sky.500"
              _hover={{
                bg: "sky.50",
                color: "sky.700",
                borderColor: "sky.600",
                transform: "translateY(-2px)",
                shadow: "lg"
              }}
              _active={{
                transform: "scale(0.98)"
              }}
              _disabled={{
                bg: "gray.100",
                color: "gray.400",
                borderColor: "gray.300",
                cursor: "not-allowed",
                opacity: 0.6
              }}
              transition="all 0.2s"
            >
              {isLoading ? <Spinner size="sm" color="sky.500" /> : "Post"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirmation Dialog */}
      <AlertDialog
        isOpen={isConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsConfirmOpen(false)}
        isCentered
      >
        <AlertDialogOverlay backdropFilter="blur(4px)" />
        <AlertDialogContent borderRadius="2xl" shadow="2xl">
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Discard post?
          </AlertDialogHeader>
          <AlertDialogBody color="gray.600">
            Are you sure you want to discard this post? Your content will be lost.
          </AlertDialogBody>
          <AlertDialogFooter gap={3}>
            <Button 
              ref={cancelRef} 
              onClick={() => setIsConfirmOpen(false)}
              rounded="full"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button 
              colorScheme="red" 
              onClick={handleConfirmClose}
              rounded="full"
              px={6}
            >
              Discard
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CreatePostModal;