import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Activity, Search, ShieldCheck } from 'lucide-react';

interface LogAuditoria {
  id: string;
  acao: string;
  modulo: string;
  detalhes: string;
  timestamp: Timestamp | null;
  usuario: {
    uid: string;
    nome: string;
    role: string;
  };
}

export default function LogsAuditoriaPage() {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'logs_auditoria'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LogAuditoria[];
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar logs de auditoria:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logsFiltrados = logs.filter(log => {
    const termo = busca.toLowerCase();
    return (
      log.modulo.toLowerCase().includes(termo) ||
      log.detalhes.toLowerCase().includes(termo) ||
      log.usuario.nome.toLowerCase().includes(termo)
    );
  });

  const renderBadgeAcao = (acao: string) => {
    const acaoUpper = acao.toUpperCase();
    if (acaoUpper === 'CRIAR') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">CRIAR</span>;
    }
    if (acaoUpper === 'EDITAR') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">EDITAR</span>;
    }
    if (acaoUpper === 'EXCLUIR') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">EXCLUIR</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{acao}</span>;
  };

  const formatarData = (timestamp: Timestamp | null) => {
    if (!timestamp) return '—';
    return timestamp.toDate().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Activity className="text-blue-600" size={28} />
            Logs de Auditoria
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Rastreamento de segurança e histórico de ações críticas do sistema.
          </p>
        </div>
      </header>

      <div className="relative w-full max-w-md">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por módulo, usuário ou detalhes..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">Carregando histórico de auditoria...</p>
          </div>
        ) : logsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
              <ShieldCheck size={28} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium">
              {busca ? 'Nenhum log encontrado para esta busca.' : 'Nenhum registro de auditoria documentado até o momento.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Data / Hora</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuário</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ação</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Módulo</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logsFiltrados.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-600">{formatarData(log.timestamp)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{log.usuario.nome}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{log.usuario.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderBadgeAcao(log.acao)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-700">{log.modulo}</span>
                    </td>
                    <td className="px-6 py-4 max-w-xs md:max-w-md lg:max-w-lg">
                      <span className="text-sm text-gray-600 truncate block hover:whitespace-normal hover:break-words">
                        {log.detalhes}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
