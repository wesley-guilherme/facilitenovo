import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';

export default function CustomDrawerContent(props: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileContainer}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.nomeConsultor}>Nome do Consultor</Text>
        <Text style={styles.emailConsultor}>email@consultor.com</Text>
        <View style={styles.empresaContainer}>
          <Text style={styles.empresaIcon}>🏢</Text>
          <Text style={styles.empresaTexto}>Empresa do Consultor</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent} />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerItem}>
          <Text style={styles.footerIcon}>⚙️</Text>
          <Text style={styles.footerText}>Configurações</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerItem}>
          <Text style={styles.footerIcon}>💬</Text>
          <Text style={styles.footerText}>Fale Conosco</Text>
        </TouchableOpacity>
        <View style={styles.copyrightContainer}>
          <Text style={styles.copyrightText}>Criado por: Wesley Guilherme</Text>
          <Text style={styles.copyrightText}>© Copyright 2026</Text>
          <Text style={styles.versionText}>Versão 1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FC' },
  profileContainer: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20, alignItems: 'center' },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2463EB', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 40 },
  nomeConsultor: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  emailConsultor: { fontSize: 14, color: '#6C757D', marginBottom: 12 },
  empresaContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E9ECEF' },
  empresaIcon: { fontSize: 14, marginRight: 6 },
  empresaTexto: { fontSize: 12, color: '#4A4A4A' },
  divider: { height: 1, backgroundColor: '#E9ECEF', marginHorizontal: 16, marginVertical: 8 },
  drawerContent: { paddingHorizontal: 16 },
  footer: { paddingHorizontal: 20, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#E9ECEF', marginTop: 20 },
  footerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  footerIcon: { fontSize: 20, marginRight: 12, color: '#6C757D' },
  footerText: { fontSize: 16, color: '#1A1A1A' },
  copyrightContainer: { marginTop: 16, alignItems: 'center' },
  copyrightText: { fontSize: 11, color: '#ADB5BD', textAlign: 'center' },
  versionText: { fontSize: 11, color: '#ADB5BD', textAlign: 'center', marginTop: 4 },
});