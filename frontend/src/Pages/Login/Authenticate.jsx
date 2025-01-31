import { useToast } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../service/LocalStorageService";
import { setToken } from "../../service/LocalStorageService";
export default function Authenticate() {
  const [userDetails, setUserDetails] = useState({});
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const toast = useToast();
  const showToast = (title, description, status = "info") => {
    toast({
      title,
      description,
      status,
      duration: 5000,
      isClosable: true,
    });
  };

  useEffect(() => {
    console.log("windows href: ", window.location.href);
    const authCodeRegex = /code=([^&]+)/;
    const isMatch = window.location.href.match(authCodeRegex);
    if (isMatch) {
      const authCode = isMatch[1];
      fetch(
        `http://localhost:8888/api/identity/auth/outbound/authentication?code=${authCode}`,
        {
          method: "POST",
        }
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          console.log("data: ", data);
          setToken(data.result?.token);
        });
    }
  }, []);
  const getUserDetails = async (accessToken) => {
    try {
      const response = await fetch(
        "http://localhost:8888/api/identity/users/",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const data = await response.json();
      setUserDetails(data.result);
      setIsLoggedIn(true);
    } catch (error) {
      showToast("Error fetching user details", error.message, "error");
    }
  };
  useEffect(() => {
    const accessToken = localStorage.getItem("token");

    if (accessToken) {
      // Lấy thông tin người dùng
      getUserDetails(accessToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Lắng nghe sự thay đổi của userDetails
  useEffect(() => {
    console.log("User details: ", userDetails); // Debug giá trị userDetails
    if (userDetails.noPassword === true && !isLoggedIn) {
      navigate("/create-password");
    } else if (userDetails.noPassword === false && isLoggedIn) {
      navigate("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDetails, navigate]); // Thêm userDetails vào mảng phụ thuộc

  return <>{!isLoggedIn && <div>Login</div>}</>;
}
