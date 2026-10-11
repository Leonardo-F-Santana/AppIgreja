import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../config/firebase";
import { enviarNotificacaoPushEmMassa } from "../utils/pushNotifications";

export interface TransmissaoConfig {
  titulo: string;
  linkYoutube: string;
  aoVivo: boolean;
  atualizadoEm?: any;
}

const transmissaoDocRef = doc(db, "configuracoes", "transmissao");

/**
 * Escuta em tempo real o estado da transmissão ao vivo.
 */
export function ouvirTransmissao(
  callback: (dados: TransmissaoConfig | null) => void
): () => void {
  return onSnapshot(
    transmissaoDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          titulo: data.titulo || "",
          linkYoutube: data.linkYoutube || "",
          aoVivo: Boolean(data.aoVivo),
          atualizadoEm: data.atualizadoEm || null,
        });
      } else {
        callback({
          titulo: "",
          linkYoutube: "",
          aoVivo: false,
        });
      }
    },
    (error) => {
      console.error("Erro ao escutar dados da transmissão:", error);
    }
  );
}

/**
 * Salva as configurações de título, link e status no Firestore.
 */
export async function salvarConfiguracoesTransmissao(
  dados: Partial<TransmissaoConfig>
): Promise<void> {
  await setDoc(
    transmissaoDocRef,
    {
      ...dados,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Altera rapidamente apenas o estado 'aoVivo' no Firestore.
 */
export async function alternarEstadoAoVivo(aoVivo: boolean): Promise<void> {
  await setDoc(
    transmissaoDocRef,
    {
      aoVivo,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Dispara notificações push aos membros no app móvel.
 * Tenta primeiro a Cloud Function. Se ainda não estiver implantada,
 * utiliza o fallback direto idêntico ao avisosService para funcionamento imediato.
 */
export async function dispararNotificacaoAoVivo(titulo: string): Promise<{
  sucesso: boolean;
  enviados: number;
  mensagem?: string;
}> {
  // 1. Tenta acionar a Cloud Function callable no backend
  try {
    const notificarFn = httpsCallable<{ titulo: string }, { sucesso: boolean; enviados: number; mensagem?: string }>(
      functions,
      "notificarTransmissaoAoVivo"
    );
    const resposta = await notificarFn({ titulo });
    if (resposta.data && typeof resposta.data.sucesso === "boolean") {
      return resposta.data;
    }
  } catch (cloudFnError: any) {
    console.warn(
      "[transmissaoService] Cloud Function indisponível ou ainda não implantada no Firebase. Executando envio via serviço de notificações do painel:",
      cloudFnError?.message || cloudFnError
    );
  }

  // 2. Fallback direto e resiliente (mesmo padrão do avisosService)
  try {
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);
    const tokenSet = new Set<string>();

    usersSnapshot.forEach((docSnap) => {
      const userData = docSnap.data();
      if (
        userData.expoPushToken &&
        typeof userData.expoPushToken === "string" &&
        userData.receberNotificacoes !== false
      ) {
        tokenSet.add(userData.expoPushToken);
      }
    });

    const tokens = Array.from(tokenSet);

    if (tokens.length === 0) {
      return {
        sucesso: false,
        enviados: 0,
        mensagem: "Nenhum membro com notificações ativas encontrado no momento.",
      };
    }

    const tituloPush = "🔴 Estamos ao vivo!";
    const corpoPush = titulo.trim()
      ? `${titulo.trim()}`
      : "Culto ao vivo iniciado! Toque para assistir.";

    await enviarNotificacaoPushEmMassa(tituloPush, corpoPush, tokens);

    return {
      sucesso: true,
      enviados: tokens.length,
      mensagem: `Notificação enviada com sucesso para ${tokens.length} membro(s).`,
    };
  } catch (fallbackError: any) {
    console.error("[transmissaoService] Erro ao enviar notificações:", fallbackError);
    throw new Error(
      fallbackError?.message || "Ocorreu um erro ao enviar as notificações."
    );
  }
}

