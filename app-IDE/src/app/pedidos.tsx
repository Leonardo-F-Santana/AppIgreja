import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Switch,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export default function PedidosScreen() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [requestText, setRequestText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Estado para gerenciar o histórico de pedidos
  const [myRequests, setMyRequests] = useState<any[]>([]);

  // Carregar histórico de pedidos do Firestore em tempo real
  React.useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'pedidos_oracao'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pedidos = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let dateStr = '';
        if (data.criadoEm instanceof Timestamp) {
          dateStr = data.criadoEm.toDate().toLocaleDateString('pt-BR');
        } else {
          dateStr = new Date().toLocaleDateString('pt-BR');
        }

        return {
          id: docSnap.id,
          name: data.titulo || 'Anônimo',
          text: data.mensagem || '',
          date: dateStr,
          status: data.status || 'pendente',
          timestamp: data.criadoEm?.toMillis() || 0,
        };
      });

      // Ordena no cliente para evitar a necessidade de índice composto (userId + criadoEm)
      pedidos.sort((a, b) => b.timestamp - a.timestamp);
      
      setMyRequests(pedidos);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!requestText.trim()) return;
    if (!isAnonymous && !name.trim()) return;

    try {
      // Envia para o Firestore
      const user = auth.currentUser;
      await addDoc(collection(db, 'pedidos_oracao'), {
        titulo: isAnonymous ? 'Anônimo' : name.trim(),
        mensagem: requestText.trim(),
        anonimo: isAnonymous,
        status: 'pendente',
        userId: user ? user.uid : null, // Guarda o ID do utilizador para mostrar no histórico
        criadoEm: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      Alert.alert('Erro', 'Não foi possível enviar o pedido. Tente novamente.');
      return;
    }

    // Não precisamos adicionar localmente pois o onSnapshot vai atualizar o estado
    
    // Mostra tela de sucesso
    setIsSubmitted(true);
    
    // Mostra tela de sucesso
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setName('');
    setRequestText('');
    setIsAnonymous(false);
    setIsSubmitted(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Excluir Pedido",
      "Tem certeza que deseja apagar este pedido do seu histórico?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'pedidos_oracao', id));
              // O onSnapshot vai atualizar a lista automaticamente
            } catch (error) {
              console.error('Erro ao excluir pedido:', error);
              Alert.alert('Erro', 'Não foi possível excluir o pedido.');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'orando': return '#4ade80'; // Verde
      case 'atendido': return '#60a5fa'; // Azul
      default: return '#facc15'; // Amarelo (pendente)
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'orando': return 'Em Oração';
      case 'atendido': return 'Atendido';
      default: return 'Pendente';
    }
  };

  const renderHistoryItem = ({ item }: { item: any }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={styles.historyDate}>{item.date}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>
          <Text style={[styles.historyName, item.name === 'Anônimo' && styles.anonName]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
          activeOpacity={0.7}
        >
          <Feather name="trash-2" size={16} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
      <Text style={styles.historyText}>{item.text}</Text>
    </View>
  );

  const renderForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.description}>
        Envie seu pedido de oração. Nossa equipe pastoral intercederá por você em absoluto sigilo.
      </Text>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Enviar de forma anônima</Text>
        <Switch
          value={isAnonymous}
          onValueChange={setIsAnonymous}
          trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(255,255,255,0.3)' }}
          thumbColor={isAnonymous ? '#FFFFFF' : '#A0AEC0'}
        />
      </View>

      {!isAnonymous && (
        <TextInput
          style={styles.input}
          placeholder="Seu Nome Completo"
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={name}
          onChangeText={setName}
        />
      )}
      
      <TextInput
        style={styles.textArea}
        placeholder="Escreva seu pedido de oração..."
        placeholderTextColor="rgba(255,255,255,0.4)"
        multiline={true}
        numberOfLines={5}
        textAlignVertical="top"
        value={requestText}
        onChangeText={setRequestText}
      />
      
      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={handleSubmit}
        activeOpacity={0.8}
      >
        <Text style={styles.submitButtonText}>Enviar Pedido</Text>
      </TouchableOpacity>
    </View>
  );

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
          <Text style={styles.headerTitle}>Pedidos de Oração</Text>
          <View style={{ width: 34 }} />
        </View>

        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {isSubmitted ? (
            /* Feedback de Sucesso */
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#25D366" style={{ marginBottom: 20 }} />
              <Text style={styles.successTitle}>Pedido Enviado!</Text>
              <Text style={styles.successMessage}>
                Seu pedido foi enviado com segurança. Nossa liderança já o recebeu e estará orando por você.
              </Text>

              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={handleReset}
                activeOpacity={0.8}
              >
                <Text style={styles.resetButtonText}>Enviar outro pedido</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={myRequests}
              keyExtractor={(item) => item.id}
              renderItem={renderHistoryItem}
              ListHeaderComponent={
                <>
                  {renderForm()}
                  {myRequests.length > 0 && (
                    <Text style={styles.historyTitle}>Meu Histórico de Pedidos</Text>
                  )}
                </>
              }
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </KeyboardAvoidingView>
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
  formContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 30,
  },
  description: {
    color: '#A0AEC0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  switchLabel: {
    color: '#E2E8F0',
    fontSize: 15,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
    minHeight: 120,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  submitButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  successMessage: {
    color: '#A0AEC0',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 30,
  },
  resetButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  historyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  historyCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  historyDate: {
    color: '#A0AEC0',
    fontSize: 12,
    marginBottom: 4,
  },
  historyName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  anonName: {
    color: '#A0AEC0',
    fontStyle: 'italic',
    fontWeight: 'normal',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
    marginLeft: 10,
  },
  historyText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
