import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { enviarNotificacaoPushEmMassa } from "../utils/pushNotifications";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Prioridade = "alta" | "normal";

export interface Aviso {
  id: string;
  titulo: string;
  mensagem: string;
  prioridade: Prioridade;
  autor: string;
  dataCriacao: Timestamp | null;
}

export interface CriarAvisoPayload {
  titulo: string;
  mensagem: string;
  prioridade: Prioridade;
  autor: string;
}

export interface EditarAvisoPayload {
  titulo?: string;
  mensagem?: string;
  prioridade?: Prioridade;
}

// ─── Referência da coleção ───────────────────────────────────────────────────

const avisosRef = collection(db, "avisos");
const usersRef = collection(db, "users");

// ─── Funções CRUD ────────────────────────────────────────────────────────────

/**
 * Cria um novo aviso no Firestore e envia notificações push.
 */
export async function criarAviso(aviso: CriarAvisoPayload): Promise<string> {
  const docRef = await addDoc(avisosRef, {
    ...aviso,
    dataCriacao: serverTimestamp(),
  });

  // Tenta enviar notificações em background para não travar a UI em caso de erro
  (async () => {
    try {
      const usersSnapshot = await getDocs(usersRef);
      const tokens: string[] = [];

      usersSnapshot.forEach((docSnap) => {
        const userData = docSnap.data();
        if (userData.expoPushToken && typeof userData.expoPushToken === 'string') {
          tokens.push(userData.expoPushToken);
        }
      });

      if (tokens.length > 0) {
        // Resumo de no máximo 100 caracteres para a notificação
        const mensagemResumida = aviso.mensagem.length > 100 
          ? aviso.mensagem.substring(0, 97) + '...'
          : aviso.mensagem;

        await enviarNotificacaoPushEmMassa(aviso.titulo, mensagemResumida, tokens);
      }
    } catch (error) {
      console.error("[avisosService] Erro ao enviar notificações push para o novo aviso:", error);
    }
  })();

  return docRef.id;
}

/**
 * Edita um aviso existente no Firestore.
 */
export async function editarAviso(
  id: string,
  dados: EditarAvisoPayload
): Promise<void> {
  const docRef = doc(db, "avisos", id);
  await updateDoc(docRef, { ...dados });
}

/**
 * Deleta um aviso do Firestore pelo ID.
 */
export async function deletarAviso(id: string): Promise<void> {
  const docRef = doc(db, "avisos", id);
  await deleteDoc(docRef);
}

/**
 * Escuta a coleção de avisos em tempo real, ordenados por dataCriacao desc.
 * Retorna a função de unsubscribe para cleanup.
 */
export function ouvirAvisos(
  callback: (avisos: Aviso[]) => void
): () => void {
  const q = query(avisosRef, orderBy("dataCriacao", "desc"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const avisos: Aviso[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        titulo: data.titulo ?? "",
        mensagem: data.mensagem ?? "",
        prioridade: data.prioridade ?? "normal",
        autor: data.autor ?? "Desconhecido",
        dataCriacao: data.dataCriacao ?? null,
      };
    });
    callback(avisos);
  });

  return unsubscribe;
}
