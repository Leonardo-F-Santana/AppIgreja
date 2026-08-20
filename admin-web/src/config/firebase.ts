import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração do Firebase — projeto ministerioide
const firebaseConfig = {
  apiKey: "AIzaSyAfcSWaS8VcO-rqUmTJ8ikt2YLB9F-f2S0",
  authDomain: "ministerioide.firebaseapp.com",
  projectId: "ministerioide",
  storageBucket: "ministerioide.firebasestorage.app",
  messagingSenderId: "591090128111",
  appId: "1:591090128111:web:6c23bd3ab84d2a378bf71a",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Configurar persistência local para evitar a necessidade de logins repetidos
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Persistência do Firebase configurada (browserLocalPersistence).");
  })
  .catch((error) => {
    console.error("Erro ao configurar persistência do Firebase Auth:", error);
  });

export default app;
