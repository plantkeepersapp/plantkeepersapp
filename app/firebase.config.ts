import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';


const firebaseAppConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "plantkeepers-app.firebaseapp.com",
  projectId: "plantkeepers-app",
  storageBucket: "plantkeepers-app.appspot.com",
  messagingSenderId: "1026415274368",
  appId: "1:1026415274368:web:18d7ac707693741ee43965"
};

const firebaseAuthConfig = {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
}


export const FIREBASE_APP = initializeApp(firebaseAppConfig);
export const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, firebaseAuthConfig);