import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Snackbar,
  Typography,
} from "@mui/material";
import Header from "../header/Header";

import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
const Home = () => {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState({});
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState("");
  const [snackType, setSnackType] = useState("error");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const showPassword = () => {
    let password = document.getElementById("password");
    let ConfirmPassword = document.getElementById("ConfirmPassword");
    if (password.type === "password" && ConfirmPassword.type === "password") {
      password.type = "text";
      ConfirmPassword.type = "text";
    } else {
      password.type = "password";
      ConfirmPassword.type = "password";
    }
  };
  const handleCloseSnackBar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setSnackBarOpen(false);
  };

  const showError = (message) => {
    setSnackType("error");
    setSnackBarMessage(message);
    setSnackBarOpen(true);
  };

  const showSuccess = (message) => {
    setSnackType("success");
    setSnackBarMessage(message);
    setSnackBarOpen(true);
  };
  // const getUserDetails = async (accessToken) => {
  //   const response = await fetch(
  //     `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`
  //   );
  //   const data = await response.json();

  //   setUserDetails(data);
  // };
  const addPassword = (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      showError("Password and Confirm Password do not match");
      return;
    }
    const body = {
      password: password,
    };

    fetch("http://localhost:8080/identity/users/create-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(body),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (data.code !== 1000) throw new Error(data.message);

        getUserDetails(localStorage.getItem("token"));
        showSuccess(data.message);
        
      })
      .catch((error) => {
        showError(error.message);
      });
  };
  const getUserDetails = async (accessToken) => {
    const response = await fetch(
      "http://localhost:8080/identity/users/myinfo",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await response.json();
    console.log("data: ", data);
    setUserDetails(data.result);
  };
  
  useEffect(() => {
    const accessToken = localStorage.getItem("token");

    if (!accessToken) {
      navigate("/login");
    } else {
        getUserDetails(accessToken); 
    }
  }, [navigate]);
  return (
    <div>
      <Header />
      <Snackbar
        open={snackBarOpen}
        onClose={handleCloseSnackBar}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackBar}
          severity={snackType}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackBarMessage}
        </Alert>
      </Snackbar>
      {userDetails ? (
        userDetails.noPassword ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100vh"
            bgcolor={"#f0f2f5"}
          >
            <Card
              sx={{
                minWidth: 400,
                maxWidth: 500,
                boxShadow: 4,
                borderRadius: 4,
                padding: 4,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "100%", // Ensure content takes full width
                }}
              >
                <p>Welcome back to BLUR,{userDetails.username}</p>
                <h1 className="name">First Name: {userDetails.firstName}</h1>
                <p className="email">Last Name: {userDetails.lastName}</p>{" "}
                <ul>
                  User's roles:
                  {userDetails.roles?.map((item, index) => (
                    <li className="email" key={index}>
                      {item.name}
                    </li>
                  ))}
                </ul>
              </Box>
            </Card>
          </Box>
        ) : (
          <div>
            <div className="container vertical-align ">
              <div className="row">
                <div className="col-lg-10 col-xl-9 mx-auto">
                  <div className="card flex-row my-5 border-0 shadow rounded-3 overflow-hidden">
                    <div className="card-img-left d-none d-md-flex translate-y-1">
                      <img
                        className="background_blur"
                        src="../sea.jpg"
                        alt="blur.jpg"
                      />
                    </div>
                    <div className="card-body p-4 p-sm-5">
                      <h5 className="card-title text-center mb-5 fw-light fs-5">
                        Create your password
                      </h5>
                      <form>
                        <div className="form-floating mb-3">
                          <input
                            type="password"
                            className="form-control"
                            id="password"
                            placeholder="password"
                            required
                            autofocus
                            onChange={(e) => {
                              
                              setPassword(e.target.value);
                            }}
                          />
                          <VisibilityOffIcon
                            className="position-absolute"
                            style={{
                              right: "10px",
                              top: "50%",
                              transform: "translateY(-50%)",
                            }}
                            onClick={showPassword}
                          
                          />

                          <label htmlFor="password">Password</label>
                        </div>

                        <div className="form-floating mb-3">
                          <input
                            type="password"
                            className="form-control"
                            id="ConfirmPassword"
                            placeholder="ConfirmPassword"
                            onChange={(e) => {
                              
                              setConfirmPassword(e.target.value);
                            }}
                          />
                          <VisibilityOffIcon
                            className="position-absolute"
                            style={{
                              right: "10px",
                              top: "50%",
                              transform: "translateY(-50%)",
                            }}
                            
                            onClick={showPassword}
                          />
                          <label htmlFor="floatingPassword">
                            Confirm Password
                          </label>
                        </div>

                        <div className="d-grid mb-2">
                          <button
                            className="btn btn-lg btn-primary btn-login fw-bold text-uppercase"
                            type="submit"
                            onClick={addPassword}
                          >
                            Confirm
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "30px",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress></CircularProgress>
          <Typography>Loading ...</Typography>
        </Box>
      )}
    </div>
  );
};

export default Home;
