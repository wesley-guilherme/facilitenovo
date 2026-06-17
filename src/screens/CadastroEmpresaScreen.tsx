/**
 * TELA: CadastroEmpresaScreen
 * 
 * FUNÇÃO:
 * Permite cadastrar uma nova empresa com:
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
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmpresaRepository } from '../database/empresaRepository';

import {
  validarNomeFantasia,
  validarProprietario,
  validarCidade,
  validarEstado,
  validarEndereco,
  validarNumero,
  validarEmail,
  validarCelular,
  validarCodigoReferencia
} from '../utils/validator'

import {
  formatarCelular,
  formatarUF,
  normalizarTexto,
  normalizarEmail,
  normalizarCodigoReferencia,
  limitarCodigoReferencia
} from'../utils/formatters';

import { salvarLogo, excluirImagem } from '../services/imageService';

import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';
import * as ImagePicker from 'expo-image-picker';


const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;
const HEADER_HEIGHT = 56;

type CadastroEmpresaScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'CadastroEmpresa'>;

export default function CadastroEmpresaScreen() {
  const navigation = useNavigation<CadastroEmpresaScreenNavigationProp>();
  
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

  // Estados do formulário
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

  const limparFormulario = () => {
  setCodigoReferencia('');
  setNomeFantasia('');
  setProprietario('');
  setCidade('');
  setEstado('');
  setEndereco('');
  setNumero('');
  setEmail('');
  setCelular('');
  setAnotacoes('');
  setLogo(null);


  setErrors({
    codigoReferencia: '',
    nomeFantasia: '',
    proprietario: '',
    cidade: '',
    estado: '',
    endereco: '',
    numero: '',
    email: '',
    celular: '',
  });
};

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

  useFocusEffect(
    useCallback(() => {
      limparFormulario();
    }, [])
  );

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
  const codigo = limitarCodigoReferencia(texto);

  setCodigoReferencia(codigo);

  if (!codigo) {
    setErrors(prev => ({
      ...prev,
      codigoReferencia: 'Código de referência é obrigatório'
    }));
  } else {
    setErrors(prev => ({
      ...prev,
      codigoReferencia: ''
    }));
  }
};

const handleSelecionarLogo = async () => {
  const { status } =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Permissão negada',
      'Precisamos de acesso à galeria para adicionar logo'
    );
    return;
  }

  const result =
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

  if (!result.canceled) {
    try {

      const logoAntiga = logo;

      const caminhoFinal =
        await salvarLogo(
          result.assets[0].uri
        );

      if (logoAntiga) {
        await excluirImagem(logoAntiga);
      }

      console.log(
        '🏢 Logo salva em:',
        caminhoFinal
      );

      setLogo(caminhoFinal);

    } catch (error) {

      console.error(
        'Erro ao salvar logo:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível salvar a logo.'
      );
    }
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
        onPress: async () => {
          try {

            if (logo) {
              await excluirImagem(logo);
            }

            setLogo(null);

          } catch (error) {
            console.error(
              'Erro ao excluir logo:',
              error
            );

            Alert.alert(
              'Erro',
              'Não foi possível excluir a logo.'
            );
          }
        }
      }
    ]
  );
};

  const handleSalvar = async () => {
   
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
    
    if (nomeError || proprietarioError || cidadeError || estadoError || enderecoError || numeroError || emailError || celularError || codigoError) {
      console.log('🔴 3 - Erro de validação');
      Alert.alert('Erro', 'Preencha todos os campos corretamente');
      return;
    }

    const nomeFantasiaFinal = normalizarTexto(nomeFantasia);
    const proprietarioFinal = normalizarTexto(proprietario);
    const cidadeFinal = normalizarTexto(cidade);
    const enderecoFinal = normalizarTexto(endereco);
    const numeroFinal = numero.trim();
    const emailFinal = normalizarEmail(email);
    const codigoReferenciaFinal = normalizarCodigoReferencia(codigoReferencia);
    const anotacoesFinal = normalizarTexto(anotacoes);
    
    try {
      const empresaId = Date.now().toString();
    
      // Verificar se o código já existe
  const codigoExistente =
    await EmpresaRepository.existeCodigo(
      codigoReferenciaFinal
    );

  if (codigoExistente) {
    Alert.alert(
      'Erro',
      'Este código de referência já está cadastrado'
    );
    return;
  }

const valoresInsert = [
  empresaId,
  codigoReferenciaFinal,
  nomeFantasiaFinal,
  proprietarioFinal,
  cidadeFinal,
  formatarUF(estado),
  enderecoFinal,
  numeroFinal,
  emailFinal,
  celular,
  anotacoesFinal,
  logo ?? '',
  1,
  new Date().toISOString()
];

    await EmpresaRepository.inserirEmpresa(
      valoresInsert
    );

      Alert.alert(
        'Sucesso',
        'Empresa cadastrada com sucesso!',
        [{ 
          text: 'OK',
           onPress: () => {
            limparFormulario();
            navigation.navigate('Empresas') 
          },
        },
      ]
    );
    } catch (error) {
      console.error('❌ 7 - Erro no INSERT:', error);
      Alert.alert('Erro', 'Não foi possível cadastrar a empresa');
    }
  };

  const handleCancelar = () => {
    limparFormulario();
    navigation.navigate('Empresas');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 50 : STATUS_BAR_HEIGHT + 8 }]}>
        <TouchableOpacity onPress={handleCancelar} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova Empresa</Text>
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
                    placeholder="UF (ex: BA)"
                    placeholderTextColor="#ADB5BD"
                    autoCapitalize="characters"
                    maxLength={2}
                    value={estado}
                    onChangeText={(text) => {
                      const uf = formatarUF(text);
                      setEstado(uf);
                      setErrors(prev => 
                        ({ ...prev, 
                        estado: validarEstado(uf) 
                      }));
                    }}
                  />
                  {errors.estado ? <Text style={styles.errorText}>{errors.estado}</Text> : null}
                </View>
              </View>

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
});