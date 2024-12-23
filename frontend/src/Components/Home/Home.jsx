import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { Box, Card, CircularProgress, Typography } from "@mui/material";
import Header from '../header/Header';

const Home = () => {

    const navigate = useNavigate();
    const [userDetails,setUserDetails] = useState({});
    const getUserDetails = async (accessToken) => {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`
      );
      const data = await response.json();
      
      setUserDetails(data);
    };
  
    // const getUserDetails = async (accessToken) =>{
    //     const response = await fetch(
    //         "http://localhost:8080/identity/users/myinfo",{
    //         method:"GET",
    //         headers:{
    //             Authorization: `Bearer ${accessToken}`,
    //         },
    //     });
    //     const data = await response.json();
    //     console.log("data: ", data);
    //     setUserDetails(data.result);
    // };
    useEffect(() =>{
      const accessToken = localStorage.getItem("token");
      console.log(accessToken);
      
      if(!accessToken){
        navigate("/login")
      }else{
        getUserDetails(accessToken);
      }
    },[navigate])
  return (
    
    <div>
      <Header/>
      {userDetails ? (
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
              <img
                src={userDetails.picture}
                alt={`${userDetails.given_name}'s profile`}
                className="profile-pic"
              />
              <p>Welcome back to BLUR,</p>
              <h1 className="name">{userDetails.name}</h1>
              <p className="email">{userDetails.email}</p>{" "}
            </Box>
          </Card>
        </Box>
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
  )
}

export default Home