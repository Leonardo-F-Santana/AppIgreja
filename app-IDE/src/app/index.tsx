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
} from 'react-native';
import { useRouter } from 'expo-router';
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
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Senha"
                    placeholderTextColor="#888"
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  activeOpacity={0.8}
                  onPress={() => router.replace('/home')}
                >
                  <Text style={styles.primaryButtonText}>Login</Text>
                </TouchableOpacity>

                <View style={styles.rememberMeContainer}>
                  <CustomSwitch 
                    value={rememberMe} 
                    onValueChange={setRememberMe} 
                    label="Lembrar-me" 
                  />
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
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Senha"
                    placeholderTextColor="#888"
                    secureTextEntry
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmar Senha"
                    placeholderTextColor="#888"
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  activeOpacity={0.8}
                  onPress={() => router.replace('/home')}
                >
                  <Text style={styles.primaryButtonText}>Cadastrar</Text>
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
    alignItems: 'center',
  },
});
