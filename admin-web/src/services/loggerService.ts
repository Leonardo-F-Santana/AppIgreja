import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UsuarioLog {
  uid: string;
  nome?: string;
  role?: string;
}

export type AcaoLog = 'CRIAR' | 'EDITAR' | 'EXCLUIR' | string;

export const registrarLog = async (
  usuario: UsuarioLog,
  acao: AcaoLog,
  modulo: string,
  detalhes: string
) => {
  try {
    if (!usuario?.uid) return;

    await addDoc(collection(db, 'logs_auditoria'), {
      usuario: {
        uid: usuario.uid,
        nome: usuario.nome || 'Desconhecido',
        role: usuario.role || 'Sem Perfil'
      },
      acao: acao.toUpperCase(),
      modulo,
      detalhes,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('[Auditoria] Falha ao registrar log:', error);
  }
};
