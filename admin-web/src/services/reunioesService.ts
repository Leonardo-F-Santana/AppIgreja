import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

// ─── Tipagens ─────────────────────────────────────────────────────────────────

export interface ParticipanteReuniao {
  membroId: string;
  nome: string;
  presente: boolean;
}

export interface Reuniao {
  id: string;
  titulo: string;
  data: string;
  descricao: string;
  participantes: ParticipanteReuniao[];
  criadoEm?: Timestamp | null;
}

// ─── Referência da Coleção ────────────────────────────────────────────────────

const reunioesRef = collection(db, "reunioes");

// ─── Funções CRUD ─────────────────────────────────────────────────────────────

/**
 * Busca todas as reuniões cadastradas no Firestore.
 */
export async function getReunioes(): Promise<Reuniao[]> {
  try {
    const q = query(reunioesRef, orderBy("data", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        titulo: data.titulo || "",
        data: data.data || "",
        descricao: data.descricao || "",
        participantes: Array.isArray(data.participantes) ? data.participantes : [],
        criadoEm: data.criadoEm || null,
      } as Reuniao;
    });
  } catch (error: any) {
    console.error("[reunioesService] Erro ao buscar reuniões:", error.message);
    const fallbackSnap = await getDocs(reunioesRef);
    return fallbackSnap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        titulo: data.titulo || "",
        data: data.data || "",
        descricao: data.descricao || "",
        participantes: Array.isArray(data.participantes) ? data.participantes : [],
        criadoEm: data.criadoEm || null,
      } as Reuniao;
    }).sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  }
}

/**
 * Cria uma nova reunião no Firestore.
 */
export async function addReuniao(
  dados: Omit<Reuniao, "id" | "criadoEm">
): Promise<string> {
  const docRef = await addDoc(reunioesRef, {
    titulo: dados.titulo ?? "",
    data: dados.data ?? "",
    descricao: dados.descricao ?? "",
    participantes: Array.isArray(dados.participantes) ? dados.participantes : [],
    criadoEm: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Atualiza os dados de uma reunião existente.
 */
export async function updateReuniao(
  id: string,
  dados: Partial<Omit<Reuniao, "id" | "criadoEm">>
): Promise<void> {
  const docRef = doc(db, "reunioes", id);
  await updateDoc(docRef, { ...dados });
}

/**
 * Exclui uma reunião do Firestore.
 */
export async function deleteReuniao(id: string): Promise<void> {
  const docRef = doc(db, "reunioes", id);
  await deleteDoc(docRef);
}

/**
 * Listener em tempo real para a coleção de reuniões.
 */
export function ouvirReunioes(
  callback: (reunioes: Reuniao[]) => void
): () => void {
  const q = query(reunioesRef, orderBy("data", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const reunioes = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          titulo: data.titulo || "",
          data: data.data || "",
          descricao: data.descricao || "",
          participantes: Array.isArray(data.participantes) ? data.participantes : [],
          criadoEm: data.criadoEm || null,
        } as Reuniao;
      });
      callback(reunioes);
    },
    (error) => {
      console.error("[reunioesService] Erro ao escutar reuniões:", error.message);
      if (error.message.includes("index")) {
        const fallbackQ = query(reunioesRef);
        onSnapshot(fallbackQ, (snap) => {
          const reunioes = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              titulo: data.titulo || "",
              data: data.data || "",
              descricao: data.descricao || "",
              participantes: Array.isArray(data.participantes) ? data.participantes : [],
              criadoEm: data.criadoEm || null,
            } as Reuniao;
          });
          reunioes.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
          callback(reunioes);
        });
      } else {
        callback([]);
      }
    }
  );
}
