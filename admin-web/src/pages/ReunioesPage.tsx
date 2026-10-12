import { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Plus,
  X,
  Users,
  Pencil,
  Trash2,
  CheckSquare,
  Square,
  Search,
  Calendar,
  FileText,
  UserCheck,
  UserX,
  UserPlus,
  Download,
  ChevronDown,
  Check,
  MessageSquare,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoIgreja from '../assets/logo-black.png';
import {
  ouvirReunioes,
  addReuniao,
  updateReuniao,
  deleteReuniao,
  type Reuniao,
  type ParticipanteReuniao,
} from '../services/reunioesService';
import { ouvirMembros, type Membro } from '../services/membrosService';

// ─── Componente Spinner ────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Componente Toast ──────────────────────────────────────────────────────────
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
    <div
      className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-white text-sm font-semibold animate-in fade-in slide-in-from-top-4 duration-200
        ${tipo === 'sucesso' ? 'bg-blue-600' : 'bg-red-600'}`}
    >
      <span>{mensagem}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Constantes de Estilização ─────────────────────────────────────────────────
const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
const labelClass = 'text-xs font-bold text-gray-500 uppercase tracking-wider';
const required = <span className="text-red-400 ml-0.5">*</span>;

// ─── Helpers de Formatação ─────────────────────────────────────────────────────
function formatarDataHora(dataStr: string): string {
  if (!dataStr) return '—';
  try {
    if (dataStr.includes('T')) {
      const [dataPart, horaPart] = dataStr.split('T');
      const [ano, mes, dia] = dataPart.split('-');
      const hora = horaPart.slice(0, 5);
      return `${dia}/${mes}/${ano} às ${hora}`;
    }
    const [ano, mes, dia] = dataStr.split('-');
    if (ano && mes && dia) {
      return `${dia}/${mes}/${ano}`;
    }
    return dataStr;
  } catch {
    return dataStr;
  }
}

// ─── Geração de Relatório PDF de Presença ──────────────────────────────────────
export function gerarRelatorioPresencaPDF(reuniao: Reuniao) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cabeçalho: Logotipo da Igreja (sem texto sobreposto)
  try {
    doc.addImage(logoIgreja, 'PNG', 14, 10, 30, 30);
  } catch (error) {
    console.warn('Erro ao carregar logotipo no PDF:', error);
  }

  // Textos do Cabeçalho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text('Relatório de Presença', 48, 19);

  doc.setFontSize(12);
  doc.setTextColor(37, 99, 235);
  doc.text(reuniao.titulo || 'Reunião', 48, 27);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Data: ${formatarDataHora(reuniao.data)}`, 48, 34);

  const agora = new Date();
  const dataGeracao = agora.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Gerado em: ${dataGeracao}`, 48, 39);

  // Linha Divisória
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 44, pageWidth - 14, 44);

  // Cálculo de Resumo de Presença
  const participantes = reuniao.participantes || [];
  const totalParticipantes = participantes.length;
  const presentes = participantes.filter((p) => p.presente === true).length;
  const ausentes = participantes.filter((p) => p.presente === false).length;
  const taxaPresenca = totalParticipantes > 0 ? Math.round((presentes / totalParticipantes) * 100) : 0;

  // Bloco de Resumo Estatístico
  const resumoY = 48;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, resumoY, pageWidth - 28, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, resumoY, pageWidth - 28, 22, 2, 2, 'S');

  // Total de Participantes
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL DE PARTICIPANTES', 20, resumoY + 7);
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(String(totalParticipantes), 20, resumoY + 16);

  // Presentes
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('PRESENTES', 85, resumoY + 7);
  doc.setFontSize(12);
  doc.setTextColor(22, 163, 74);
  doc.text(`${presentes} (${taxaPresenca}%)`, 85, resumoY + 16);

  // Ausentes
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('AUSENTES', 145, resumoY + 7);
  doc.setFontSize(12);
  doc.setTextColor(220, 38, 38);
  doc.text(`${ausentes} (${totalParticipantes > 0 ? 100 - taxaPresenca : 0}%)`, 145, resumoY + 16);

  // Tabela Detalhada com autoTable
  const rows = participantes.map((p) => [
    p.nome,
    p.presente
      ? 'Presente'
      : p.justificativa?.trim()
      ? `Justificado (${p.justificativa.trim()})`
      : 'Ausente',
  ]);

  autoTable(doc, {
    startY: resumoY + 28,
    head: [['Nome do Membro', 'Status']],
    body: rows.length > 0 ? rows : [['Nenhum participante registrado nesta reunião', '—']],
    theme: 'striped',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 50, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const val = String(data.cell.raw || '');
        if (val === 'Presente') {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fillColor = [240, 253, 244];
        } else if (val.startsWith('Justificado')) {
          data.cell.styles.textColor = [180, 83, 9];
          data.cell.styles.fillColor = [254, 243, 199];
        } else if (val === 'Ausente') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fillColor = [254, 242, 242];
        }
      }
    },
  });

  // Rodapé: Numeração de Páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - 14,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    );
  }

  // Download do PDF
  const nomeSanitizado = (reuniao.titulo || 'reuniao').replace(/\s+/g, '_');
  doc.save(`lista_presenca_${nomeSanitizado}.pdf`);
}

// ─── Modal Criar/Editar Reunião ────────────────────────────────────────────────
interface ModalReuniaoFormProps {
  reuniaoEditada?: Reuniao | null;
  onClose: () => void;
  onSalvar: (dados: { titulo: string; data: string; descricao: string }) => Promise<void>;
  isLoading: boolean;
}

function ModalReuniaoForm({
  reuniaoEditada,
  onClose,
  onSalvar,
  isLoading,
}: ModalReuniaoFormProps) {
  const isEditing = !!reuniaoEditada;
  const [titulo, setTitulo] = useState(reuniaoEditada?.titulo || '');
  const [data, setData] = useState(reuniaoEditada?.data || '');
  const [descricao, setDescricao] = useState(reuniaoEditada?.descricao || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !data.trim()) return;
    await onSalvar({
      titulo: titulo.trim(),
      data: data.trim(),
      descricao: descricao.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl">
              <CalendarDays size={18} className="text-blue-700" />
            </div>
            <div>
              <h2 className="text-gray-900 font-bold text-lg leading-tight">
                {isEditing ? 'Editar Reunião' : 'Nova Reunião'}
              </h2>
              <p className="text-gray-400 text-xs font-medium mt-0.5">
                Gestão e agendamento de reuniões
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Título da Reunião{required}</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Reunião de Liderança / Assembleia"
              required
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Data e Horário{required}</label>
            <input
              type="datetime-local"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Descrição / Pauta</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Pauta da reunião, observações ou objetivos..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !titulo.trim() || !data.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Spinner /> : isEditing ? 'Salvar Alterações' : 'Criar Reunião'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Lista de Presença ───────────────────────────────────────────────────
interface ModalPresencaProps {
  reuniao: Reuniao;
  membros: Membro[];
  onClose: () => void;
  onAtualizarParticipantes: (participantes: ParticipanteReuniao[]) => Promise<void>;
}

function ModalPresenca({
  reuniao,
  membros,
  onClose,
  onAtualizarParticipantes,
}: ModalPresencaProps) {
  const [buscaMembro, setBuscaMembro] = useState('');
  const [buscaParticipante, setBuscaParticipante] = useState('');
  const [membrosSelecionadosIds, setMembrosSelecionadosIds] = useState<string[]>([]);
  const [dropdownMembrosAberto, setDropdownMembrosAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Participantes atuais da reunião
  const participantes = reuniao.participantes || [];

  // Estatísticas de presença
  const totalParticipantes = participantes.length;
  const presentesCount = participantes.filter((p) => p.presente).length;
  const justificadosCount = participantes.filter((p) => !p.presente && Boolean(p.justificativa?.trim())).length;
  const ausentesCount = participantes.filter((p) => !p.presente && !p.justificativa?.trim()).length;
  const percentual = totalParticipantes > 0 ? Math.round((presentesCount / totalParticipantes) * 100) : 0;

  // Membros do sistema que ainda não foram adicionados à reunião
  const membrosDisponiveis = useMemo(() => {
    return membros.filter((m) => !participantes.some((p) => p.membroId === m.id));
  }, [membros, participantes]);

  const membrosFiltrados = useMemo(() => {
    if (!buscaMembro.trim()) return membrosDisponiveis;
    return membrosDisponiveis.filter((m) =>
      m.username.toLowerCase().includes(buscaMembro.toLowerCase())
    );
  }, [membrosDisponiveis, buscaMembro]);

  // Participantes filtrados pela busca interna
  const participantesFiltrados = useMemo(() => {
    if (!buscaParticipante.trim()) return participantes;
    return participantes.filter((p) =>
      p.nome.toLowerCase().includes(buscaParticipante.toLowerCase())
    );
  }, [participantes, buscaParticipante]);

  // Alternar presença de um participante
  const handleTogglePresenca = async (membroId: string) => {
    if (salvando) return;
    setSalvando(true);
    const atualizados = participantes.map((p) =>
      p.membroId === membroId ? { ...p, presente: !p.presente } : p
    );
    try {
      await onAtualizarParticipantes(atualizados);
    } finally {
      setSalvando(false);
    }
  };

  // Justificar falta de um participante
  const handleJustificarFalta = async (membroId: string) => {
    if (salvando) return;
    const participante = participantes.find((p) => p.membroId === membroId);
    if (!participante) return;

    const motivoAtual = participante.justificativa || '';
    const resposta = window.prompt(
      'Digite o motivo da ausência (ou deixe em branco para limpar):',
      motivoAtual
    );

    // Se o usuário cancelou (null), não faz nada
    if (resposta === null) return;

    const motivoFormatado = resposta.trim();
    setSalvando(true);
    const atualizados = participantes.map((p) => {
      if (p.membroId !== membroId) return p;
      if (motivoFormatado) {
        return { ...p, justificativa: motivoFormatado, presente: false };
      } else {
        const { justificativa: _, ...resto } = p;
        return { ...resto, presente: false };
      }
    });

    try {
      await onAtualizarParticipantes(atualizados);
    } finally {
      setSalvando(false);
    }
  };

  // Alternar seleção de um membro para adicionar
  const handleToggleMembroSelecionado = (membroId: string) => {
    setMembrosSelecionadosIds((prev) =>
      prev.includes(membroId) ? prev.filter((id) => id !== membroId) : [...prev, membroId]
    );
  };

  // Marcar todos os membros filtrados disponíveis
  const handleMarcarTodosFiltrados = () => {
    const idsFiltrados = membrosFiltrados.map((m) => m.id);
    setMembrosSelecionadosIds((prev) => Array.from(new Set([...prev, ...idsFiltrados])));
  };

  // Desmarcar todos os membros selecionados
  const handleDesmarcarTodos = () => {
    setMembrosSelecionadosIds([]);
  };

  // Adicionar múltiplos membros selecionados
  const handleAdicionarMembrosSelecionados = async () => {
    if (membrosSelecionadosIds.length === 0 || salvando) return;
    const membrosParaAdicionar = membros.filter((m) =>
      membrosSelecionadosIds.includes(m.id)
    );
    if (membrosParaAdicionar.length === 0) return;

    setSalvando(true);
    const novosParticipantes: ParticipanteReuniao[] = membrosParaAdicionar.map((membro) => ({
      membroId: membro.id,
      nome: membro.username,
      presente: false,
    }));
    const atualizados = [...participantes, ...novosParticipantes];
    try {
      await onAtualizarParticipantes(atualizados);
      setMembrosSelecionadosIds([]);
      setBuscaMembro('');
      setDropdownMembrosAberto(false);
    } finally {
      setSalvando(false);
    }
  };

  // Adicionar todos os membros disponíveis de uma só vez
  const handleAdicionarTodosMembros = async () => {
    if (membrosDisponiveis.length === 0 || salvando) return;
    if (
      !window.confirm(
        `Deseja adicionar todos os ${membrosDisponiveis.length} membros disponíveis a esta reunião?`
      )
    ) {
      return;
    }

    setSalvando(true);
    const novos: ParticipanteReuniao[] = membrosDisponiveis.map((m) => ({
      membroId: m.id,
      nome: m.username,
      presente: false,
    }));
    const atualizados = [...participantes, ...novos];
    try {
      await onAtualizarParticipantes(atualizados);
    } finally {
      setSalvando(false);
    }
  };

  // Marcar todos como presentes ou ausentes
  const handleMarcarTodos = async (presente: boolean) => {
    if (participantes.length === 0 || salvando) return;
    setSalvando(true);
    const atualizados = participantes.map((p) => ({ ...p, presente }));
    try {
      await onAtualizarParticipantes(atualizados);
    } finally {
      setSalvando(false);
    }
  };

  // Remover participante da reunião
  const handleRemoverParticipante = async (membroId: string) => {
    if (salvando) return;
    setSalvando(true);
    const atualizados = participantes.filter((p) => p.membroId !== membroId);
    try {
      await onAtualizarParticipantes(atualizados);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl">
              <CheckSquare size={18} className="text-blue-700" />
            </div>
            <div>
              <h2 className="text-gray-900 font-bold text-lg leading-tight">
                Lista de Presença
              </h2>
              <p className="text-gray-400 text-xs font-medium mt-0.5">
                {reuniao.titulo} • {formatarDataHora(reuniao.data)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => gerarRelatorioPresencaPDF(reuniao)}
              className="py-2 px-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
              title="Baixar Relatório PDF de Presença"
            >
              <Download size={15} className="text-blue-700" />
              Relatório PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col gap-6 overflow-y-auto">
          {/* Card Resumo / Progresso */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-gray-700">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-600" />
                <span>{totalParticipantes} Participantes</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-green-700 flex items-center gap-1 font-bold">
                  <UserCheck size={14} /> {presentesCount} Presentes
                </span>
                <span className="text-amber-700 flex items-center gap-1 font-bold">
                  <MessageSquare size={14} /> {justificadosCount} Justificados
                </span>
                <span className="text-gray-500 flex items-center gap-1 font-bold">
                  <UserX size={14} /> {ausentesCount} Ausentes
                </span>
                <span className="text-blue-900 font-extrabold">{percentual}% Presença</span>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="w-full bg-blue-200/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentual}%` }}
              />
            </div>
          </div>

          {/* Adicionar Membro à Reunião */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus size={14} className="text-blue-600" />
              Adicionar Membro à Lista
            </span>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <button
                  type="button"
                  onClick={() => setDropdownMembrosAberto((prev) => !prev)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center justify-between text-left shadow-sm"
                >
                  <span className={membrosSelecionadosIds.length > 0 ? 'text-blue-900 font-bold' : 'text-gray-500'}>
                    {membrosSelecionadosIds.length === 0
                      ? 'Selecione os membros cadastrados...'
                      : `${membrosSelecionadosIds.length} membro(s) selecionado(s)`}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
                    {membrosSelecionadosIds.length > 0 && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[11px] font-bold">
                        {membrosSelecionadosIds.length}
                      </span>
                    )}
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform duration-200 ${
                        dropdownMembrosAberto ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdicionarMembrosSelecionados}
                disabled={membrosSelecionadosIds.length === 0 || salvando}
                className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm"
              >
                <Plus size={15} />
                {salvando
                  ? 'Adicionando...'
                  : membrosSelecionadosIds.length > 0
                  ? `Adicionar (${membrosSelecionadosIds.length})`
                  : 'Adicionar'}
              </button>
            </div>

            {/* Painel Dropdown com Checkboxes */}
            {dropdownMembrosAberto && (
              <div className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-col gap-2.5 shadow-md animate-in fade-in duration-150">
                {/* Campo de Busca Rápida */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome do membro..."
                    value={buscaMembro}
                    onChange={(e) => setBuscaMembro(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Barra de Ações Rápidas */}
                <div className="flex items-center justify-between text-[11px] px-1 font-semibold">
                  <span className="text-gray-500">
                    {membrosFiltrados.length} disponível(is)
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleMarcarTodosFiltrados}
                      className="text-blue-700 hover:text-blue-900 font-bold hover:underline"
                    >
                      Marcar todos ({membrosFiltrados.length})
                    </button>
                    {membrosSelecionadosIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDesmarcarTodos}
                        className="text-gray-500 hover:text-gray-700 hover:underline"
                      >
                        Limpar ({membrosSelecionadosIds.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista de Membros com Checkbox */}
                <div className="max-h-52 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100">
                  {membrosFiltrados.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">
                      Nenhum membro encontrado.
                    </div>
                  ) : (
                    membrosFiltrados.map((m) => {
                      const isSelected = membrosSelecionadosIds.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleToggleMembroSelecionado(m.id)}
                          className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors text-xs font-semibold select-none ${
                            isSelected
                              ? 'bg-blue-50/80 text-blue-950 font-bold'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span className="truncate">
                              {m.username} {m.celulaNome ? `(${m.celulaNome})` : ''}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider bg-blue-100 px-1.5 py-0.5 rounded">
                              Selecionado
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {membrosDisponiveis.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAdicionarTodosMembros}
                  disabled={salvando}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                >
                  + Adicionar todos os {membrosDisponiveis.length} membros disponíveis
                </button>
              </div>
            )}
          </div>

          {/* Lista de Participantes */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Chamada de Presença ({totalParticipantes})
              </span>

              {totalParticipantes > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarcarTodos(true)}
                    disabled={salvando}
                    className="text-xs font-bold text-green-700 hover:bg-green-50 px-2.5 py-1 rounded-lg border border-green-200 transition-colors"
                  >
                    Marcar Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarcarTodos(false)}
                    disabled={salvando}
                    className="text-xs font-bold text-gray-600 hover:bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 transition-colors"
                  >
                    Desmarcar Todos
                  </button>
                </div>
              )}
            </div>

            {totalParticipantes > 4 && (
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filtrar participante por nome..."
                  value={buscaParticipante}
                  onChange={(e) => setBuscaParticipante(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            )}

            {participantes.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center flex flex-col items-center gap-2">
                <Users size={28} className="text-gray-300" />
                <p className="text-sm font-semibold text-gray-600">
                  Nenhum participante adicionado ainda
                </p>
                <p className="text-xs text-gray-400 max-w-sm">
                  Selecione membros no campo acima para adicioná-los à lista de presença desta reunião.
                </p>
              </div>
            ) : participantesFiltrados.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                Nenhum participante encontrado com esse nome.
              </div>
            ) : (
              <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {participantesFiltrados.map((p) => (
                  <div
                    key={p.membroId}
                    className={`flex items-center justify-between p-3.5 transition-colors cursor-pointer select-none ${
                      p.presente ? 'bg-green-50/50 hover:bg-green-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleTogglePresenca(p.membroId)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-blue-700 flex-shrink-0">
                        {p.presente ? (
                          <CheckSquare size={20} className="text-green-600" />
                        ) : (
                          <Square size={20} className="text-gray-300 hover:text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-bold truncate ${
                            p.presente ? 'text-gray-900' : 'text-gray-600'
                          }`}
                        >
                          {p.nome}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {p.presente ? (
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-green-100 text-green-700">
                              Presente
                            </span>
                          ) : p.justificativa?.trim() ? (
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                              Justificado
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                              Ausente
                            </span>
                          )}

                          {!p.presente && p.justificativa?.trim() && (
                            <span
                              className="text-xs text-amber-700 italic truncate max-w-[260px]"
                              title={`Motivo: ${p.justificativa.trim()}`}
                            >
                              • Motivo: {p.justificativa.trim()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJustificarFalta(p.membroId);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          !p.presente && p.justificativa?.trim()
                            ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-800'
                            : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title={
                          p.justificativa?.trim()
                            ? `Editar justificativa: "${p.justificativa}"`
                            : 'Justificar ausência'
                        }
                      >
                        <MessageSquare size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoverParticipante(p.membroId);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover da Reunião"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={() => gerarRelatorioPresencaPDF(reuniao)}
            className="py-2.5 px-4 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-xs transition-colors flex items-center gap-2"
          >
            <Download size={15} />
            Relatório PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function ReunioesPage() {
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');

  // Modais
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [reuniaoParaEditar, setReuniaoParaEditar] = useState<Reuniao | null>(null);
  const [reuniaoPresenca, setReuniaoPresenca] = useState<Reuniao | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal de Relatório por Período
  const [isRelatorioModalOpen, setIsRelatorioModalOpen] = useState(false);
  const [dataInicialRel, setDataInicialRel] = useState('');
  const [dataFinalRel, setDataFinalRel] = useState('');

  // Toast
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);

  // Listener de Reuniões em tempo real
  useEffect(() => {
    setCarregando(true);
    const unsubscribe = ouvirReunioes((dados) => {
      setReunioes(dados);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  // Listener de Membros em tempo real
  useEffect(() => {
    const unsubscribe = ouvirMembros((dados) => {
      setMembros(dados);
    });
    return () => unsubscribe();
  }, []);

  // Mantém os dados da reunião selecionada para presença atualizados em tempo real
  const reuniaoPresencaAtual = useMemo(() => {
    if (!reuniaoPresenca) return null;
    return reunioes.find((r) => r.id === reuniaoPresenca.id) || reuniaoPresenca;
  }, [reunioes, reuniaoPresenca]);

  // Filtragem de reuniões
  const reunioesFiltradas = useMemo(() => {
    if (!filtroTexto.trim()) return reunioes;
    const busca = filtroTexto.toLowerCase();
    return reunioes.filter(
      (r) =>
        r.titulo.toLowerCase().includes(busca) ||
        r.descricao.toLowerCase().includes(busca)
    );
  }, [reunioes, filtroTexto]);

  // Criar ou Atualizar Reunião
  const handleSalvarReuniao = async (dados: {
    titulo: string;
    data: string;
    descricao: string;
  }) => {
    setIsSaving(true);
    try {
      if (reuniaoParaEditar) {
        await updateReuniao(reuniaoParaEditar.id, {
          titulo: dados.titulo,
          data: dados.data,
          descricao: dados.descricao,
        });
        setToast({ mensagem: 'Reunião atualizada com sucesso!', tipo: 'sucesso' });
      } else {
        await addReuniao({
          titulo: dados.titulo,
          data: dados.data,
          descricao: dados.descricao,
          participantes: [],
        });
        setToast({ mensagem: 'Reunião criada com sucesso!', tipo: 'sucesso' });
      }
      setModalFormAberto(false);
      setReuniaoParaEditar(null);
    } catch (error: any) {
      console.error('Erro ao salvar reunião:', error);
      const mensagemErro =
        error?.code === 'permission-denied'
          ? 'Permissão negada no Firestore (regras de segurança).'
          : error?.message || 'Erro ao salvar reunião.';
      setToast({ mensagem: `Erro: ${mensagemErro}`, tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  // Excluir Reunião
  const handleExcluirReuniao = async (reuniaoId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta reunião? Esta ação não pode ser desfeita.')) {
      return;
    }
    try {
      await deleteReuniao(reuniaoId);
      setToast({ mensagem: 'Reunião excluída com sucesso!', tipo: 'sucesso' });
    } catch (error) {
      console.error('Erro ao excluir reunião:', error);
      setToast({ mensagem: 'Erro ao excluir reunião.', tipo: 'erro' });
    }
  };

  // Atualizar Lista de Participantes (Presença)
  const handleAtualizarParticipantes = async (novosParticipantes: ParticipanteReuniao[]) => {
    if (!reuniaoPresencaAtual) return;
    try {
      await updateReuniao(reuniaoPresencaAtual.id, {
        participantes: novosParticipantes,
      });
    } catch (error) {
      console.error('Erro ao atualizar presença:', error);
      setToast({ mensagem: 'Erro ao atualizar participantes.', tipo: 'erro' });
    }
  };

  // ─── Geração de Relatório Consolidado por Período ─────────────────────────
  const gerarRelatorioPeriodoPDF = () => {
    // Filtrar reuniões pelo intervalo de datas
    const reunioesPeriodo = reunioes.filter((r) => {
      const dataItem = r.data ? r.data.slice(0, 10) : '';
      const atendeInicial = !dataInicialRel || dataItem >= dataInicialRel;
      const atendeFinal = !dataFinalRel || dataItem <= dataFinalRel;
      return atendeInicial && atendeFinal;
    });

    if (reunioesPeriodo.length === 0) {
      alert('Nenhuma reunião encontrada para o período selecionado.');
      return;
    }

    // Cálculos consolidados
    const totalReunioes = reunioesPeriodo.length;
    let totalPresencas = 0;
    let totalFaltas = 0;
    let totalMembros = 0;

    reunioesPeriodo.forEach((r) => {
      const parts = r.participantes || [];
      totalMembros += parts.length;
      totalPresencas += parts.filter((p) => p.presente === true).length;
      totalFaltas += parts.filter((p) => p.presente === false).length;
    });

    const taxaPresencaGeral =
      totalMembros > 0 ? Math.round((totalPresencas / totalMembros) * 100) : 0;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Logotipo da Igreja (mesmas coordenadas 14, 10, 30, 30)
    try {
      doc.addImage(logoIgreja, 'PNG', 14, 10, 30, 30);
    } catch (error) {
      console.warn('Erro ao carregar logotipo no PDF:', error);
    }

    // Título e Período
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('Relatório Consolidado de Reuniões', 48, 19);

    const formatarDataSimples = (dStr: string) => {
      if (!dStr) return '';
      const [ano, mes, dia] = dStr.split('-');
      return `${dia}/${mes}/${ano}`;
    };

    const periodoTexto =
      dataInicialRel && dataFinalRel
        ? `Período: ${formatarDataSimples(dataInicialRel)} a ${formatarDataSimples(dataFinalRel)}`
        : dataInicialRel
        ? `A partir de: ${formatarDataSimples(dataInicialRel)}`
        : dataFinalRel
        ? `Até: ${formatarDataSimples(dataFinalRel)}`
        : 'Período: Todas as reuniões';

    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text(periodoTexto, 48, 27);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const dataGeracao = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.text(`Gerado em: ${dataGeracao}`, 48, 35);

    // Linha divisória
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 44, pageWidth - 14, 44);

    // Bloco de Resumo Consolidado
    const resumoY = 48;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, resumoY, pageWidth - 28, 22, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, resumoY, pageWidth - 28, 22, 2, 2, 'S');

    // Total de Reuniões
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL DE REUNIÕES', 20, resumoY + 7);
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(String(totalReunioes), 20, resumoY + 16);

    // Total de Presenças
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL DE PRESENÇAS', 75, resumoY + 7);
    doc.setFontSize(12);
    doc.setTextColor(22, 163, 74);
    doc.text(`${totalPresencas} (${taxaPresencaGeral}%)`, 75, resumoY + 16);

    // Total de Faltas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL DE FALTAS', 140, resumoY + 7);
    doc.setFontSize(12);
    doc.setTextColor(220, 38, 38);
    doc.text(`${totalFaltas} (${totalMembros > 0 ? 100 - taxaPresencaGeral : 0}%)`, 140, resumoY + 16);

    // Tabela Consolidada (autoTable)
    const rows = reunioesPeriodo.map((r) => {
      const parts = r.participantes || [];
      const totalP = parts.length;
      const pres = parts.filter((p) => p.presente === true).length;
      const falt = totalP - pres;
      return [
        formatarDataHora(r.data),
        r.titulo,
        String(totalP),
        String(pres),
        String(falt),
      ];
    });

    autoTable(doc, {
      startY: resumoY + 28,
      head: [['Data', 'Título', 'Total Membros', 'Presentes', 'Faltas']],
      body: rows,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [51, 65, 85],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 35, halign: 'center' },
        1: { cellWidth: 'auto', halign: 'left' },
        2: { cellWidth: 28, halign: 'center' },
        3: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14, bottom: 20 },
      didParseCell: (data) => {
        if (data.section === 'body') {
          if (data.column.index === 3) {
            data.cell.styles.textColor = [22, 163, 74];
          } else if (data.column.index === 4) {
            data.cell.styles.textColor = [220, 38, 38];
          }
        }
      },
    });

    // Numeração de Páginas
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth - 14,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      );
    }

    doc.save('relatorio_reunioes_periodo.pdf');

    // Fechar modal e limpar filtros de data
    setIsRelatorioModalOpen(false);
    setDataInicialRel('');
    setDataFinalRel('');
  };

  return (
    <>
      {toast && (
        <Toast
          mensagem={toast.mensagem}
          tipo={toast.tipo}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal Formulário de Reunião */}
      {modalFormAberto && (
        <ModalReuniaoForm
          reuniaoEditada={reuniaoParaEditar}
          onClose={() => {
            setModalFormAberto(false);
            setReuniaoParaEditar(null);
          }}
          onSalvar={handleSalvarReuniao}
          isLoading={isSaving}
        />
      )}

      {/* Modal Lista de Presença */}
      {reuniaoPresencaAtual && (
        <ModalPresenca
          reuniao={reuniaoPresencaAtual}
          membros={membros}
          onClose={() => setReuniaoPresenca(null)}
          onAtualizarParticipantes={handleAtualizarParticipantes}
        />
      )}

      <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Gestão de Reuniões
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Agende reuniões de liderança, assembleias e gerencie a lista de presença dos membros.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsRelatorioModalOpen(true)}
              className="py-2.5 px-4 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 text-blue-900 font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <FileText size={16} className="text-blue-700" />
              Relatório Geral
            </button>
            <button
              onClick={() => {
                setReuniaoParaEditar(null);
                setModalFormAberto(true);
              }}
              className="bg-blue-900 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus size={16} />
              Nova Reunião
            </button>
          </div>
        </header>

        {/* Barra de Filtro / Busca */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={18} className="absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar reunião por título ou pauta..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Listagem em Cards */}
        {carregando ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <Spinner />
              <p className="text-sm font-medium">Carregando reuniões...</p>
            </div>
          </div>
        ) : reunioesFiltradas.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-20 gap-4 border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <CalendarDays size={28} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-gray-900 font-bold text-base">
                {reunioes.length === 0
                  ? 'Nenhuma reunião agendada encontrada.'
                  : 'Nenhuma reunião encontrada com o filtro atual.'}
              </p>
              <p className="text-gray-400 text-sm font-medium mt-1">
                Clique em "+ Nova Reunião" para começar a agendar.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reunioesFiltradas.map((reuniao) => {
              const total = reuniao.participantes?.length || 0;
              const presentes = reuniao.participantes?.filter((p) => p.presente).length || 0;

              return (
                <div
                  key={reuniao.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-blue-100 p-2.5 rounded-xl flex-shrink-0">
                        <CalendarDays size={18} className="text-blue-700" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-gray-900 font-bold text-base leading-tight truncate">
                          {reuniao.titulo}
                        </h3>
                        <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                          Agendada
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-col gap-2.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={15} className="text-gray-400 flex-shrink-0" />
                      <span className="font-semibold text-gray-800">
                        {formatarDataHora(reuniao.data)}
                      </span>
                    </div>

                    {reuniao.descricao && (
                      <div className="flex items-start gap-2 text-gray-600">
                        <FileText size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-500 line-clamp-2">
                          {reuniao.descricao}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-gray-600 pt-1">
                      <Users size={15} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-700">
                        {total > 0 ? (
                          <>
                            <strong className="text-blue-900 font-bold">{presentes}</strong> presentes
                            de {total} membros
                          </>
                        ) : (
                          'Nenhum participante adicionado'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReuniaoPresenca(reuniao)}
                        className="flex-1 py-2.5 rounded-xl border border-blue-200 text-blue-700 font-bold text-xs hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckSquare size={15} />
                        Lista de Presença
                      </button>
                      <button
                        onClick={() => gerarRelatorioPresencaPDF(reuniao)}
                        className="flex-1 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 hover:bg-blue-100 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        title="Baixar Relatório PDF de Presença"
                      >
                        <Download size={15} className="text-blue-700" />
                        Relatório PDF
                      </button>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setReuniaoParaEditar(reuniao);
                          setModalFormAberto(true);
                        }}
                        className="flex-1 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                        title="Editar Reunião"
                      >
                        <Pencil size={13} />
                        Editar
                      </button>
                      <button
                        onClick={() => handleExcluirReuniao(reuniao.id)}
                        className="flex-1 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                        title="Excluir Reunião"
                      >
                        <Trash2 size={13} />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Relatório Consolidado por Período */}
      {isRelatorioModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsRelatorioModalOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2.5 rounded-xl">
                  <FileText size={18} className="text-blue-700" />
                </div>
                <div>
                  <h2 className="text-gray-900 font-bold text-base leading-tight">
                    Relatório por Período
                  </h2>
                  <p className="text-gray-400 text-xs font-medium mt-0.5">
                    Selecione as datas para consolidar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRelatorioModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Inputs */}
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={dataInicialRel}
                  onChange={(e) => setDataInicialRel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Data Final
                </label>
                <input
                  type="date"
                  value={dataFinalRel}
                  onChange={(e) => setDataFinalRel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed">
                Deixe em branco para incluir todas as reuniões cadastradas.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsRelatorioModalOpen(false);
                  setDataInicialRel('');
                  setDataFinalRel('');
                }}
                className="py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={gerarRelatorioPeriodoPDF}
                className="py-2.5 px-5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
              >
                <Download size={14} />
                Gerar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
