import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Mock de Eventos
const mockEvents = [
  {
    id: '1',
    title: 'Conferência de Jovens - Desperta',
    date: '2026-08-15',
    day: '15',
    month: 'AGO',
    time: '19:00',
    location: 'Sede Principal',
    description: 'Uma noite de muito louvor, adoração e palavra para os jovens.',
    type: 'upcoming'
  },
  {
    id: '2',
    title: 'Retiro de Casais 2026',
    date: '2026-09-10',
    day: '10',
    month: 'SET',
    time: '08:00',
    location: 'Acampamento Moriá',
    description: 'Tempo precioso para investir no seu casamento e família.',
    type: 'upcoming'
  },
  {
    id: '3',
    title: 'Batismo nas Águas',
    date: '2026-10-05',
    day: '05',
    month: 'OUT',
    time: '10:00',
    location: 'Sítio Recanto das Águas',
    description: 'Venha celebrar a nova vida em Cristo dos nossos irmãos.',
    type: 'upcoming'
  },
  {
    id: '4',
    title: 'Seminário de Liderança',
    date: '2026-06-20',
    day: '20',
    month: 'JUN',
    time: '14:00',
    location: 'Auditório IDE',
    description: 'Capacitação para todos os líderes de células e ministérios.',
    type: 'past'
  },
  {
    id: '5',
    title: 'Culto de Ações de Graças',
    date: '2025-12-31',
    day: '31',
    month: 'DEZ',
    time: '22:00',
    location: 'Sede Principal',
    description: 'Encerramento do ano com muita gratidão a Deus.',
    type: 'past'
  }
];

export default function EventsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' ou 'past'

  const filteredEvents = mockEvents.filter(event => event.type === activeTab);

  const renderEventCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateMonth}>{item.month}</Text>
          <Text style={styles.dateDay}>{item.day}</Text>
        </View>
      </View>
      
      <View style={styles.cardRight}>
        <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
        
        <View style={styles.infoRow}>
          <Feather name="clock" size={14} color="#AAAAAA" />
          <Text style={styles.infoText}>{item.time}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color="#AAAAAA" />
          <Text style={styles.infoText}>{item.location}</Text>
        </View>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>
            {activeTab === 'upcoming' ? 'Participar' : 'Ver Detalhes'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-left" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Agenda de Eventos</Text>
          <View style={{ width: 28 }} />
        </View>
      </SafeAreaView>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'upcoming' && styles.activeTabButton]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Próximos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'past' && styles.activeTabButton]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            Anteriores
          </Text>
        </TouchableOpacity>
      </View>

      {/* Event List */}
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEventCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="calendar" size={48} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>Nenhum evento encontrado.</Text>
          </View>
        }
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
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  activeTabButton: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)', // Verde translúcido Antigravity
  },
  tabText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#4ade80',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardLeft: {
    marginRight: 15,
    justifyContent: 'flex-start',
  },
  dateBlock: {
    width: 65,
    height: 75,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
  },
  dateMonth: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dateDay: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  cardRight: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    color: '#AAAAAA',
    fontSize: 13,
    marginLeft: 6,
  },
  actionButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#888888',
    fontSize: 16,
    marginTop: 15,
  }
});
