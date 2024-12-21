import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { Box, Card, CircularProgress, Typography } from "@mui/material";
import Header from '../header/Header';

const Home = () => {

    const navigate = useNavigate();
    const [userDetails,setUserDetails] = useState({});
    const getUserDetails = async (accessToken) =>{
        const response = await fetch(
            "http://localhost:8080/identity/users/myinfo",{
            method:"GET",
            headers:{
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const data = await response.json();
        console.log("data: ", data);
        setUserDetails(data.result);
    };
    useEffect(() =>{
      const accessToken = localStorage.getItem("token");
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
              minWidth: 350,
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
                alignItems: "flex-start",
                width: "100%",
                gap: "10px",
              }}
            >
              <Typography
                sx={{
                  fontSize: 18,
                  mb: "40px",
                }}
              >
                Welcome back to Blur, {userDetails.username} !
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  width: "100%", // Ensure content takes full width
                }}
              >
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  User Id
                </Typography>
                <Typography
                  sx={{
                    fontSize: 14,
                  }}
                >
                  {userDetails.id}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  width: "100%", // Ensure content takes full width
                }}
              >
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  First Name
                </Typography>
                <Typography
                  sx={{
                    fontSize: 14,
                  }}
                >
                  {userDetails.firstName}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  width: "100%", // Ensure content takes full width
                }}
              >
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Last Name
                </Typography>
                <Typography
                  sx={{
                    fontSize: 14,
                  }}
                >
                  {userDetails.lastName}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  width: "100%", // Ensure content takes full width
                }}
              >
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Date of birth
                </Typography>
                <Typography
                  sx={{
                    fontSize: 14,
                  }}
                >
                  {userDetails.dob}
                </Typography>
              </Box>
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