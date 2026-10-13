import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

// ─── Tipagens ─────────────────────────────────────────────────────────────────

export interface FichaInclusao {
  condicao: string;
  alergias: string;
  gatilhos: string;
  comoAcalmar: string;
}

export interface Crianca {
  id: string;
  nome: string;
  dataNascimento: string;
  nomeResponsavel: string;
  telefoneEmergencia: string;
  membroIdResponsavel?: string;
  fichaInclusao?: FichaInclusao;
  criadoEm?: Timestamp | null;
}

// ─── Referência da Coleção ────────────────────────────────────────────────────

const kidsRef = collection(db, "kids");

// ─── Funções CRUD ─────────────────────────────────────────────────────────────

/**
 * Busca todas as crianças cadastradas no Firestore.
 */
export async function getKids(): Promise<Crianca[]> {
  try {
    const q = query(kidsRef, orderBy("nome", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        nome: data.nome || "",
        dataNascimento: data.dataNascimento || "",
        nomeResponsavel: data.nomeResponsavel || "",
        telefoneEmergencia: data.telefoneEmergencia || "",
        membroIdResponsavel: data.membroIdResponsavel || "",
        fichaInclusao: data.fichaInclusao || undefined,
        criadoEm: data.criadoEm || null,
      } as Crianca;
    });
  } catch (error: any) {
    console.error("[kidsService] Erro ao buscar crianças:", error.message);
    const fallbackSnap = await getDocs(kidsRef);
    return fallbackSnap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        nome: data.nome || "",
        dataNascimento: data.dataNascimento || "",
        nomeResponsavel: data.nomeResponsavel || "",
        telefoneEmergencia: data.telefoneEmergencia || "",
        membroIdResponsavel: data.membroIdResponsavel || "",
        fichaInclusao: data.fichaInclusao || undefined,
        criadoEm: data.criadoEm || null,
      } as Crianca;
    });
  }
}

/**
 * Cadastra uma nova criança no Firestore.
 */
export async function addKid(
  dados: Omit<Crianca, "id" | "criadoEm">
): Promise<string> {
  const docRef = await addDoc(kidsRef, {
    nome: dados.nome ?? "",
    dataNascimento: dados.dataNascimento ?? "",
    nomeResponsavel: dados.nomeResponsavel ?? "",
    telefoneEmergencia: dados.telefoneEmergencia ?? "",
    membroIdResponsavel: dados.membroIdResponsavel ?? "",
    fichaInclusao: dados.fichaInclusao ?? null,
    criadoEm: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Atualiza os dados de uma criança existente.
 */
export async function updateKid(
  id: string,
  dados: Partial<Omit<Crianca, "id" | "criadoEm">>
): Promise<void> {
  const docRef = doc(db, "kids", id);

  const cleanData: Record<string, any> = {};

  if (dados.nome !== undefined) cleanData.nome = dados.nome ?? "";
  if (dados.dataNascimento !== undefined) cleanData.dataNascimento = dados.dataNascimento ?? "";
  if (dados.nomeResponsavel !== undefined) cleanData.nomeResponsavel = dados.nomeResponsavel ?? "";
  if (dados.telefoneEmergencia !== undefined) cleanData.telefoneEmergencia = dados.telefoneEmergencia ?? "";
  if (dados.membroIdResponsavel !== undefined) cleanData.membroIdResponsavel = dados.membroIdResponsavel ?? "";
  if (dados.fichaInclusao !== undefined) {
    cleanData.fichaInclusao = dados.fichaInclusao ?? null;
  }

  await updateDoc(docRef, cleanData);
}

/**
 * Exclui o cadastro de uma criança do Firestore.
 */
export async function deleteKid(id: string): Promise<void> {
  const docRef = doc(db, "kids", id);
  await deleteDoc(docRef);
}

/**
 * Listener em tempo real para a coleção de crianças.
 */
export function ouvirKids(
  callback: (kids: Crianca[]) => void
): () => void {
  const q = query(kidsRef, orderBy("nome", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const kids = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          nome: data.nome || "",
          dataNascimento: data.dataNascimento || "",
          nomeResponsavel: data.nomeResponsavel || "",
          telefoneEmergencia: data.telefoneEmergencia || "",
          membroIdResponsavel: data.membroIdResponsavel || "",
          fichaInclusao: data.fichaInclusao || undefined,
          criadoEm: data.criadoEm || null,
        } as Crianca;
      });
      callback(kids);
    },
    (error) => {
      console.error("[kidsService] Erro ao escutar crianças:", error.message);
      const fallbackQ = query(kidsRef);
      onSnapshot(fallbackQ, (snap) => {
        const kids = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            nome: data.nome || "",
            dataNascimento: data.dataNascimento || "",
            nomeResponsavel: data.nomeResponsavel || "",
            telefoneEmergencia: data.telefoneEmergencia || "",
            membroIdResponsavel: data.membroIdResponsavel || "",
            fichaInclusao: data.fichaInclusao || undefined,
            criadoEm: data.criadoEm || null,
          } as Crianca;
        });
        kids.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
        callback(kids);
      });
    }
  );
}

// ─── Mural de Avisos Kids ─────────────────────────────────────────────────────

export interface AvisoKids {
  id?: string;
  titulo: string;
  mensagem: string;
  dataCriacao: Date | Timestamp | null;
}

const avisosKidsRef = collection(db, "avisos_kids");

function mapAvisoKids(id: string, data: Record<string, any>): AvisoKids {
  return {
    id,
    titulo: data.titulo || "",
    mensagem: data.mensagem || "",
    dataCriacao: data.dataCriacao || null,
  };
}

/**
 * Busca todos os avisos do Ministério Kids (mais recentes primeiro).
 */
export async function getAvisosKids(): Promise<AvisoKids[]> {
  const q = query(avisosKidsRef, orderBy("dataCriacao", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapAvisoKids(d.id, d.data()));
}

/**
 * Listener em tempo real para os avisos do Ministério Kids (mais recentes primeiro).
 */
export function ouvirAvisosKids(
  callback: (avisos: AvisoKids[]) => void
): () => void {
  const q = query(avisosKidsRef, orderBy("dataCriacao", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => mapAvisoKids(d.id, d.data())));
    },
    (error) => {
      console.error("[kidsService] Erro ao escutar avisos kids:", error.message);
      callback([]);
    }
  );
}

/**
 * Publica um novo aviso no mural do Ministério Kids.
 */
export async function addAvisoKids(
  dados: Pick<AvisoKids, "titulo" | "mensagem">
): Promise<string> {
  const docRef = await addDoc(avisosKidsRef, {
    titulo: dados.titulo ?? "",
    mensagem: dados.mensagem ?? "",
    dataCriacao: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Exclui um aviso do mural do Ministério Kids.
 */
export async function deleteAvisoKids(id: string): Promise<void> {
  await deleteDoc(doc(db, "avisos_kids", id));
}
