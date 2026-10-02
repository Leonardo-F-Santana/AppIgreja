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
  arrayUnion,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../config/firebase";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Album {
  id: string;
  titulo: string;
  fotos: string[];    // Array de URLs do Firebase Storage
  capa: string;       // URL da primeira foto (ou a que o admin definir)
  createdAt: Timestamp | null;
}

export interface CriarAlbumPayload {
  titulo: string;
}

// ─── Referência da coleção ───────────────────────────────────────────────────

const albunsRef = collection(db, "albuns");

// ─── Funções de Upload ───────────────────────────────────────────────────────

/**
 * Faz upload de múltiplos ficheiros para o Firebase Storage na pasta `albuns/`.
 * Retorna um array com as URLs públicas de download de cada ficheiro.
 *
 * Para evitar colisões de nomes, cada ficheiro recebe um prefixo com timestamp.
 */
export async function uploadMultiplasFotos(
  ficheiros: File[]
): Promise<string[]> {
  // Cria uma Promise para cada ficheiro: upload + obtenção da URL
  const uploadPromises = ficheiros.map(async (ficheiro) => {
    // Gera um nome único para evitar sobreposições
    const nomeUnico = `${Date.now()}_${ficheiro.name}`;
    const storageRef = ref(storage, `albuns/${nomeUnico}`);

    // Upload do ficheiro para o Storage
    await uploadBytes(storageRef, ficheiro);

    // Obtém a URL pública de download
    const url = await getDownloadURL(storageRef);
    return url;
  });

  // Executa todos os uploads em paralelo
  const urls = await Promise.all(uploadPromises);
  return urls;
}

/**
 * Remove um ficheiro do Firebase Storage a partir da sua URL.
 * Utilizado ao eliminar fotos individuais ou ao apagar um álbum inteiro.
 */
export async function removerFotoDoStorage(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    // Se o ficheiro já não existir, ignoramos silenciosamente
    console.warn("[albunsService] Ficheiro não encontrado no Storage (pode já ter sido removido):", error);
  }
}

// ─── Funções CRUD ────────────────────────────────────────────────────────────

/**
 * Cria um novo álbum no Firestore.
 * 1. Faz o upload de todas as fotos selecionadas.
 * 2. Guarda o documento com título, array de URLs, capa (primeira foto) e timestamp.
 */
export async function criarAlbum(
  payload: CriarAlbumPayload,
  ficheiros: File[]
): Promise<string> {
  // 1. Upload de todas as fotos
  const urls = await uploadMultiplasFotos(ficheiros);

  // 2. Criar o documento no Firestore
  const docRef = await addDoc(albunsRef, {
    titulo: payload.titulo,
    fotos: urls,
    capa: urls.length > 0 ? urls[0] : "", // Primeira foto como capa por defeito
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Edita o título de um álbum existente.
 */
export async function editarTituloAlbum(
  id: string,
  novoTitulo: string
): Promise<void> {
  const docRef = doc(db, "albuns", id);
  await updateDoc(docRef, { titulo: novoTitulo });
}

/**
 * Adiciona mais fotos a um álbum existente.
 * Usa arrayUnion para fazer push das novas URLs ao array de fotos sem sobrescrever.
 */
export async function adicionarFotosAoAlbum(
  id: string,
  ficheiros: File[]
): Promise<string[]> {
  // 1. Upload das novas fotos
  const novasUrls = await uploadMultiplasFotos(ficheiros);

  // 2. Atualiza o documento com arrayUnion (adiciona ao array existente)
  const docRef = doc(db, "albuns", id);
  await updateDoc(docRef, {
    fotos: arrayUnion(...novasUrls),
  });

  return novasUrls;
}

/**
 * Remove uma foto específica de um álbum.
 * Remove do Firestore (array) e tenta remover do Storage.
 */
export async function removerFotoDoAlbum(
  albumId: string,
  fotoUrl: string,
  fotosAtuais: string[]
): Promise<void> {
  // Filtra a foto do array
  const novasFotos = fotosAtuais.filter((url) => url !== fotoUrl);

  const docRef = doc(db, "albuns", albumId);
  await updateDoc(docRef, {
    fotos: novasFotos,
    // Se a foto removida era a capa, atualiza para a próxima disponível
    capa: novasFotos.length > 0 ? novasFotos[0] : "",
  });

  // Tenta remover do Storage
  await removerFotoDoStorage(fotoUrl);
}

/**
 * Elimina um álbum completo: remove o documento do Firestore
 * e tenta eliminar todos os ficheiros associados no Storage.
 */
export async function deletarAlbum(
  id: string,
  fotos: string[]
): Promise<void> {
  // 1. Elimina o documento do Firestore
  const docRef = doc(db, "albuns", id);
  await deleteDoc(docRef);

  // 2. Tenta eliminar cada foto do Storage (fire-and-forget para não bloquear)
  const deletePromises = fotos.map((url) => removerFotoDoStorage(url));
  await Promise.allSettled(deletePromises);
}

/**
 * Escuta a coleção `albuns` em tempo real, ordenados por createdAt descendente
 * (os mais recentes primeiro). Retorna a função de unsubscribe para cleanup.
 */
export function ouvirAlbuns(
  callback: (albuns: Album[]) => void
): () => void {
  const q = query(albunsRef, orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const albuns: Album[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          titulo: data.titulo ?? "",
          fotos: data.fotos ?? [],
          capa: data.capa ?? "",
          createdAt: data.createdAt ?? null,
        };
      });
      callback(albuns);
    },
    (error) => {
      console.error("[albunsService] Erro ao escutar álbuns:", error.message);
      callback([]);
    }
  );

  return unsubscribe;
}
