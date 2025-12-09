import axios, { AxiosRequestConfig } from "axios"

const BASE_URL = "http://localhost:8888/api/identity/users"

interface RegistrationData {
    username: string
    password: string
    email?: string
    firstName?: string
    lastName?: string
    [key: string]: unknown
}

interface ApiResponse<T> {
    code: number
    message?: string
    result?: T
}

const config = (token?: string): AxiosRequestConfig => ({
    headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
    },
})

export const registerUser = async <T = unknown>(data: RegistrationData): Promise<T> => {
    try {
        const response = await axios.post<ApiResponse<T>>(`${BASE_URL}/registration`, data, config())
        if (response.data?.code !== 1000) {
            throw new Error(response.data?.message)
        }
        return response.data?.result as T
    } catch (error) {
        console.log("Error: ", error)
        throw error
    }
}
