import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QrCode, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../config/firebase';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';

export default function CarteirinhaScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [nome, setNome] = useState('Membro');
  const [role, setRole] = useState('MEMBRO');
  const [dataAdesao, setDataAdesao] = useState('Membro desde 2024');

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setNome(data.nome || data.username || currentUser.displayName || 'Membro');
          
          if (data.role) {
            setRole(String(data.role).toUpperCase());
          }
          
          if (data.criadoEm && data.criadoEm instanceof Timestamp) {
            setDataAdesao(`Membro desde ${data.criadoEm.toDate().getFullYear()}`);
          }
        } else {
          setNome(currentUser.displayName || 'Membro');
        }
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={[styles.container, isLandscape && styles.containerLandscape]}>
      {/* Header */}
      {!isLandscape && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color="#111827" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sua Carteirinha</Text>
        </View>
      )}

      <View style={[styles.content, isLandscape && styles.contentLandscape]}>
        {/* Cartão Azul */}
        <View style={[styles.card, isLandscape && styles.cardLandscape]}>
          {/* Marca d'água de fundo */}
          <Image 
            source={require('../../assets/Img/logo sem fundo.png')} 
            style={styles.watermark} 
            resizeMode="contain"
          />

          <View style={styles.cardTop}>
            <Text style={styles.cardLogo}>MINISTÉRIO IDE</Text>
            <Image 
              source={require('../../assets/Img/profile.png')} 
              style={styles.profilePhoto} 
            />
          </View>

          <View style={styles.cardBottom}>
            <Text style={styles.roleText}>{role}</Text>
            <Text style={styles.nameText} numberOfLines={1}>{nome}</Text>
            <Text style={styles.dateText}>{dataAdesao}</Text>
          </View>
        </View>

        {/* QR Code Container */}
        {!isLandscape && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrText}>Apresente este código na entrada</Text>
            <QrCode color="#000000" size={120} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // gray-100
  },
  containerLandscape: {
    backgroundColor: '#1E3A8A', // Torna o fundo inteiro azul no landscape
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  contentLandscape: {
    paddingTop: 0,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    aspectRatio: 1.58,
    backgroundColor: '#1E3A8A', // blue-900
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10, // Shadow robusta no Android
  },
  cardLandscape: {
    width: '100%',
    height: '100%',
    maxWidth: 'none',
    aspectRatio: undefined,
    borderRadius: 0,
    padding: 40, // Mais margem interna no landscape para não tocar nos cantos
    elevation: 0,
    shadowOpacity: 0,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  cardLogo: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    flex: 1,
  },
  profilePhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: '#CCCCCC',
  },
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.15,
    transform: [{ scale: 0.7 }],
    zIndex: 1,
  },
  cardBottom: {
    marginTop: 'auto',
    zIndex: 2,
  },
  roleText: {
    color: '#BFDBFE', // blue-200
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateText: {
    color: '#93C5FD', // blue-300
    fontSize: 12,
  },
  qrContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  qrText: {
    color: '#6B7280', // gray-500
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
});
