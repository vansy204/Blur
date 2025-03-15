import React, { useEffect, useState } from "react";
import { LuCircleDashed } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { getUserDetails } from "../../service/JwtService";
import axios from "axios";
import { getToken } from "../../service/LocalStorageService";

const ProfileUserDetails = () => {
  const [user,setUser] = useState(null);
    useEffect(() =>{
      const fetchUser = async () =>{
        const userData = getUserDetails();
        const token = getToken();
        if(!userData) return;
        try{
          const response = await axios.get("http://localhost:8888/api/profile/users/myInfo",
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          )
          if(response.data?.code !== 1000){
            throw new Error("Invalid User");
          }
          setUser(response.data?.result);
          console.log("user: ", response.data?.result);
          
      }catch(error){
          console.log("Error:" , error);
      };
    }
    fetchUser();
  },[]);
  const navigate = useNavigate();
  return (
    <div className="py-10 w-full">
      <div className="flex items-center">
        <div className="w-[15%]">
          <img
            className="w-32 h-32 rounded-full"
            src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
            alt=""
          />
        </div>
        <div className="space-y-5">
          <div className="flex space-x-10 items-center">
            <p>{user?.firstName}</p>
            <button onClick={() => navigate("/account/edit")}>
              Edit Profile
            </button>
            <LuCircleDashed onClick={() => navigate("/account/edit")} />
          </div>
          <div className="flex space-x-10">
            <div>
              <span className="font-semibold mr-2">10</span>
              <span>posts</span>
            </div>
            <div>
              <span className="font-semibold mr-2">99</span>
              <span>follower</span>
            </div>
            <div>
              <span className="font-semibold mr-2">99</span>
              <span>following</span>
            </div>
          </div>
          <div>
            <p className="font-semibold">Name</p>
            <p className="font-thin text-sm">bio</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileUserDetails;
