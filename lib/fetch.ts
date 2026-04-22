import { useAuthStore } from "@/store";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";

export const fetchAPI = async (url: string, options?: RequestInit) => {
    try {
        let finalUrl = url;
        const baseUrl = process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:5000/api/v1";
        const { token } = useAuthStore.getState();

        if (url.startsWith('/')) {
            if (url.startsWith('/(api)')) {
                finalUrl = `${baseUrl}${url.replace('/(api)', '')}`;
            } else {
                finalUrl = `${baseUrl}${url}`;
            }
        }

        const isFormData = options?.body instanceof FormData || (options?.body && typeof options.body === 'object' && '_parts' in options.body);

        const headers: Record<string, string> = {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options?.headers as Record<string, string>,
        };
        if (isFormData) {
            delete headers['Content-Type'];
        } else if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(finalUrl, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text();

            if (response.status === 401) {
                console.warn("🔐 [fetchAPI] 401 Unauthorized - Logging out");
                useAuthStore.getState().logout();
                // We avoid direct router.replace here as it can cause "Navigation context" errors
                // when called from background intervals or during transitions.
            }
            throw new Error(`Lỗi HTTP! trạng thái: ${response.status} - ${errorText.substring(0, 200)}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const jsonData = await response.json();
            return jsonData;
        } else {
            const text = await response.text();
            try {
                const parsedData = JSON.parse(text);
                return parsedData;
            } catch (parseError) {
                return text;
            }
        }
    } catch (error) {
        throw error;
    }
};

export const useFetch = <T>(url: string, options?: RequestInit) => {
    const { data, error, isLoading, refetch } = useQuery<T, Error>({
        queryKey: [url, options],
        queryFn: async () => {
            const result = await fetchAPI(url, options);
            return result.data ?? result;
        },
    });

    return {
        data,
        loading: isLoading,
        error: error?.message || null,
        refetch
    };
};