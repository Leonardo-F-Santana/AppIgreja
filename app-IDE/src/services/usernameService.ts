import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Coleção pública de lookup para login por username: usernames/{usernameLogin} → { uid, email }.
 * - Leitura pontual (get) é pública: é preciso conhecer o handle exato.
 * - Listagem é proibida nas regras, por isso a coleção não pode ser enumerada.
 * - A coleção 'users' continua privada.
 */
const COLECAO = 'usernames';

export function normalizarUsername(valor: string): string {
  return valor.trim().toLowerCase();
}

// IDs de documento do Firestore não podem conter '/', nem ser '.', '..' ou '__x__'.
export function usernameValido(handle: string): boolean {
  return !!handle && !handle.includes('/') && handle !== '.' && handle !== '..' && !/^__.*__$/.test(handle);
}

/** Resolve o e-mail associado a um username (funciona sem autenticação). */
export async function buscarEmailPorUsername(handle: string): Promise<string | null> {
  if (!usernameValido(handle)) return null;
  const snap = await getDoc(doc(db, COLECAO, handle));
  return snap.exists() ? (snap.data().email as string) ?? null : null;
}

/** true se o username ainda não foi reservado por ninguém. */
export async function usernameDisponivel(handle: string): Promise<boolean> {
  if (!usernameValido(handle)) return false;
  const snap = await getDoc(doc(db, COLECAO, handle));
  return !snap.exists();
}

/**
 * Garante que existe o mapeamento usernames/{handle} → { uid, email } para o utilizador autenticado.
 * Os mapeamentos são imutáveis para não-admins: se o handle já pertencer a outro uid, devolve 'conflito'.
 */
export async function garantirMapeamentoUsername(
  handle: string,
  uid: string,
  email: string | null,
): Promise<'criado' | 'existente' | 'conflito' | 'ignorado'> {
  if (!usernameValido(handle) || !email) return 'ignorado';

  const ref = doc(db, COLECAO, handle);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data().uid === uid ? 'existente' : 'conflito';
  }

  await setDoc(ref, { uid, email: email.toLowerCase() });
  return 'criado';
}
