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
  limit,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { enviarNotificacaoPushEmMassa } from "../utils/pushNotifications";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Prioridade = "alta" | "normal";

export interface CriadoPor {
  uid: string;
  nome: string;
  cargo: string;
}

export interface Aviso {
  id: string;
  titulo: string;
  mensagem: string;
  prioridade: Prioridade;
  autor?: string; // Mantido para compatibilidade com registros antigos
  criadoPor?: CriadoPor;
  dataCriacao: Timestamp | null;
  /** Campo 'criadoEm' usado pelo dashboardService para ordenação */
  criadoEm?: Timestamp | string;
}

export interface CriarAvisoPayload {
  titulo: string;
  mensagem: string;
  prioridade: Prioridade;
  criadoPor?: CriadoPor;
  autor?: string;
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
      const tokenSet = new Set<string>();

      usersSnapshot.forEach((docSnap) => {
        const userData = docSnap.data();
        // Só envia para quem tem token e não desativou notificações
        if (
          userData.expoPushToken &&
          typeof userData.expoPushToken === 'string' &&
          userData.receberNotificacoes !== false
        ) {
          tokenSet.add(userData.expoPushToken); // Set elimina duplicados automaticamente
        }
      });

      const tokens = Array.from(tokenSet);

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
        criadoPor: data.criadoPor ?? undefined,
        dataCriacao: data.dataCriacao ?? null,
      };
    });
    callback(avisos);
  });

  return unsubscribe;
}

/**
 * Escuta os 3 avisos mais recentes em tempo real.
 */
export function ouvirUltimosAvisos(
  callback: (avisos: Aviso[]) => void
): () => void {
  const q = query(avisosRef, orderBy("dataCriacao", "desc"), limit(3));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const avisos: Aviso[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        titulo: data.titulo ?? "",
        mensagem: data.mensagem ?? "",
        prioridade: data.prioridade ?? "normal",
        autor: data.autor ?? "Desconhecido",
        criadoPor: data.criadoPor ?? undefined,
        dataCriacao: data.dataCriacao ?? null,
      };
    });
    callback(avisos);
  });

  return unsubscribe;
}
