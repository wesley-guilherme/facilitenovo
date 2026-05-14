/**
 * COMPONENTE: CustomDrawerContent
 * 
 * FUNÇÃO:
 * Este componente personaliza o menu lateral (drawer) que aparece quando o usuário
 * clica no ícone de hambúrguer (☰) no canto superior esquerdo da tela.
 * 
 * ESTRUTURA DO MENU LATERAL:
 * 1. Cabeçalho com perfil do consultor (avatar, nome, email, empresa)
 * 2. Linha divisória
 * 3. Itens de navegação principais (gerados automaticamente pelo Drawer)
 * 4. Rodapé com links de configurações e informações de copyright
 * 
 * COMO É USADO:
 * Este componente é passado para o Drawer.Navigator no App.tsx através da prop
 * 'drawerContent', substituindo o menu lateral padrão.
 */

// IMPORTAÇÕES
import React from 'react';
import { 
  View,           // Contêiner flexível para agrupar elementos
  Text,           // Exibe texto com estilos
  StyleSheet,     // Cria os estilos do componente
  TouchableOpacity, // Botão com efeito de toque (feedback visual)
  SafeAreaView    // Ajusta o conteúdo para áreas seguras (evita notch, bordas)
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer'; 
// DrawerContentScrollView: Componente especial que já gerencia a rolagem e a navegação
// Ele automaticamente renderiza os itens de navegação (Início, etc.)

/**
 * COMPONENTE PRINCIPAL
 * @param props - Recebe as propriedades de navegação (navigation, state, etc.)
 *                O tipo 'any' é usado por simplicidade, mas poderia ser tipado corretamente
 */
export default function CustomDrawerContent(props: any) {
  return (
    /**
     * SafeAreaView: Garante que o conteúdo não fique atrás da notch do celular
     * ou das bordas arredondadas.
     */
    <SafeAreaView style={styles.container}>
      
      {/* ======================================== */}
      {/* SEÇÃO 1: PERFIL DO CONSULTOR (CABEÇALHO) */}
      {/* ======================================== */}
      <View style={styles.profileContainer}>
        
        {/* Avatar / Foto do perfil */}
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>👤</Text>
          {/* EMOJIS COMO FALLBACK: Enquanto não temos imagens reais, usamos emojis.
              Futuramente pode ser substituído por <Image source={require('...')} /> */}
        </View>
        
        {/* Nome do consultor logado */}
        <Text style={styles.nomeConsultor}>Nome do Consultor</Text>
        {/* TEXTO ESTÁTICO: Futuramente será substituído por um estado/dado do banco */}
        
        {/* E-mail do consultor */}
        <Text style={styles.emailConsultor}>email@consultor.com</Text>
        
        {/* Container da empresa (com fundo branco e borda arredondada) */}
        <View style={styles.empresaContainer}>
          <Text style={styles.empresaIcon}>🏢</Text>
          <Text style={styles.empresaTexto}>Empresa do Consultor</Text>
        </View>
      </View>

      {/* Linha divisória (separador visual entre o perfil e os itens do menu) */}
      <View style={styles.divider} />

      {/* ======================================== */}
      {/* SEÇÃO 2: ITENS DE NAVEGAÇÃO PRINCIPAIS */}
      {/* ======================================== */}
      {/* 
        DrawerContentScrollView: Componente mágico do React Navigation.
        Ele recebe todas as props do drawer original (props) e automaticamente:
        - Renderiza os itens de navegação definidos no Drawer.Screen (ex: "Início")
        - Gerencia qual item está ativo (estilo ativo)
        - Controla a rolagem se houver muitos itens
        - Aplica o contentContainerStyle para espaçamento interno
        
        O {...props} espalha todas as propriedades (navigation, state, descriptors...)
        O contentContainerStyle adiciona padding horizontal aos itens.
      */}
      <DrawerContentScrollView 
        {...props} 
        contentContainerStyle={styles.drawerContent} 
      />

      {/* ======================================== */}
      {/* SEÇÃO 3: RODAPÉ (CONFIGURAÇÕES, COPYRIGHT) */}
      {/* ======================================== */}
      <View style={styles.footer}>
        
        {/* Botão de Configurações 
            TouchableOpacity: Fornece feedback visual ao toque (opacidade diminui)
            Futuramente, ao clicar, navegará para a tela de configurações
        */}
        <TouchableOpacity 
          style={styles.footerItem}
          // onPress={() => navigation.navigate('Configuracoes')}  // FUTURO
        >
          <Text style={styles.footerIcon}>⚙️</Text>
          <Text style={styles.footerText}>Configurações</Text>
        </TouchableOpacity>
        
        {/* Botão de Fale Conosco */}
        <TouchableOpacity 
          style={styles.footerItem}
          // onPress={() => Linking.openURL('mailto:contato@facilite.com')} // FUTURO
        >
          <Text style={styles.footerIcon}>💬</Text>
          <Text style={styles.footerText}>Fale Conosco</Text>
        </TouchableOpacity>
        
        {/* Container de informações de copyright e versão */}
        <View style={styles.copyrightContainer}>
          <Text style={styles.copyrightText}>Criado por: Wesley Guilherme</Text>
          <Text style={styles.copyrightText}>© Copyright 2026</Text>
          <Text style={styles.versionText}>Versão 1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

/**
 * ESTILOS DO COMPONENTE
 * Seguem a paleta de cores definida na documentação do projeto:
 * - Fundo: #F8F9FC (branco azulado)
 * - Azul primário: #2463EB
 * - Texto principal: #1A1A1A (preto suave)
 * - Texto secundário: #6C757D (cinza)
 */
const styles = StyleSheet.create({
  /**
   * Container principal do menu lateral
   * flex: 1 → Ocupa toda a altura disponível
   * backgroundColor: #F8F9FC → Fundo branco azulado (consistência com o app)
   */
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FC' 
  },

  /**
   * Container do perfil (avatar, nome, email, empresa)
   * alignItems: 'center' → Centraliza horizontalmente
   * paddingTop: 40 → Espaçamento do topo (considerando a área segura)
   */
  profileContainer: { 
    paddingHorizontal: 20, 
    paddingTop: 40, 
    paddingBottom: 20, 
    alignItems: 'center' 
  },

  /**
   * Placeholder do avatar (fundo azul redondo)
   * width/height: 80 → Quadrado de 80px
   * borderRadius: 40 → Metade do tamanho = círculo perfeito
   * backgroundColor: #2463EB → Azul da paleta
   */
  avatarPlaceholder: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#2463EB', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12 
  },

  /**
   * Texto do avatar (emoji)
   * fontSize: 40 → Emoji grande dentro do círculo
   */
  avatarText: { 
    fontSize: 40 
  },

  /**
   * Nome do consultor (estilo título)
   * fontWeight: 'bold' → Negrito para destaque
   * color: #1A1A1A → Preto suave para contraste
   */
  nomeConsultor: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1A1A1A', 
    marginBottom: 4 
  },

  /**
   * E-mail do consultor (estilo secundário)
   * color: #6C757D → Cinza para hierarquia visual
   */
  emailConsultor: { 
    fontSize: 14, 
    color: '#6C757D', 
    marginBottom: 12 
  },

  /**
   * Container da "tag" da empresa (estilo pill)
   * flexDirection: 'row' → Ícone e texto lado a lado
   * backgroundColor: #FFFFFF → Branco para destacar do fundo
   * borderRadius: 20 → Cantos arredondados (efeito de pílula)
   * borderWidth/borderColor → Borda sutil para definir o elemento
   */
  empresaContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E9ECEF' 
  },

  /** Ícone da empresa dentro da pill */
  empresaIcon: { 
    fontSize: 14, 
    marginRight: 6 
  },

  /** Texto da empresa dentro da pill */
  empresaTexto: { 
    fontSize: 12, 
    color: '#4A4A4A' 
  },

  /**
   * Linha divisória horizontal
   * height: 1 → Apenas 1 pixel de altura
   * backgroundColor: #E9ECEF → Cinza bem claro
   * marginHorizontal: 16 → Espaço nas laterais
   * marginVertical: 8 → Espaço vertical antes e depois
   */
  divider: { 
    height: 1, 
    backgroundColor: '#E9ECEF', 
    marginHorizontal: 16, 
    marginVertical: 8 
  },

  /**
   * Estilo aplicado ao container de conteúdo do DrawerContentScrollView
   * paddingHorizontal: 16 → Espaçamento nas laterais dos itens de navegação
   */
  drawerContent: { 
    paddingHorizontal: 16 
  },

  /**
   * Container do rodapé (configurações e copyright)
   * borderTopWidth: 1 → Linha separadora no topo
   * borderTopColor: #E9ECEF → Cor da linha
   * marginTop: 20 → Espaço antes do rodapé
   */
  footer: { 
    paddingHorizontal: 20, 
    paddingBottom: 30, 
    borderTopWidth: 1, 
    borderTopColor: '#E9ECEF', 
    marginTop: 20 
  },

  /**
   * Cada item do rodapé (Configurações, Fale Conosco)
   * flexDirection: 'row' → Ícone e texto lado a lado
   * paddingVertical: 12 → Altura confortável para toque (mínimo 44px recomendado)
   */
  footerItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12 
  },

  /** Ícone do item do rodapé */
  footerIcon: { 
    fontSize: 20, 
    marginRight: 12, 
    color: '#6C757D' 
  },

  /** Texto do item do rodapé */
  footerText: { 
    fontSize: 16, 
    color: '#1A1A1A' 
  },

  /**
   * Container das informações de copyright
   * marginTop: 16 → Espaço acima do copyright
   * alignItems: 'center' → Centralizar textos
   */
  copyrightContainer: { 
    marginTop: 16, 
    alignItems: 'center' 
  },

  /**
   * Texto de copyright
   * fontSize: 11 → Pequeno para não poluir visualmente
   * color: #ADB5BD → Cinza mais claro (menor hierarquia visual)
   * textAlign: 'center' → Centralizar
   */
  copyrightText: { 
    fontSize: 11, 
    color: '#ADB5BD', 
    textAlign: 'center' 
  },

  /**
   * Texto da versão
   * Escala menor para hierarquia (depois do copyright)
   */
  versionText: { 
    fontSize: 11, 
    color: '#ADB5BD', 
    textAlign: 'center', 
    marginTop: 4 
  },
});

/**
 * NOTAS DE FUTURA MANUTENÇÃO:
 * 
 * 1. DINAMIZAR DADOS DO CONSULTOR:
 *    Atualmente os dados do consultor (nome, email, empresa) estão "hardcoded"
 *    (fixos no código). Futuramente, quando implementarmos login e banco de dados,
 *    substituir por algo como: {nomeConsultor} em vez de "Nome do Consultor"
 * 
 * 2. SUBSTITUIR EMOJIS POR SVGS:
 *    Os emojis (👤, 🏢, ⚙️, 💬) são placeholders. Para um app profissional,
 *    substituir por ícones SVG usando @expo/vector-icons ou react-native-svg
 * 
 * 3. ADICIONAR FUNÇÕES DE NAVEGAÇÃO:
 *    Descomentar os onPress e adicionar navigation.navigate('TelaX') para
 *    Configurações e Fale Conosco
 * 
 * 4. TIPAR CORRETAMENTE AS PROPS:
 *    Em vez de 'any', importar DrawerContentComponentProps do @react-navigation/drawer
 *    e usar: export default function CustomDrawerContent(props: DrawerContentComponentProps)
 * 
 * 5. IMAGEM REAL PARA AVATAR:
 *    Substituir o View avatarPlaceholder por:
 *    <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
 */