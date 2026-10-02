import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Share,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

type Devotional = { id: string; date: string; title: string; content: string; };

export default function DevocionalScreen() {
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [historico, setHistorico] = useState<Devotional[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const prepararEdicao = (item: Devotional) => {
    setTitle(item.title);
    setContent(item.content);
    setEditandoId(item.id);
  };

  const atualizarDevocional = async () => {
    if (!title.trim() || !content.trim() || !editandoId) return;

    try {
      await updateDoc(doc(db, 'devocionais', editandoId), {
        titulo: title.trim(),
        texto: content.trim(),
      });

      Alert.alert('Sucesso', 'Devocional atualizado com sucesso!');
      setTitle('');
      setContent('');
      setEditandoId(null);
    } catch (error) {
      console.error('Erro ao atualizar devocional:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o devocional.');
    }
  };

  const excluirDevocional = (id: string) => {
    Alert.alert(
      'Atenção',
      'Deseja mesmo excluir este devocional?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'devocionais', id));
              Alert.alert('Sucesso', 'Devocional excluído!');
              if (editandoId === id) {
                setTitle('');
                setContent('');
                setEditandoId(null);
              }
            } catch (error) {
              console.error('Erro ao excluir:', error);
              Alert.alert('Erro', 'Não foi possível excluir.');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'devocionais'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const devocionaisData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.titulo || 'Sem título',
          content: data.texto || '',
          date: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString('pt-BR') : 'Data Indisponível',
        } as Devotional;
      });
      setHistorico(devocionaisData);
    });

    return () => unsubscribe();
  }, []);

  const salvarDevocional = async () => {
    if (!title.trim() || !content.trim()) return;

    try {
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Erro', 'Você precisa estar logado para salvar.');
        return;
      }

      await addDoc(collection(db, 'devocionais'), {
        titulo: title.trim(),
        texto: content.trim(),
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Sucesso', 'Devocional salvo com sucesso!');
      
      setTitle('');
      setContent('');
    } catch (error) {
      console.error('Erro ao salvar devocional:', error);
      Alert.alert('Erro', 'Não foi possível salvar o devocional. Tente novamente.');
    }
  };

  const handleShare = async (devotional: Devotional) => {
    try {
      await Share.share({
        message: `${devotional.date} - ${devotional.title}\n\n${devotional.content}`,
      });
    } catch (error) {
      console.log('Erro ao compartilhar:', error);
    }
  };

  const renderItem = ({ item }: { item: Devotional }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.cardDate}>{item.date}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <TouchableOpacity onPress={() => handleShare(item)} style={styles.shareButton}>
          <Feather name="share-2" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <Text style={styles.cardContent} numberOfLines={2}>{item.content}</Text>
      
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
        <TouchableOpacity onPress={() => prepararEdicao(item)} style={[styles.actionButton, { marginRight: 10 }]}>
          <Feather name="edit-2" size={16} color="#A0AEC0" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => excluirDevocional(item.id)} style={styles.actionButton}>
          <Feather name="trash-2" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#0a0a1a', '#050B14']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Diário Devocional</Text>
          <View style={{ width: 34 }} />
        </View>

        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.content}>
            {/* Formulário de Criação */}
            <View style={styles.formContainer}>
              <TextInput
                style={styles.inputTitle}
                placeholder="Título (ex: Jesus e seu sacrifício)"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={title}
                onChangeText={setTitle}
              />
              
              <TextInput
                style={styles.inputContent}
                placeholder="Escreva sua reflexão..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                value={content}
                onChangeText={setContent}
              />
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity 
                  style={[styles.saveButton, { flex: 1, marginRight: editandoId ? 10 : 0 }]} 
                  onPress={editandoId ? atualizarDevocional : salvarDevocional}
                >
                  <Text style={styles.saveButtonText}>
                    {editandoId ? 'Atualizar' : 'Salvar Devocional'}
                  </Text>
                </TouchableOpacity>

                {editandoId && (
                  <TouchableOpacity 
                    style={[styles.saveButton, { flex: 1, backgroundColor: 'rgba(255, 60, 60, 0.15)', borderColor: 'rgba(255, 60, 60, 0.3)' }]} 
                    onPress={() => {
                      setTitle('');
                      setContent('');
                      setEditandoId(null);
                    }}
                  >
                    <Text style={[styles.saveButtonText, { color: '#FF6B6B' }]}>Cancelar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Listagem do Histórico */}
            <Text style={styles.historyTitle}>Meus Devocionais</Text>
            <FlatList
              data={historico}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Nenhum devocional salvo ainda.</Text>
              }
            />
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formContainer: {
    marginBottom: 20,
  },
  inputTitle: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputContent: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 120,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  saveButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  listContainer: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardDate: {
    color: '#A0AEC0',
    fontSize: 12,
    marginBottom: 4,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 22,
  },
  emptyText: {
    color: '#A0AEC0',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});
