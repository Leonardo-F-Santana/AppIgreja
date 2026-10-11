import { useState, useEffect } from "react";
import {
  Radio,
  ExternalLink,
  Save,
  Bell,
  Loader2,
} from "lucide-react";
import {
  ouvirTransmissao,
  salvarConfiguracoesTransmissao,
  alternarEstadoAoVivo,
  dispararNotificacaoAoVivo,
  type TransmissaoConfig,
} from "../services/transmissaoService";

interface GestaoTransmissaoCardProps {
  onToast?: (mensagem: string, tipo: "sucesso" | "erro") => void;
}

export default function GestaoTransmissaoCard({ onToast }: GestaoTransmissaoCardProps) {
  const [titulo, setTitulo] = useState("");
  const [linkYoutube, setLinkYoutube] = useState("");
  const [aoVivo, setAoVivo] = useState(false);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [alternandoStatus, setAlternandoStatus] = useState(false);
  const [notificando, setNotificando] = useState(false);

  // Escuta dados em tempo real do documento configuracoes/transmissao
  useEffect(() => {
    const unsub = ouvirTransmissao((dados: TransmissaoConfig | null) => {
      if (dados) {
        setTitulo(dados.titulo || "");
        setLinkYoutube(dados.linkYoutube || "");
        setAoVivo(Boolean(dados.aoVivo));
      }
      setCarregandoInicial(false);
    });

    return () => unsub();
  }, []);

  const dispararToast = (msg: string, tipo: "sucesso" | "erro") => {
    if (onToast) {
      onToast(msg, tipo);
    } else {
      alert(msg);
    }
  };

  // Salvar título e link do YouTube no Firestore
  const handleSalvar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSalvando(true);
    try {
      await salvarConfiguracoesTransmissao({
        titulo: titulo.trim(),
        linkYoutube: linkYoutube.trim(),
        aoVivo,
      });
      dispararToast("Configurações da transmissão salvas com sucesso!", "sucesso");
    } catch (error) {
      console.error("Erro ao salvar transmissão:", error);
      dispararToast("Erro ao salvar dados da transmissão.", "erro");
    } finally {
      setSalvando(false);
    }
  };

  // Alternar o interruptor Online / Offline
  const handleToggleAoVivo = async () => {
    const novoStatus = !aoVivo;
    setAlternandoStatus(true);
    try {
      await alternarEstadoAoVivo(novoStatus);
      setAoVivo(novoStatus);
      dispararToast(
        novoStatus
          ? "Transmissão ativada como AO VIVO!"
          : "Transmissão alterada para OFFLINE.",
        "sucesso"
      );
    } catch (error) {
      console.error("Erro ao alternar status:", error);
      dispararToast("Erro ao alterar status da transmissão.", "erro");
    } finally {
      setAlternandoStatus(false);
    }
  };

  // Disparar Cloud Function para notificar todos os aplicativos
  const handleNotificar = async () => {
    if (!titulo.trim()) {
      dispararToast("Por favor, preencha o título antes de notificar.", "erro");
      return;
    }

    if (!window.confirm(`Deseja enviar notificação push aos membros com o título: "${titulo.trim()}"?`)) {
      return;
    }

    setNotificando(true);
    try {
      // Salva preventivamente o título e link caso o admin não tenha clicado em salvar ainda
      await salvarConfiguracoesTransmissao({
        titulo: titulo.trim(),
        linkYoutube: linkYoutube.trim(),
        aoVivo,
      });

      const res = await dispararNotificacaoAoVivo(titulo.trim());
      if (res.sucesso) {
        dispararToast(
          `Notificação enviada com sucesso para ${res.enviados} membro(s)!`,
          "sucesso"
        );
      } else {
        dispararToast(res.mensagem || "Nenhum membro notificado.", "erro");
      }
    } catch (error: any) {
      console.error("Erro ao disparar notificação:", error);
      dispararToast(
        error?.message || "Falha ao enviar notificação para os aplicativos.",
        "erro"
      );
    } finally {
      setNotificando(false);
    }
  };

  const handleTestarLink = () => {
    if (!linkYoutube.trim()) return;
    let url = linkYoutube.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (carregandoInicial) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-center py-10">
        <Loader2 className="animate-spin text-blue-600" size={24} />
        <span className="ml-3 text-sm font-medium text-gray-500">
          Carregando informações da transmissão...
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-3xl p-6 sm:p-7 shadow-sm border transition-all ${
      aoVivo ? "border-red-300 ring-2 ring-red-100" : "border-gray-100"
    }`}>
      {/* Topo do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${
            aoVivo ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
          }`}>
            <Radio size={24} className={aoVivo ? "animate-pulse" : ""} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Gestão de Transmissão
              </h2>
              {aoVivo ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  AO VIVO
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  OFFLINE
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Defina o link do YouTube, ative o status no app e notifique a membresia.
            </p>
          </div>
        </div>

        {/* Toggle / Interruptor Ao Vivo */}
        <div className="flex items-center gap-3 bg-gray-50 p-2 sm:px-4 sm:py-2.5 rounded-2xl border border-gray-100">
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-gray-700">
              {aoVivo ? "Transmissão no Ar" : "Transmissão Pausada"}
            </span>
            <span className="text-[11px] text-gray-400">
              {aoVivo ? "Visível no app móvel" : "Oculto no app móvel"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleAoVivo}
            disabled={alternandoStatus}
            role="switch"
            aria-checked={aoVivo}
            className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
              aoVivo ? "bg-red-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                aoVivo ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Formulário de Configuração */}
      <form onSubmit={handleSalvar} className="mt-5 flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Título da Transmissão */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Título da Transmissão
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Culto de Celebração - Domingo"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Link do YouTube */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Link da Transmissão (YouTube)
              </label>
              {linkYoutube.trim() && (
                <button
                  type="button"
                  onClick={handleTestarLink}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors"
                >
                  <ExternalLink size={12} />
                  Testar link
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="url"
                value={linkYoutube}
                onChange={(e) => setLinkYoutube(e.target.value)}
                placeholder="Ex: https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Barra de Ações */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          {/* Botão Salvar */}
          <button
            type="submit"
            disabled={salvando}
            className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {salvando ? (
              <Loader2 size={16} className="animate-spin text-gray-500" />
            ) : (
              <Save size={16} />
            )}
            Salvar Dados
          </button>

          {/* Botão Notificar Aplicativos */}
          <button
            type="button"
            onClick={handleNotificar}
            disabled={notificando || !titulo.trim()}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            title={!titulo.trim() ? "Insira o título da transmissão para notificar" : "Disparar push notification"}
          >
            {notificando ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Enviando Push...</span>
              </>
            ) : (
              <>
                <Bell size={16} />
                <span>Notificar Aplicativos</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
