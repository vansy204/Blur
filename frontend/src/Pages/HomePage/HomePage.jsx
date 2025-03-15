

import StoryCircle from '../../Components/Story/StoryCircle'
import HomeRight from '../../Components/HomeRight/HomeRight'
import React, { useEffect, useState } from 'react'
import PostCard from '../../Components/Post/PostCard'
import { getUserDetails } from '../../service/JwtService'
import axios from 'axios'


const HomePage = () => {  
  const [user,setUser] = useState(null);
  useEffect(() =>{
    const fetchUser = async () =>{
      const userData = getUserDetails();
      if(!userData) return;
      try{
        const response = await axios.get("localhost:8888/api/profile/users/myInfo")
        if(response.data?.code !== 1000){
          throw new Error("Invalid User");
        }
        setUser(response.data.result);
    }catch(error){
        console.log("Error:" , error);
    };
    fetchUser()
  }},[]);

  return (
    <div>
    <div className="mt-10 flex w-[100%] justify-center">
      <div className="w-[44%] px-10 ">
        <div className="storyDiv flex space-x-2  p-4 rounded-md justify-start w-full">
          {[1, 1, 1].map((item,index) => (
            <StoryCircle key={index} userName={user?.userName}/>
          ))}
        </div>
        <div className="space-y-10 w-full mt-10">
          {
            [1,1,1,1].map((item,index) =>(
              <PostCard post ={item} userName={user?.userName}/>
            ))
          }
        </div>
      </div>
         <div className="w-[20%]">
        <HomeRight />
      </div>
    </div>
  </div>
  )
}

export default HomePage