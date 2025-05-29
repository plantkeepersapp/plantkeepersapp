import { getIdToken } from 'firebase/auth';
import { FIREBASE_AUTH } from '@/firebase.config';

const BASE_URL = 'http://localhost:8000/api';

const apiFetch = async (
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true
) => {
    let headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (includeAuth) {
        const user = FIREBASE_AUTH.currentUser;
        if (user) {
            const token = await getIdToken(user);
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

    return res.json();
};

export default apiFetch;
