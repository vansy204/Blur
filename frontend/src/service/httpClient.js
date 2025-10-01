import axios from "axios";
import { CONFIG } from "./configuration";

const httpClient = axios.create({
    baseURL: CONFIG.API_GATEWAY,
    timeout: 10000, // 10 seconds timeout
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`, // Default token, can be overridden
    }
});
export default httpClient;