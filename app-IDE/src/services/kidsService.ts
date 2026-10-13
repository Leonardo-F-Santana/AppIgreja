import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ─── Mural de Avisos Kids ─────────────────────────────────────────────────────

export interface AvisoKids {
  id?: string;
  titulo: string;
  mensagem: string;
  dataCriacao: Date | Timestamp | null;
}

const avisosKidsRef = collection(db, 'avisos_kids');

function mapAvisoKids(id: string, data: Record<string, any>): AvisoKids {
  return {
    id,
    titulo: data.titulo || '',
    mensagem: data.mensagem || '',
    dataCriacao: data.dataCriacao || null,
  };
}

/**
 * Busca todos os avisos do Ministério Kids (mais recentes primeiro).
 */
export async function getAvisosKids(): Promise<AvisoKids[]> {
  const q = query(avisosKidsRef, orderBy('dataCriacao', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapAvisoKids(d.id, d.data()));
}

/**
 * Listener em tempo real para os avisos do Ministério Kids (mais recentes primeiro).
 */
export function ouvirAvisosKids(
  callback: (avisos: AvisoKids[]) => void
): () => void {
  const q = query(avisosKidsRef, orderBy('dataCriacao', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => mapAvisoKids(d.id, d.data())));
    },
    (error) => {
      console.error('[kidsService] Erro ao escutar avisos kids:', error.message);
      callback([]);
    }
  );
}

/**
 * Publica um novo aviso no mural do Ministério Kids.
 */
export async function addAvisoKids(
  dados: Pick<AvisoKids, 'titulo' | 'mensagem'>
): Promise<string> {
  const docRef = await addDoc(avisosKidsRef, {
    titulo: dados.titulo ?? '',
    mensagem: dados.mensagem ?? '',
    dataCriacao: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Exclui um aviso do mural do Ministério Kids.
 */
export async function deleteAvisoKids(id: string): Promise<void> {
  await deleteDoc(doc(db, 'avisos_kids', id));
}
