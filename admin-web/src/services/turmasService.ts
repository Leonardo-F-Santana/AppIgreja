import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

// ─── Tipagem ──────────────────────────────────────────────────────────────────

export interface Turma {
  id?: string;
  nome: string;               // ex: EBD Adultos
  professor: string;
  diaHorario: string;
  status: 'ativa' | 'encerrada';
  criadoPor?: {
    uid: string;
    nome: string;
    cargo: string;
  };
  criadoEm?: Timestamp | null;
}

// ─── Referência da coleção ────────────────────────────────────────────────────

const turmasRef = collection(db, "turmas");

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function adicionarTurma(
  dados: Omit<Turma, 'id' | 'criadoEm'>,
): Promise<string> {
  const docRef = await addDoc(turmasRef, {
    ...dados,
    criadoEm: serverTimestamp(),
  });
  return docRef.id;
}

export async function editarTurma(
  id: string,
  dados: Partial<Omit<Turma, 'id' | 'criadoEm'>>,
): Promise<void> {
  const docRef = doc(db, "turmas", id);
  await updateDoc(docRef, { ...dados });
}

export async function deletarTurma(id: string): Promise<void> {
  const docRef = doc(db, "turmas", id);
  await deleteDoc(docRef);
}

// ─── Listener em tempo real ───────────────────────────────────────────────────

export function ouvirTurmas(callback: (turmas: Turma[]) => void): () => void {
  const q = query(turmasRef, orderBy("criadoEm", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const turmas = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          nome: data.nome || "",
          professor: data.professor || "",
          diaHorario: data.diaHorario || "",
          status: data.status || "ativa",
          criadoPor: data.criadoPor || undefined,
          criadoEm: data.criadoEm || null,
        } as Turma;
      });
      callback(turmas);
    },
    (error) => {
      console.error("[turmasService] Erro ao escutar turmas:", error.message);
      // Fallback sem ordenação caso o índice não exista
      if (error.message.includes("index")) {
        const fallbackQ = query(turmasRef);
        onSnapshot(fallbackQ, (snap) => {
          const turmas = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              nome: data.nome || "",
              professor: data.professor || "",
              diaHorario: data.diaHorario || "",
              status: data.status || "ativa",
              criadoPor: data.criadoPor || undefined,
              criadoEm: data.criadoEm || null,
            } as Turma;
          });
          callback(turmas);
        });
      } else {
        callback([]);
      }
    },
  );
}
