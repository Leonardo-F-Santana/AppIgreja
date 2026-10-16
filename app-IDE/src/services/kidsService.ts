import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  where,
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
  apenasPaisKids?: boolean;
  destinatariosIds?: string[];
}

const avisosKidsRef = collection(db, 'avisos_kids');

function mapAvisoKids(id: string, data: Record<string, any>): AvisoKids {
  return {
    id,
    titulo: data.titulo || '',
    mensagem: data.mensagem || '',
    dataCriacao: data.dataCriacao || null,
    apenasPaisKids: data.apenasPaisKids !== undefined ? data.apenasPaisKids : true,
    destinatariosIds: Array.isArray(data.destinatariosIds) ? data.destinatariosIds : [],
  };
}

/**
 * Verifica se um usuário possui filhos cadastrados no Ministério Kids.
 */
export async function verificarSeUsuarioEPaiKids(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const q = query(
      collection(db, 'kids'),
      where('membroIdResponsavel', '==', userId)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (error) {
    console.error('[kidsService] Erro ao verificar se usuário é pai kids:', error);
    return false;
  }
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
 * Garante que avisos restritos aos pais só sejam exibidos para quem tem filhos cadastrados.
 */
export function ouvirAvisosKids(
  callback: (avisos: AvisoKids[]) => void,
  userId?: string
): () => void {
  const qAvisos = query(avisosKidsRef, orderBy('dataCriacao', 'desc'));

  if (!userId) {
    return onSnapshot(
      qAvisos,
      (snapshot) => {
        const permitidos = snapshot.docs
          .map((d) => mapAvisoKids(d.id, d.data()))
          .filter((a) => a.apenasPaisKids === false);
        callback(permitidos);
      },
      (error) => {
        console.error('[kidsService] Erro ao escutar avisos kids:', error.message);
        callback([]);
      }
    );
  }

  // Com usuário autenticado: escuta os filhos do usuário em tempo real
  const qKids = query(
    collection(db, 'kids'),
    where('membroIdResponsavel', '==', userId)
  );

  let unsubscribeAvisos: (() => void) | null = null;

  const unsubscribeKids = onSnapshot(
    qKids,
    (kidsSnap) => {
      const isPai = !kidsSnap.empty;

      if (unsubscribeAvisos) {
        unsubscribeAvisos();
      }

      unsubscribeAvisos = onSnapshot(
        qAvisos,
        (snapshot) => {
          const lista = snapshot.docs.map((d) => mapAvisoKids(d.id, d.data()));
          const permitidos = lista.filter((aviso) => {
            const eRestritoPais = aviso.apenasPaisKids !== false;
            if (eRestritoPais) {
              if (aviso.destinatariosIds && aviso.destinatariosIds.length > 0) {
                return aviso.destinatariosIds.includes(userId) || isPai;
              }
              return isPai;
            }
            return true;
          });
          callback(permitidos);
        },
        (error) => {
          console.error('[kidsService] Erro ao escutar avisos kids:', error.message);
          callback([]);
        }
      );
    },
    (err) => {
      console.error('[kidsService] Erro ao escutar filhos do usuário:', err);
      callback([]);
    }
  );

  return () => {
    unsubscribeKids();
    if (unsubscribeAvisos) unsubscribeAvisos();
  };
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
