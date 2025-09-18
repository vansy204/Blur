import axios from "axios";

const BASE_URL = "";
const NOTIFICATION_API = `${BASE_URL}/api/notification`;
const config = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
export const getAllNotifications = async (token,userId) => {
    try{
        const res = await axios.get(`${NOTIFICATION_API}/${userId}`, config(token))
        return res.data.result || [];
    }  catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
}
export const markNotificationAsRead = async (token, notificationId) => {
    try {
        const res = await axios.put(`${NOTIFICATION_API}/markAsRead/${notificationId}`, {}, config(token));
        return res.data;
    } catch (error) {
        console.error("Error marking notification as read:", error);
        throw error;
    }
}
export const markAllNotificationsAsRead = async (token) => {
    try {
        const res = await axios.put(`${NOTIFICATION_API}/markAllAsRead`, {}, config(token));
        return res.data;
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        throw error;
    }
}