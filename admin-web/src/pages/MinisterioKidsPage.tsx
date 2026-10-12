import { useState, useEffect, useMemo } from 'react';
import {
  Baby,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Phone,
  User,
  Sparkles,
  Heart,
  Eye,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import {
  ouvirKids,
  addKid,
  updateKid,
  deleteKid,
  type Crianca,
  type FichaInclusao,
} from '../services/kidsService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dataParaInput(dataStr: string): string {
  if (!dataStr) return '';
  if (dataStr.includes('-') && dataStr.length === 10) return dataStr;
  if (dataStr.includes('/')) {
    const partes = dataStr.split('/');
    if (partes.length === 3) {
      const [dia, mes, ano] = partes;
      return `${ano.padStart(4, '20')}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
  }
  return dataStr;
}

function formatarDataBR(dataStr: string): string {
  if (!dataStr) return '—';
  try {
    if (dataStr.includes('/')) return dataStr;
    const [ano, mes, dia] = dataStr.split('-');
    if (ano && mes && dia) return `${dia}/${mes}/${ano}`;
    return dataStr;
  } catch {
    return dataStr;
  }
}

function calcularIdade(dataNascStr: string): string {
  if (!dataNascStr) return '—';
  try {
    const hoje = new Date();
    let ano = 0, mes = 0, dia = 0;
    if (dataNascStr.includes('/')) {
      const partes = dataNascStr.split('/').map(Number);
      dia = partes[0];
      mes = partes[1];
      ano = partes[2];
    } else if (dataNascStr.includes('-')) {
      const partes = dataNascStr.split('-').map(Number);
      ano = partes[0];
      mes = partes[1];
      dia = partes[2];
    }
    if (!ano || !mes || !dia) return '—';

    let anos = hoje.getFullYear() - ano;
    let meses = hoje.getMonth() + 1 - mes;
    if (hoje.getDate() < dia) meses--;
    if (meses < 0) {
      anos--;
      meses += 12;
    }
    if (anos <= 0) {
      return `${Math.max(0, meses)} ${meses === 1 ? 'mês' : 'meses'}`;
    }
    return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  } catch {
    return '—';
  }
}

function temFichaInclusaoValida(ficha?: FichaInclusao): boolean {
  if (!ficha) return false;
  return Boolean(
    ficha.condicao?.trim() ||
    ficha.alergias?.trim() ||
    ficha.gatilhos?.trim() ||
    ficha.comoAcalmar?.trim()
  );
}

// ─── Componente Spinner ────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Modal de Detalhes / Ficha de Acolhimento ─────────────────────────────────

interface ModalDetalhesKidsProps {
  crianca: Crianca;
  onClose: () => void;
  onEditar: () => void;
}

function ModalDetalhesKids({ crianca, onClose, onEditar }: ModalDetalhesKidsProps) {
  const possuiInclusao = temFichaInclusaoValida(crianca.fichaInclusao);
  const ficha = crianca.fichaInclusao;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${possuiInclusao ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'}`}>
              <Baby size={20} />
            </div>
            <div>
              <h2 className="text-gray-900 font-bold text-lg leading-tight">
                {crianca.nome}
              </h2>
              <p className="text-gray-400 text-xs font-medium mt-0.5">
                Idade: {calcularIdade(crianca.dataNascimento)} • Nasc: {formatarDataBR(crianca.dataNascimento)}
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

        {/* Content */}
        <div className="p-8 flex flex-col gap-6 overflow-y-auto">
          {/* Badge de Destaque Inclusão */}
          {possuiInclusao ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <Sparkles size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Ficha de Inclusão Ativa • Atenção Especial
                </p>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Esta criança necessita de acolhimento adaptado. Consulte os gatilhos e estratégias abaixo antes de conduzir as atividades.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3 text-xs text-blue-800 flex items-center gap-2">
              <Baby size={16} className="text-blue-600 flex-shrink-0" />
              <span>Criança sem ficha de inclusão ou necessidades especiais registradas.</span>
            </div>
          )}

          {/* Dados do Responsável */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col gap-2.5">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Contatos de Emergência
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-700">
                <User size={15} className="text-blue-600 flex-shrink-0" />
                <span>
                  <strong>Responsável:</strong> {crianca.nomeResponsavel || 'Não informado'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone size={15} className="text-green-600 flex-shrink-0" />
                <span>
                  <strong>Telefone:</strong>{' '}
                  {crianca.telefoneEmergencia ? (
                    <a
                      href={`tel:${crianca.telefoneEmergencia.replace(/\D/g, '')}`}
                      className="text-blue-700 font-bold hover:underline"
                    >
                      {crianca.telefoneEmergencia}
                    </a>
                  ) : (
                    'Não informado'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Ficha de Inclusão Detalhada */}
          {possuiInclusao && ficha && (
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Heart size={15} className="text-rose-600" />
                Guia de Acolhimento e Cuidados
              </h3>

              {ficha.condicao && (
                <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                    Condição / Diagnóstico (Ex: Autismo, TDAH)
                  </span>
                  <p className="text-xs text-gray-800 leading-relaxed font-semibold">
                    {ficha.condicao}
                  </p>
                </div>
              )}

              {ficha.alergias && (
                <div className="p-3.5 rounded-2xl bg-red-50/60 border border-red-100">
                  <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <AlertCircle size={13} className="text-red-600" />
                    Alergias / Restrições Alimentares
                  </span>
                  <p className="text-xs text-red-950 leading-relaxed font-medium">
                    {ficha.alergias}
                  </p>
                </div>
              )}

              {ficha.gatilhos && (
                <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-100">
                  <span className="text-[11px] font-bold text-orange-900 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <ShieldAlert size={13} className="text-orange-600" />
                    Gatilhos (Barulho, Luz, Toque, Multidão, etc.)
                  </span>
                  <p className="text-xs text-gray-800 leading-relaxed">
                    {ficha.gatilhos}
                  </p>
                </div>
              )}

              {ficha.comoAcalmar && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-emerald-600" />
                    Como Acalmar e Métodos Eficazes de Acolhimento
                  </span>
                  <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                    {ficha.comoAcalmar}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50/50">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEditar();
            }}
            className="py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold text-xs transition-colors flex items-center gap-2"
          >
            <Pencil size={14} />
            Editar Cadastro
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Criação / Edição de Criança ──────────────────────────────────────

interface ModalCriancaFormProps {
  criancaEditada?: Crianca | null;
  onClose: () => void;
  onSalvar: (dados: Omit<Crianca, 'id' | 'criadoEm'>) => Promise<void>;
  isLoading: boolean;
}

function ModalCriancaForm({
  criancaEditada,
  onClose,
  onSalvar,
  isLoading,
}: ModalCriancaFormProps) {
  const isEditing = !!criancaEditada;

  const [nome, setNome] = useState(criancaEditada?.nome || '');
  const [dataNascimento, setDataNascimento] = useState(dataParaInput(criancaEditada?.dataNascimento || ''));
  const [nomeResponsavel, setNomeResponsavel] = useState(criancaEditada?.nomeResponsavel || '');
  const [telefoneEmergencia, setTelefoneEmergencia] = useState(criancaEditada?.telefoneEmergencia || '');
  const [membroIdResponsavel, setMembroIdResponsavel] = useState(criancaEditada?.membroIdResponsavel || '');

  // Ficha de Inclusão
  const [possuiInclusao, setPossuiInclusao] = useState(
    Boolean(temFichaInclusaoValida(criancaEditada?.fichaInclusao))
  );
  const [condicao, setCondicao] = useState(criancaEditada?.fichaInclusao?.condicao || '');
  const [alergias, setAlergias] = useState(criancaEditada?.fichaInclusao?.alergias || '');
  const [gatilhos, setGatilhos] = useState(criancaEditada?.fichaInclusao?.gatilhos || '');
  const [comoAcalmar, setComoAcalmar] = useState(criancaEditada?.fichaInclusao?.comoAcalmar || '');

  useEffect(() => {
    if (criancaEditada) {
      setNome(criancaEditada.nome || '');
      setDataNascimento(dataParaInput(criancaEditada.dataNascimento || ''));
      setNomeResponsavel(criancaEditada.nomeResponsavel || '');
      setTelefoneEmergencia(criancaEditada.telefoneEmergencia || '');
      setMembroIdResponsavel(criancaEditada.membroIdResponsavel || '');
      const temInclusao = Boolean(temFichaInclusaoValida(criancaEditada.fichaInclusao));
      setPossuiInclusao(temInclusao);
      setCondicao(criancaEditada.fichaInclusao?.condicao || '');
      setAlergias(criancaEditada.fichaInclusao?.alergias || '');
      setGatilhos(criancaEditada.fichaInclusao?.gatilhos || '');
      setComoAcalmar(criancaEditada.fichaInclusao?.comoAcalmar || '');
    } else {
      setNome('');
      setDataNascimento('');
      setNomeResponsavel('');
      setTelefoneEmergencia('');
      setMembroIdResponsavel('');
      setPossuiInclusao(false);
      setCondicao('');
      setAlergias('');
      setGatilhos('');
      setComoAcalmar('');
    }
  }, [criancaEditada]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !nomeResponsavel.trim()) return;

    const payload: Omit<Crianca, 'id' | 'criadoEm'> = {
      nome: nome.trim(),
      dataNascimento: dataNascimento.trim(),
      nomeResponsavel: nomeResponsavel.trim(),
      telefoneEmergencia: telefoneEmergencia.trim(),
      membroIdResponsavel: membroIdResponsavel.trim() || '',
      fichaInclusao: possuiInclusao
        ? {
          condicao: condicao.trim(),
          alergias: alergias.trim(),
          gatilhos: gatilhos.trim(),
          comoAcalmar: comoAcalmar.trim(),
        }
        : (null as any),
    };

    await onSalvar(payload);
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all';
  const labelClass = 'text-xs font-bold text-gray-600 uppercase tracking-wider mb-1 block';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl text-blue-700">
              <Baby size={18} />
            </div>
            <div>
              <h2 className="text-gray-900 font-bold text-lg leading-tight">
                {isEditing ? 'Editar Criança' : 'Nova Criança no Ministério Kids'}
              </h2>
              <p className="text-gray-400 text-xs font-medium mt-0.5">
                Cadastro e ficha de acolhimento inclusivo
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-4 overflow-y-auto">
          {/* Dados Básicos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelClass}>
                Nome da Criança <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Gabriel Silva Santos"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Data de Nascimento</label>
              <input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Nome do Responsável <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nomeResponsavel}
                onChange={(e) => setNomeResponsavel(e.target.value)}
                placeholder="Ex: Ana Paula Silva"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Telefone / WhatsApp de Emergência</label>
              <input
                type="tel"
                value={telefoneEmergencia}
                onChange={(e) => setTelefoneEmergencia(e.target.value)}
                placeholder="(00) 00000-0000"
                className={inputClass}
              />
            </div>
          </div>

          {/* Toggle Ficha de Inclusão */}
          <div className="border-t border-gray-100 pt-3">
            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 cursor-pointer hover:bg-amber-50 transition-colors select-none">
              <input
                type="checkbox"
                checked={possuiInclusao}
                onChange={(e) => setPossuiInclusao(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-gray-300"
              />
              <div className="flex-1">
                <span className="text-xs font-bold text-amber-900 block flex items-center gap-1.5">
                  Ativar Ficha de Inclusão (Atenção Especial / Neurodivergência)
                </span>
                <span className="text-[11px] text-amber-700">
                  Por favor, marque caso seu filho tenha alguma deficiência, transtorno do neurodesenvolvimento (como autismo ou TDAH) ou alergia.
                </span>
              </div>
            </label>
          </div>

          {/* Campos da Ficha de Inclusão */}
          {possuiInclusao && (
            <div className="p-4 rounded-2xl bg-gray-50 border border-amber-200 flex flex-col gap-3 animate-in fade-in duration-200">
              <div>
                <label className={labelClass}>Condição / Diagnóstico</label>
                <input
                  type="text"
                  value={condicao}
                  onChange={(e) => setCondicao(e.target.value)}
                  placeholder="Ex: TEA (Autismo Nível 1), TDAH, Síndrome de Down..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Alergias ou Restrições</label>
                <input
                  type="text"
                  value={alergias}
                  onChange={(e) => setAlergias(e.target.value)}
                  placeholder="Ex: Alergia a amendoim, glúten, lactose..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Gatilhos Sensoriais / Emocionais</label>
                <textarea
                  rows={2}
                  value={gatilhos}
                  onChange={(e) => setGatilhos(e.target.value)}
                  placeholder="Ex: Sons muito altos, luzes piscantes, toques inesperados..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>Como Acalmar / Estratégias de Acolhimento</label>
                <textarea
                  rows={2}
                  value={comoAcalmar}
                  onChange={(e) => setComoAcalmar(e.target.value)}
                  placeholder="Ex: Oferecer fone abafador, brinquedo sensorial, falar com tom de voz calmo..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !nome.trim() || !nomeResponsavel.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Spinner /> : isEditing ? 'Salvar Alterações' : 'Cadastrar Criança'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Componente Principal da Página ──────────────────────────────────────────

export default function MinisterioKidsPage() {
  const [kids, setKids] = useState<Crianca[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroApenasInclusao, setFiltroApenasInclusao] = useState(false);

  // Modais
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [kidParaEditar, setKidParaEditar] = useState<Crianca | null>(null);
  const [kidDetalhes, setKidDetalhes] = useState<Crianca | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Listener em tempo real
  useEffect(() => {
    setCarregando(true);
    const unsubscribe = ouvirKids((dados) => {
      setKids(dados);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtragem
  const kidsFiltradas = useMemo(() => {
    return kids.filter((k) => {
      const matchBusca =
        !filtroTexto.trim() ||
        k.nome.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        k.nomeResponsavel.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        k.fichaInclusao?.condicao?.toLowerCase().includes(filtroTexto.toLowerCase());

      const matchInclusao = !filtroApenasInclusao || temFichaInclusaoValida(k.fichaInclusao);

      return matchBusca && matchInclusao;
    });
  }, [kids, filtroTexto, filtroApenasInclusao]);

  // Contagens
  const totalKids = kids.length;
  const totalInclusao = kids.filter((k) => temFichaInclusaoValida(k.fichaInclusao)).length;

  // Salvar
  const handleSalvarCrianca = async (dados: Omit<Crianca, 'id' | 'criadoEm'>) => {
    setSalvando(true);
    try {
      if (kidParaEditar) {
        await updateKid(kidParaEditar.id, dados);
      } else {
        await addKid(dados);
      }
      setModalFormAberto(false);
      setKidParaEditar(null);
    } catch (error: any) {
      console.error('Erro ao salvar criança:', error);
      alert(`Erro ao salvar cadastro da criança: ${error?.message || 'Tente novamente.'}`);
    } finally {
      setSalvando(false);
    }
  };

  // Excluir
  const handleExcluirCrianca = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o cadastro de "${nome}"?`)) return;
    try {
      await deleteKid(id);
    } catch (error) {
      console.error('Erro ao excluir criança:', error);
      alert('Erro ao excluir cadastro.');
    }
  };

  return (
    <>
      {/* Modal de Detalhes / Ficha de Acolhimento */}
      {kidDetalhes && (
        <ModalDetalhesKids
          crianca={kidDetalhes}
          onClose={() => setKidDetalhes(null)}
          onEditar={() => {
            const kid = kidDetalhes;
            setKidDetalhes(null);
            setKidParaEditar(kid);
            setModalFormAberto(true);
          }}
        />
      )}

      {/* Modal Formulário */}
      {modalFormAberto && (
        <ModalCriancaForm
          criancaEditada={kidParaEditar}
          onClose={() => {
            setModalFormAberto(false);
            setKidParaEditar(null);
          }}
          onSalvar={handleSalvarCrianca}
          isLoading={salvando}
        />
      )}

      <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Ministério Kids
              </h1>
              <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-sky-200">
                Inclusivo
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Gestão de crianças, suporte a famílias e acolhimento dedicado à neurodivergência e inclusão.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setKidParaEditar(null);
                setModalFormAberto(true);
              }}
              className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus size={16} />
              Nova Criança
            </button>
          </div>
        </header>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-2xl text-blue-700">
              <Baby size={22} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Total de Crianças
              </span>
              <p className="text-2xl font-extrabold text-gray-900">{totalKids}</p>
            </div>
          </div>

          <div className="bg-white border border-amber-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4 bg-amber-50/30">
            <div className="bg-amber-100 p-3 rounded-2xl text-amber-800">
              <Sparkles size={22} />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Fichas de Inclusão Ativas
              </span>
              <p className="text-2xl font-extrabold text-amber-900">{totalInclusao}</p>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={18} className="absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por criança, responsável ou condição..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFiltroApenasInclusao((prev) => !prev)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${filtroApenasInclusao
                ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
            >
              <Sparkles size={14} className={filtroApenasInclusao ? 'text-amber-600' : 'text-gray-400'} />
              Apenas Ficha de Inclusão ({totalInclusao})
            </button>
          </div>
        </div>

        {/* Listagem de Cards */}
        {carregando ? (
          <div className="flex items-center justify-center py-24 text-gray-400 gap-3">
            <Spinner />
            <span className="text-sm font-medium">Carregando crianças...</span>
          </div>
        ) : kidsFiltradas.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-20 gap-4 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Baby size={28} className="text-gray-400" />
            </div>
            <div>
              <p className="text-gray-900 font-bold text-base">
                {kids.length === 0
                  ? 'Nenhuma criança cadastrada ainda.'
                  : 'Nenhuma criança encontrada com os filtros atuais.'}
              </p>
              <p className="text-gray-400 text-xs font-medium mt-1">
                Clique em "+ Nova Criança" para iniciar os registros do Ministério Kids.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {kidsFiltradas.map((kid) => {
              const possuiInclusao = temFichaInclusaoValida(kid.fichaInclusao);

              return (
                <div
                  key={kid.id}
                  className={`bg-white rounded-2xl border transition-all p-6 flex flex-col gap-4 shadow-sm hover:shadow-md ${possuiInclusao
                    ? 'border-amber-300/80 bg-gradient-to-b from-amber-50/20 to-white'
                    : 'border-gray-100'
                    }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2.5 rounded-2xl flex-shrink-0 ${possuiInclusao
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-700'
                          }`}
                      >
                        <Baby size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-gray-900 font-bold text-base leading-tight truncate">
                          {kid.nome}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {calcularIdade(kid.dataNascimento)} • Nasc: {formatarDataBR(kid.dataNascimento)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Destaque Visual / Badge de Inclusão */}
                  {possuiInclusao ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      <Sparkles size={13} className="text-amber-600 flex-shrink-0" />
                      <span className="truncate">
                        Atenção Especial {kid.fichaInclusao?.condicao ? `• ${kid.fichaInclusao.condicao}` : ''}
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-gray-50 text-gray-500 border border-gray-100">
                      <span>Desenvolvimento Típico</span>
                    </div>
                  )}

                  {/* Informações do Responsável */}
                  <div className="flex flex-col gap-1.5 text-xs text-gray-600 pt-1 border-t border-gray-50">
                    <div className="flex items-center gap-2 truncate">
                      <User size={13} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">
                        <strong>Resp:</strong> {kid.nomeResponsavel}
                      </span>
                    </div>

                    {kid.telefoneEmergencia && (
                      <div className="flex items-center gap-2 truncate">
                        <Phone size={13} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate font-medium text-gray-700">
                          {kid.telefoneEmergencia}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                    <button
                      onClick={() => setKidDetalhes(kid)}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm ${possuiInclusao
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-blue-900 hover:bg-blue-800 text-white'
                        }`}
                    >
                      <Eye size={14} />
                      Ver Detalhes
                    </button>

                    <button
                      onClick={() => {
                        setKidParaEditar(kid);
                        setModalFormAberto(true);
                      }}
                      className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-colors flex items-center justify-center"
                      title="Editar Criança"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => handleExcluirCrianca(kid.id, kid.nome)}
                      className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center"
                      title="Excluir Criança"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
