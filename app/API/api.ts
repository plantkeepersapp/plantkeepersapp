import { getIdToken } from 'firebase/auth';
import { FIREBASE_AUTH } from '@/firebase.config';
import Constants from 'expo-constants';

const expoHostUri = Constants.expoConfig?.hostUri;
// Extract IP part only
const expoIp = expoHostUri?.split(':')[0] || 'localhost';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || `http://${expoIp}:8000/api`;

const apiFetch = async (
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true,
) => {
    let headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (includeAuth) {
        const user = FIREBASE_AUTH.currentUser;
        if (user) {
            const token = await getIdToken(user);
            console.debug(`API call to ${BASE_URL}${endpoint} with token ${token}`);
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(error || `Request failed: ${res.status}`);
    }

    if (res.status == 204) return {};
    return res.json();
};

export default apiFetch;
