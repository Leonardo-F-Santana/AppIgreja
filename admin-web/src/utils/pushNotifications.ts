export interface ExpoPushMessage {
  to: string;
  sound: 'default' | null;
  title: string;
  body: string;
  data?: Record<string, unknown>;
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
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
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
