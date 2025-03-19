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
} from "@chakra-ui/react";
import axios from "axios";
import { uploadToCloudnary } from "../../Config/UploadToCloudnary";
import { useEffect, useRef, useState } from "react";
import { getToken } from "../../service/LocalStorageService";

const CreatePostModal = ({ isOpen, onClose, onPostCreate }) => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const cancelRef = useRef();
  const toast = useToast();
  const token = getToken();

  useEffect(() => {
    setPreviewUrls(images.map((file) => URL.createObjectURL(file)));
  }, [images]);

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const resetAndClose = () => {
    setContent("");
    setImages([]);
    setPreviewUrls([]);
    onClose();
  };

  const handleCloseAttempt = () => {
    if (content || images.length > 0) {
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
        images.length > 0
          ? await Promise.all(images.map(uploadToCloudnary))
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

      // 👉 Gọi callback cập nhật UI
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

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleCloseAttempt} size="3xl" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader textAlign="center">Create New Post</ModalHeader>
          <ModalCloseButton onClick={handleCloseAttempt} />
          <ModalBody px={0} py={0}>
            <Box display="flex" flexDir={{ base: "column", md: "row" }}>
              <Box
                flex="1"
                bg="gray.50"
                display="flex"
                flexWrap="wrap"
                justifyContent="center"
                alignItems="center"
                minH="300px"
                p={2}
              >
                {previewUrls.length > 0 ? (
                  previewUrls.map((url, i) => (
                    <Image
                      key={i}
                      src={url}
                      boxSize="100px"
                      borderRadius="md"
                      objectFit="cover"
                    />
                  ))
                ) : (
                  <Box color="gray.400">No Image Selected</Box>
                )}
              </Box>
              <Box flex="1" p={4}>
                <Textarea
                  placeholder="Write a caption..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  minH="120px"
                  resize="none"
                />
                <Box mt={4}>
                  <label htmlFor="upload-photo">
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
                        id="upload-photo"
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        display="none"
                        onChange={handleImageChange}
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
              isDisabled={!content.trim() && images.length === 0}
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
            Are you sure you want to discard this post? Your content will be
            lost.
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
