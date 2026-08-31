import {
  collection,
  updateDoc,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  getDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface RegistroHistorico {
  id: string;
  data: string;
  tipo: string;
  descricao: string;
}

export interface Membro {
  id: string;
  uid?: string;
  username: string;
  email: string;
  role: string;
  telefone?: string;
  dataNascimento?: string;
  celulaId?: string;
  celulaNome?: string;
  status?: string;
  historico?: RegistroHistorico[];
  acessoApp: boolean;
  createdAt: Timestamp | null;
}

export interface MembroPayload {
  username: string;
  email?: string;
  telefone?: string;
  dataNascimento?: string;
  role: string;
  celulaId?: string;
  celulaNome?: string;
  status?: string;
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
  const docSnap = await getDoc(docRef);
  await updateDoc(docRef, { role: novaFuncao });

  // Sincronização com o perfil de login (coleção usuarios)
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data.email) {
      const q = query(collection(db, "users"), where("email", "==", data.email.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (snap) => {
        if (snap.id !== id) {
          await updateDoc(doc(db, "users", snap.id), { role: novaFuncao });
        }
      });
    }
  }
}

export async function adicionarMembroManual(dados: MembroPayload): Promise<string> {
  // Verifica se o e-mail já está cadastrado
  if (dados.email) {
    const emailSanitizado = dados.email.toLowerCase().trim();
    const emailQuery = query(membrosRef, where('email', '==', emailSanitizado));
    const querySnapshot = await getDocs(emailQuery);
    
    if (!querySnapshot.empty) {
      throw new Error('DUPLICATE_EMAIL');
    }
    
    // Assegura que o e-mail será salvo limpo
    dados.email = emailSanitizado;
  }

  const docRef = await addDoc(membrosRef, {
    ...dados,
    acessoApp: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function editarMembroManual(
  id: string,
  dados: MembroPayload
): Promise<void> {
  const docRef = doc(db, "users", id);
  await updateDoc(docRef, { ...dados });

  // Sincronização com o perfil de login (coleção usuarios)
  if (dados.email) {
    const emailSanitizado = dados.email.toLowerCase().trim();
    const q = query(collection(db, "users"), where("email", "==", emailSanitizado));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach(async (snap) => {
      // Atualiza os documentos associados (perfil de login), ignorando a própria ficha
      if (snap.id !== id) {
        await updateDoc(doc(db, "users", snap.id), {
          nome: dados.username,
          telefone: dados.telefone || "",
          role: dados.role,
        });
      }
    });
  }
}

export async function deletarMembro(id: string): Promise<void> {
  const docRef = doc(db, "users", id);
  await deleteDoc(docRef);
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
          telefone: data.telefone ?? undefined,
          dataNascimento: data.dataNascimento ?? undefined,
          celulaId: data.celulaId ?? undefined,
          celulaNome: data.celulaNome ?? undefined,
          status: data.status ?? 'Ativo',
          historico: Array.isArray(data.historico) ? data.historico : [],
          acessoApp: data.acessoApp ?? true,
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
              telefone: data.telefone ?? undefined,
              dataNascimento: data.dataNascimento ?? undefined,
              celulaId: data.celulaId ?? undefined,
              celulaNome: data.celulaNome ?? undefined,
              status: data.status ?? 'Ativo',
              historico: Array.isArray(data.historico) ? data.historico : [],
              acessoApp: data.acessoApp ?? true,
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
