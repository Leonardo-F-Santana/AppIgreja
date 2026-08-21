// Vercel Serverless Function — proxy para a Expo Push API
// Isso contorna o CORS que impede o browser de chamar exp.host diretamente.
// Em dev (npm run dev), o proxy do Vite cumpre esse papel.
// Em produção (Vercel), esta function é usada automaticamente.

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas aceita POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // Propaga o status e os dados da API do Expo
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('[api/push] Erro ao reencaminhar para Expo Push API:', error);
    return res.status(500).json({
      error: 'Falha ao enviar notificação',
      details: error.message || String(error),
    });
  }
}
