// Script de teste: envia push notification diretamente para o token salvo no Firestore
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
  console.log("1. Buscando tokens no Firestore...");
  const querySnapshot = await getDocs(collection(db, "users"));
  const tokens = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.expoPushToken && typeof data.expoPushToken === 'string') {
      tokens.push(data.expoPushToken);
      console.log(`   Token encontrado: ${data.expoPushToken} (user: ${doc.id})`);
    }
  });

  if (tokens.length === 0) {
    console.log("Nenhum token encontrado! Abortando.");
    process.exit(1);
  }

  console.log(`\n2. Enviando push para ${tokens.length} dispositivo(s)...`);

  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title: '🔔 Teste de Notificação',
    body: 'Se você está ouvindo o som, as notificações estão funcionando!',
    channelId: 'default',
    priority: 'high',
    data: {
      tipo: 'teste',
      timestamp: Date.now(),
    },
  }));

  console.log("   Payload:", JSON.stringify(messages, null, 2));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    console.log(`\n3. Status da resposta: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log("4. Resposta da API Expo:", JSON.stringify(data, null, 2));

    // Verifica erros individuais
    if (data.data) {
      data.data.forEach((result, i) => {
        if (result.status === 'ok') {
          console.log(`   ✅ Token ${i + 1}: Enviado com sucesso (ID: ${result.id})`);
        } else {
          console.log(`   ❌ Token ${i + 1}: ERRO - ${result.message} (detalhes: ${JSON.stringify(result.details)})`);
        }
      });
    }
  } catch (error) {
    console.error("ERRO ao enviar:", error);
  }

  process.exit(0);
}

run();
