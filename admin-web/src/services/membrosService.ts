import {
  collection,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Membro {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: Timestamp | null;
}

// ─── Referência da coleção ───────────────────────────────────────────────────

const membrosRef = collection(db, "users");

// ─── Funções CRUD ────────────────────────────────────────────────────────────

/**
 * Altera o nível de acesso (função/role) de um membro.
 * Exemplo: de 'membro' para 'admin'.
 */
export async function atualizarFuncaoMembro(
  id: string,
  novaFuncao: string
): Promise<void> {
  const docRef = doc(db, "users", id);
  await updateDoc(docRef, { role: novaFuncao });
}

/**
 * Escuta a coleção de usuários em tempo real.
 * Retorna a função de unsubscribe para cleanup.
 */
export function ouvirMembros(
  callback: (membros: Membro[]) => void
): () => void {
  // Ordena por data de criação descendente (mais recentes primeiro)
  const q = query(membrosRef, orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const membros: Membro[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          username: data.username ?? "Sem Nome",
          email: data.email ?? "sem-email@ide.com",
          role: data.role ?? "membro", // Se não tiver role, assume 'membro'
          createdAt: data.createdAt ?? null,
        };
      });
      callback(membros);
    },
    (error) => {
      console.error("[membrosService] Erro ao escutar membros:", error.message);
      // Fallback fallback: the index on createdAt might be missing. If so, fetch without order.
      if (error.message.includes('index')) {
        const fallbackQ = query(membrosRef);
        onSnapshot(fallbackQ, (snap) => {
          const membros: Membro[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              username: data.username ?? "Sem Nome",
              email: data.email ?? "sem-email@ide.com",
              role: data.role ?? "membro",
              createdAt: data.createdAt ?? null,
            };
          });
          callback(membros);
        });
      } else {
        callback([]);
      }
    }
  );

  return unsubscribe;
}
