import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UserData {
  username: string;
  email: string;
  role: string;
  createdAt: Timestamp | null;
  receberNotificacoes?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function formatRole(role: string): string {
  const roles: Record<string, string> = {
    admin: 'Administrador',
    lider: 'Líder',
    membro: 'Membro',
  };
  return roles[role?.toLowerCase()] || role || 'Membro';
}

function formatarData(ts: Timestamp | null): string {
  if (!ts) return '—';
  try {
    const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts as any);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

// ─── Componente: Item de Informação ───────────────────────────────────────────

interface InfoItemProps {
  icon: string;
  label: string;
  value: string;
  iconColor?: string;
}

function InfoItem({ icon, label, value, iconColor = '#4ade80' }: InfoItemProps) {
  return (
    <View style={styles.infoItem}>
      <View style={[styles.infoIconCircle, { backgroundColor: iconColor + '15' }]}>
        <Feather name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Componente: Item de Menu ─────────────────────────────────────────────────

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  iconColor?: string;
  isDestructive?: boolean;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

function MenuItem({ icon, title, subtitle, iconColor = '#FFFFFF', isDestructive = false, onPress, rightElement }: MenuItemProps) {
  const color = isDestructive ? '#ef4444' : iconColor;

  return (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.menuIconCircle, { backgroundColor: isDestructive ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)' }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, isDestructive && { color: '#ef4444' }]}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement ? rightElement : <Feather name="chevron-right" size={18} color={isDestructive ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.2)'} />}
    </TouchableOpacity>
  );
}

// ─── Tela Principal ───────────────────────────────────────────────────────────

export default function PerfilScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // ─── Buscar dados do utilizador ─────────────────────────────────────────
  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      // Sem utilizador autenticado — redirecionar para login
      router.replace('/');
      return;
    }

    async function fetchUserData() {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser!.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            username: data.username ?? '',
            email: data.email ?? currentUser!.email ?? '',
            role: data.role ?? 'membro',
            createdAt: data.createdAt ?? null,
            receberNotificacoes: data.receberNotificacoes ?? true,
          });
        } else {
          // Documento não existe no Firestore, usar dados do Auth
          setUserData({
            username: currentUser!.email?.split('@')[0] ?? '',
            email: currentUser!.email ?? '',
            role: 'membro',
            createdAt: null,
            receberNotificacoes: true,
          });
        }
      } catch (error) {
        console.error('[PerfilScreen] Erro ao buscar dados do utilizador:', error);
        // Fallback para dados do Auth
        setUserData({
          username: currentUser!.email?.split('@')[0] ?? '',
          email: currentUser!.email ?? '',
          role: 'membro',
          createdAt: null,
          receberNotificacoes: true,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, []);

  // ─── Logout ─────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair? Você precisará fazer login novamente para acessar o aplicativo.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/');
            } catch (error) {
              Alert.alert('Erro', 'Ocorreu um erro ao tentar sair. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  // ─── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <LinearGradient colors={['#0a0a1a', '#050B14']} style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ade80" />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </LinearGradient>
    );
  }

  const displayName = userData?.username || 'Utilizador';
  const displayEmail = userData?.email || '';
  const displayRole = formatRole(userData?.role ?? 'membro');
  const displayDate = formatarData(userData?.createdAt ?? null);
  const initials = getInitials(displayName);

  return (
    <LinearGradient colors={['#0a0a1a', '#050B14']} style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.safeArea}>
        {/* ─── Header ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Avatar & Nome ──────────────────────────────────────────── */}
          <View style={styles.profileSection}>
            {/* Avatar com iniciais */}
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#4ade80', '#22c55e']}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarInitials}>{initials}</Text>
              </LinearGradient>
              {/* Badge de role */}
              <View style={styles.roleBadgeFloat}>
                <MaterialCommunityIcons name="shield-check" size={12} color="#4ade80" />
              </View>
            </View>

            {/* Nome */}
            <Text style={styles.profileName}>{displayName}</Text>

            {/* Role */}
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons name="shield-account" size={14} color="#4ade80" />
              <Text style={styles.roleText}>{displayRole}</Text>
            </View>
          </View>

          {/* ─── Card de Informações ────────────────────────────────────── */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Informações da Conta</Text>

            <View style={styles.card}>
              <InfoItem
                icon="user"
                label="Nome de Utilizador"
                value={displayName}
                iconColor="#4ade80"
              />

              <View style={styles.cardDivider} />

              <InfoItem
                icon="mail"
                label="E-mail"
                value={displayEmail}
                iconColor="#60a5fa"
              />

              <View style={styles.cardDivider} />

              <InfoItem
                icon="calendar"
                label="Membro desde"
                value={displayDate}
                iconColor="#facc15"
              />
            </View>
          </View>

          {/* ─── Seção de Conta ──────────────────────────────────────────── */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Conta</Text>

            <View style={styles.card}>
              <MenuItem
                icon="edit-3"
                title="Editar Perfil"
                subtitle="Alterar nome e informações"
                iconColor="#c084fc"
                onPress={() => router.push('/editar-perfil')}
              />

            </View>
          </View>

          {/* ─── Botão de Logout ─────────────────────────────────────────── */}
          <View style={styles.sectionContainer}>
            <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.8}
              onPress={handleLogout}
            >
              <Feather name="log-out" size={20} color="#ef4444" />
              <Text style={styles.logoutText}>Sair da Conta</Text>
            </TouchableOpacity>
          </View>

          {/* ─── Versão ──────────────────────────────────────────────────── */}
          <Text style={styles.versionText}>Ministério IDE v1.0.0</Text>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // -- Loading --
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 16,
  },

  // -- Header --
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // -- Profile Section --
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  avatarInitials: {
    color: '#000000',
    fontSize: 36,
    fontWeight: 'bold',
  },
  roleBadgeFloat: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 15, 25, 0.95)',
    borderWidth: 2,
    borderColor: '#4ade80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    color: '#4ade80',
    fontSize: 13,
    fontWeight: '600',
  },

  // -- Sections --
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },

  // -- Card --
  card: {
    backgroundColor: 'rgba(15, 15, 25, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 4,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 16,
  },

  // -- Info Items --
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 3,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // -- Menu Items --
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  menuSubtitle: {
    color: '#888888',
    fontSize: 12,
    marginTop: 2,
  },

  // -- Logout Button --
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // -- Version --
  versionText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
});
