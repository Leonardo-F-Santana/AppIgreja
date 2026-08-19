import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type Devotional = { id: string; date: string; title: string; content: string; };

export default function DevocionalScreen() {
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    const newDevotional = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('pt-BR'),
      title: title.trim(),
      content: content.trim(),
    };

    setDevotionals([newDevotional, ...devotionals]);
    setTitle('');
    setContent('');
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
      <Text style={styles.cardContent}>{item.content}</Text>
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
              
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Salvar Devocional</Text>
              </TouchableOpacity>
            </View>

            {/* Listagem do Histórico */}
            <Text style={styles.historyTitle}>Meu Histórico</Text>
            <FlatList
              data={devotionals}
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
    minHeight: 100,
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
