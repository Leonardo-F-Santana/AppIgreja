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
} from "firebase/firestore";
import { db } from "../config/firebase";

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

// ─── Funções CRUD ────────────────────────────────────────────────────────────

/**
 * Cria um novo aviso no Firestore.
 */
export async function criarAviso(aviso: CriarAvisoPayload): Promise<string> {
  const docRef = await addDoc(avisosRef, {
    ...aviso,
    dataCriacao: serverTimestamp(),
  });
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
