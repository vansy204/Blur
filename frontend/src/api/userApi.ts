import axios, { AxiosRequestConfig } from "axios"
import { getToken } from "../service/LocalStorageService"

const BASE_URL = "http://localhost:8888/api/profile"

interface UserProfile {
    id: string
    userId?: string
    firstName?: string
    lastName?: string
    imageUrl?: string
    bio?: string
    followers?: string[]
    following?: string[]
    city?: string
    phone?: string
    email?: string
    gender?: string
    website?: string
    address?: string
    dob?: string
    [key: string]: unknown
}

interface UpdateProfileData {
    firstName?: string
    lastName?: string
    bio?: string
    imageUrl?: string
    [key: string]: unknown
}

interface ApiResponse<T> {
    code: number
    message?: string
    result?: T
}

const config = (token: string): AxiosRequestConfig => ({
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    },
})

// Lấy thông tin profile của chính mình
export const fetchUserInfo = async (token: string): Promise<UserProfile> => {
    try {
        const response = await axios.get<ApiResponse<UserProfile>>(`${BASE_URL}/users/myInfo`, config(token))
        if (response.data?.code !== 1000) {
            throw new Error(response.data?.message)
        }
        return response.data?.result as UserProfile
    } catch (error) {
        console.log("Error: ", error)
        throw error
    }
}

// Lấy thông tin user theo userId (dành cho nội bộ)
export const fetchUserByUserId = async (userId: string, token: string): Promise<UserProfile> => {
    try {
        const response = await axios.get<ApiResponse<UserProfile>>(`${BASE_URL}/internal/users/${userId}`, config(token))
        if (response.data?.code !== 1000) {
            throw new Error(response.data?.message)
        }
        return response.data?.result as UserProfile
    } catch (error) {
        console.log("Error: ", error)
        throw error
    }
}

// Lấy tất cả user profiles
export const fetchAllUserProfiles = async (token: string): Promise<UserProfile[]> => {
    try {
        const response = await axios.get<ApiResponse<UserProfile[]>>(`${BASE_URL}/users/`, config(token))
        if (response.data?.code !== 1000) {
            throw new Error(response.data?.message)
        }
        return response.data?.result as UserProfile[]
    } catch (error) {
        console.log("Error: ", error)
        throw error
    }
}

// Cập nhật profile người dùng
export const updateUserProfile = async (userProfileId: string, data: UpdateProfileData, token: string): Promise<UserProfile> => {
    try {
        const response = await axios.put<ApiResponse<UserProfile>>(`${BASE_URL}/users/${userProfileId}`, data, config(token))
        if (response.data?.code !== 1000) {
            throw new Error(response.data?.message)
        }
        return response.data?.result as UserProfile
    } catch (error) {
        console.log("Error: ", error)
        throw error
    }
}

// Xoá profile người dùng
export const deleteUserProfile = async (userProfileId: string, token: string): Promise<unknown> => {
    try {
        const response = await axios.delete<ApiResponse<unknown>>(`${BASE_URL}/users/${userProfileId}`, config(token))
        if (response.data?.code !== 1000) {
            throw new Error(response.data?.message)
        }
        return response.data?.result
    } catch (error) {
        console.log("Error: ", error)
        throw error
    }
}

// Follow người dùng
export const followUser = async (userId: string, token: string): Promise<unknown> => {
    try {
        const response = await axios.put<ApiResponse<unknown>>(`${BASE_URL}/users/follow/${userId}`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
        return response.data?.result
    } catch (error) {
        console.log("Error: ", error)
        throw error
    }
}

// Unfollow người dùng
export const unfollowUser = async (userId: string, token: string): Promise<unknown> => {
    try {
        const response = await axios.put<ApiResponse<unknown>>(`${BASE_URL}/users/unfollow/${userId}`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
        return response.data?.result
    } catch (error) {
        console.log("Error: ", error)
        throw error
    }
}

// Tìm kiếm user theo tên
export const searchUsersByFirstName = async (firstName: string, token: string): Promise<UserProfile[]> => {
    try {
        const response = await axios.get<ApiResponse<UserProfile[]>>(`${BASE_URL}/users/search/${firstName}`, config(token))
        return response.data?.result || []
    } catch (error) {
        console.log("Error: ", error)
        throw error
    }
}

export const searchUsersByUserName = async (userName: string): Promise<UserProfile[]> => {
    try {
        const response = await axios.post<ApiResponse<UserProfile[]>>(`${BASE_URL}/users/search`, { keyword: userName }, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
                "Content-Type": "application/json",
            },
        })
        return response.data?.result || []
    } catch (error) {
        console.log("Error: ", error)
        throw error
    }
}

// Lấy thông tin user theo profileId
export const fetchUserProfileById = async (profileId: string, token: string): Promise<UserProfile> => {
    try {
        const response = await axios.get<ApiResponse<UserProfile>>(`${BASE_URL}/users/${profileId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        )
        if (response.data?.code !== 1000) {
            throw new Error(response.data?.message)
        }
        return response.data?.result as UserProfile
    } catch (error) {
        console.log("Error: ", error)
        throw error
    }
}

export const getFollowers = async (profileId: string, token: string): Promise<UserProfile[]> => {
    try {
        const response = await axios.get<ApiResponse<UserProfile[]>>(`${BASE_URL}/users/follower/${profileId}`, config(token))
        return response.data?.result || []
    } catch (error) {
        console.error("Error fetching followers:", error)
        return []
    }
}

export const getFollowings = async (profileId: string, token: string): Promise<UserProfile[]> => {
    try {
        const response = await axios.get<ApiResponse<UserProfile[]>>(`${BASE_URL}/users/following/${profileId}`, config(token))
        return response.data?.result || []
    } catch (error) {
        console.error("Error fetching followings:", error)
        return []
    }
}
