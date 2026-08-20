import React, { useState } from 'react';
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
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

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
  secureTextEntry?: boolean;
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
  secureTextEntry = false,
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
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}

// ─── Tela Principal: Alterar Senha ────────────────────────────────────────────

export default function AlterarSenhaScreen() {
  const router = useRouter();
  const auth = getAuth();
  
  // ─── Estados do Formulário ───────────────────────────────────────────────
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  
  // ─── Estados da Tela ─────────────────────────────────────────────────────
  const [loadingSenha, setLoadingSenha] = useState(false);

  // ─── Função de Alteração ────────────────────────────────────────────────
  const handleAlterarSenha = async () => {
    if (!senhaAtual || !novaSenha) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
    if (!passwordRegex.test(novaSenha)) {
      Alert.alert('Senha Fraca', 'A nova senha deve ter pelo menos 6 caracteres, incluindo 1 letra maiúscula, 1 minúscula e 1 caractere especial (ex: @, #, !, $).');
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      Alert.alert('Erro', 'Sessão expirada ou e-mail inválido. Faça login novamente.');
      return;
    }

    setLoadingSenha(true);
    try {
      // Passo A: Reautenticação
      const credential = EmailAuthProvider.credential(user.email, senhaAtual);
      await reauthenticateWithCredential(user, credential);

      // Passo B: Atualização
      await updatePassword(user, novaSenha);

      Alert.alert('Sucesso', 'Sua senha foi alterada com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      router.back();
    } catch (error: any) {
      console.error('[AlterarSenha] Erro:', error);
      if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        Alert.alert('Erro', 'A senha atual está incorreta.');
      } else {
        Alert.alert('Erro', 'Ocorreu um erro ao alterar a senha. Tente novamente.');
      }
    } finally {
      setLoadingSenha(false);
    }
  };

  return (
    <LinearGradient colors={['#0a0a1a', '#050B14']} style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            disabled={loadingSenha}
          >
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Alterar Senha</Text>
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
              Crie uma nova senha forte para manter a sua conta segura.
            </Text>

            <View style={styles.formContainer}>
              <CustomInput
                label="Senha Atual"
                icon="lock"
                placeholder="Digite sua senha atual"
                value={senhaAtual}
                onChangeText={setSenhaAtual}
                secureTextEntry={true}
              />

              <CustomInput
                label="Nova Senha"
                icon="key"
                placeholder="No mínimo 6 caracteres"
                value={novaSenha}
                onChangeText={setNovaSenha}
                secureTextEntry={true}
              />
              <Text style={styles.helpText}>A senha deve ter no mínimo 6 caracteres, 1 letra maiúscula, 1 minúscula e 1 caractere especial.</Text>
            </View>
          </ScrollView>

          {/* Footer (Botão Salvar) */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, loadingSenha && styles.saveButtonDisabled]}
              onPress={handleAlterarSenha}
              disabled={loadingSenha}
              activeOpacity={0.8}
            >
              {loadingSenha ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <>
                  <Feather name="check" size={20} color="#000000" />
                  <Text style={styles.saveButtonText}>Alterar Senha</Text>
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
    color: '#888888',
    fontSize: 12,
    marginTop: -10,
    marginLeft: 4,
  },

  // -- Footer / Botão --
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
    backgroundColor: '#0a0a1a',
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
