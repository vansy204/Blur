const BASE_URL  = "http://localhost:8888/identity/users";

const config = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

export const registerUser = async (data) => {
    try{
        const response = await axios.post(`${BASE_URL}/registration`, data, config());
        if (response.data?.code !== 1000) {
            throw new Error(response.data?.message);
        }
        return response.data?.result;
    }catch (error) {
        console.log("Error: ", error);
        throw error;
    }
}