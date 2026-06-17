/**
 * TELA: FaleConoscoScreen
 * 
 * FUNÇÃO:
 * Exibe as informações de contato do desenvolvedor:
 * - Nome / Desenvolvedor
 * - Redes sociais (WhatsApp, LinkedIn, GitHub, Gmail, Instagram)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Linking,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;

type FaleConoscoScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'FaleConosco'>;

type RedeSocial = {
  id: string;
  nome: string;
  iconeSvg: any; // Para imagem local
  url: string;
  cor: string;
  username: string;
};

const REDES_SOCIAIS: RedeSocial[] = [
  {
    id: '1',
    nome: 'WhatsApp',
    iconeSvg: require('../../assets/fc_whatsapp.png'),
    url: 'https://wa.me/5573998092770',
    cor: '#25D366',
    username: '(73) 99809-2770',
  },
  {
    id: '2',
    nome: 'LinkedIn',
    iconeSvg: require('../../assets/fc_linkedin.png'),
    url: 'https://www.linkedin.com/in/wesley-guilherme-b0535462/',
    cor: '#0077B5',
    username: '/in/wesley-guilherme',
  },
  {
    id: '3',
    nome: 'GitHub',
    iconeSvg: require('../../assets/fc_github.png'),
    url: 'https://github.com/wesley-guilherme',
    cor: '#333333',
    username: '/wesley-guilherme',
  },
  {
    id: '4',
    nome: 'Gmail',
    iconeSvg: require('../../assets/fc_gmail.png'),
    url: 'mailto:wesley.analistasystem@gmail.com',
    cor: '#EA4335',
    username: 'wesley.analistasystem@gmail.com',
  },
  {
    id: '5',
    nome: 'Instagram',
    iconeSvg: require('../../assets/fc_instagram.png'),
    url: 'https://instagram.com/wesley.guilherme',
    cor: '#E4405F',
    username: '@wesley.guilherme',
  },
];

export default function FaleConoscoScreen() {
  const navigation = useNavigation<FaleConoscoScreenNavigationProp>();

  const handleVoltar = () => {
    navigation.goBack();
  };

  const handleAbrirLink = (url: string, nome: string) => {
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Erro', `Não foi possível abrir ${nome}`);
        }
      })
      .catch(() => {
        Alert.alert('Erro', `Não foi possível abrir ${nome}`);
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      
      {/* Cabeçalho */}
      <View style={[styles.header, { paddingTop: STATUS_BAR_HEIGHT + 8 }]}>
        <TouchableOpacity onPress={handleVoltar} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fale Conosco</Text>
        <View style={styles.placeholderRight} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Logo / Avatar do Desenvolvedor */}
        <View style={styles.logoContainer}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>👨‍💻</Text>
          </View>
          <Text style={styles.desenvolvedorNome}>Wesley Guilherme</Text>
          <Text style={styles.desenvolvedorTitulo}>Desenvolvedor Full Stack</Text>
        </View>

        {/* Frase centralizada */}
        <View style={styles.fraseContainer}>
          <Text style={styles.fraseTexto}>
            "Transformando ideias em soluções digitais"
          </Text>
        </View>

        {/* Título das redes sociais */}
        <View style={styles.redesTitleContainer}>
          <Text style={styles.redesTitle}>📱 Contate-me nas redes sociais</Text>
        </View>

        {/* Lista de Redes Sociais com ícones SVG */}
        <View style={styles.redesContainer}>
          {REDES_SOCIAIS.map((rede) => (
            <TouchableOpacity
              key={rede.id}
              style={[styles.card, { borderLeftColor: rede.cor, borderLeftWidth: 4 }]}
              onPress={() => handleAbrirLink(rede.url, rede.nome)}
              activeOpacity={0.7}
            >
              <View style={styles.cardIconContainer}>
                <Image source={rede.iconeSvg} style={styles.cardIcon} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardNome}>{rede.nome}</Text>
                <Text style={styles.cardUsername}>{rede.username}</Text>
              </View>
              <Text style={styles.cardArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Copyright */}
        <View style={styles.copyrightContainer}>
          <Text style={styles.copyrightText}>© 2026 FACILITE</Text>
          <Text style={styles.copyrightText}>Versão 1.0.0</Text>
          <Text style={styles.copyrightText}>Desenvolvido com ❤️ para consultores de campo</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#F8F9FC',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 8,
    width: 44,
  },
  backIcon: {
    fontSize: 32,
    color: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  placeholderRight: {
    width: 44,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Logo / Avatar
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2463EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 48,
  },
  desenvolvedorNome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  desenvolvedorTitulo: {
    fontSize: 14,
    color: '#6C757D',
  },
  // Frase centralizada
  fraseContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  fraseTexto: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Título redes sociais
  redesTitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  redesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  // Cards das redes sociais
  redesContainer: {
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  cardInfo: {
    flex: 1,
  },
  cardNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cardUsername: {
    fontSize: 12,
    color: '#6C757D',
  },
  cardArrow: {
    fontSize: 18,
    color: '#ADB5BD',
    marginLeft: 12,
  },
  // Copyright
  copyrightContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 16,
  },
  copyrightText: {
    fontSize: 12,
    color: '#ADB5BD',
    marginBottom: 4,
  },
});