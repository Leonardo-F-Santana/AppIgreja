import { useState, useEffect } from 'react';
import {
  HandHeart, Trash2, Search, AlertTriangle, Clock, X, ShieldAlert
} from 'lucide-react';
import {
  ouvirPedidos,
  atualizarStatusPedido,
  deletarPedido,
  type PedidoOracao,
  type StatusPedido,
} from '../services/pedidosService';

// ─── Helpers de Data ──────────────────────────────────────────────────────────

function formatarData(ts: PedidoOracao['criadoEm']): string {
  if (!ts) return '—';
  const date = ts.toDate();
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastProps {
  mensagem: string;
  tipo: 'sucesso' | 'erro';
  onClose: () => void;
}

function Toast({ mensagem, tipo, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-white text-sm font-semibold
      ${tipo === 'sucesso' ? 'bg-emerald-600' : 'bg-red-600'}`}
    >
      {tipo === 'sucesso' ? <HandHeart size={16} /> : <AlertTriangle size={16} />}
      <span>{mensagem}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Componente: Card de Pedido ───────────────────────────────────────────────

interface PedidoCardProps {
  pedido: PedidoOracao;
  onStatusChange: (id: string, status: StatusPedido) => void;
  onEliminar: (pedido: PedidoOracao) => void;
}

function PedidoCard({ pedido, onStatusChange, onEliminar }: PedidoCardProps) {
  const getStatusColor = (status: StatusPedido) => {
    switch (status) {
      case 'pendente': return 'bg-amber-100 text-amber-700 ring-amber-200';
      case 'orando': return 'bg-blue-100 text-blue-700 ring-blue-200';
      case 'atendido': return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
      default: return 'bg-gray-100 text-gray-700 ring-gray-200';
    }
  };

  const getStatusLabel = (status: StatusPedido) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'orando': return 'Em Oração';
      case 'atendido': return 'Atendido';
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden hover:shadow-md transition-all">
      <div className="p-5 flex flex-col gap-3">
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-gray-900 font-bold text-base leading-tight mb-1">
              {pedido.titulo}
            </h3>
            <div className="flex items-center gap-2">
              {pedido.anonimo ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 uppercase tracking-widest">
                  <ShieldAlert size={10} />
                  Anónimo
                </span>
              ) : (
                <span className="text-xs font-semibold text-gray-400">Identificado</span>
              )}
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                <Clock size={12} />
                {formatarData(pedido.criadoEm)}
              </span>
            </div>
          </div>
          
          {/* Badge Status */}
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${getStatusColor(pedido.status)}`}>
            {getStatusLabel(pedido.status)}
          </span>
        </div>

        {/* Mensagem */}
        <div className="bg-gray-50 rounded-xl p-4 mt-2 border border-gray-100">
          <p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">
            {pedido.mensagem}
          </p>
        </div>
      </div>

      {/* Ações (Rodapé) */}
      <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Controles de Status */}
        <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 w-full sm:w-auto">
          <button
            onClick={() => onStatusChange(pedido.id, 'pendente')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-bold transition-colors
              ${pedido.status === 'pendente' ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
          >
            Pendente
          </button>
          <button
            onClick={() => onStatusChange(pedido.id, 'orando')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-bold transition-colors
              ${pedido.status === 'orando' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
          >
            Em Oração
          </button>
          <button
            onClick={() => onStatusChange(pedido.id, 'atendido')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-bold transition-colors
              ${pedido.status === 'atendido' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
          >
            Atendido
          </button>
        </div>

        {/* Botão Eliminar */}
        <button
          onClick={() => onEliminar(pedido)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full sm:w-auto flex justify-center"
          title="Eliminar pedido"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Modal Confirmação Eliminação ──────────────────────────────────────────────

interface ModalConfirmacaoProps {
  pedido: PedidoOracao;
  onConfirmar: () => void;
  onCancelar: () => void;
  isLoading: boolean;
}

function ModalConfirmacao({ pedido, onConfirmar, onCancelar, isLoading }: ModalConfirmacaoProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-8 py-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-gray-900 font-bold text-lg mb-1">Eliminar Pedido</h2>
            <p className="text-gray-500 text-sm font-medium">
              Tem certeza que deseja eliminar o pedido <span className="font-bold text-gray-700">"{pedido.titulo}"</span>?
            </p>
          </div>
          <div className="flex gap-3 w-full pt-2">
            <button
              onClick={onCancelar}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : <Trash2 size={14} />}
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Estado Vazio ─────────────────────────────────────────────────────────────

function EmptyState({ filtrado }: { filtrado: boolean }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
        <HandHeart size={28} className="text-emerald-300" />
      </div>
      <div className="text-center">
        <p className="text-gray-900 font-bold text-base">
          {filtrado ? 'Nenhum pedido encontrado' : 'Nenhum pedido de oração'}
        </p>
        <p className="text-gray-400 text-sm font-medium mt-1">
          {filtrado
            ? 'Tente ajustar os filtros.'
            : 'Os pedidos enviados pela aplicação aparecerão aqui.'}
        </p>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

type FiltroStatus = 'todos' | StatusPedido;

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoOracao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');
  
  const [pedidoParaEliminar, setPedidoParaEliminar] = useState<PedidoOracao | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);

  // Subscrição em tempo real
  useEffect(() => {
    const unsubscribe = ouvirPedidos((dados) => {
      setPedidos(dados);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtros
  const pedidosFiltrados = pedidos.filter((p) => {
    const matchBusca =
      p.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      p.mensagem.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || p.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  // Contadores
  const totalPendentes = pedidos.filter(p => p.status === 'pendente').length;
  const totalOrando = pedidos.filter(p => p.status === 'orando').length;
  const totalAtendidos = pedidos.filter(p => p.status === 'atendido').length;

  // ── Handlers ──

  const handleStatusChange = async (id: string, novoStatus: StatusPedido) => {
    try {
      await atualizarStatusPedido(id, novoStatus);
      setToast({ mensagem: 'Status atualizado com sucesso.', tipo: 'sucesso' });
    } catch (err) {
      console.error('[PedidosPage] Erro ao atualizar status:', err);
      setToast({ mensagem: 'Erro ao atualizar status. Tente novamente.', tipo: 'erro' });
    }
  };

  const handleEliminar = async () => {
    if (!pedidoParaEliminar) return;
    setIsDeleting(true);
    try {
      await deletarPedido(pedidoParaEliminar.id);
      setPedidoParaEliminar(null);
      setToast({ mensagem: 'Pedido eliminado.', tipo: 'sucesso' });
    } catch (err) {
      console.error('[PedidosPage] Erro ao eliminar:', err);
      setToast({ mensagem: 'Erro ao eliminar pedido.', tipo: 'erro' });
    } finally {
      setIsDeleting(false);
    }
  };

  const filtros: { label: string; value: FiltroStatus; count?: number }[] = [
    { label: 'Todos', value: 'todos', count: pedidos.length },
    { label: 'Pendentes', value: 'pendente', count: totalPendentes },
    { label: 'Em Oração', value: 'orando', count: totalOrando },
    { label: 'Atendidos', value: 'atendido', count: totalAtendidos },
  ];

  return (
    <>
      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} onClose={() => setToast(null)} />}

      {pedidoParaEliminar && (
        <ModalConfirmacao
          pedido={pedidoParaEliminar}
          onConfirmar={handleEliminar}
          onCancelar={() => setPedidoParaEliminar(null)}
          isLoading={isDeleting}
        />
      )}

      <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">

        {/* Header */}
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Pedidos de Oração</h1>
          <p className="text-gray-500 text-sm font-medium">
            Gerencie os pedidos de oração enviados pela comunidade.
          </p>
        </header>

        {/* Barra de Filtros */}
        <div className="flex flex-col xl:flex-row gap-3">
          {/* Busca */}
          <div className="relative flex-1 min-w-[280px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por título ou mensagem..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Abas de status */}
          <div className="flex gap-2 flex-wrap">
            {filtros.map((f) => (
              <button
                key={f.value}
                onClick={() => setFiltroStatus(f.value)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5
                  ${filtroStatus === f.value
                    ? 'bg-emerald-900 text-white border-emerald-900'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
              >
                {f.label}
                {f.count !== undefined && f.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black
                    ${filtroStatus === f.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo principal */}
        {carregando ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <svg className="animate-spin h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-sm font-medium">Carregando pedidos...</p>
            </div>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <EmptyState filtrado={busca !== '' || filtroStatus !== 'todos'} />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-400 px-1">
              {pedidosFiltrados.length} pedido{pedidosFiltrados.length !== 1 ? 's' : ''} encontrado{pedidosFiltrados.length !== 1 ? 's' : ''}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pedidosFiltrados.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onStatusChange={handleStatusChange}
                  onEliminar={setPedidoParaEliminar}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
