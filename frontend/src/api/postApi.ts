import axios from "axios"

const API_BASE_URL = "http://localhost:8888/api"

interface PostData {
    caption?: string
    mediaUrls?: string[]
    [key: string]: unknown
}

interface Post {
    id: string
    caption?: string
    mediaUrls?: string[]
    userId?: string
    likes?: string[]
    likeCount?: number
    commentCount?: number
    [key: string]: unknown
}

interface Comment {
    id: string
    content: string
    userId?: string
    createdAt?: string
    [key: string]: unknown
}

interface ApiResponse<T> {
    code: number
    message?: string
    result?: T
}

interface LikeResponse {
    code?: number
    result?: unknown
    [key: string]: unknown
}

// ✅ Tạo post mới
export const createPost = async (token: string, postData: PostData): Promise<Post> => {
    try {
        const response = await axios.post<ApiResponse<Post>>(
            `${API_BASE_URL}/post/create`,
            postData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        )

        if (response.data?.code !== 1000) {
            throw new Error(`Create post error: ${response.data?.code}`)
        }

        console.log('✅ Post created successfully:', response.data?.result)
        return response.data?.result as Post
    } catch (error) {
        console.error("❌ Create post error:", error)
        throw error
    }
}

// Lấy id của post
export const fetchPostById = async (postId: string, token: string): Promise<Post | null> => {
    try {
        console.log("🌐 Fetching post:", postId)
        const response = await axios.get<ApiResponse<Post>>(
            `http://localhost:8888/api/post/${postId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        )

        if (response.data?.code !== 1000) {
            throw new Error(`Fetch post error: ${response.data?.code}`)
        }

        return response.data.result as Post
    } catch (error) {
        console.error("Fetch post by ID error:", error)
        return null
    }
}

// ✅ Lấy tất cả bài posts của user hiện tại
export const fetchUserPosts = async (token: string): Promise<Post[]> => {
    try {
        const response = await axios.get<ApiResponse<Post[]>>(
            `${API_BASE_URL}/post/my-posts`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        )

        if (response.data?.code !== 1000) {
            throw new Error(`Fetch error: ${response.data?.code}`)
        }

        return response.data?.result as Post[]
    } catch (error) {
        console.error("Fetch posts error:", error)
        throw error
    }
}

interface PaginatedPostsResponse {
    posts: Post[]
    hasNextPage: boolean
}

// ✅ Lấy tất cả bài posts (có phân trang)
export const fetchAllPost = async (token: string, page: number = 1, limit: number = 5): Promise<PaginatedPostsResponse> => {
    try {
        const response = await axios.get<ApiResponse<Post[]>>(
            `${API_BASE_URL}/post/all`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                params: { page, limit },
            }
        )

        // DEBUG: Log the full response to see structure
        console.log("🔍 API Response:", JSON.stringify(response.data, null, 2))

        if (response.data?.code !== 1000) {
            throw new Error(`Fetch error: ${response.data?.code}`)
        }

        // Check if result is directly an array or has content/data property (pagination)
        const rawResult = response.data?.result
        console.log("🔍 Raw result type:", typeof rawResult, Array.isArray(rawResult))
        console.log("🔍 Raw result:", rawResult)

        // Handle both direct array and paginated response (result.content)
        let posts: Post[] = []
        if (Array.isArray(rawResult)) {
            posts = rawResult
        } else if (rawResult && typeof rawResult === 'object') {
            // Check for common pagination patterns
            const paginatedResult = rawResult as { content?: Post[], data?: Post[], posts?: Post[] }
            posts = paginatedResult.content || paginatedResult.data || paginatedResult.posts || []
        }

        console.log("🔍 Final posts count:", posts.length)

        // Determine if there are more pages based on the number of results
        const hasNextPage = posts.length >= limit

        return { posts, hasNextPage }
    } catch (error) {
        console.error("Fetch all posts error:", error)
        // Return empty array instead of throwing to prevent crashes
        return { posts: [], hasNextPage: false }
    }
}

// ✅ Lấy danh sách likes của một post (GET)
export const fetchLikePost = async (token: string, postId: string): Promise<string[]> => {
    try {
        const response = await axios.get<ApiResponse<string[]>>(
            `${API_BASE_URL}/post/${postId}/likes`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        )

        if (response.data?.code !== 1000) {
            throw new Error(`Fetch likes error: ${response.data?.code}`)
        }

        return response.data?.result as string[]
    } catch (error) {
        console.error("Fetch likes error:", error)
        throw error
    }
}

export const likePost = async (token: string, postId: string): Promise<LikeResponse> => {
    const response = await axios.put<LikeResponse>(
        `${API_BASE_URL}/post/${postId}/like`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    )
    console.log("✅ Post like toggled:", response.data)
    return response.data
}

// ✅ UNLIKE post (PUT request)
export const unlikePost = async (token: string, postId: string): Promise<unknown> => {
    try {
        const response = await axios.put<ApiResponse<unknown>>(
            `${API_BASE_URL}/post/${postId}/unlike`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        )

        if (response.data?.code !== 1000) {
            throw new Error(`Unlike error: ${response.data?.code}`)
        }

        console.log('✅ Post unliked:', response.data)
        return response.data?.result
    } catch (error) {
        console.error("❌ Unlike post error:", error)
        throw error
    }
}

// ✅ Toggle Like/Unlike (helper function)
export const toggleLikePost = async (token: string, postId: string, isCurrentlyLiked: boolean): Promise<unknown> => {
    if (isCurrentlyLiked) {
        return await unlikePost(token, postId)
    } else {
        return await likePost(token, postId)
    }
}

// ✅ Xóa bài post
export const deletePost = async (token: string, postId: string): Promise<unknown> => {
    try {
        const response = await axios.delete<ApiResponse<unknown>>(
            `${API_BASE_URL}/post/${postId}/delete`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        )

        if (response.data?.code !== 1000) {
            throw new Error(`Delete error: ${response.data?.code}`)
        }

        return response.data?.result
    } catch (error) {
        console.error("Delete post error:", error)
        throw error
    }
}

// ✅ Lấy bài posts của một user cụ thể (theo userId)
export const getPostsByUserId = async (userId: string, token: string): Promise<Post[]> => {
    try {
        const response = await axios.get<ApiResponse<Post[]>>(
            `${API_BASE_URL}/post/users/posts/${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        )

        if (response.data?.code !== 1000) {
            throw new Error(`Fetch user posts error: ${response.data?.code}`)
        }

        return response.data?.result || []
    } catch (error) {
        console.error("Fetch user posts error:", error)
        return []
    }
}

// ✅ Lấy tất cả comments của một post
export const fetchAllComments = async (token: string, postId: string): Promise<Comment[]> => {
    try {
        const response = await axios.get<ApiResponse<Comment[]>>(
            `${API_BASE_URL}/post/comment/${postId}/comments`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        )

        if (response.data?.code !== 1000) {
            throw new Error(`Fetch comments error: ${response.data?.code}`)
        }

        return response.data?.result as Comment[]
    } catch (error) {
        console.error("Fetch all comments error:", error)
        throw error
    }
}

// ✅ Tạo comment mới (POST request)
export const createComment = async (token: string, postId: string, content: string): Promise<Comment> => {
    try {
        const response = await axios.post<ApiResponse<Comment>>(
            `${API_BASE_URL}/post/comment/${postId}/create`,
            { content },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        )

        if (response.data?.code !== 1000) {
            throw new Error(`Create comment error: ${response.data?.code}`)
        }

        console.log('✅ Comment created:', response.data)
        return response.data?.result as Comment
    } catch (error) {
        console.error("❌ Create comment error:", error)
        throw error
    }
}

// ✅ Xóa comment
export const deleteComment = async (token: string, commentId: string): Promise<unknown> => {
    try {
        const response = await axios.delete<ApiResponse<unknown>>(
            `${API_BASE_URL}/post/comment/${commentId}/delete`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        )

        if (response.data?.code !== 1000) {
            throw new Error(`Delete comment error: ${response.data?.code}`)
        }

        return response.data?.result
    } catch (error) {
        console.error("Delete comment error:", error)
        throw error
    }
}
