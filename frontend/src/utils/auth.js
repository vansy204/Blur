export const getToken = () => localStorage.getItem("token");

export const getUserId = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.sub || decoded.userId || decoded.user_id || decoded.id;
  } catch (error) {
    console.error("Cannot decode token:", error);
    return null;
  }
};

