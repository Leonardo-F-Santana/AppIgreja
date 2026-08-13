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

export type DiaSemana =
  | "Segunda-feira"
  | "Terça-feira"
  | "Quarta-feira"
  | "Quinta-feira"
  | "Sexta-feira"
  | "Sábado"
  | "Domingo";

export const DIAS_SEMANA: DiaSemana[] = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

export interface Celula {
  id: string;
  nome: string;
  lider: string;
  diaSemana: DiaSemana;
  horario: string;  // "HH:MM"
  endereco: string;
  bairro: string;
  criadoEm: Timestamp | null;
}

export interface CriarCelulaPayload {
  nome: string;
  lider: string;
  diaSemana: DiaSemana;
  horario: string;
  endereco: string;
  bairro: string;
}

export type EditarCelulaPayload = Partial<CriarCelulaPayload>;

// ─── Referência da coleção ───────────────────────────────────────────────────

const celulasRef = collection(db, "celulas");

// ─── Funções CRUD ────────────────────────────────────────────────────────────

/**
 * Cria uma nova célula no Firestore.
 */
export async function criarCelula(celula: CriarCelulaPayload): Promise<string> {
  const docRef = await addDoc(celulasRef, {
    ...celula,
    criadoEm: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Atualiza uma célula existente.
 */
export async function editarCelula(
  id: string,
  dados: EditarCelulaPayload
): Promise<void> {
  const docRef = doc(db, "celulas", id);
  await updateDoc(docRef, { ...dados });
}

/**
 * Elimina uma célula pelo ID.
 */
export async function deletarCelula(id: string): Promise<void> {
  const docRef = doc(db, "celulas", id);
  await deleteDoc(docRef);
}

/**
 * Escuta a coleção células em tempo real, ordenadas por nome (A→Z).
 * Retorna a função de unsubscribe para cleanup.
 */
export function ouvirCelulas(
  callback: (celulas: Celula[]) => void
): () => void {
  const q = query(celulasRef, orderBy("nome", "asc"));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const celulas: Celula[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          nome: data.nome ?? "",
          lider: data.lider ?? "",
          diaSemana: data.diaSemana ?? "Quarta-feira",
          horario: data.horario ?? "",
          endereco: data.endereco ?? "",
          bairro: data.bairro ?? "",
          criadoEm: data.criadoEm ?? null,
        };
      });
      callback(celulas);
    },
    (error) => {
      console.error("[celulasService] Erro ao escutar células:", error.message);
      callback([]);
    }
  );

  return unsubscribe;
}
