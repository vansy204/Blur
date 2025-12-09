import axios, { AxiosRequestConfig, AxiosResponse } from "axios"
import { getToken } from "../service/LocalStorageService"

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8888"
const STORY_API = `${BASE_URL}/api/stories`

interface Story {
    id: string
    mediaUrl?: string
    media?: string
    username?: string
    firstName?: string
    lastName?: string
    userId?: string
    likes?: string[]
    [key: string]: unknown
}

interface StoryData {
    mediaUrl: string
    caption?: string
    [key: string]: unknown
}

interface ApiResponse<T> {
    result?: T
    code?: number
    message?: string
}

// Helper function to get the authorization headers
const getAuthHeaders = (token: string | null = getToken()): AxiosRequestConfig => {
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    }
}

// Lấy tất cả stories từ tất cả người dùng
export const fetchAllStories = async (token: string | null = getToken()): Promise<Story[]> => {
    try {
        const res = await axios.get<ApiResponse<Story[]>>(`${STORY_API}/all`, getAuthHeaders(token))
        const data = res.data.result || []

        return data.map(story => ({
            ...story,
            id: story.id,
            media: story.mediaUrl,
            username: `${story.firstName} ${story.lastName}`,
        }))
    } catch (error) {
        console.error("Error fetching all stories:", error)
        return []
    }
}

// Lấy stories của người dùng hiện tại
export const fetchMyStories = async (): Promise<Story[]> => {
    try {
        const res = await axios.get<ApiResponse<Story[]>>(`${STORY_API}/my-stories`, getAuthHeaders())
        return res.data.result || []
    } catch (error) {
        console.error("Error fetching my stories:", error)
        return []
    }
}

// Lấy stories theo userId
export const fetchStoriesByUserId = async (userId: string): Promise<Story[]> => {
    try {
        const res = await axios.get<ApiResponse<Story[]>>(`${STORY_API}/user/${userId}`, getAuthHeaders())
        return res.data.result || []
    } catch (error) {
        console.error(`Error fetching stories for user ${userId}:`, error)
        return []
    }
}

// Lấy story chi tiết theo ID
export const fetchStoryById = async (storyId: string): Promise<Story | null> => {
    try {
        const res = await axios.get<ApiResponse<Story>>(`${STORY_API}/${storyId}`, getAuthHeaders())
        return res.data.result || null
    } catch (error) {
        console.error(`Error fetching story ${storyId}:`, error)
        return null
    }
}

// Tạo story mới
export const createStory = async (storyData: StoryData): Promise<AxiosResponse["data"] | null> => {
    try {
        const res = await axios.post(
            `${STORY_API}/create`,
            storyData,
            getAuthHeaders()
        )
        return res.data
    } catch (error) {
        console.error("Error creating story:", error)
        return null
    }
}

// Cập nhật story
export const updateStory = async (storyId: string, storyData: Partial<StoryData>): Promise<Story | null> => {
    try {
        const res = await axios.put<ApiResponse<Story>>(
            `${STORY_API}/${storyId}`,
            storyData,
            getAuthHeaders()
        )
        return res.data.result || null
    } catch (error) {
        console.error(`Error updating story ${storyId}:`, error)
        return null
    }
}

// Xóa story
export const deleteStory = async (storyId: string): Promise<unknown> => {
    try {
        const res = await axios.delete<ApiResponse<unknown>>(`${STORY_API}/${storyId}`, getAuthHeaders())
        return res.data.result
    } catch (error) {
        console.error(`Error deleting story ${storyId}:`, error)
        return null
    }
}

// Like story
export const likeStory = async (storyId: string, _token?: string): Promise<unknown> => {
    try {
        const res = await axios.put<ApiResponse<unknown>>(
            `${STORY_API}/like/${storyId}`,
            {},
            getAuthHeaders()
        )
        return res.data.result
    } catch (error) {
        console.error(`Error liking story ${storyId}:`, error)
        return null
    }
}

// Unlike story
export const unlikeStory = async (storyId: string): Promise<unknown> => {
    try {
        const res = await axios.put<ApiResponse<unknown>>(
            `${STORY_API}/unlike/${storyId}`,
            {},
            getAuthHeaders()
        )
        return res.data.result
    } catch (error) {
        console.error(`Error unliking story ${storyId}:`, error)
        return null
    }
}
