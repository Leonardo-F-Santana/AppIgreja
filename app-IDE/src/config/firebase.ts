import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfcSWaS8VcO-rqUmTJ8ikt2YLB9F-f2S0",
  authDomain: "ministerioide.firebaseapp.com",
  projectId: "ministerioide",
  storageBucket: "ministerioide.firebasestorage.app",
  messagingSenderId: "591090128111",
  appId: "1:591090128111:web:6c23bd3ab84d2a378bf71a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services that will likely be used
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);

export default app;
