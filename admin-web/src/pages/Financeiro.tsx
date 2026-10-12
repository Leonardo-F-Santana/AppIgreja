import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, Plus, X, 
  Search, FileText, Calendar as CalendarIcon, Tag, Download,
  Target, Pencil, Trash2
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { exportToCSV } from '../utils/exportCSV';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoIgreja from '../assets/logo-black.png';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface Campanha {
  id: string;
  titulo: string;
  descricao: string;
  tipo?: string;
  chaveOuConta?: string;
  chavePix?: string;
  ativo?: boolean;
  dataCriacao?: Timestamp | null;
}

export interface Transacao {
  id: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao: string;
  categoria: string;
  data: Timestamp | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

function formatarData(ts: Timestamp | null): string {
  if (!ts) return '—';
  const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts as any);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ─── Classes Form ────────────────────────────────────────────────────────────

const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
const labelClass = 'text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block';

// ─── Componente Principal ────────────────────────────────────────────────────

export default function Financeiro() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Campanha Modal State
  const [isCampanhaModalOpen, setIsCampanhaModalOpen] = useState(false);
  const [isSubmittingCampanha, setIsSubmittingCampanha] = useState(false);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [campanhaEditando, setCampanhaEditando] = useState<Campanha | null>(null);
  const [tituloCampanha, setTituloCampanha] = useState('');
  const [descricaoCampanha, setDescricaoCampanha] = useState('');
  const [chavePixCampanha, setChavePixCampanha] = useState('');
  
  // Form State
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [dataLocal, setDataLocal] = useState('');

  // ─── Efeito para buscar transações ─────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'transacoes'), orderBy('data', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Transacao[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as Transacao);
      });
      setTransacoes(list);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar transações:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ─── Efeito para buscar campanhas de arrecadação em tempo real ─────────────
  useEffect(() => {
    const q = query(collection(db, 'doacoes'), orderBy('dataCriacao', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Campanha[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            titulo: data.titulo || '',
            descricao: data.descricao || '',
            tipo: data.tipo || 'PIX',
            chaveOuConta: data.chaveOuConta || data.chavePix || '',
            chavePix: data.chavePix || data.chaveOuConta || '',
            ativo: data.ativo ?? true,
            dataCriacao: data.dataCriacao || data.criadoEm || null,
          });
        });
        setCampanhas(list);
      },
      (error) => {
        console.error('Erro ao buscar campanhas:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // ─── Cálculos ──────────────────────────────────────────────────────────────
  const { totalEntradas, totalSaidas, saldoAtual } = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    
    transacoes.forEach(t => {
      if (t.tipo === 'entrada') entradas += t.valor;
      if (t.tipo === 'saida') saidas += t.valor;
    });

    return {
      totalEntradas: entradas,
      totalSaidas: saidas,
      saldoAtual: entradas - saidas,
    };
  }, [transacoes]);

  // Processar dados do Fluxo de Caixa (Recharts)
  const dadosGraficoFinanceiro = useMemo(() => {
    if (!transacoes || transacoes.length === 0) return [];
    
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mapa = new Map<string, { mes: string; entradas: number; saidas: number; order: number }>();
    
    const hoje = new Date();
    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const chave = `${d.getFullYear()}-${d.getMonth()}`;
      mapa.set(chave, { mes: meses[d.getMonth()], entradas: 0, saidas: 0, order: d.getTime() });
    }

    transacoes.forEach(t => {
      if (!t.data) return;
      const date = typeof t.data.toDate === 'function' ? t.data.toDate() : new Date(t.data as any);
      const chave = `${date.getFullYear()}-${date.getMonth()}`;
      if (mapa.has(chave)) {
        const item = mapa.get(chave)!;
        if (t.tipo === 'entrada') item.entradas += t.valor;
        if (t.tipo === 'saida') item.saidas += t.valor;
      }
    });

    return Array.from(mapa.values()).sort((a, b) => a.order - b.order);
  }, [transacoes]);

  // ─── Filtragem ─────────────────────────────────────────────────────────────
  const transacoesFiltradas = transacoes.filter(t => 
    t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenModal = () => {
    setTipo('entrada');
    setValor('');
    setDescricao('');
    setCategoria('Dízimo'); // default
    setDataLocal(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor || !descricao || !categoria || !dataLocal) return;

    setIsSubmitting(true);
    try {
      const parsedValor = parseFloat(valor.replace(',', '.'));
      const dataFormatada = new Date(dataLocal + 'T12:00:00'); // evita timezone offset do localDate

      await addDoc(collection(db, 'transacoes'), {
        tipo,
        valor: parsedValor,
        descricao: descricao.trim(),
        categoria,
        data: Timestamp.fromDate(dataFormatada)
      });
      
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      alert("Houve um erro ao salvar a transação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Ações de Campanhas de Arrecadação ────────────────────────────────────
  const handleAbrirEdicaoCampanha = (campanha: Campanha) => {
    setCampanhaEditando(campanha);
    setTituloCampanha(campanha.titulo);
    setDescricaoCampanha(campanha.descricao || '');
    setChavePixCampanha(campanha.chavePix || campanha.chaveOuConta || '');
    setIsCampanhaModalOpen(true);
  };

  const handleFecharModalCampanha = () => {
    setIsCampanhaModalOpen(false);
    setCampanhaEditando(null);
    setTituloCampanha('');
    setDescricaoCampanha('');
    setChavePixCampanha('');
  };

  const handleExcluirCampanha = async (id: string, titulo: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a campanha "${titulo}"?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'doacoes', id));
      alert('Campanha excluída com sucesso.');
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
      alert('Erro ao excluir campanha.');
    }
  };

  const handleSalvarCampanha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloCampanha.trim() || !chavePixCampanha.trim()) {
      alert('Por favor, preencha o título e a chave Pix da campanha.');
      return;
    }

    setIsSubmittingCampanha(true);
    try {
      if (campanhaEditando) {
        // Atualização da campanha existente
        await updateDoc(doc(db, 'doacoes', campanhaEditando.id), {
          titulo: tituloCampanha.trim(),
          descricao: descricaoCampanha.trim(),
          tipo: 'PIX',
          chaveOuConta: chavePixCampanha.trim(),
          chavePix: chavePixCampanha.trim(),
        });
        alert('Campanha atualizada com sucesso!');
      } else {
        // Criação de nova campanha
        await addDoc(collection(db, 'doacoes'), {
          titulo: tituloCampanha.trim(),
          descricao: descricaoCampanha.trim(),
          tipo: 'PIX',
          chaveOuConta: chavePixCampanha.trim(),
          chavePix: chavePixCampanha.trim(),
          ativo: true,
          dataCriacao: serverTimestamp(),
          criadoEm: serverTimestamp(),
        });
        alert('Campanha de arrecadação criada com sucesso!');
      }

      handleFecharModalCampanha();
    } catch (error) {
      console.error('Erro ao salvar campanha:', error);
      alert('Houve um erro ao salvar a campanha de arrecadação.');
    } finally {
      setIsSubmittingCampanha(false);
    }
  };

  // ─── Opções de Categoria baseadas no Tipo ──────────────────────────────────
  const categoriasEntrada = ['Dízimo', 'Oferta', 'Missões', 'Doação Especial', 'Outros'];
  const categoriasSaida = ['Conta de Luz', 'Conta de Água', 'Aluguel', 'Manutenção', 'Missões', 'Eventos', 'Equipamentos', 'Outros'];
  
  const currentCategorias = tipo === 'entrada' ? categoriasEntrada : categoriasSaida;
  
  // Atualiza a categoria padrão quando muda o tipo se a categoria atual não estiver na lista
  useEffect(() => {
    if (!currentCategorias.includes(categoria)) {
      setCategoria(currentCategorias[0]);
    }
  }, [tipo, categoria, currentCategorias]);

  // ─── Geração de Relatório em PDF ───────────────────────────────────────────
  const gerarRelatorioPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Cabeçalho com Logotipo
    try {
      doc.addImage(logoIgreja, 'PNG', 14, 10, 32, 19);
    } catch (e) {
      console.warn('Erro ao carregar logotipo no PDF:', e);
    }

    // Título Centralizado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('Relatório de Prestação de Contas', pageWidth / 2, 20, { align: 'center' });

    // Data de Geração
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
    doc.text(`Gerado em: ${dataGeracao}`, pageWidth / 2, 26, { align: 'center' });

    // Linha divisória
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 33, pageWidth - 14, 33);

    // Bloco de Resumo Financeiro
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 37, pageWidth - 28, 22, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 37, pageWidth - 28, 22, 2, 2, 'S');

    // Totais: Entradas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL ENTRADAS', 22, 44);
    doc.setFontSize(11);
    doc.setTextColor(22, 163, 74);
    doc.text(formatarMoeda(totalEntradas).replace(/\u00a0/g, ' '), 22, 52);

    // Totais: Saídas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('TOTAL SAÍDAS', 86, 44);
    doc.setFontSize(11);
    doc.setTextColor(220, 38, 38);
    doc.text(formatarMoeda(totalSaidas).replace(/\u00a0/g, ' '), 86, 52);

    // Totais: Saldo Atual
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('SALDO ATUAL', 150, 44);
    doc.setFontSize(11);
    if (saldoAtual >= 0) {
      doc.setTextColor(37, 99, 235);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    doc.text(formatarMoeda(saldoAtual).replace(/\u00a0/g, ' '), 150, 52);

    // Tabela Detalhada de Movimentações
    const rows = transacoesFiltradas.map((t) => [
      formatarData(t.data),
      t.descricao + (t.categoria ? ` (${t.categoria})` : ''),
      t.tipo === 'entrada' ? 'Entrada' : 'Saída',
      (t.tipo === 'entrada' ? '+ ' : '- ') + formatarMoeda(t.valor).replace(/\u00a0/g, ' '),
    ]);

    autoTable(doc, {
      startY: 64,
      head: [['Data', 'Descrição', 'Tipo', 'Valor']],
      body: rows,
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235],
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
        0: { cellWidth: 26, halign: 'center' },
        1: { cellWidth: 'auto', halign: 'left' },
        2: { cellWidth: 24, halign: 'center' },
        3: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14, bottom: 40 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const rowData = rows[data.row.index];
          if (rowData && rowData[2] === 'Entrada') {
            data.cell.styles.textColor = [22, 163, 74];
          } else if (rowData && rowData[2] === 'Saída') {
            data.cell.styles.textColor = [220, 38, 38];
          }
        }
      },
    });

    // Assinaturas
    const pageHeight = doc.internal.pageSize.getHeight();
    const lastY = (doc as any).lastAutoTable?.finalY ?? 70;

    let signY: number;
    if (lastY + 35 > pageHeight - 20) {
      doc.addPage();
      signY = 50;
    } else {
      signY = Math.max(lastY + 25, pageHeight - 35);
    }

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.5);

    // Linha Pastor Presidente
    doc.line(24, signY, 89, signY);
    // Linha Tesoureiro(a)
    doc.line(121, signY, 186, signY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Pastor Presidente', 56.5, signY + 5, { align: 'center' });
    doc.text('Tesoureiro(a)', 153.5, signY + 5, { align: 'center' });

    // Salvar arquivo PDF
    doc.save('prestacao_contas_ide.pdf');
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Financeiro</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Gestão do Livro-Caixa e histórico de transações.</p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Saldo Atual */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="flex justify-between items-start z-10">
            <p className="text-gray-500 font-bold text-xs tracking-wider uppercase">Saldo Atual</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Wallet size={18} strokeWidth={2.5} />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 z-10">{formatarMoeda(saldoAtual)}</h2>
        </div>

        {/* Entradas */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="flex justify-between items-start z-10">
            <p className="text-gray-500 font-bold text-xs tracking-wider uppercase">Entradas</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp size={18} strokeWidth={2.5} />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-blue-600 z-10">{formatarMoeda(totalEntradas)}</h2>
        </div>

        {/* Saídas */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="flex justify-between items-start z-10">
            <p className="text-gray-500 font-bold text-xs tracking-wider uppercase">Saídas</p>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <TrendingDown size={18} strokeWidth={2.5} />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-red-600 z-10">{formatarMoeda(totalSaidas)}</h2>
        </div>
      </div>

      {/* Gráfico de Fluxo de Caixa */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-2">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Fluxo de Caixa (Últimos 6 Meses)</h2>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGraficoFinanceiro} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }} 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
              <Bar dataKey="entradas" fill="#16a34a" name="Entradas" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="saidas" fill="#dc2626" name="Saídas" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela Section */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        {/* Table Header Controls */}
        <div className="p-5 md:px-6 md:py-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Histórico de Transações</h2>
          
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Buscar transação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>
            
            <button
              onClick={() => {
                const dadosFormatados = transacoesFiltradas.map(t => ({
                  'Tipo': t.tipo === 'entrada' ? 'Entrada' : 'Saída',
                  'Descrição': t.descricao,
                  'Categoria': t.categoria,
                  'Data': t.data,
                  'Valor': t.tipo === 'entrada' ? t.valor : -t.valor
                }));
                exportToCSV(dadosFormatados, "relatorio_financeiro.csv");
              }}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors shadow-sm whitespace-nowrap justify-center"
            >
              <Download size={18} />
              Exportar CSV
            </button>

            <button
              onClick={gerarRelatorioPDF}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors shadow-sm whitespace-nowrap justify-center"
            >
              <FileText size={18} />
              Relatório
            </button>

            <button
              onClick={() => setIsCampanhaModalOpen(true)}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors shadow-sm whitespace-nowrap justify-center"
            >
              <Target size={18} className="text-blue-600" />
              <span>Nova Campanha</span>
            </button>

            <button
              onClick={handleOpenModal}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-blue-600/20 transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus size={18} />
              <span>Nova Transação</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold border-b border-gray-100">Descrição</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100">Categoria</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100">Data</th>
                <th className="px-6 py-4 font-bold border-b border-gray-100 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-gray-700 divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p>Carregando transações...</p>
                    </div>
                  </td>
                </tr>
              ) : transacoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-gray-50 p-4 rounded-full mb-2">
                        <FileText size={32} className="text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-semibold text-base">Nenhuma transação encontrada</p>
                      <p className="text-gray-400 text-sm font-medium">Cadastre novas entradas ou saídas para ver o histórico.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transacoesFiltradas.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${t.tipo === 'entrada' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                          {t.tipo === 'entrada' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        </div>
                        <span className="font-semibold text-gray-900">{t.descricao}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      <div className="flex items-center gap-2 bg-gray-100/80 px-2.5 py-1 rounded-md w-max">
                        <Tag size={12} className="text-gray-400" />
                        <span className="text-xs font-bold">{t.categoria}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {formatarData(t.data)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold">
                      <span className={t.tipo === 'entrada' ? 'text-blue-600' : 'text-red-600'}>
                        {t.tipo === 'entrada' ? '+' : '-'} {formatarMoeda(t.valor)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Seção de Campanhas de Arrecadação ─────────────────────────── */}
      <div className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                Campanhas de Arrecadação
              </h2>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {campanhas.length} {campanhas.length === 1 ? 'campanha' : 'campanhas'}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5 font-medium">
              Campanhas ativas exibidas para os membros no App Mobile.
            </p>
          </div>

          <button
            onClick={() => {
              setCampanhaEditando(null);
              setTituloCampanha('');
              setDescricaoCampanha('');
              setChavePixCampanha('');
              setIsCampanhaModalOpen(true);
            }}
            className="self-start sm:self-auto bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm shadow-blue-600/20 active:scale-95"
          >
            <Plus size={16} />
            <span>Nova Campanha</span>
          </button>
        </div>

        {campanhas.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
              <Target size={28} />
            </div>
            <div>
              <p className="text-gray-900 font-bold text-base">Nenhuma campanha cadastrada</p>
              <p className="text-gray-500 text-xs mt-1">
                Crie uma campanha com chave Pix para arrecadar fundos diretamente pelo aplicativo.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campanhas.map((campanha) => (
              <div
                key={campanha.id}
                className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5 group"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-blue-100 p-2.5 rounded-2xl text-blue-700 flex-shrink-0">
                        <Target size={20} />
                      </div>
                      <h3 className="text-gray-900 font-bold text-base leading-tight truncate">
                        {campanha.titulo}
                      </h3>
                    </div>
                  </div>

                  {campanha.descricao ? (
                    <p className="text-gray-600 text-xs leading-relaxed line-clamp-3">
                      {campanha.descricao}
                    </p>
                  ) : (
                    <p className="text-gray-400 text-xs italic">Sem descrição informada.</p>
                  )}

                  {/* Chave Pix */}
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Chave Pix
                    </span>
                    <span className="text-xs font-bold text-gray-800 break-all select-all font-mono">
                      {campanha.chavePix || campanha.chaveOuConta}
                    </span>
                  </div>
                </div>

                {/* Rodapé com Ações */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleAbrirEdicaoCampanha(campanha)}
                    className="flex-1 py-2 px-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-blue-600 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    title="Editar Campanha"
                  >
                    <Pencil size={14} />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => handleExcluirCampanha(campanha.id, campanha.titulo)}
                    className="py-2 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    title="Excluir Campanha"
                  >
                    <Trash2 size={14} />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nova Transação */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2.5 rounded-xl">
                  <Wallet size={18} className="text-blue-700" />
                </div>
                <div>
                  <h2 className="text-gray-900 font-bold text-lg leading-tight">Nova Transação</h2>
                  <p className="text-gray-400 text-xs font-medium mt-0.5">Adicione entradas ou saídas</p>
                </div>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5 overflow-y-auto">
              
              {/* Tipo Radio */}
              <div className="flex gap-4">
                <label className="flex-1 relative cursor-pointer group">
                  <input 
                    type="radio" 
                    name="tipo" 
                    className="peer sr-only"
                    checked={tipo === 'entrada'}
                    onChange={() => setTipo('entrada')}
                  />
                  <div className="w-full py-3 px-4 rounded-xl border-2 border-gray-100 bg-gray-50 text-center peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all">
                    <span className="font-bold text-sm text-gray-400 peer-checked:text-blue-700 flex items-center justify-center gap-2">
                      <TrendingUp size={16} className={tipo === 'entrada' ? 'text-blue-600' : ''} />
                      Entrada
                    </span>
                  </div>
                </label>
                <label className="flex-1 relative cursor-pointer group">
                  <input 
                    type="radio" 
                    name="tipo" 
                    className="peer sr-only"
                    checked={tipo === 'saida'}
                    onChange={() => setTipo('saida')}
                  />
                  <div className="w-full py-3 px-4 rounded-xl border-2 border-gray-100 bg-gray-50 text-center peer-checked:border-red-500 peer-checked:bg-red-50 transition-all">
                    <span className="font-bold text-sm text-gray-400 peer-checked:text-red-700 flex items-center justify-center gap-2">
                      <TrendingDown size={16} className={tipo === 'saida' ? 'text-red-600' : ''} />
                      Saída
                    </span>
                  </div>
                </label>
              </div>

              {/* Valor e Data */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className={labelClass}>Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    placeholder="0.00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Data</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <CalendarIcon size={16} />
                    </div>
                    <input 
                      type="date" 
                      value={dataLocal}
                      onChange={(e) => setDataLocal(e.target.value)}
                      required
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className={labelClass}>Descrição</label>
                <input 
                  type="text" 
                  placeholder="Ex: Dízimo do irmão João"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              {/* Categoria */}
              <div>
                <label className={labelClass}>Categoria</label>
                <select 
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  required
                  className={inputClass}
                >
                  {currentCategorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm shadow-blue-600/30 flex items-center justify-center disabled:opacity-70"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Salvando...</span>
                  </div>
                ) : (
                  'Salvar Transação'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova / Editar Campanha */}
      {isCampanhaModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) handleFecharModalCampanha(); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2.5 rounded-xl text-blue-700">
                  <Target size={20} />
                </div>
                <div>
                  <h2 className="text-gray-900 font-bold text-lg leading-tight">
                    {campanhaEditando ? 'Editar Campanha de Arrecadação' : 'Nova Campanha de Arrecadação'}
                  </h2>
                  <p className="text-gray-400 text-xs font-medium mt-0.5">Disponibilizada diretamente no App dos membros</p>
                </div>
              </div>
              <button 
                onClick={handleFecharModalCampanha}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSalvarCampanha} className="p-8 flex flex-col gap-5">
              {/* Título */}
              <div>
                <label className={labelClass}>Título da Campanha *</label>
                <input 
                  type="text" 
                  placeholder="Ex: Reforma do Templo ou Missões no Sertão"
                  value={tituloCampanha}
                  onChange={(e) => setTituloCampanha(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              {/* Descrição */}
              <div>
                <label className={labelClass}>Descrição da Campanha</label>
                <textarea 
                  rows={3}
                  placeholder="Explique o propósito desta campanha aos membros..."
                  value={descricaoCampanha}
                  onChange={(e) => setDescricaoCampanha(e.target.value)}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Chave Pix */}
              <div>
                <label className={labelClass}>Chave Pix *</label>
                <input 
                  type="text" 
                  placeholder="Ex: financeiro@igreja.com ou (11) 99999-9999"
                  value={chavePixCampanha}
                  onChange={(e) => setChavePixCampanha(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              {/* Ações */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleFecharModalCampanha}
                  disabled={isSubmittingCampanha}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCampanha || !tituloCampanha.trim() || !chavePixCampanha.trim()}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingCampanha ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Salvando...</span>
                    </div>
                  ) : (
                    campanhaEditando ? 'Salvar Alterações' : 'Salvar Campanha'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
