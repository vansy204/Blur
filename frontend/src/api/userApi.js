import axios from "axios"

export const fetchUserInfo = async (token) =>{
    try{
        const response = await axios.get("http://localhost:8888/api/profile/users/myInfo",
            {
                headers:{
                    Authorization:  `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if(response.data?.code !== 1000){
                throw new Error(response.data?.message);
            }
            return response.data?.result;
    }catch(error){
        console.log("Error: ", error);
        throw error;
    }
}