import { collection, onSnapshot, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Aviso } from './avisosService';
import type { Evento } from './eventosService';

export interface DashboardResumo {
  totalMembros: number;
  totalPedidos: number;
  pedidosUrgentes: number;
  totalEventos: number;
  proximosEventos: Evento[];
  ultimosAvisos: Aviso[];
}

export function ouvirResumoDashboard(callback: (resumo: DashboardResumo) => void): () => void {
  let state: DashboardResumo = {
    totalMembros: 0,
    totalPedidos: 0,
    pedidosUrgentes: 0,
    totalEventos: 0,
    proximosEventos: [],
    ultimosAvisos: [],
  };

  const emit = () => callback({ ...state });

  // 1. Membros
  const unsubMembros = onSnapshot(collection(db, 'users'), (snap) => {
    state.totalMembros = snap.size;
    emit();
  });

  // 2. Pedidos
  const unsubPedidos = onSnapshot(collection(db, 'pedidos_oracao'), (snap) => {
    state.totalPedidos = snap.size;
    let urgentes = 0;
    snap.forEach((doc) => {
      const data = doc.data();
      // Assumimos 'pendente' como indicador de urgência/atenção para este dashboard
      if (data.status === 'pendente') {
        urgentes++;
      }
    });
    state.pedidosUrgentes = urgentes;
    emit();
  });

  // 3. Eventos
  const unsubEventos = onSnapshot(collection(db, 'eventos'), (snap) => {
    const eventos: Evento[] = [];
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    
    let totalMes = 0;

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const ev = { id: docSnap.id, ...data } as Evento;
      eventos.push(ev);
      
      const evDate = data.data instanceof Timestamp ? data.data.toDate() : new Date(data.data as string);
      
      if (evDate >= inicioMes && evDate.getMonth() === agora.getMonth() && evDate.getFullYear() === agora.getFullYear()) {
         totalMes++;
      }
    });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const proximos = eventos
      .filter((e) => {
        const d = e.data instanceof Timestamp ? e.data.toDate() : new Date(e.data as string);
        return d >= hoje;
      })
      .sort((a, b) => {
        const da = a.data instanceof Timestamp ? a.data.toDate() : new Date(a.data as string);
        const db = b.data instanceof Timestamp ? b.data.toDate() : new Date(b.data as string);
        return da.getTime() - db.getTime();
      })
      .slice(0, 3);

    state.totalEventos = totalMes;
    state.proximosEventos = proximos;
    emit();
  });

  // 4. Avisos
  const qAvisos = query(collection(db, 'avisos'), orderBy('criadoEm', 'desc'), limit(3));
  const unsubAvisos = onSnapshot(qAvisos, (snap) => {
    state.ultimosAvisos = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Aviso));
    emit();
  }, (error) => {
     // Fallback se faltar index
     if (error.message.includes('index')) {
        const fb = query(collection(db, 'avisos'));
        onSnapshot(fb, (s) => {
           const todos = s.docs.map((d) => ({ id: d.id, ...d.data() } as Aviso));
           todos.sort((a, b) => {
              const da = a.criadoEm instanceof Timestamp ? a.criadoEm.toDate() : new Date(a.criadoEm as string);
              const db = b.criadoEm instanceof Timestamp ? b.criadoEm.toDate() : new Date(b.criadoEm as string);
              return db.getTime() - da.getTime();
           });
           state.ultimosAvisos = todos.slice(0, 3);
           emit();
        });
     }
  });

  return () => {
    unsubMembros();
    unsubPedidos();
    unsubEventos();
    unsubAvisos();
  };
}
