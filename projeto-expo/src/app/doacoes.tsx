import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function DoacoesScreen() {
  const router = useRouter();

  const [receipt, setReceipt] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const pixKey = '12.345.678/0001-90';

  const handleCopyPix = async () => {
    try {
      Alert.alert('Sucesso', 'Chave PIX copiada com sucesso!');
    } catch (error) {
      // Simulação caso a API nativa falhe
      Alert.alert('Sucesso', 'Chave PIX copiada com sucesso! (Simulado)');
    }
  };

  const handlePickReceipt = async () => {
    try {
      // Simulação pura devido a ausência dos pacotes ImagePicker localmente.
      setReceipt('simulated_receipt.jpg');
    } catch (error) {
      console.log('Erro ao abrir galeria:', error);
      // Fallback para simulação
      setReceipt('simulated_receipt.jpg');
    }
  };

  const handleSendReceipt = () => {
    if (!receipt) return;

    setIsUploading(true);

    // Simula o tempo de upload de 2 segundos
    setTimeout(() => {
      setIsUploading(false);
      setReceipt(null);
      Alert.alert('Muito Obrigado!', 'Seu comprovante foi enviado com sucesso. Deus abençoe sua generosidade!');
    }, 2000);
  };

  return (
    <LinearGradient
      colors={['#0a0a1a', '#050B14']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Doações</Text>
          <View style={{ width: 34 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          <Text style={styles.pageDescription}>
            "Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria." - 2 Coríntios 9:7
          </Text>

          {/* Seção PIX */}
          <View style={styles.card}>
            <View style={styles.qrCodeContainer}>
              <Ionicons name="qr-code-outline" size={100} color="#FFFFFF" />
            </View>

            <View style={styles.pixKeyContainer}>
              <Text style={styles.pixKeyLabel}>Chave PIX (CNPJ)</Text>
              <Text style={styles.pixKeyValue}>{pixKey}</Text>
            </View>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyPix}
              activeOpacity={0.8}
            >
              <Ionicons name="copy-outline" size={20} color="#0a0a1a" />
              <Text style={styles.copyButtonText}>Copiar Chave PIX</Text>
            </TouchableOpacity>
          </View>

          {/* Seção Dados Bancários */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dados Bancários</Text>

            <View style={styles.bankInfoRow}>
              <Text style={styles.bankInfoLabel}>Banco:</Text>
              <Text style={styles.bankInfoValue}>Banco Itau (999)</Text>
            </View>
            <View style={styles.bankInfoRow}>
              <Text style={styles.bankInfoLabel}>Agência:</Text>
              <Text style={styles.bankInfoValue}>0001</Text>
            </View>
            <View style={styles.bankInfoRow}>
              <Text style={styles.bankInfoLabel}>Conta Corrente:</Text>
              <Text style={styles.bankInfoValue}>12345-6</Text>
            </View>
            <View style={styles.bankInfoRow}>
              <Text style={styles.bankInfoLabel}>Titular:</Text>
              <Text style={styles.bankInfoValue}>Ministério IDE</Text>
            </View>
          </View>

          {/* Seção Envio de Comprovante */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Comprovante</Text>
            <Text style={styles.receiptDescription}>
              Fez sua doação? Envie o comprovante (opcional).
            </Text>

            {!receipt ? (
              <TouchableOpacity
                style={styles.attachButton}
                onPress={handlePickReceipt}
                activeOpacity={0.8}
              >
                <Ionicons name="attach-outline" size={22} color="#FFFFFF" />
                <Text style={styles.attachButtonText}>Anexar Comprovante</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.receiptAttachedContainer}>
                <View style={styles.receiptInfoRow}>
                  <Feather name="image" size={20} color="#4ade80" />
                  <Text style={styles.receiptAttachedText}>Comprovante anexado</Text>
                </View>

                <TouchableOpacity
                  style={[styles.sendButton, isUploading && styles.sendButtonDisabled]}
                  onPress={handleSendReceipt}
                  activeOpacity={0.8}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#0a0a1a" />
                  ) : (
                    <>
                      <Feather name="send" size={18} color="#0a0a1a" />
                      <Text style={styles.sendButtonText}>Enviar Agora</Text>
                    </>
                  )}
                </TouchableOpacity>

                {!isUploading && (
                  <TouchableOpacity onPress={() => setReceipt(null)} style={styles.removeReceiptButton}>
                    <Text style={styles.removeReceiptText}>Remover / Escolher outro</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
    width: 34,
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pageDescription: {
    color: '#A0AEC0',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  qrCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
  },
  pixKeyContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pixKeyLabel: {
    color: '#A0AEC0',
    fontSize: 13,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pixKeyValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  copyButton: {
    backgroundColor: '#4ade80',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  copyButtonText: {
    color: '#0a0a1a',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  bankInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  bankInfoLabel: {
    color: '#A0AEC0',
    fontSize: 15,
  },
  bankInfoValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  receiptDescription: {
    color: '#A0AEC0',
    fontSize: 14,
    marginBottom: 16,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  attachButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  receiptAttachedContainer: {
    marginTop: 8,
  },
  receiptInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
  },
  receiptAttachedText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  sendButton: {
    backgroundColor: '#4ade80',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#0a0a1a',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  removeReceiptButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  removeReceiptText: {
    color: '#A0AEC0',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
