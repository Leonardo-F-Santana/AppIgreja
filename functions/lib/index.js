"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificarTransmissaoAoVivo = exports.enviarLembretePush = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Inicializa a aplicação do Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
/**
 * Função auxiliar isolada para envio em massa das notificações.
 */
async function enviarNotificacaoExpo(titulo, mensagem, tokens, dataPayload) {
    if (!tokens || tokens.length === 0)
        return;
    const messages = tokens.map((token) => ({
        to: token,
        sound: "default",
        title: titulo,
        body: mensagem,
        channelId: "default",
        priority: "high",
        data: dataPayload || { tipo: "evento_lembrete", timestamp: Date.now() },
    }));
    try {
        const response = await fetch(EXPO_PUSH_URL, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(messages),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na API do Expo: ${response.status} - ${errorText}`);
        }
        functions.logger.info(`[pushNotifications] Lembretes enviados para ${tokens.length} dispositivos.`);
    }
    catch (error) {
        functions.logger.error("[pushNotifications] Falha ao enviar lembretes push:", error);
    }
}
/**
 * Função HTTP Callable para envio manual de lembrete push de um evento.
 * Recebe: { eventoId: string, mensagem?: string }
 */
exports.enviarLembretePush = functions.https.onCall(async (data, context) => {
    // 1. Verificação de segurança (Recomendado para evitar abusos no endpoint)
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "O utilizador necessita de estar autenticado para disparar lembretes.");
    }
    const eventoId = data === null || data === void 0 ? void 0 : data.eventoId;
    const mensagemCustomizada = data === null || data === void 0 ? void 0 : data.mensagem; // Payload opcional caso o admin queira customizar
    if (!eventoId || typeof eventoId !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "O parâmetro 'eventoId' é obrigatório e deve ser uma string válida.");
    }
    try {
        // 2. Busca os detalhes do evento para construir o payload dinamicamente
        const eventoDoc = await db.collection("eventos").doc(eventoId).get();
        if (!eventoDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Evento não encontrado.");
        }
        const evento = eventoDoc.data();
        const titulo = `Lembrete: ${(evento === null || evento === void 0 ? void 0 : evento.titulo) || "Novo Evento"}`;
        // Fallbacks para a mensagem
        const corpo = mensagemCustomizada || (evento === null || evento === void 0 ? void 0 : evento.descricao) || "Não se esqueça do evento que está a aproximar-se!";
        const mensagemResumida = corpo.length > 100 ? corpo.substring(0, 97) + "..." : corpo;
        // 3. Busca todos os utilizadores ativos e extrai os pushTokens únicos (usando Set)
        const usersSnapshot = await db.collection("users").get();
        const tokenSet = new Set();
        usersSnapshot.forEach((docSnap) => {
            const userData = docSnap.data();
            if (userData.expoPushToken &&
                typeof userData.expoPushToken === "string" &&
                userData.receberNotificacoes !== false) {
                tokenSet.add(userData.expoPushToken);
            }
        });
        const tokens = Array.from(tokenSet);
        if (tokens.length === 0) {
            return { sucesso: false, enviados: 0, mensagem: "Nenhum token válido encontrado." };
        }
        // 4. Integração: Envio para a API do Expo
        await enviarNotificacaoExpo(titulo, mensagemResumida, tokens);
        // 5. Retorna o status de sucesso para o painel Web Admin
        return {
            sucesso: true,
            enviados: tokens.length
        };
    }
    catch (error) {
        functions.logger.error("Erro interno ao enviar lembrete:", error);
        throw new functions.https.HttpsError("internal", "Ocorreu um erro interno ao processar o envio do lembrete.");
    }
});
/**
 * Função HTTP Callable para notificar o início de transmissão ao vivo aos membros.
 * Recebe: { titulo?: string }
 */
exports.notificarTransmissaoAoVivo = functions.https.onCall(async (data, context) => {
    // 1. Verificação de segurança: utilizador autenticado
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "O utilizador necessita de estar autenticado para disparar notificações.");
    }
    const tituloTransmissao = ((data === null || data === void 0 ? void 0 : data.titulo) || "").trim() || "Culto Ao Vivo";
    const tituloPush = "🔴 Estamos ao vivo!";
    const corpoPush = `${tituloTransmissao}`;
    try {
        // 2. Busca todos os utilizadores ativos e extrai os pushTokens únicos (Set)
        const usersSnapshot = await db.collection("users").get();
        const tokenSet = new Set();
        usersSnapshot.forEach((docSnap) => {
            const userData = docSnap.data();
            if (userData.expoPushToken &&
                typeof userData.expoPushToken === "string" &&
                userData.receberNotificacoes !== false) {
                tokenSet.add(userData.expoPushToken);
            }
        });
        const tokens = Array.from(tokenSet);
        if (tokens.length === 0) {
            return {
                sucesso: false,
                enviados: 0,
                mensagem: "Nenhum token válido encontrado para envio."
            };
        }
        // 3. Integração: Envio em massa para a API do Expo
        await enviarNotificacaoExpo(tituloPush, corpoPush, tokens, {
            tipo: "transmissao_ao_vivo",
            titulo: tituloTransmissao,
            timestamp: Date.now(),
        });
        functions.logger.info(`[notificarTransmissaoAoVivo] Notificação transmitida para ${tokens.length} membros.`);
        // 4. Retorno para o Web Admin
        return {
            sucesso: true,
            enviados: tokens.length,
            mensagem: `Notificação enviada com sucesso para ${tokens.length} dispositivo(s).`,
        };
    }
    catch (error) {
        functions.logger.error("Erro interno ao enviar notificação de transmissão:", error);
        throw new functions.https.HttpsError("internal", "Ocorreu um erro interno ao processar a notificação de transmissão ao vivo.");
    }
});
//# sourceMappingURL=index.js.map