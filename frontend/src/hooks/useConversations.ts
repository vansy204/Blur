// hooks/useConversations.ts
import { useState, useEffect, useCallback } from 'react'
import { getMyConversations } from '../api/messageApi'
import { getToken } from '../service/LocalStorageService'
import { AxiosError } from 'axios'

interface Conversation {
    id: string
    type?: string
    participants?: unknown[]
    lastMessage?: unknown
    [key: string]: unknown
}

interface UseConversationsReturn {
    conversations: Conversation[]
    loading: boolean
    error: string | null
    refreshConversations: () => Promise<void>
}

interface ApiResponse {
    data?: {
        result?: Conversation[]
    }
}

export const useConversations = (): UseConversationsReturn => {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const token = getToken()

    const loadConversations = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            console.log("Token in useConversations:", token)

            if (!token) {
                setError("Authentication required. Please login again.")
                return
            }

            console.log("Loading conversations with token:", token ? "Token exists" : "No token")

            const res = await getMyConversations(token) as ApiResponse
            console.log("Conversations response:", res)

            setConversations(res?.data?.result || [])
        } catch (err) {
            console.error("Error loading conversations:", err)
            const axiosError = err as AxiosError<{ message?: string }>

            if (axiosError.response?.status === 403) {
                setError("Access forbidden. Please check your permissions or login again.")
            } else if (axiosError.response?.status === 401) {
                setError("Authentication failed. Please login again.")
            } else if (axiosError.response?.status === 500) {
                setError("Server error. Please try again later.")
            } else if (!axiosError.response) {
                setError("Network error. Please check your connection.")
            } else {
                setError(`Failed to load conversations: ${axiosError.response?.data?.message || axiosError.message}`)
            }
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        loadConversations()
    }, [loadConversations])

    return {
        conversations,
        loading,
        error,
        refreshConversations: loadConversations
    }
}
