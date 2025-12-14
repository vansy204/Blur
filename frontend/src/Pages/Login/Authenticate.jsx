import { useToast } from "@chakra-ui/react";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../../service/LocalStorageService";

export default function Authenticate() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  const showToast = useCallback((title, description, status = "info") => {
    toast({
      title,
      description,
      status,
      duration: 5000,
      isClosable: true,
    });
  }, [toast]);

  useEffect(() => {
    const authenticateWithGoogle = async () => {
      console.log("Current URL: ", window.location.href);
      
      const urlParams = new URLSearchParams(window.location.search);
      const authCode = urlParams.get("code");
      
      console.log("Auth code found: ", authCode ? "Yes" : "No");
      
      if (!authCode) {
        console.log("No auth code in URL, redirecting to login");
        navigate("/login");
        return;
      }

      try {
        console.log("Sending request to backend...");
        const response = await fetch(
          `http://localhost:8888/api/identity/auth/outbound/authentication?code=${encodeURIComponent(authCode)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Response status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Response data:", data);

        if (data.code === 1000 && data.result?.token) {
          setToken(data.result.token);
          showToast("Welcome!", "Login with Google successful", "success");
          navigate("/");
        } else {
          throw new Error(data.message || "Login failed");
        }
      } catch (error) {
        console.error("Google login error:", error);
        showToast("Login Failed", error.message || "Could not complete Google login", "error");
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    authenticateWithGoogle();
  }, [navigate, showToast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      {isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Đang xử lý đăng nhập Google...</p>
        </div>
      ) : (
        <div>Redirecting...</div>
      )}
    </div>
  );
}
