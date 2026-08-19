import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import CustomSwitch from '../components/CustomSwitch';

const { width, height } = Dimensions.get('window');

const TOGGLE_WIDTH = width * 0.8;
const TOGGLE_HEIGHT = 50;

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const togglePosition = useSharedValue(0);

  // Auth States
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Usado no login (pode ser email ou username)
  const [email, setEmail] = useState(''); // Usado no cadastro
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRecuperacao, setLoadingRecuperacao] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Auth Functions
  const handleLogin = async () => {
    if (!loginIdentifier || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
    
    setIsLoading(true);
    try {
      let finalEmail = loginIdentifier.trim().toLowerCase();

      // Se não tem '@', assumimos que é um nome de usuário e buscamos no banco
      if (!finalEmail.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', finalEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          Alert.alert('Falha no Login', 'Usuário não encontrado.');
          setIsLoading(false);
          return;
        }

        // Pega o e-mail real associado a esse username
        finalEmail = querySnapshot.docs[0].data().email;
      }

      await signInWithEmailAndPassword(auth, finalEmail, password);
      
      try {
        await AsyncStorage.setItem('@lembrar_me_status', rememberMe ? 'true' : 'false');
      } catch (e) {
        console.error('Erro ao guardar preferencia de sessao', e);
      }
      
      router.replace('/home');
    } catch (error: any) {
      let errorMessage = 'Ocorreu um erro ao fazer login.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        errorMessage = 'Credenciais incorretas.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'O identificador fornecido é inválido.';
      }
      Alert.alert('Falha no Login', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecuperarSenha = async () => {
    if (!loginIdentifier) {
      Alert.alert('Atenção', 'Por favor, digite o seu e-mail no campo acima para recuperar a senha.');
      return;
    }
    
    // Expressão regular simples para verificar formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginIdentifier)) {
      Alert.alert('Atenção', 'O formato do e-mail é inválido.');
      return;
    }

    setLoadingRecuperacao(true);
    try {
      await sendPasswordResetEmail(auth, loginIdentifier);
      Alert.alert("Sucesso", "E-mail de redefinição enviado! Verifique a sua caixa de entrada e o spam.");
    } catch (error: any) {
      console.error('Erro ao recuperar senha:', error);
      let errorMessage = 'Não foi possível enviar o e-mail de redefinição.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Não encontramos nenhuma conta com este e-mail.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'O formato do e-mail é inválido.';
      }
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoadingRecuperacao(false);
    }
  };

  const handleSignUp = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert('Senha Fraca', 'A senha deve conter ao menos 1 letra maiúscula, 1 minúscula, 1 caractere especial e ter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Tentando criar usuário no Auth...');
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const user = userCredential.user;
      console.log('Usuário criado com sucesso no Auth! UID:', user.uid);

      console.log('Tentando salvar/atualizar no Firestore...');
      // Envolve a chamada do Firestore em um Promise.race para evitar hang infinito (timeout de 8s)
      const firestorePromise = (async () => {
        const finalEmail = email.trim().toLowerCase();
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', finalEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Cenário A: Usuário já existe (cadastrado pelo admin) - Mesclagem
          const existingDocId = querySnapshot.docs[0].id;
          await updateDoc(doc(db, 'users', existingDocId), {
            uid: user.uid,
            acessoApp: true,
            username: username.trim().toLowerCase(),
          });
          console.log('Mesclagem de conta realizada com sucesso!');
        } else {
          // Cenário B: Usuário novo - Criação Normal
          await setDoc(doc(db, 'users', user.uid), {
            username: username.trim().toLowerCase(),
            email: finalEmail,
            acessoApp: true,
            createdAt: new Date(),
          });
          console.log('Nova conta salva no Firestore com sucesso!');
        }
      })();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('FIRESTORE_TIMEOUT')), 8000)
      );

      await Promise.race([firestorePromise, timeoutPromise]);

      // Desloga o usuário imediatamente para impedir o login automático
      await signOut(auth);
      console.log('SignOut concluído.');
      
      Alert.alert('Sucesso!', 'Sua conta foi criada. Por favor, faça login para entrar no aplicativo.');
      
      // Limpa os campos de senha
      setPassword('');
      setConfirmPassword('');
      
      // Muda para a aba de Login
      handleToggle(true);
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      let errorMessage = 'Ocorreu um erro ao criar a conta.';
      
      if (error.message === 'FIRESTORE_TIMEOUT') {
        errorMessage = 'O banco de dados não respondeu. Verifique se você criou o Firestore Database no painel do Firebase.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este e-mail já está cadastrado.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'O e-mail fornecido é inválido.';
      }
      Alert.alert('Falha no Cadastro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (loginState: boolean) => {
    if (loginState === isLogin) return;
    setIsLogin(loginState);
    togglePosition.value = withTiming(loginState ? 0 : 1, {
      duration: 350,
      easing: Easing.inOut(Easing.ease),
    });
  };

  const activePillStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: togglePosition.value * (TOGGLE_WIDTH / 2) }],
    };
  });

  const loginFormStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(togglePosition.value, [0, 0.5, 1], [1, 0, 0]),
      transform: [
        { translateY: interpolate(togglePosition.value, [0, 1], [0, 20]) },
      ],
      position: 'absolute',
      width: '100%',
    };
  });

  const signUpFormStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(togglePosition.value, [0, 0.5, 1], [0, 0, 1]),
      transform: [
        { translateY: interpolate(togglePosition.value, [0, 1], [-20, 0]) },
      ],
      position: 'absolute',
      width: '100%',
    };
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar style="dark" />

        {/* Header - Curved Top */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Image
              source={require('../../assets/Img/logo sem fundo.png')}
              style={styles.logo}
            />
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.mainContent}>
            {/* Toggle (Segmented Control) */}
            <View style={styles.toggleContainer}>
              <Animated.View style={[styles.activePill, activePillStyle]} />

              <TouchableOpacity
                style={styles.toggleButton}
                activeOpacity={0.8}
                onPress={() => handleToggle(true)}
              >
                <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
                  Login
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleButton}
                activeOpacity={0.8}
                onPress={() => handleToggle(false)}
              >
                <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
                  Cadastrar
                </Text>
              </TouchableOpacity>
            </View>

            {/* Forms Area */}
            <View style={styles.formsWrapper}>

              {/* Login Form */}
              <Animated.View style={loginFormStyle} pointerEvents={isLogin ? 'auto' : 'none'}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#888"
                    autoCapitalize="none"
                    value={loginIdentifier}
                    onChangeText={setLoginIdentifier}
                  />
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      style={[styles.input, { paddingRight: 50 }]}
                      placeholder="Senha"
                      placeholderTextColor="#888"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity 
                      style={styles.eyeIcon} 
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color="#888" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  activeOpacity={0.8}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading && isLogin ? (
                    <ActivityIndicator color="#121212" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Login</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.rememberMeContainer}>
                  <CustomSwitch 
                    value={rememberMe} 
                    onValueChange={setRememberMe} 
                    label="Lembrar-me" 
                  />
                  
                  <TouchableOpacity onPress={handleRecuperarSenha} disabled={loadingRecuperacao}>
                    {loadingRecuperacao ? (
                      <ActivityIndicator size="small" color="#888" />
                    ) : (
                      <Text style={styles.forgotPasswordText}>Esqueci a senha</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Sign Up Form */}
              <Animated.View style={signUpFormStyle} pointerEvents={!isLogin ? 'auto' : 'none'}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Usuário"
                    placeholderTextColor="#888"
                    autoCapitalize="none"
                    value={username}
                    onChangeText={setUsername}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      style={[styles.input, { paddingRight: 50 }]}
                      placeholder="Senha"
                      placeholderTextColor="#888"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity 
                      style={styles.eyeIcon} 
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color="#888" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      style={[styles.input, { paddingRight: 50 }]}
                      placeholder="Confirmar Senha"
                      placeholderTextColor="#888"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity 
                      style={styles.eyeIcon} 
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Feather name={showConfirmPassword ? 'eye' : 'eye-off'} size={20} color="#888" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.passwordHint}>
                    A senha deve ter no mínimo 6 caracteres, contendo pelo menos 1 letra maiúscula, 1 minúscula e 1 caractere especial.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  activeOpacity={0.8}
                  onPress={handleSignUp}
                  disabled={isLoading}
                >
                  {isLoading && !isLogin ? (
                    <ActivityIndicator color="#121212" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Cadastrar</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background
  },
  headerContainer: {
    height: height * 0.35,
    backgroundColor: '#503d2e',
    borderBottomLeftRadius: width * 0.5,
    borderBottomRightRadius: width * 0.5,
    transform: [{ scaleX: 1.3 }],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerContent: {
    transform: [{ scaleX: 1 / 1.3 }], // Reverse the scale to keep content normal
    alignItems: 'center',
    justifyContent: 'center',
    width: width,
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  logo: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
  },
  keyboardView: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingTop: 30,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  toggleContainer: {
    width: TOGGLE_WIDTH,
    height: TOGGLE_HEIGHT,
    backgroundColor: '#2A2A2A',
    borderRadius: TOGGLE_HEIGHT / 2,
    flexDirection: 'row',
    position: 'relative',
    marginBottom: 40,
  },
  activePill: {
    position: 'absolute',
    width: TOGGLE_WIDTH / 2,
    height: TOGGLE_HEIGHT,
    backgroundColor: '#444444',
    borderRadius: TOGGLE_HEIGHT / 2,
    top: 0,
    left: 0,
  },
  toggleButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  toggleText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  formsWrapper: {
    width: '100%',
    flex: 1,
  },
  inputContainer: {
    marginBottom: 30,
  },
  input: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    height: 55,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#121212',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rememberMeContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  forgotPasswordText: {
    color: '#888',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  passwordHint: {
    color: '#888',
    fontSize: 12,
    marginTop: -5,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  eyeIcon: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: 50, // Match the height of the input exactly
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
});
