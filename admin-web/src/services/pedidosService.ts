import {
  collection,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type StatusPedido = 'pendente' | 'orando' | 'atendido';

export interface PedidoOracao {
  id: string;
  titulo: string;
  mensagem: string;
  anonimo: boolean;
  status: StatusPedido;
  criadoEm: Timestamp | null;
}

// ─── Referência da coleção ───────────────────────────────────────────────────

const pedidosRef = collection(db, "pedidos_oracao");

// ─── Funções CRUD ────────────────────────────────────────────────────────────

/**
 * Atualiza o status de um pedido de oração.
 */
export async function atualizarStatusPedido(
  id: string,
  status: StatusPedido
): Promise<void> {
  const docRef = doc(db, "pedidos_oracao", id);
  await updateDoc(docRef, { status });
}

/**
 * Elimina um pedido de oração pelo ID.
 */
export async function deletarPedido(id: string): Promise<void> {
  const docRef = doc(db, "pedidos_oracao", id);
  await deleteDoc(docRef);
}

/**
 * Escuta a coleção pedidos_oracao em tempo real, ordenados por data (mais recentes primeiro).
 * Retorna a função de unsubscribe para cleanup.
 */
export function ouvirPedidos(
  callback: (pedidos: PedidoOracao[]) => void
): () => void {
  const q = query(pedidosRef, orderBy("criadoEm", "desc"));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const pedidos: PedidoOracao[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          titulo: data.titulo ?? "",
          mensagem: data.mensagem ?? "",
          anonimo: data.anonimo ?? false,
          status: data.status ?? "pendente",
          criadoEm: data.criadoEm ?? null,
        };
      });
      callback(pedidos);
    },
    (error) => {
      console.error("[pedidosService] Erro ao escutar pedidos:", error.message);
      callback([]);
    }
  );

  return unsubscribe;
}
