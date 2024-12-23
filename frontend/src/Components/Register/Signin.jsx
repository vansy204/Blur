/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/anchor-has-content */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css";
import { OAuthConfig } from "../../configurations/configuration";
import { Alert, Snackbar } from "@mui/material";

const Signin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState("");
  const [snackType, setSnackType] = useState("error");

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
  const handleSubmit = (event) => {
    event.preventDefault();
    // khi an login thi goi ve api cua backend
    fetch("http://localhost:8080/identity/auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // set content type thanh json
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
        console.log("Response body: ", data);
        if (data.code !== 1000) {
          throw new Error("error:", data.message);
        }
        localStorage.setItem("token", data.result?.token);
        navigate("/");
      })
      .catch((error) => {
        showError("Incorect username or password");
  });
};
  const handleClick = () => {
    const callbackUrl = OAuthConfig.redirectUri;
    const authUrl = OAuthConfig.authUri;
    const googleClientId = OAuthConfig.clientId;

    const targetUrl = `${authUrl}?redirect_uri=${encodeURIComponent(
      callbackUrl
    )}&response_type=code&client_id=${googleClientId}&scope=openid%20email%20profile`;

    console.log(targetUrl);

    window.location.href = targetUrl;
  };
  useEffect(() => {
    const accessToken = localStorage.getItem("token");
    console.log(accessToken);

    if (accessToken) {
      navigate("/");
    }
  }, [navigate]);
  return (
    <>
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
                Sign In to experience Blur
              </h5>
              <form>
                <div className="form-floating mb-3">
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    placeholder="myusername"
                    required
                    autofocus
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <label htmlFor="username">Username</label>
                </div>

                <div className="form-floating mb-3">
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <label htmlFor="floatingPassword">Password</label>
                </div>

                <div className="d-grid mb-2">
                  <button
                    className="btn btn-lg btn-primary btn-login fw-bold text-uppercase"
                    type="submit"
                    onClick={handleSubmit}
                  >
                    Login
                  </button>
                </div>
                <a className="d-block text-center mt-2 small" href="/signup">
                  {" "}
                  Don't have an account? Sign Up
                </a>
                <hr className="my-4" />
                <div className="d-grid mb-2">
                  <button
                    className="btn btn-lg btn-google btn-login fw-bold text-uppercase"
                    type="submit"
                    onClick={handleClick}
                  >
                    <i className="fab fa-google me-2" /> Sign up with Google
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Signin;
