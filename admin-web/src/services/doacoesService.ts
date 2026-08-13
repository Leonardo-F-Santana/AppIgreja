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
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Doacao {
  id: string;
  titulo: string;
  descricao: string;
  tipo: "PIX" | "Transferência Bancária";
  chaveOuConta: string;
  ativo: boolean;
  dataCriacao: Timestamp | null;
}

export type NovaDoacao = Omit<Doacao, "id" | "dataCriacao">;

// ─── Referência da coleção ───────────────────────────────────────────────────

const doacoesRef = collection(db, "doacoes");

// ─── Funções CRUD ────────────────────────────────────────────────────────────

/**
 * Cria uma nova conta/campanha de doação.
 */
export async function criarDoacao(dados: NovaDoacao): Promise<string> {
  const docRef = await addDoc(doacoesRef, {
    ...dados,
    dataCriacao: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Edita uma conta/campanha existente.
 */
export async function editarDoacao(
  id: string,
  dados: Partial<NovaDoacao>
): Promise<void> {
  const docRef = doc(db, "doacoes", id);
  await updateDoc(docRef, { ...dados });
}

/**
 * Exclui uma conta/campanha.
 */
export async function deletarDoacao(id: string): Promise<void> {
  const docRef = doc(db, "doacoes", id);
  await deleteDoc(docRef);
}

/**
 * Alterna o status ativo/inativo de uma campanha rapidamente.
 */
export async function alternarStatus(id: string, ativo: boolean): Promise<void> {
  const docRef = doc(db, "doacoes", id);
  await updateDoc(docRef, { ativo });
}

/**
 * Escuta a coleção de doacoes em tempo real.
 * Retorna a função de unsubscribe para cleanup.
 */
export function ouvirDoacoes(
  callback: (doacoes: Doacao[]) => void
): () => void {
  // Ordena por dataCriacao descendente (mais recentes primeiro)
  const q = query(doacoesRef, orderBy("dataCriacao", "desc"));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const doacoes: Doacao[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          titulo: data.titulo ?? "",
          descricao: data.descricao ?? "",
          tipo: data.tipo ?? "PIX",
          chaveOuConta: data.chaveOuConta ?? "",
          ativo: data.ativo ?? false,
          dataCriacao: data.dataCriacao ?? null,
        };
      });
      callback(doacoes);
    },
    (error) => {
      console.error("[doacoesService] Erro ao escutar doações:", error.message);
      callback([]);
    }
  );

  return unsubscribe;
}
