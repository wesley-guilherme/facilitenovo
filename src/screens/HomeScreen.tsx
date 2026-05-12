import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';

const menuItems = [
  { id: 'consultor', title: 'Cadastrar Consultor', icon: '👤' },
  { id: 'empresa', title: 'Cadastrar Empresa', icon: '🏢' },
  { id: 'visita', title: 'Visita In Loco', icon: '🏍️' },
  { id: 'relatorios', title: 'Relatórios', icon: '📊' },
  { id: 'textos', title: 'Textos Predefinidos', icon: '💬' },
];

export default function HomeScreen() {
  const navigation = useNavigation();

  const handleNavigate = (title: string) => {
    Alert.alert('Navegação', `Ir para: ${title}`);
  };

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FACILITE</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.welcomeArea}>
        <Text style={styles.welcomeText}>Olá, João!</Text>
        <Text style={styles.subtitleText}>O que deseja fazer hoje?</Text>
      </View>

      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuCard}
            onPress={() => handleNavigate(item.title)}
            activeOpacity={0.7}
          >
            <View style={styles.menuCardLeft}>
              <Text style={styles.menuIconText}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  menuButton: { padding: 8 },
  menuIcon: { fontSize: 28, color: '#1A1A1A' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  notificationButton: { padding: 8 },
  notificationIcon: { fontSize: 22, color: '#6C757D' },
  welcomeArea: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  welcomeText: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  subtitleText: { fontSize: 14, color: '#6C757D' },
  menuContainer: { flex: 1, paddingHorizontal: 16 },
  menuCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#E9ECEF' },
  menuCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIconText: { fontSize: 24, color: '#2463EB' },
  menuTitle: { fontSize: 16, fontWeight: '500', color: '#1A1A1A' },
  menuArrow: { fontSize: 18, color: '#6C757D' },
});