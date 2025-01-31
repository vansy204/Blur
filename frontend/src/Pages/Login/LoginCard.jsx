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
} from "@chakra-ui/react";
import React, {  useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { OAuthConfig } from "../../Config/configuration";
import { setToken } from "../../service/LocalStorageService";

const LoginCard = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
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
 
  const handleSubmit = (even) => {
    even.preventDefault();
    // goi ve api login cua api-gateway
    fetch("http://localhost:8888/api/identity/auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (data.code !== 1000) {
          throw new Error("Invalid Username Or Password!!");
        }
        setToken(data.result?.token);
        showToast("Login success!!", "","success")
        navigate("/");
      })
      .catch((error) => {
        showToast("Login Error",error.message,"error")
      });
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

  return (
    <div className="flex-row">
      <Card
        direction={{ base: "column", sm: "row" }}
        overflow="hidden"
        variant="outline"
        style={{ border: "none" }} // Loại bỏ viền của Card nếu cần
      >
        <div className="d-none d-md-flex" style={{ flex: 1, padding: 0 }}>
          <Image
            className=""
            src="../blur.jpg"
            alt="blur"
            style={{
              objectFit: "cover", // Đảm bảo ảnh lấp đầy không gian
              width: "100%",
              height: "100%",
              margin: 0, // Loại bỏ khoảng trắng
              padding: 0, // Loại bỏ khoảng cách
              border: "none", // Loại bỏ viền
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
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <input
                  name="password"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="font-thin mt-5 text-left">
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
