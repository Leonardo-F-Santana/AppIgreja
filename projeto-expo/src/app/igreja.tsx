import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function IgrejaScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-left" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nossa Visão</Text>
          <View style={{ width: 28 }} />
          {/* Placeholder para centralizar o título */}
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Image */}
        <Image
          source={require('../../assets/Img/sobre.jpg')}
          style={styles.heroImage}
        />

        {/* Purpose Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nossa História</Text>
          <Text style={styles.paragraph}>
            Somos uma igreja família, chamada para viver no amor de Cristo.{'\n'}
            Nosso propósito é formar discípulos que caminham juntos, aprendendo e crescendo na fé, apoiando uns aos outros como irmãos. Aqui você encontra um lugar de acolhimento, comunhão e transformação, onde cada pessoa é convidada a seguir Jesus e a refletir Sua luz no mundo.
          </Text>
        </View>

        {/* Pillars Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nossos Pilares</Text>

          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Feather name="target" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Missão</Text>
              <Text style={styles.cardDescription}>
                Formar discípulos de Cristo que vivam em comunhão como uma família espiritual, refletindo o amor de Deus e servindo ao próximo com dedicação e fé.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <FontAwesome5 name="eye" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Visão</Text>
              <Text style={styles.cardDescription}>
                Ser uma igreja acolhedora e transformadora, onde cada pessoa encontra propósito em seguir Jesus, cresce em discipulado e se torna luz para a comunidade.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Feather name="heart" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Valores</Text>
              <Text style={styles.cardDescription}>
                Amor, Transparência, Excelência, Serviço Comunitário e Centralidade nas Escrituras.
              </Text>
            </View>
          </View>
        </View>

        {/* Leadership */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nossos Pastores</Text>
          <View style={styles.leadershipContainer}>
            <View style={styles.leaderProfile}>
              <Image
                source={require('../../assets/Img/pastor-diego.png')}
                style={styles.leaderAvatar}
              />
              <Text style={styles.leaderName}>Pastor Diego</Text>
              <Text style={styles.leaderRole}></Text>
            </View>

            <View style={styles.leaderProfile}>
              <Image
                source={require('../../assets/Img/pastora-hayane.png')}
                style={styles.leaderAvatar}
              />
              <Text style={styles.leaderName}>Pastora Hayane</Text>
              <Text style={styles.leaderRole}></Text>
            </View>
          </View>
        </View>

      </ScrollView>
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
  scrollContent: {
    paddingBottom: 40,
  },
  heroImage: {
    width: '100%',
    height: 200,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 25,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 35,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  paragraph: {
    color: '#CCCCCC',
    fontSize: 15,
    lineHeight: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'flex-start',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cardDescription: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
  },
  leadershipContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 30,
  },
  leaderProfile: {
    alignItems: 'center',
  },
  leaderAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  leaderName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  leaderRole: {
    color: '#CCCCCC',
    fontSize: 12,
  },
});
