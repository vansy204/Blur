import axios, { AxiosRequestConfig, AxiosResponse } from "axios"

const BASE_URL = "http://localhost:8888"
const NOTIFICATION_API = `${BASE_URL}/api/notification`

interface Notification {
    id: string
    type?: string
    content?: string
    seen?: boolean
    [key: string]: unknown
}

interface ApiResponse<T> {
    result?: T
    code?: number
    message?: string
}

const config = (token: string): AxiosRequestConfig => ({
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    },
})

export const getAllNotifications = async (token: string, userId: string): Promise<Notification[]> => {
    try {
        const res = await axios.get<ApiResponse<Notification[]>>(`${NOTIFICATION_API}/${userId}`, config(token))
        return res.data.result || []
    } catch (error) {
        console.error("Error fetching notifications:", error)
        return []
    }
}

export const markNotificationAsRead = async (token: string, notificationId: string): Promise<AxiosResponse["data"]> => {
    try {
        const res = await axios.put(`${NOTIFICATION_API}/markAsRead/${notificationId}`, {}, config(token))
        return res.data
    } catch (error) {
        console.error("Error marking notification as read:", error)
        throw error
    }
}

export const markAllNotificationsAsRead = async (token: string): Promise<AxiosResponse["data"]> => {
    try {
        const res = await axios.put(`${NOTIFICATION_API}/markAllAsRead`, {}, config(token))
        return res.data
    } catch (error) {
        console.error("Error marking all notifications as read:", error)
        throw error
    }
}
