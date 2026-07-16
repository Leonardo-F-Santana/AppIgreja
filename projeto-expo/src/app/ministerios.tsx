import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const MINISTRIES_DATA = [
  {
    id: '1',
    nome: 'Ministério de Louvor',
    descricao: 'Responsável por conduzir a igreja em adoração através da música. Buscamos músicos e cantores dedicados.',
    icone: 'music',
    family: 'Feather',
    dia_reuniao: 'Sábados, 16h',
    nome_lider: 'Líder: Thiago',
  },
  {
    id: '2',
    nome: 'Ministério Infantil',
    descricao: 'Cuidamos e ensinamos a palavra de Deus às crianças com muito amor, criatividade e segurança.',
    icone: 'child',
    family: 'FontAwesome5',
    dia_reuniao: 'Domingos, 10h',
    nome_lider: 'Líder: tia Joana',
  },
  {
    id: '3',
    nome: 'Rede de Jovens',
    descricao: 'Um espaço dinâmico para jovens se conectarem, crescerem juntos e viverem os propósitos de Deus.',
    icone: 'users',
    family: 'Feather',
    dia_reuniao: 'Sábados, 19h30',
    nome_lider: 'Líder: Felipe e Carol',
  },
  {
    id: '4',
    nome: 'Casais',
    descricao: 'Fortalecendo casamentos através de princípios bíblicos, promovendo amor, respeito e unidade no lar.',
    icone: 'heart',
    family: 'Feather',
    dia_reuniao: 'Sextas, 20h',
    nome_lider: 'Líder: Pr. Marcos',
  },
  {
    id: '5',
    nome: 'Ação Social',
    descricao: 'Demonstrando o amor de Jesus de forma prática, auxiliando famílias carentes e a comunidade ao redor.',
    icone: 'hands-helping',
    family: 'FontAwesome5',
    dia_reuniao: 'Terças, 19h',
    nome_lider: 'Líder: Roberto',
  },
];

export default function MinistriesScreen() {
  const router = useRouter();

  const renderIcon = (family: string, name: string) => {
    if (family === 'FontAwesome5') {
      return <FontAwesome5 name={name} size={24} color="#FFFFFF" />;
    }
    return <Feather name={name as any} size={24} color="#FFFFFF" />;
  };

  const renderItem = ({ item }: { item: typeof MINISTRIES_DATA[0] }) => (
    <View style={styles.card}>
      {/* Header do Card */}
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          {renderIcon(item.family, item.icone)}
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.cardTitle}>{item.nome}</Text>
          <Text style={styles.cardLeader}>{item.nome_lider}</Text>
        </View>
      </View>

      {/* Descrição */}
      <Text style={styles.cardDescription}>{item.descricao}</Text>

      {/* Rodapé do Card */}
      <View style={styles.cardFooter}>
        <View style={styles.tagContainer}>
          <Feather name="calendar" size={12} color="#A0AEC0" style={{ marginRight: 4 }} />
          <Text style={styles.tagText}>{item.dia_reuniao}</Text>
        </View>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Participar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Header da Tela */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-left" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ministérios</Text>
          <View style={{ width: 28 }} />
        </View>
      </SafeAreaView>

      {/* Texto Introdutório */}
      <View style={styles.introContainer}>
        <Text style={styles.introText}>
          Encontre o seu lugar de servir e conectar-se com a comunidade.
        </Text>
      </View>

      {/* Lista de Ministérios */}
      <FlatList
        data={MINISTRIES_DATA}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  safeArea: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 20,
    backgroundColor: '#0a0a1a',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  introContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  introText: {
    color: '#CCCCCC',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardLeader: {
    color: '#A0AEC0',
    fontSize: 13,
  },
  cardDescription: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
