import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAfcSWaS8VcO-rqUmTJ8ikt2YLB9F-f2S0",
  authDomain: "ministerioide.firebaseapp.com",
  projectId: "ministerioide",
  storageBucket: "ministerioide.firebasestorage.app",
  messagingSenderId: "591090128111",
  appId: "1:591090128111:web:6c23bd3ab84d2a378bf71a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log("Checking users for Expo Push Tokens...");
  const querySnapshot = await getDocs(collection(db, "users"));
  let count = 0;
  let usersWithToken = 0;
  querySnapshot.forEach((doc) => {
    count++;
    const data = doc.data();
    if (data.expoPushToken) {
      usersWithToken++;
      console.log(`User ${doc.id} has token: ${data.expoPushToken}`);
    }
  });
  console.log(`Total users: ${count}`);
  console.log(`Users with push token: ${usersWithToken}`);
  process.exit(0);
}
run();
