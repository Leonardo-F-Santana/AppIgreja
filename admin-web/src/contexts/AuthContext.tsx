import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Tipos de cargo disponíveis no sistema
export type UserRole = 'admin' | 'tesouraria' | 'secretaria' | 'lider';

// Interface do utilizador com role
export interface AppUser {
  uid: string;
  email: string | null;
  role: UserRole;
  nome?: string;
}

// Interface do contexto
interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

// Hook para consumir o contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// Provider que envolve a aplicação
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // FORÇA O ESTADO DE LOADING PARA PREVENIR RACE CONDITIONS COM PROTECTED ROUTE
      setLoading(true);
      
      if (firebaseUser) {
        // Buscar role do Firestore
        let role: UserRole = 'secretaria'; // fallback seguro
        let nome = firebaseUser.displayName || '';

        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.role && ['admin', 'tesouraria', 'secretaria', 'lider'].includes(data.role)) {
              role = data.role as UserRole;
            }
            if (data.nome) {
              nome = data.nome;
            }
          }
        } catch (error) {
          console.error('Erro ao buscar role/nome do utilizador:', error);
        }

        // Sincronizar nome e e-mail do Firebase Auth no Firestore
        // (merge: true preserva o campo role existente)
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            email: firebaseUser.email || '',
            nome: firebaseUser.displayName || '',
          }, { merge: true });
        } catch (error) {
          console.error('Erro ao sincronizar dados do utilizador:', error);
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role,
          nome,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}
