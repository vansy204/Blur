import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';

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
  return (
    <div>Home</div>
  )
}

export default Home