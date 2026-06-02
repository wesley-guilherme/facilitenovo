/**
 * TELA: EditarEmpresaScreen
 * 
 * FUNÇÃO:
 * Permite editar os dados de uma empresa existente:
 * - Logo (opcional, com opção de excluir)
 * - Nome Fantasia (obrigatório)
 * - Proprietário (obrigatório)
 * - Cidade (obrigatório)
 * - Estado (obrigatório)
 * - Endereço (obrigatório)
 * - Número (obrigatório)
 * - E-mail (obrigatório, formato válido)
 * - Celular (obrigatório, formato (99)-99999-9999)
 * - Código de Referência (obrigatório, apenas números)
 * - Anotações (opcional)
 * - Desativar Cadastro (Switch)
 * - Excluir Cadastro (botão vermelho)
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  Switch,
  SafeAreaView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../database/initDatabase'
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;
const HEADER_HEIGHT = 56;

type EditarEmpresaScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'EditarEmpresa'>;

// Tipo para os dados da empresa recebidos via parâmetro
type EmpresaData = {
  id: string;
  logo: string | null;
  nome_fantasia: string;
  proprietario: string;
  cidade: string;
  estado: string;
  endereco: string;
  numero: string;
  email: string;
  contato: string;
  codigo_referencia: string;
  anotacoes: string;
  ativo: number;
};

export default function EditarEmpresaScreen() {
  const navigation = useNavigation<EditarEmpresaScreenNavigationProp>();
  const route = useRoute();
  
  // Recebe os dados da empresa via parâmetro de navegação
  const empresa = (route.params as any)?.empresa as EmpresaData;
  console.log('📦 Empresa recebida para edição:', empresa.id);
  console.log('📝 Nome recebido:', empresa.nome_fantasia);
  
  // Refs para os inputs
  const scrollViewRef = useRef<ScrollView>(null);
  const nomeRef = useRef<TextInput>(null);
  const proprietarioRef = useRef<TextInput>(null);
  const cidadeRef = useRef<TextInput>(null);
  const estadoRef = useRef<TextInput>(null);
  const enderecoRef = useRef<TextInput>(null);
  const numeroRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const celularRef = useRef<TextInput>(null);
  const codigoRef = useRef<TextInput>(null);
  const anotacoesRef = useRef<TextInput>(null);

const [logo, setLogo] = useState<string | null>(null);
const [nomeFantasia, setNomeFantasia] = useState('');
const [proprietario, setProprietario] = useState('');
const [cidade, setCidade] = useState('');
const [estado, setEstado] = useState('');
const [endereco, setEndereco] = useState('');
const [numero, setNumero] = useState('');
const [email, setEmail] = useState('');
const [celular, setCelular] = useState('');
const [codigoReferencia, setCodigoReferencia] = useState('');
const [anotacoes, setAnotacoes] = useState('');
const [desativado, setDesativado] = useState(false);

useEffect(() => {
  if (!empresa) return;

  console.log('🔄 Atualizando formulário:', empresa.id);

  setLogo(empresa.logo || null);
  setNomeFantasia(empresa.nome_fantasia || '');
  setProprietario(empresa.proprietario || '');
  setCidade(empresa.cidade || '');
  setEstado(empresa.estado || '');
  setEndereco(empresa.endereco || '');
  setNumero(empresa.numero || '');
  setEmail(empresa.email || '');
  setCelular(empresa.contato || '');
  setCodigoReferencia(empresa.codigo_referencia || '');
  setAnotacoes(empresa.anotacoes || '');
  setDesativado(empresa.ativo !== 1);

}, [empresa]);


  // Estados de erro
  const [errors, setErrors] = useState({
    nomeFantasia: '',
    proprietario: '',
    cidade: '',
    estado: '',
    endereco: '',
    numero: '',
    email: '',
    celular: '',
    codigoReferencia: '',
  });

  // Função para validar nome fantasia
  const validarNomeFantasia = (texto: string) => {
    if (texto.trim() === '') {
      return 'Nome fantasia é obrigatório';
    }
    return '';
  };

  // Função para validar proprietário
  const validarProprietario = (texto: string) => {
    if (texto.trim() === '') {
      return 'Proprietário é obrigatório';
    }
    return '';
  };

  // Função para validar cidade
  const validarCidade = (texto: string) => {
    if (texto.trim() === '') {
      return 'Cidade é obrigatória';
    }
    return '';
  };

  const ESTADOS_BRASIL = [
  'AC','AL','AP','AM','BA','CE','DF','ES',
  'GO','MA','MT','MS','MG','PA','PB','PR',
  'PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO'
];

const validarEstado = (texto: string) => {
  const uf = texto.trim().toUpperCase();

  if (!uf) {
    return 'Estado é obrigatório';
  }

  if (!ESTADOS_BRASIL.includes(uf)) {
    return 'UF inválida';
  }

  return '';
};

  // Função para validar endereço
  const validarEndereco = (texto: string) => {
    if (texto.trim() === '') {
      return 'Endereço é obrigatório';
    }
    return '';
  };

  // Função para validar número
  const validarNumero = (texto: string) => {
    if (texto.trim() === '') {
      return 'Número é obrigatório';
    }
    return '';
  };

  // Função para validar email
  const validarEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() === '') {
      return 'E-mail é obrigatório';
    }
    if (!regex.test(email)) {
      return 'E-mail inválido';
    }
    return '';
  };

  // Função para validar código de referência (apenas números)
  const validarCodigoReferencia = (texto: string) => {
    const regex = /^\d*$/;
    if (texto.trim() === '') {
      return 'Código de referência é obrigatório';
    }
    if (!regex.test(texto)) {
      return 'Código deve conter apenas números';
    }
    return '';
  };

  // Função para formatar celular
  const formatarCelular = (texto: string) => {
    let numeros = texto.replace(/\D/g, '');
    if (numeros.length > 11) {
      numeros = numeros.slice(0, 11);
    }
    
    let formatado = numeros;
    if (numeros.length === 0) {
      formatado = '';
    } else if (numeros.length <= 2) {
      formatado = `(${numeros}`;
    } else if (numeros.length <= 7) {
      formatado = `(${numeros.slice(0, 2)})-${numeros.slice(2)}`;
    } else {
      formatado = `(${numeros.slice(0, 2)})-${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
    }
    
    return formatado;
  };

  // Função para validar celular
  const validarCelular = (celular: string) => {
    const numeros = celular.replace(/\D/g, '');
    if (numeros.length === 0) {
      return 'Celular é obrigatório';
    }
    if (numeros.length !== 11) {
      return 'Celular deve ter 11 dígitos (DDD + 9 números)';
    }
    return '';
  };

  const handleCelularChange = (texto: string) => {
    const formatado = formatarCelular(texto);
    setCelular(formatado);
    
    const numeros = texto.replace(/\D/g, '');
    if (numeros.length === 0) {
      setErrors(prev => ({ ...prev, celular: 'Celular é obrigatório' }));
    } else if (numeros.length !== 11) {
      setErrors(prev => ({ ...prev, celular: 'Celular deve ter 11 dígitos (DDD + 9 números)' }));
    } else {
      setErrors(prev => ({ ...prev, celular: '' }));
    }
  };

  const handleCodigoChange = (texto: string) => {
    const regex = /^\d*$/;
    if (regex.test(texto) || texto === '') {
      setCodigoReferencia(texto);
      if (texto.trim() === '') {
        setErrors(prev => ({ ...prev, codigoReferencia: 'Código de referência é obrigatório' }));
      } else {
        setErrors(prev => ({ ...prev, codigoReferencia: '' }));
      }
    }
  };

  // Função para selecionar logo
  const handleSelecionarLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria para adicionar logo');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setLogo(result.assets[0].uri);
    }
  };

  const handleExcluirLogo = () => {
    Alert.alert(
      'Excluir Logo',
      'Tem certeza que deseja remover a logo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => setLogo(null)
        }
      ]
    );
  };

  // Função para excluir o cadastro completo
  const handleExcluirCadastro = () => {
    Alert.alert(
      'Excluir Cadastro',
      'Tem certeza que deseja excluir permanentemente esta empresa? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM empresas WHERE id = ?', [empresa.id]);
              Alert.alert(
                'Sucesso',
                'Empresa excluída com sucesso!',
                [{ text: 'OK', onPress: () => navigation.navigate('Empresas') }]
              );
            } catch (error) {
              console.error('Erro ao excluir empresa:', error);
              Alert.alert('Erro', 'Não foi possível excluir a empresa');
            }
          }
        }
      ]
    );
  };

  // CORREÇÃO: Função handleSalvar com UPDATE no banco
  const handleSalvar = async () => {
    console.log('🔵 1 - Iniciou handleSalvar');
    const nomeError = validarNomeFantasia(nomeFantasia);
    const proprietarioError = validarProprietario(proprietario);
    const cidadeError = validarCidade(cidade);
    const estadoError = validarEstado(estado);
    const enderecoError = validarEndereco(endereco);
    const numeroError = validarNumero(numero);
    const emailError = validarEmail(email);
    const celularError = validarCelular(celular);
    const codigoError = validarCodigoReferencia(codigoReferencia);
    
    setErrors({
      nomeFantasia: nomeError,
      proprietario: proprietarioError,
      cidade: cidadeError,
      estado: estadoError,
      endereco: enderecoError,
      numero: numeroError,
      email: emailError,
      celular: celularError,
      codigoReferencia: codigoError,
    });

    console.log('🔵 2 - Validações concluídas');
    
    if (nomeError || proprietarioError || cidadeError || estadoError || enderecoError || numeroError || emailError || celularError || codigoError) {
      Alert.alert('Erro', 'Preencha todos os campos corretamente');
      return;
    }
    
 console.log('🔵 4 - Validação passou, ID da empresa:', empresa?.id);
  console.log('🔵 5 - Dados que serão enviados:', {
    codigoReferencia,
    nomeFantasia,
    proprietario,
    cidade,
    estado,
    endereco,
    numero,
    email,
    celular,
    anotacoes,
    logo,
    desativado,
    empresaId: empresa?.id
  });   

    try {
      console.log('🔵 6 - Tentando executar UPDATE...');
      await db.runAsync(
        `UPDATE empresas SET 
          codigo_referencia = ?, 
          nome_fantasia = ?, 
          proprietario = ?, 
          cidade = ?, 
          estado = ?, 
          endereco = ?, 
          numero = ?, 
          email = ?, 
          contato = ?, 
          anotacoes = ?, 
          logo = ?, 
          ativo = ?, 
          updated_at = ?
        WHERE id = ?`,
        [
          codigoReferencia,
          nomeFantasia,
          proprietario,
          cidade,
          estado.toUpperCase(),
          endereco,
          numero,
          email,
          celular,
          anotacoes,
          logo,
          desativado ? 0 : 1,
          new Date().toISOString(),
          empresa.id
        ]
      );

      console.log('✅ 7 - UPDATE executado com sucesso!');
      
      Alert.alert(
        'Sucesso',
        'Empresa atualizada com sucesso!',
        [{ text: 'OK', onPress: () => navigation.navigate('Empresas') }]
      );
    } catch (error) {
      console.error('❌ 8 - Erro no UPDATE:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a empresa');
    }
  };

  const handleCancelar = () => {
    navigation.navigate('Empresas');
  };

  // Switch com useMemo para evitar piscar
  const switchComponent = useMemo(() => (
    <Switch
      value={desativado}
      onValueChange={() => setDesativado(prev => !prev)}
      trackColor={{ false: '#E9ECEF', true: '#2463EB' }}
      thumbColor="#FFFFFF"
    />
  ), [desativado]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 50 : STATUS_BAR_HEIGHT + 8 }]}>
        <TouchableOpacity onPress={handleCancelar} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Empresa</Text>
        <TouchableOpacity onPress={handleSalvar} style={styles.saveButton}>
          <Text style={styles.saveText}>Salvar</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? HEADER_HEIGHT + 50 + 20 : HEADER_HEIGHT + STATUS_BAR_HEIGHT}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_HEIGHT + (Platform.OS === 'ios' ? 50 : STATUS_BAR_HEIGHT) + 16 }]}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
          >
            <View style={styles.logoSection}>
              <TouchableOpacity 
                style={styles.logoContainer} 
                onPress={handleSelecionarLogo}
                activeOpacity={0.7}
              >
                {logo ? (
                  <Image source={{ uri: logo }} style={styles.logo} />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Text style={styles.logoPlaceholderIcon}>🏢</Text>
                    <Text style={styles.logoPlaceholderText}>Adicionar Logo</Text>
                  </View>
                )}
              </TouchableOpacity>
              {logo && (
                <TouchableOpacity onPress={handleExcluirLogo} style={styles.excluirLogoButton}>
                  <Text style={styles.excluirLogoText}>Excluir Logo</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.form}>
              {/* Campo Nome Fantasia */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Nome Fantasia <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  ref={nomeRef}
                  style={[styles.input, errors.nomeFantasia ? styles.inputError : null]}
                  placeholder="Digite o nome fantasia da empresa"
                  placeholderTextColor="#ADB5BD"
                  value={nomeFantasia}
                  onChangeText={(text) => {
                    setNomeFantasia(text);
                    setErrors(prev => ({ ...prev, nomeFantasia: validarNomeFantasia(text) }));
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => proprietarioRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {errors.nomeFantasia ? <Text style={styles.errorText}>{errors.nomeFantasia}</Text> : null}
              </View>

              {/* Campo Proprietário */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Proprietário <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  ref={proprietarioRef}
                  style={[styles.input, errors.proprietario ? styles.inputError : null]}
                  placeholder="Digite o nome do proprietário"
                  placeholderTextColor="#ADB5BD"
                  value={proprietario}
                  onChangeText={(text) => {
                    setProprietario(text);
                    setErrors(prev => ({ ...prev, proprietario: validarProprietario(text) }));
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => cidadeRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {errors.proprietario ? <Text style={styles.errorText}>{errors.proprietario}</Text> : null}
              </View>

              {/* Linha Cidade + Estado */}
              <View style={styles.row}>
                <View style={[styles.field, { flex: 2, marginRight: 8 }]}>
                  <Text style={styles.label}>
                    Cidade <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    ref={cidadeRef}
                    style={[styles.input, errors.cidade ? styles.inputError : null]}
                    placeholder="Digite a cidade"
                    placeholderTextColor="#ADB5BD"
                    value={cidade}
                    onChangeText={(text) => {
                      setCidade(text);
                      setErrors(prev => ({ ...prev, cidade: validarCidade(text) }));
                    }}
                  />
                  {errors.cidade ? <Text style={styles.errorText}>{errors.cidade}</Text> : null}
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>
                    Estado <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    ref={estadoRef}
                    style={[styles.input, errors.estado ? styles.inputError : null]}
                    placeholder="UF (ex: SP)"
                    placeholderTextColor="#ADB5BD"
                    autoCapitalize="characters"
                    maxLength={2}
                    value={estado}
                    onChangeText={(text) => {
                      const uf = text.toUpperCase().replace(/[^A-Z]/g, '');
                      setEstado(uf);
                      setErrors(prev => ({ ...prev, 
                        estado: validarEstado(uf) 
                      }));
                    }}
                  />
                  {errors.estado ? <Text style={styles.errorText}>{errors.estado}</Text> : null}
                </View>
              </View>

              {/* Campo Endereço */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Endereço <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  ref={enderecoRef}
                  style={[styles.input, errors.endereco ? styles.inputError : null]}
                  placeholder="Digite o endereço (rua, avenida...)"
                  placeholderTextColor="#ADB5BD"
                  value={endereco}
                  onChangeText={(text) => {
                    setEndereco(text);
                    setErrors(prev => ({ ...prev, endereco: validarEndereco(text) }));
                  }}
                />
                {errors.endereco ? <Text style={styles.errorText}>{errors.endereco}</Text> : null}
              </View>

              {/* Linha Número + (espaço vazio) */}
              <View style={styles.row}>
                <View style={[styles.field, { flex: 2, marginRight: 8 }]}>
                  <Text style={styles.label}>
                    Número <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    ref={numeroRef}
                    style={[styles.input, errors.numero ? styles.inputError : null]}
                    placeholder="Número do endereço"
                    placeholderTextColor="#ADB5BD"
                    keyboardType="numeric"
                    value={numero}
                    onChangeText={(text) => {
                      setNumero(text);
                      setErrors(prev => ({ ...prev, numero: validarNumero(text) }));
                    }}
                  />
                  {errors.numero ? <Text style={styles.errorText}>{errors.numero}</Text> : null}
                </View>
                <View style={[styles.field, { flex: 1 }]} />
              </View>

              {/* Campo E-mail */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  E-mail <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  ref={emailRef}
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  placeholder="contato@empresa.com"
                  placeholderTextColor="#ADB5BD"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrors(prev => ({ ...prev, email: validarEmail(text) }));
                  }}
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>

              {/* Campo Celular */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Celular <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  ref={celularRef}
                  style={[styles.input, errors.celular ? styles.inputError : null]}
                  placeholder="(99)-99999-9999"
                  placeholderTextColor="#ADB5BD"
                  keyboardType="numeric"
                  value={celular}
                  onChangeText={handleCelularChange}
                />
                <Text style={styles.helperText}>Digite DDD + 9 números (ex: 11999999999)</Text>
                {errors.celular ? <Text style={styles.errorText}>{errors.celular}</Text> : null}
              </View>

              {/* Campo Código de Referência */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Código de Referência <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  ref={codigoRef}
                  style={[styles.input, errors.codigoReferencia ? styles.inputError : null]}
                  placeholder="Digite apenas números"
                  placeholderTextColor="#ADB5BD"
                  keyboardType="numeric"
                  value={codigoReferencia}
                  onChangeText={handleCodigoChange}
                />
                <Text style={styles.helperText}>Apenas números</Text>
                {errors.codigoReferencia ? <Text style={styles.errorText}>{errors.codigoReferencia}</Text> : null}
              </View>

              {/* Campo Anotações */}
              <View style={styles.field}>
                <Text style={styles.label}>Anotações</Text>
                <TextInput
                  ref={anotacoesRef}
                  style={styles.input}
                  placeholder="Informações adicionais sobre a empresa..."
                  placeholderTextColor="#ADB5BD"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={anotacoes}
                  onChangeText={setAnotacoes}
                />
              </View>

              {/* Switch Desativar Cadastro */}
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Desativar Cadastro</Text>
                {switchComponent}
              </View>

              {/* Botão Excluir Cadastro */}
              <TouchableOpacity 
                style={styles.excluirButton} 
                onPress={handleExcluirCadastro}
                activeOpacity={0.7}
              >
                <Text style={styles.excluirButtonText}>Excluir Cadastro</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#6C757D',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  saveButton: {
    padding: 8,
  },
  saveText: {
    fontSize: 16,
    color: '#2463EB',
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
  },
  logoPlaceholderIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  logoPlaceholderText: {
    fontSize: 10,
    color: '#6C757D',
  },
  excluirLogoButton: {
    marginTop: 8,
  },
  excluirLogoText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
  },
  form: {
    paddingHorizontal: 16,
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 11,
    color: '#FF3B30',
    marginTop: 4,
  },
  helperText: {
    fontSize: 10,
    color: '#ADB5BD',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
  },
  switchLabel: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  excluirButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  excluirButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});