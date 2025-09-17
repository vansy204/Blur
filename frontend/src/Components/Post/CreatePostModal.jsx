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
} from "@chakra-ui/react";
import axios from "axios";
import { uploadToCloudnary } from "../../Config/UploadToCloudnary";
import { useEffect, useRef, useState } from "react";
import { getToken } from "../../service/LocalStorageService";
import { BsEmojiSmile } from "react-icons/bs";
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
        "/api/post/create",
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

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleCloseAttempt} size="3xl" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader textAlign="center">Create New Post</ModalHeader>
          <ModalCloseButton onClick={handleCloseAttempt} />
          <ModalBody px={0} py={0}>
            <Box display="flex" flexDir={{ base: "column", md: "row" }} minH="400px">
              <Box
                flex="1.5"
                bg="gray.50"
                display="flex"
                justifyContent="center"
                alignItems="center"
                minH="400px"
                p={2}
              >
                {previewUrls.length > 0 ? (
                  previewUrls.map((media, i) =>
                    media.type.startsWith("video") ? (
                      <video
                        key={i}
                        src={media.url}
                        controls
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "8px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Image
                        key={i}
                        src={media.url}
                        boxSize="100%"
                        borderRadius="md"
                        objectFit="cover"
                      />
                    )
                  )
                ) : (
                  <Box color="gray.400">No Image/Video Selected</Box>
                )}
              </Box>

              <Box flex="1" p={4} display="flex" flexDir="column" gap={4}>
                {/* Vùng nhập nội dung có icon emoji */}
                <Box position="relative">
                  <Textarea
                    placeholder="Write a caption..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    minH="120px"
                    resize="none"
                    pr="40px"
                  />
                  <Box
                    position="absolute"
                    top="10px"
                    right="10px"
                    cursor="pointer"
                    color="gray.500"
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
                    >
                      <EmojiPicker onEmojiClick={handleEmojiClick} height={350} width={300} />
                    </Box>
                  )}
                </Box>

                {/* Upload media */}
                <Box>
                  <label htmlFor="upload-media">
                    <Box
                      cursor="pointer"
                      border="2px dashed #CBD5E0"
                      borderRadius="lg"
                      p={4}
                      textAlign="center"
                      _hover={{ bg: "gray.50" }}
                    >
                      <strong>Click to select images/videos</strong>
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

          <ModalFooter justifyContent="space-between" px={6} py={4}>
            <Button onClick={handleCloseAttempt} variant="ghost" rounded="full">
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={isLoading}
              isDisabled={!content.trim() && mediaFiles.length === 0}
              rounded="full"
            >
              {isLoading ? <Spinner size="sm" /> : "Post"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsConfirmOpen(false)}
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader>Discard post?</AlertDialogHeader>
          <AlertDialogBody>
            Are you sure you want to discard this post? Your content will be lost.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleConfirmClose} ml={3}>
              Discard
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CreatePostModal;
