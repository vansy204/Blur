import { jwtDecode } from "jwt-decode";
import { getToken } from "./LocalStorageService";

export const getUserDetails =async () =>{
    const token = getToken();
    if(token !== null){
      try{
        const decode = jwtDecode(token);    
        return decode;
      }catch(error){
        console.log("Invalid token", error);
        return null;
      }
    }
  }