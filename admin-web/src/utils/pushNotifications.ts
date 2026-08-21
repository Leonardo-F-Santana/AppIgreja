export interface ExpoPushMessage {
  to: string;
  sound: 'default' | null;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
}

/**
 * Envia uma notificação push em massa para vários dispositivos via Expo Push API.
 * 
 * @param titulo O título da notificação
 * @param mensagem O corpo (body) da notificação
 * @param tokens Array de strings com os Expo Push Tokens dos destinatários
 */
export async function enviarNotificacaoPushEmMassa(
  titulo: string,
  mensagem: string,
  tokens: string[]
): Promise<void> {
  if (!tokens || tokens.length === 0) {
    console.log('[pushNotifications] Nenhum token fornecido. Notificação abortada.');
    return;
  }

  // Monta o payload (array de mensagens)
  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title: titulo,
    body: mensagem,
    channelId: 'default',
    priority: 'high',
    data: {
      tipo: 'aviso',
      timestamp: Date.now(),
    },
  }));

  try {
    // Em desenvolvimento (npm run dev): o proxy do Vite em vite.config.ts redireciona /api/push → exp.host
    // Em produção (Vercel): a serverless function em /api/push.ts faz o proxy para exp.host
    // Ambos os ambientes usam '/api/push' como endpoint, então o código funciona em ambos.
    const pushUrl = import.meta.env.VITE_EXPO_PUSH_URL || '/api/push';

    const response = await fetch(pushUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API do Expo: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[pushNotifications] Notificações enviadas com sucesso para ${tokens.length} dispositivos.`, data);
  } catch (error) {
    console.error('[pushNotifications] Falha ao enviar notificações push:', error);
    // Não lançamos o erro novamente para evitar interromper fluxos que dependam dessa função.
  }
}
