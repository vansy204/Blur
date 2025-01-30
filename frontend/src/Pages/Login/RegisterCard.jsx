import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Heading,
  Image,
  Stack,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const RegisterCard = () => {
  const navigate = useNavigate();
  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const checkPassword = () => password === confirmPassword;
  const handleSubmit = () =>{
    if(!checkPassword){
      
    }
  }
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
            className="w-1/3"
            src="../blur.jpg"
            alt="blur"
            style={{
              objectFit: "cover", // Đảm bảo ảnh lấp đầy không gian
              width: "100%", // Hình ảnh sẽ chiếm 100% chiều rộng của phần tử chứa
              height: "100%", // Hình ảnh chiếm hết chiều cao của phần tử chứa
              margin: 0, // Loại bỏ khoảng trắng
              padding: 0, // Loại bỏ khoảng cách
              border: "none", // Loại bỏ viền
            }}
          />
        </div>

        <Stack style={{ flex: 1 }}>
          <CardHeader className="text-center mb-5 fw-light fs-5">
            <Heading className="">Sign In To Blur</Heading>
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
              <div className="mb-3">
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  type="text"
                  name="firstName"
                  id="firstName"
                  placeholder="First Name"
                  required
                  autoFocus
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  type="text"
                  name="lastName"
                  id="lastName"
                  placeholder="Last Name"
                  required
                  autoFocus
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="relative mb-4">
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  type="date"
                  name="dob"
                  id="dob"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
              <div className="relative">
                <input
                  name="password"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10" // Chú ý thêm `pr-10`
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <div className="relative mt-3">
                <input
                  name="confirmPassword"
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10" // Chú ý thêm `pr-10`
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <div className="font-thin mt-5 text-left">
              <p>
                You have an account?{" "}
                <button
                  className="text-blue-400"
                  onClick={(e) => navigate("/login")}
                >
                  Login now
                </button>
              </p>
            </div>
          </CardBody>

          <CardFooter className="flex flex-col items-center justify-center">
            <div className="button-login w-full max-w-sm">
              <Button
                type="submit"
                variant="solid"
                colorScheme="blue"
                className="mb-3 w-full"
                onSubmit={handleSubmit}
              >
                Register
              </Button>
              <Button
                type="submit"
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

export default RegisterCard;
