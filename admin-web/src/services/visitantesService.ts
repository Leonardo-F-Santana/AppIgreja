import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface Visitante {
  id?: string;
  nome: string;
  telefone: string;
  dataVisita: string;
  quemConvidou?: string;
  status: string;
  createdAt?: Timestamp | null;
}

const visitantesRef = collection(db, "visitantes");

export async function adicionarVisitante(dados: Omit<Visitante, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(visitantesRef, {
    ...dados,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function editarVisitante(id: string, dados: Omit<Visitante, 'id' | 'createdAt'>): Promise<void> {
  const docRef = doc(db, "visitantes", id);
  await updateDoc(docRef, { ...dados });
}

export async function deletarVisitante(id: string): Promise<void> {
  const docRef = doc(db, "visitantes", id);
  await deleteDoc(docRef);
}

export function ouvirVisitantes(callback: (visitantes: Visitante[]) => void): () => void {
  const q = query(visitantesRef, orderBy("dataVisita", "desc"));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const visitantes = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          nome: data.nome || "",
          telefone: data.telefone || "",
          dataVisita: data.dataVisita || "",
          quemConvidou: data.quemConvidou || "",
          status: data.status || "Novo",
          createdAt: data.createdAt || null,
        } as Visitante;
      });
      callback(visitantes);
    },
    (error) => {
      console.error("[visitantesService] Erro ao escutar visitantes:", error.message);
      if (error.message.includes('index')) {
        const fallbackQ = query(visitantesRef);
        onSnapshot(fallbackQ, (snap) => {
          const visitantes = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              nome: data.nome || "",
              telefone: data.telefone || "",
              dataVisita: data.dataVisita || "",
              quemConvidou: data.quemConvidou || "",
              status: data.status || "Novo",
              createdAt: data.createdAt || null,
            } as Visitante;
          });
          visitantes.sort((a, b) => new Date(b.dataVisita).getTime() - new Date(a.dataVisita).getTime());
          callback(visitantes);
        });
      } else {
        callback([]);
      }
    }
  );
}
