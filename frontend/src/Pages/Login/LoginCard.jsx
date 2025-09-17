import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Heading,
  Image,
  Stack,
  useToast,
  Checkbox,
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import { FaGoogle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { OAuthConfig } from "../../Config/configuration";
import { setToken } from "../../service/LocalStorageService";
import axios from "axios";

const LoginCard = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  // Load saved credentials khi component mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem("rememberedCredentials");
    if (savedCredentials) {
      const { username: savedUsername, password: savedPassword } = JSON.parse(savedCredentials);
      setUsername(savedUsername);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const showToast = (title, description, status) => {
    toast({
      title,
      description,
      status,
      duration: 5000,
      position: "top-right",
      isClosable: true,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const user = {
      username: username,
      password: password,
    };
    try { 
      const response = await axios.post("/api/identity/auth/token", user);

      if(response.data.code !== 1000){
        throw new Error("Invalid username or password");
      }

      // Xử lý ghi nhớ đăng nhập
      if (rememberMe) {
        // Lưu thông tin đăng nhập vào localStorage
        localStorage.setItem("rememberedCredentials", JSON.stringify({
          username: username,
          password: password
        }));
      } else {
        // Xóa thông tin đăng nhập đã lưu nếu không tick remember me
        localStorage.removeItem("rememberedCredentials");
      }

      setToken(response.data.result?.token);
      showToast("Login success", "", "success");
      navigate("/");
    } catch (error) {
      showToast("Login Error", error.message, "error");
    }
  };

  const handleClick = () => {
    const callBackUrl = OAuthConfig.redirectUri;
    const authUrl = OAuthConfig.authUri;
    const googleClientId = OAuthConfig.clientId;

    const targetUrl = `${authUrl}?redirect_uri=${encodeURIComponent(
      callBackUrl
    )}&response_type=code&client_id=${googleClientId}&scope=openid%20email%20profile`;
    console.log(targetUrl);

    window.location.href = targetUrl;
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
    // Nếu uncheck remember me, xóa thông tin đã lưu
    if (!e.target.checked) {
      localStorage.removeItem("rememberedCredentials");
    }
  };

  return (
    <div className="flex-row">
      <Card
        direction={{ base: "column", sm: "row" }}
        overflow="hidden"
        variant="outline"
        style={{ border: "none" }}
      >
        <div className="d-none d-md-flex" style={{ flex: 1, padding: 0 }}>
          <Image
            className=""
            src="../blur.jpg"
            alt="blur"
            style={{
              objectFit: "cover",
              width: "100%",
              height: "100%",
              margin: 0,
              padding: 0,
              border: "none",
            }}
          />
        </div>

        <Stack style={{ flex: 1 }}>
          <CardHeader className="text-center mb-5 fw-light fs-5">
            <Heading className="">Login To Experience Blur</Heading>
          </CardHeader>
          <CardBody className="flex flex-col items-center justify-center">
            <div className="w-full max-w-sm">
              <div className="mb-3">
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  type="text"
                  name="username"
                  id="username"
                  placeholder="Username"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <input
                  name="password"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              {/* Checkbox Remember Me */}
              <div className="mb-3 flex items-center">
                <Checkbox
                  id="rememberMe"
                  isChecked={rememberMe}
                  onChange={handleRememberMeChange}
                  colorScheme="blue"
                  size="sm"
                >
                  <span className="text-sm text-gray-600">Remember me</span>
                </Checkbox>
              </div>
            </div>
            
            <div className="font-thin mt-3 text-left">
              <p>
                You don't have an account?{" "}
                <button
                  className="text-blue-400"
                  onClick={(e) => navigate("/register")}
                >
                  Register now
                </button>
              </p>
            </div>
          </CardBody>

          <CardFooter className="flex flex-col items-center justify-center">
            <div className="button-login w-full max-w-sm">
              <Button
                type="submit"
                onClick={handleSubmit}
                variant="solid"
                colorScheme="blue"
                className="mb-3 w-full"
              >
                Login
              </Button>
              <Button
                type="submit"
                onClick={handleClick}
                variant="solid"
                colorScheme="red"
                className="mb-3 w-full flex items-center justify-center gap-2"
              >
                <FaGoogle className="text-lg" />
                <span className="font-medium">Login With Google</span>
              </Button>
            </div>
          </CardFooter>
        </Stack>
      </Card>
    </div>
  );
};

export default LoginCard;