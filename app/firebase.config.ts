import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: "plantkeepers-app.firebaseapp.com",
    projectId: "plantkeepers-app",
    storageBucket: "plantkeepers-app.firebasestorage.app",
    messagingSenderId: "1026415274368",
    appId: "1:1026415274368:web:18d7ac707693741ee43965"
};

export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);