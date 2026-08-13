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

export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  /** ISO 8601 string — armazenada como string no Firestore para compatibilidade com datetime-local */
  dataHora: string;
  local: string;
  criadoEm: Timestamp | null;
}

export interface CriarEventoPayload {
  titulo: string;
  descricao: string;
  dataHora: string;
  local: string;
}

export type EditarEventoPayload = Partial<CriarEventoPayload>;

// ─── Referência da coleção ───────────────────────────────────────────────────

const eventosRef = collection(db, "eventos");

// ─── Funções CRUD ────────────────────────────────────────────────────────────

/**
 * Cria um novo evento no Firestore.
 * O campo `dataHora` é guardado como string ISO para leitura imediata pelo input datetime-local.
 */
export async function criarEvento(evento: CriarEventoPayload): Promise<string> {
  const docRef = await addDoc(eventosRef, {
    ...evento,
    criadoEm: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Atualiza um evento existente.
 */
export async function editarEvento(
  id: string,
  dados: EditarEventoPayload
): Promise<void> {
  const docRef = doc(db, "eventos", id);
  await updateDoc(docRef, { ...dados });
}

/**
 * Elimina um evento pelo ID.
 */
export async function deletarEvento(id: string): Promise<void> {
  const docRef = doc(db, "eventos", id);
  await deleteDoc(docRef);
}

/**
 * Escuta a coleção eventos em tempo real, ordenados por dataHora ascendente
 * (os mais próximos primeiro). Retorna a função de unsubscribe para cleanup.
 */
export function ouvirEventos(
  callback: (eventos: Evento[]) => void
): () => void {
  const q = query(eventosRef, orderBy("dataHora", "asc"));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const eventos: Evento[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          titulo: data.titulo ?? "",
          descricao: data.descricao ?? "",
          dataHora: data.dataHora ?? "",
          local: data.local ?? "",
          criadoEm: data.criadoEm ?? null,
        };
      });
      callback(eventos);
    },
    (error) => {
      console.error("[eventosService] Erro ao escutar eventos:", error.message);
      callback([]);
    }
  );

  return unsubscribe;
}
