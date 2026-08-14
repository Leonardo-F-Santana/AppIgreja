import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// ─── Componente: Input Customizado ────────────────────────────────────────────

interface CustomInputProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  icon: string;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  editable?: boolean;
  maxLength?: number;
}

function CustomInput({
  label,
  value,
  onChangeText,
  icon,
  placeholder,
  keyboardType = 'default',
  editable = true,
  maxLength,
}: CustomInputProps) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputWrapper, !editable && styles.inputWrapperDisabled]}>
        <Feather name={icon as any} size={18} color={editable ? '#888888' : '#555555'} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, !editable && styles.inputDisabled]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#555555"
          keyboardType={keyboardType}
          editable={editable}
          maxLength={maxLength}
          autoCapitalize={label.includes('E-mail') ? 'none' : 'words'}
        />
      </View>
    </View>
  );
}

// ─── Tela Principal: Editar Perfil ────────────────────────────────────────────

export default function EditarPerfilScreen() {
  const router = useRouter();
  
  // ─── Estados do Formulário ───────────────────────────────────────────────
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  
  // ─── Estados da Tela ─────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Buscar dados atuais ────────────────────────────────────────────────
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.replace('/');
      return;
    }

    async function fetchUserData() {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser!.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username ?? '');
          setEmail(data.email ?? currentUser!.email ?? '');
          setTelefone(data.telefone ?? '');
          setDataNascimento(data.dataNascimento ?? '');
        } else {
          setEmail(currentUser!.email ?? '');
        }
      } catch (error) {
        console.error('[EditarPerfil] Erro ao buscar dados:', error);
        Alert.alert('Erro', 'Não foi possível carregar os seus dados.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, []);

  // ─── Máscaras Simples ───────────────────────────────────────────────────
  const handleTelefoneChange = (text: string) => {
    // Remove tudo o que não é número
    const num = text.replace(/\D/g, '');
    setTelefone(num);
  };

  const handleDataNascimentoChange = (text: string) => {
    // Máscara simples DD/MM/AAAA
    let v = text.replace(/\D/g, '');
    if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
    if (v.length > 5) v = v.substring(0, 5) + '/' + v.substring(5, 9);
    setDataNascimento(v);
  };

  // ─── Salvar no Firestore ────────────────────────────────────────────────
  const salvarPerfil = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (!username.trim()) {
      Alert.alert('Atenção', 'O nome não pode ficar vazio.');
      return;
    }

    setIsSaving(true);

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        username: username.trim(),
        telefone: telefone.trim(),
        dataNascimento: dataNascimento.trim(),
      });

      Alert.alert('Sucesso!', 'Perfil atualizado com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('[EditarPerfil] Erro ao salvar:', error);
      Alert.alert('Erro', 'Ocorreu um problema ao salvar as alterações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Render Loading ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <LinearGradient colors={['#0a0a1a', '#050B14']} style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ade80" />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      </LinearGradient>
    );
  }

  // ─── Render Principal ───────────────────────────────────────────────────
  return (
    <LinearGradient colors={['#0a0a1a', '#050B14']} style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            disabled={isSaving}
          >
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.pageSubtitle}>
              Mantenha as suas informações de contacto atualizadas.
            </Text>

            <View style={styles.formContainer}>
              <CustomInput
                label="Nome Completo"
                icon="user"
                placeholder="Introduza o seu nome"
                value={username}
                onChangeText={setUsername}
              />

              <CustomInput
                label="E-mail"
                icon="mail"
                placeholder="seu@email.com"
                value={email}
                editable={false}
              />
              <Text style={styles.helpText}>O e-mail não pode ser alterado por motivos de segurança.</Text>

              <CustomInput
                label="Telefone / WhatsApp"
                icon="phone"
                placeholder="Nº de telemóvel"
                keyboardType="numeric"
                value={telefone}
                onChangeText={handleTelefoneChange}
                maxLength={15}
              />

              <CustomInput
                label="Data de Nascimento"
                icon="calendar"
                placeholder="DD/MM/AAAA"
                keyboardType="numeric"
                value={dataNascimento}
                onChangeText={handleDataNascimentoChange}
                maxLength={10}
              />
            </View>
          </ScrollView>

          {/* Footer (Botão Salvar) */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={salvarPerfil}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <>
                  <Feather name="check" size={20} color="#000000" />
                  <Text style={styles.saveButtonText}>Guardar Alterações</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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

  // -- Scroll Content --
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  pageSubtitle: {
    color: '#AAAAAA',
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },

  // -- Formulário --
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapperDisabled: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'transparent',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  inputDisabled: {
    color: '#666666',
  },
  helpText: {
    color: '#666666',
    fontSize: 12,
    marginTop: -14,
    marginLeft: 4,
  },

  // -- Footer / Botão --
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
    backgroundColor: '#0a0a1a', // Previne transparência indesejada caso o teclado suba
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ade80',
    borderRadius: 16,
    height: 56,
    gap: 10,
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
