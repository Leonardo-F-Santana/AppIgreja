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

export interface CultoRegistro {
  id?: string;
  data: string;
  tipo: string;
  adultos: number;
  criancas: number;
  visitantes: number;
  createdAt?: Timestamp | null;
}

const cultosRef = collection(db, "cultos");

export async function adicionarCulto(dados: Omit<CultoRegistro, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(cultosRef, {
    ...dados,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function editarCulto(id: string, dados: Omit<CultoRegistro, 'id' | 'createdAt'>): Promise<void> {
  const docRef = doc(db, "cultos", id);
  await updateDoc(docRef, { ...dados });
}

export async function deletarCulto(id: string): Promise<void> {
  const docRef = doc(db, "cultos", id);
  await deleteDoc(docRef);
}

export function ouvirCultos(callback: (cultos: CultoRegistro[]) => void): () => void {
  const q = query(cultosRef, orderBy("data", "desc"));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const cultos = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          data: data.data || "",
          tipo: data.tipo || "",
          adultos: Number(data.adultos) || 0,
          criancas: Number(data.criancas) || 0,
          visitantes: Number(data.visitantes) || 0,
          createdAt: data.createdAt || null,
        } as CultoRegistro;
      });
      callback(cultos);
    },
    (error) => {
      console.error("[cultosService] Erro ao escutar cultos:", error.message);
      if (error.message.includes('index')) {
        const fallbackQ = query(cultosRef);
        onSnapshot(fallbackQ, (snap) => {
          const cultos = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              data: data.data || "",
              tipo: data.tipo || "",
              adultos: Number(data.adultos) || 0,
              criancas: Number(data.criancas) || 0,
              visitantes: Number(data.visitantes) || 0,
              createdAt: data.createdAt || null,
            } as CultoRegistro;
          });
          cultos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
          callback(cultos);
        });
      } else {
        callback([]);
      }
    }
  );
}
