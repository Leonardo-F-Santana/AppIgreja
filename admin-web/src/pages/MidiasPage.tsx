import { useState, useEffect, useRef } from 'react';
import {
  Image, Plus, Trash2, Pencil, X, Search, Upload,
  AlertTriangle, Clock, Eye, ChevronLeft
} from 'lucide-react';
import {
  ouvirAlbuns,
  criarAlbum,
  editarTituloAlbum,
  adicionarFotosAoAlbum,
  removerFotoDoAlbum,
  deletarAlbum,
  type Album,
} from '../services/albunsService';

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
      ${tipo === 'sucesso' ? 'bg-blue-600' : 'bg-red-600'}`}
    >
      {tipo === 'sucesso' ? <Image size={16} /> : <AlertTriangle size={16} />}
      <span>{mensagem}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}


// ─── Modal de Criação de Álbum ────────────────────────────────────────────────

interface ModalCriarProps {
  onClose: () => void;
  onSalvar: (titulo: string, ficheiros: File[]) => Promise<void>;
  isLoading: boolean;
}

function ModalCriar({ onClose, onSalvar, isLoading }: ModalCriarProps) {
  const [titulo, setTitulo] = useState('');
  const [ficheiros, setFicheiros] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gera previews ao selecionar ficheiros
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFicheiros(files);

    // Gerar previews
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => {
      // Revoke previews anteriores
      prev.forEach((url) => URL.revokeObjectURL(url));
      return newPreviews;
    });
  };

  // Limpa previews ao desmontar
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || ficheiros.length === 0) return;
    await onSalvar(titulo, ficheiros);
  };

  const removerPreview = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFicheiros((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl">
              <Image size={18} className="text-blue-700" />
            </div>
            <h2 className="text-gray-900 font-bold text-lg">Novo Álbum</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5 overflow-y-auto">
          {/* Título */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Título do Álbum</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Culto de Adoração - Outubro 2026"
              required
              maxLength={120}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Upload de Fotos */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fotos</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload size={20} className="text-blue-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-700">Clique para selecionar fotos</p>
                <p className="text-xs text-gray-400 mt-1">Pode selecionar várias imagens de uma vez</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFilesChange}
              className="hidden"
            />
          </div>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {previews.length} foto{previews.length !== 1 ? 's' : ''} selecionada{previews.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={preview}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removerPreview(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X size={12} />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Capa
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !titulo.trim() || ficheiros.length === 0}
              className="flex-1 py-3 rounded-xl bg-blue-900 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Enviando...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Criar Álbum
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal de Confirmação de Exclusão ─────────────────────────────────────────

interface ModalConfirmacaoProps {
  tituloAlbum: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  isLoading: boolean;
}

function ModalConfirmacao({ tituloAlbum, onConfirmar, onCancelar, isLoading }: ModalConfirmacaoProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-8 py-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-gray-900 font-bold text-lg mb-1">Excluir Álbum</h2>
            <p className="text-gray-500 text-sm font-medium">
              Tem certeza que deseja excluir <span className="font-bold text-gray-700">"{tituloAlbum}"</span>?
              Todas as fotos serão removidas. Esta ação não pode ser desfeita.
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
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Lightbox para visualizar foto em tamanho real ────────────────────────────

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
      >
        <X size={20} />
      </button>
      <img
        src={url}
        alt="Foto em tamanho real"
        className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarData(ts: Album['createdAt']): string {
  if (!ts) return '—';
  const date = ts.toDate();
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Vista de Detalhes (Edição) de um Álbum ──────────────────────────────────

interface AlbumDetalhesProps {
  album: Album;
  onVoltar: () => void;
  onToast: (msg: string, tipo: 'sucesso' | 'erro') => void;
}

function AlbumDetalhes({ album, onVoltar, onToast }: AlbumDetalhesProps) {
  const [titulo, setTitulo] = useState(album.titulo);
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [removendoFoto, setRemovendoFoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Atualiza o estado local quando o álbum muda (real-time)
  useEffect(() => {
    setTitulo(album.titulo);
  }, [album.titulo]);

  // ── Salvar título ──
  const handleSalvarTitulo = async () => {
    if (!titulo.trim() || titulo === album.titulo) {
      setEditandoTitulo(false);
      setTitulo(album.titulo);
      return;
    }
    setIsSaving(true);
    try {
      await editarTituloAlbum(album.id, titulo.trim());
      setEditandoTitulo(false);
      onToast('Título atualizado com sucesso!', 'sucesso');
    } catch {
      onToast('Erro ao atualizar título.', 'erro');
      setTitulo(album.titulo);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Adicionar mais fotos ──
  const handleAdicionarFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      await adicionarFotosAoAlbum(album.id, files);
      onToast(`${files.length} foto${files.length > 1 ? 's adicionadas' : ' adicionada'} com sucesso!`, 'sucesso');
    } catch {
      onToast('Erro ao adicionar fotos.', 'erro');
    } finally {
      setIsUploading(false);
      // Limpa o input para permitir selecionar os mesmos ficheiros novamente
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Remover foto individual ──
  const handleRemoverFoto = async (fotoUrl: string) => {
    setRemovendoFoto(fotoUrl);
    try {
      await removerFotoDoAlbum(album.id, fotoUrl, album.fotos);
      onToast('Foto removida com sucesso!', 'sucesso');
    } catch {
      onToast('Erro ao remover foto.', 'erro');
    } finally {
      setRemovendoFoto(null);
    }
  };

  return (
    <>
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-10">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            onClick={onVoltar}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors"
          >
            <ChevronLeft size={18} />
            Voltar para álbuns
          </button>
        </div>

        {/* Título editável */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {editandoTitulo ? (
            <div className="flex items-center gap-2 flex-1 w-full">
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={120}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSalvarTitulo();
                  if (e.key === 'Escape') {
                    setEditandoTitulo(false);
                    setTitulo(album.titulo);
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-blue-300 bg-white text-gray-900 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button
                onClick={handleSalvarTitulo}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-60"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => {
                  setEditandoTitulo(false);
                  setTitulo(album.titulo);
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{album.titulo}</h1>
              <button
                onClick={() => setEditandoTitulo(true)}
                className="p-2 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
                title="Editar título"
              >
                <Pencil size={16} />
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
            <Image size={12} />
            {album.fotos.length} foto{album.fotos.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
            <Clock size={12} />
            {formatarData(album.createdAt)}
          </span>
        </div>

        {/* Botão Adicionar Fotos */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-blue-900 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Enviando...
              </>
            ) : (
              <>
                <Plus size={16} />
                Adicionar Fotos
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleAdicionarFotos}
            className="hidden"
          />
        </div>

        {/* Grelha de fotos */}
        {album.fotos.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Image size={28} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-gray-900 font-bold text-base">Nenhuma foto neste álbum</p>
              <p className="text-gray-400 text-sm font-medium mt-1">
                Clique em "Adicionar Fotos" para começar.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {album.fotos.map((url, idx) => (
              <div
                key={url}
                className="relative group aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <img
                  src={url}
                  alt={`Foto ${idx + 1} do álbum ${album.titulo}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Overlay com ações */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setLightboxUrl(url)}
                    className="w-9 h-9 bg-white/90 hover:bg-white text-gray-800 rounded-xl flex items-center justify-center shadow-lg transition-colors"
                    title="Visualizar"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleRemoverFoto(url)}
                    disabled={removendoFoto === url}
                    className="w-9 h-9 bg-red-600/90 hover:bg-red-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-colors disabled:opacity-60"
                    title="Remover foto"
                  >
                    {removendoFoto === url ? (
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>

                {/* Badge de capa */}
                {idx === 0 && (
                  <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                    Capa
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Página Principal de Mídias ──────────────────────────────────────────────

type ModalState =
  | { tipo: 'nenhum' }
  | { tipo: 'criar' }
  | { tipo: 'excluir'; album: Album };

export default function MidiasPage() {
  const [albuns, setAlbuns] = useState<Album[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState<ModalState>({ tipo: 'nenhum' });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [albumAberto, setAlbumAberto] = useState<string | null>(null);

  // Escuta em tempo real
  useEffect(() => {
    const unsubscribe = ouvirAlbuns((dados) => {
      setAlbuns(dados);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtros
  const albunsFiltrados = albuns.filter((a) =>
    a.titulo.toLowerCase().includes(busca.toLowerCase())
  );

  // Encontra o álbum aberto (com dados em tempo real)
  const albumDetalhe = albumAberto
    ? albuns.find((a) => a.id === albumAberto) ?? null
    : null;

  // ── Handlers ──

  const handleCriar = async (titulo: string, ficheiros: File[]) => {
    setIsSaving(true);
    try {
      await criarAlbum({ titulo }, ficheiros);
      setModal({ tipo: 'nenhum' });
      setToast({ mensagem: 'Álbum criado com sucesso!', tipo: 'sucesso' });
    } catch {
      setToast({ mensagem: 'Erro ao criar álbum. Tente novamente.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExcluir = async () => {
    if (modal.tipo !== 'excluir') return;
    setIsSaving(true);
    try {
      await deletarAlbum(modal.album.id, modal.album.fotos);
      setModal({ tipo: 'nenhum' });
      // Se o álbum excluído era o que estava aberto, volta à lista
      if (albumAberto === modal.album.id) setAlbumAberto(null);
      setToast({ mensagem: 'Álbum excluído com sucesso.', tipo: 'sucesso' });
    } catch {
      setToast({ mensagem: 'Erro ao excluir álbum. Tente novamente.', tipo: 'erro' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToast = (msg: string, tipo: 'sucesso' | 'erro') => {
    setToast({ mensagem: msg, tipo });
  };

  // ── Se um álbum está aberto, mostra a vista de detalhes ──
  if (albumDetalhe) {
    return (
      <>
        {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} onClose={() => setToast(null)} />}
        <AlbumDetalhes
          album={albumDetalhe}
          onVoltar={() => setAlbumAberto(null)}
          onToast={handleToast}
        />
      </>
    );
  }

  return (
    <>
      {/* Toast */}
      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} onClose={() => setToast(null)} />}

      {/* Modais */}
      {modal.tipo === 'criar' && (
        <ModalCriar
          onClose={() => setModal({ tipo: 'nenhum' })}
          onSalvar={handleCriar}
          isLoading={isSaving}
        />
      )}
      {modal.tipo === 'excluir' && (
        <ModalConfirmacao
          tituloAlbum={modal.album.titulo}
          onConfirmar={handleExcluir}
          onCancelar={() => setModal({ tipo: 'nenhum' })}
          isLoading={isSaving}
        />
      )}

      {/* Conteúdo da Página */}
      <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-10">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mídias</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Gerencie os álbuns de fotos da comunidade.
            </p>
          </div>
          <button
            onClick={() => setModal({ tipo: 'criar' })}
            className="bg-blue-900 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={16} />
            Novo Álbum
          </button>
        </header>

        {/* Barra de Busca */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar álbum por título..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Conteúdo */}
        {carregando ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-sm font-medium">Carregando álbuns...</p>
            </div>
          </div>
        ) : albunsFiltrados.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Image size={28} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-gray-900 font-bold text-base">
                {busca ? 'Nenhum álbum encontrado' : 'Nenhum álbum criado'}
              </p>
              <p className="text-gray-400 text-sm font-medium mt-1">
                {busca
                  ? 'Tente ajustar a busca.'
                  : 'Clique em "+ Novo Álbum" para criar o primeiro.'}
              </p>
            </div>
            {!busca && (
              <button
                onClick={() => setModal({ tipo: 'criar' })}
                className="mt-2 bg-blue-900 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Novo Álbum
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Contador */}
            <p className="text-xs font-semibold text-gray-400 px-1">
              {albunsFiltrados.length} álbum{albunsFiltrados.length !== 1 ? 's' : ''} encontrado{albunsFiltrados.length !== 1 ? 's' : ''}
            </p>

            {/* Grelha de Álbuns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {albunsFiltrados.map((album) => (
                <div
                  key={album.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
                >
                  {/* Imagem de capa */}
                  <div
                    className="aspect-video bg-gray-100 relative cursor-pointer overflow-hidden"
                    onClick={() => setAlbumAberto(album.id)}
                  >
                    {album.capa ? (
                      <img
                        src={album.capa}
                        alt={`Capa do álbum ${album.titulo}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image size={40} className="text-gray-300" />
                      </div>
                    )}
                    {/* Badge de contagem */}
                    <span className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                      {album.fotos.length} foto{album.fotos.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setAlbumAberto(album.id)}
                    >
                      <h3 className="text-gray-900 font-bold text-sm truncate">{album.titulo}</h3>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mt-1">
                        <Clock size={11} />
                        {formatarData(album.createdAt)}
                      </span>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setAlbumAberto(album.id)}
                        className="p-2 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Ver / Editar álbum"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setModal({ tipo: 'excluir', album })}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Excluir álbum"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
