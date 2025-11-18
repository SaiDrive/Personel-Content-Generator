import type { User, UserImage, ContentItem, UserContext, ContentStatus, ContentType } from '../types';

const API_BASE_URL = '/api'; // Using a proxy for dev, assumes backend is on the same domain or proxied.

// --- HELPERS ---

const getAuthHeaders = () => {
    const token = localStorage.getItem('sessionToken');
    if (!token) {
        // Allow unauthenticated requests to proceed, let the backend handle auth errors
        return { 'Content-Type': 'application/json' };
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
            const errorBody = await response.json();
            errorMessage = errorBody.message || errorMessage;
        } catch (e) {
            // Ignore if body is not JSON
        }
        throw new Error(errorMessage);
    }
    if (response.status === 204) { // No Content
        return {} as T;
    }
    return response.json();
};

// --- API FUNCTIONS ---

// Authentication
export const loginWithGoogle = async (googleToken: string): Promise<{ token: string; user: User }> => {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleToken }),
    });
    return handleResponse(response);
};

export const logout = () => {
    // No backend call needed for logout as per spec, just clear local state
    localStorage.removeItem('sessionToken');
};

export const getMe = async (): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
};

// User Context
export const getContext = async (): Promise<UserContext> => {
    const response = await fetch(`${API_BASE_URL}/data/context`, {
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
};

export const saveContext = async (context: UserContext): Promise<{ success: true }> => {
    const response = await fetch(`${API_BASE_URL}/data/context`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(context),
    });
    return handleResponse(response);
};

// Image Library
export const getImages = async (): Promise<UserImage[]> => {
    const response = await fetch(`${API_BASE_URL}/images`, {
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
};

export const getUploadUrl = async (fileName: string, contentType: string): Promise<{ uploadUrl: string; newImage: UserImage }> => {
    const response = await fetch(`${API_BASE_URL}/images/upload-url`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ fileName, contentType }),
    });
    return handleResponse(response);
};

export const deleteImage = async (id: string): Promise<{ success: true }> => {
    const response = await fetch(`${API_BASE_URL}/images/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        await handleResponse(response); // to throw error
    }
    return { success: true };
};

// Generated Content
export const getContent = async (): Promise<ContentItem[]> => {
    const response = await fetch(`${API_BASE_URL}/content`, {
        headers: getAuthHeaders(),
    });
    return await handleResponse(response);
};

export const generateContent = async (
    type: ContentType,
    context: UserContext,
    count: number,
    startImageId?: string
): Promise<ContentItem[]> => {
    const response = await fetch(`${API_BASE_URL}/content/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type, context, count, startImageId }),
    });
    return handleResponse(response);
};

export const deleteContent = async (id: string): Promise<{ success: true }> => {
    const response = await fetch(`${API_BASE_URL}/content/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        await handleResponse(response);
    }
    return { success: true };
};

export const updateContentStatus = async (id: string, status: ContentStatus): Promise<ContentItem> => {
    const response = await fetch(`${API_BASE_URL}/content/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
    });
    return handleResponse(response);
};

export const updateContentSchedule = async (id: string, schedule: string): Promise<ContentItem> => {
    const response = await fetch(`${API_BASE_URL}/content/${id}/schedule`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ schedule }),
    });
    return handleResponse(response);
}
