export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }

  // Mapear chaves do primeiro objeto para cabeçalhos
  const headers = Object.keys(data[0]);
  const linhas = [headers.join(';')];

  data.forEach((item) => {
    const linha = headers.map((header) => {
      const val = item[header];

      if (val === null || val === undefined) {
        return '""';
      }

      // Se for objeto (como Timestamp do Firebase ou Date)
      if (typeof val === 'object') {
        if (typeof val.toDate === 'function') {
          // Firebase Timestamp
          const date = val.toDate();
          return `"${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}"`;
        } else if (val instanceof Date) {
          return `"${val.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}"`;
        }
      }

      // Se for número (garantir vírgula para decimais)
      if (typeof val === 'number') {
        return val.toString().replace('.', ',');
      }

      // String (envolver com aspas e escapar aspas internas)
      const strVal = String(val).replace(/"/g, '""');
      return `"${strVal}"`;
    });

    linhas.push(linha.join(';'));
  });

  const csvContent = "\uFEFF" + linhas.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
