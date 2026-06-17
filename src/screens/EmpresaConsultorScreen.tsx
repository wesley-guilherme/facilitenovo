/**
 * TELA: EmpresaConsultorScreen
 * 
 * FUNÇÃO:
 * Permite cadastrar/editar os dados da empresa do consultor:
 * - Logo Pequena (upload)
 * - Logo Média (upload - marca d'água)
 * - Nome da Empresa
 * - Endereço
 * - Número
 * - Cidade
 * - Estado
 * - Celular (máscara (99)-99999-9999)
 * - Telefone (máscara (99)-9999-9999)
 * - E-mail
 * - Mensagem do Formulário
 */

import React, { useState, useRef } from 'react';
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

import { EmpresaConsultorRepository } from '../database/empresaConsultorRepository';

import { salvarLogo, excluirImagem } from '../services/imageService';

import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';
import { useEmpresa } from '../contexts/EmpresaContext';
import * as ImagePicker from 'expo-image-picker';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;
const HEADER_HEIGHT = 56;

type EmpresaConsultorScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'EmpresaConsultor'>;

export default function EmpresaConsultorScreen() {
  const navigation = useNavigation<EmpresaConsultorScreenNavigationProp>();
  const { empresa, atualizarEmpresa } = useEmpresa();

  const scrollViewRef = useRef<ScrollView>(null);
  
  // Estados do formulário
  const [logoPequena, setLogoPequena] = useState<string | null>(empresa?.logoPequena || null);
  const [logoMedia, setLogoMedia] = useState<string | null>(empresa?.logoMedia || null);
  const [nome, setNome] = useState(empresa?.nome || '');
  const [endereco, setEndereco] = useState(empresa?.endereco || '');
  const [numero, setNumero] = useState(empresa?.numero || '');
  const [cidade, setCidade] = useState(empresa?.cidade || '');
  const [estado, setEstado] = useState(empresa?.estado || '');
  const [celular, setCelular] = useState(empresa?.celular || '');
  const [telefone, setTelefone] = useState(empresa?.telefone || '');
  const [email, setEmail] = useState(empresa?.email || '');
  const [mensagemFormulario, setMensagemFormulario] = useState(empresa?.mensagemFormulario || '');

  // Estados de erro
  const [errors, setErrors] = useState({
    nome: '',
    endereco: '',
    numero: '',
    cidade: '',
    estado: '',
    celular: '',
    telefone: '',
    email: '',
  });

  // Função para formatar celular (11 dígitos)
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

  // Função para formatar telefone (10 dígitos)
  const formatarTelefone = (texto: string) => {
    let numeros = texto.replace(/\D/g, '');
    if (numeros.length > 10) {
      numeros = numeros.slice(0, 10);
    }
    
    let formatado = numeros;
    if (numeros.length === 0) {
      formatado = '';
    } else if (numeros.length <= 2) {
      formatado = `(${numeros}`;
    } else if (numeros.length <= 6) {
      formatado = `(${numeros.slice(0, 2)})-${numeros.slice(2)}`;
    } else {
      formatado = `(${numeros.slice(0, 2)})-${numeros.slice(2, 6)}-${numeros.slice(6, 10)}`;
    }
    return formatado;
  };

  const handleCelularChange = (texto: string) => {
    const formatado = formatarCelular(texto);
    setCelular(formatado);
    
    const numeros = texto.replace(/\D/g, '');
    if (numeros.length !== 0 && numeros.length !== 11) {
      setErrors(prev => ({ ...prev, celular: 'Celular deve ter 11 dígitos' }));
    } else {
      setErrors(prev => ({ ...prev, celular: '' }));
    }
  };

  const handleTelefoneChange = (texto: string) => {
    const formatado = formatarTelefone(texto);
    setTelefone(formatado);
    
    const numeros = texto.replace(/\D/g, '');
    if (numeros.length !== 0 && numeros.length !== 10) {
      setErrors(prev => ({ ...prev, telefone: 'Telefone deve ter 10 dígitos' }));
    } else {
      setErrors(prev => ({ ...prev, telefone: '' }));
    }
  };

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

const handleSelecionarImagem = async (
  tipo: 'pequena' | 'media'
) => {

  const { status } =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Permissão negada',
      'Precisamos de acesso à galeria para adicionar imagem'
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

      const caminhoFinal =
        await salvarLogo(
          result.assets[0].uri
        );

      console.log(
        '🏢 Logo salva em:',
        caminhoFinal
      );

      if (tipo === 'pequena') {

        if (logoPequena) {
          await excluirImagem(
            logoPequena
          );
        }

        setLogoPequena(
          caminhoFinal
        );

      } else {

        if (logoMedia) {
          await excluirImagem(
            logoMedia
          );
        }

        setLogoMedia(
          caminhoFinal
        );
      }

    } catch (error) {

      console.error(
        'Erro ao salvar imagem:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível salvar a imagem.'
      );
    }
  }
};

const handleExcluirImagem = (
  tipo: 'pequena' | 'media'
) => {

  Alert.alert(
    'Excluir Imagem',
    `Tem certeza que deseja remover a ${
      tipo === 'pequena'
        ? 'logo pequena'
        : "marca d'água"
    }?`,
    [
      {
        text: 'Cancelar',
        style: 'cancel'
      },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {

          try {

            if (tipo === 'pequena') {

              if (logoPequena) {
                await excluirImagem(
                  logoPequena
                );
              }

              setLogoPequena(null);

            } else {

              if (logoMedia) {
                await excluirImagem(
                  logoMedia
                );
              }

              setLogoMedia(null);
            }

          } catch (error) {

            console.error(
              'Erro ao excluir imagem:',
              error
            );
          }
        }
      }
    ]
  );
};

  const handleVoltar = () => {
    navigation.goBack();
  };

  const handleSalvar =  async () => {
    const nomeError = nome.trim() === '' ? 'Nome da empresa é obrigatório' : '';
    const enderecoError = endereco.trim() === '' ? 'Endereço é obrigatório' : '';
    const numeroError = numero.trim() === '' ? 'Número é obrigatório' : '';
    const cidadeError = cidade.trim() === '' ? 'Cidade é obrigatória' : '';
    const estadoError = estado.trim() === '' ? 'Estado é obrigatório' : '';
    const emailError = validarEmail(email);
    const celularNumeros = celular.replace(/\D/g, '');
    const telefoneNumeros = telefone.replace(/\D/g, '');
    
    setErrors({
      nome: nomeError,
      endereco: enderecoError,
      numero: numeroError,
      cidade: cidadeError,
      estado: estadoError,
      celular: celularNumeros.length !== 0 && celularNumeros.length !== 11 ? 'Celular deve ter 11 dígitos' : '',
      telefone: telefoneNumeros.length !== 0 && telefoneNumeros.length !== 10 ? 'Telefone deve ter 10 dígitos' : '',
      email: emailError,
    });
    
    if (nomeError || enderecoError || numeroError || cidadeError || estadoError || emailError) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios corretamente');
      return;
    }

    try {

  const valoresEmpresa = [
    logoPequena,
    logoMedia,
    nome,
    endereco,
    numero,
    cidade,
    estado,
    celular,
    telefone,
    email,
    mensagemFormulario,
    new Date().toISOString()
  ];

  await EmpresaConsultorRepository.salvar(
    valoresEmpresa
  );

  console.log(
    '✅ Empresa consultor salva no banco'
  );  
    
    atualizarEmpresa ({
      logoPequena,
      logoMedia,
      nome,
      endereco,
      numero,
      cidade,
      estado,
      celular,
      telefone,
      email,
      mensagemFormulario,
    });
    
    Alert.alert('Sucesso',
       'Dados da empresa salvos com sucesso!',
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home')

        }
      ]
      );
  
} catch (error) {

  console.error(
    '❌ Erro ao salvar empresa:',
    error
  );

  Alert.alert(
    'Erro',
    'Não foi possível salvar a empresa.'
    );
  }
}

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 50 : STATUS_BAR_HEIGHT + 8 }]}>
        <TouchableOpacity onPress={handleVoltar} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minha Empresa</Text>
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
          >
            {/* Logo Pequena - SEM O X SOBREPOSTO */}
            <View style={styles.logoSection}>
              <Text style={styles.sectionTitle}>Logo Pequena</Text>
              <TouchableOpacity 
                style={styles.logoContainer} 
                onPress={() => handleSelecionarImagem('pequena')}
                activeOpacity={0.7}
              >
                {logoPequena ? (
                  <Image source={{ uri: logoPequena }} style={styles.logoPequena} />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Text style={styles.logoPlaceholderIcon}>🖼️</Text>
                    <Text style={styles.logoPlaceholderText}>Adicionar Logo</Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* CORREÇÃO: Botão "Excluir Foto" abaixo da imagem */}
              {logoPequena && (
                <TouchableOpacity onPress={() => handleExcluirImagem('pequena')} style={styles.excluirButton}>
                  <Text style={styles.excluirButtonText}>Excluir Logo</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Logo Média (Marca d'água) - SEM O X SOBREPOSTO */}
            <View style={styles.logoSection}>
              <Text style={styles.sectionTitle}>Logo Marca d'Água</Text>
              <TouchableOpacity 
                style={styles.logoContainerMedia} 
                onPress={() => handleSelecionarImagem('media')}
                activeOpacity={0.7}
              >
                {logoMedia ? (
                  <Image source={{ uri: logoMedia }} style={styles.logoMedia} />
                ) : (
                  <View style={styles.logoPlaceholderMedia}>
                    <Text style={styles.logoPlaceholderIcon}>🌊</Text>
                    <Text style={styles.logoPlaceholderText}>Adicionar Marca d'Água</Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* CORREÇÃO: Botão "Excluir Foto" abaixo da imagem */}
              {logoMedia && (
                <TouchableOpacity onPress={() => handleExcluirImagem('media')} style={styles.excluirButton}>
                  <Text style={styles.excluirButtonText}>Excluir Marca d'Água</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Nome da Empresa <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.nome ? styles.inputError : null]}
                  placeholder="Digite o nome da empresa"
                  placeholderTextColor="#ADB5BD"
                  value={nome}
                  onChangeText={(text) => {
                    setNome(text);
                    setErrors(prev => ({ ...prev, nome: text.trim() === '' ? 'Nome da empresa é obrigatório' : '' }));
                  }}
                />
                {errors.nome ? <Text style={styles.errorText}>{errors.nome}</Text> : null}
              </View>

              <View style={styles.row}>
                <View style={[styles.field, { flex: 2, marginRight: 8 }]}>
                  <Text style={styles.label}>Endereço <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.input, errors.endereco ? styles.inputError : null]}
                    placeholder="Rua, Avenida..."
                    placeholderTextColor="#ADB5BD"
                    value={endereco}
                    onChangeText={(text) => {
                      setEndereco(text);
                      setErrors(prev => ({ ...prev, endereco: text.trim() === '' ? 'Endereço é obrigatório' : '' }));
                    }}
                  />
                  {errors.endereco ? <Text style={styles.errorText}>{errors.endereco}</Text> : null}
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Número <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.input, errors.numero ? styles.inputError : null]}
                    placeholder="Número"
                    placeholderTextColor="#ADB5BD"
                    keyboardType="numeric"
                    value={numero}
                    onChangeText={(text) => {
                      setNumero(text);
                      setErrors(prev => ({ ...prev, numero: text.trim() === '' ? 'Número é obrigatório' : '' }));
                    }}
                  />
                  {errors.numero ? <Text style={styles.errorText}>{errors.numero}</Text> : null}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.field, { flex: 2, marginRight: 8 }]}>
                  <Text style={styles.label}>Cidade <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.input, errors.cidade ? styles.inputError : null]}
                    placeholder="Cidade"
                    placeholderTextColor="#ADB5BD"
                    value={cidade}
                    onChangeText={(text) => {
                      setCidade(text);
                      setErrors(prev => ({ ...prev, cidade: text.trim() === '' ? 'Cidade é obrigatória' : '' }));
                    }}
                  />
                  {errors.cidade ? <Text style={styles.errorText}>{errors.cidade}</Text> : null}
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Estado <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.input, errors.estado ? styles.inputError : null]}
                    placeholder="UF"
                    placeholderTextColor="#ADB5BD"
                    autoCapitalize="characters"
                    maxLength={2}
                    value={estado}
                    onChangeText={(text) => {
                      setEstado(text.toUpperCase());
                      setErrors(prev => ({ ...prev, estado: text.trim() === '' ? 'Estado é obrigatório' : '' }));
                    }}
                  />
                  {errors.estado ? <Text style={styles.errorText}>{errors.estado}</Text> : null}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Celular</Text>
                  <TextInput
                    style={[styles.input, errors.celular ? styles.inputError : null]}
                    placeholder="(99)-99999-9999"
                    placeholderTextColor="#ADB5BD"
                    keyboardType="numeric"
                    value={celular}
                    onChangeText={handleCelularChange}
                  />
                  {errors.celular ? <Text style={styles.errorText}>{errors.celular}</Text> : null}
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Telefone</Text>
                  <TextInput
                    style={[styles.input, errors.telefone ? styles.inputError : null]}
                    placeholder="(99)-9999-9999"
                    placeholderTextColor="#ADB5BD"
                    keyboardType="numeric"
                    value={telefone}
                    onChangeText={handleTelefoneChange}
                  />
                  {errors.telefone ? <Text style={styles.errorText}>{errors.telefone}</Text> : null}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>E-mail <Text style={styles.required}>*</Text></Text>
                <TextInput
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
                <Text style={styles.label}>Mensagem do Formulário</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Mensagem que aparecerá no formulário de visita..."
                  placeholderTextColor="#ADB5BD"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={mensagemFormulario}
                  onChangeText={setMensagemFormulario}
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
  keyboardAvoidingView: {
    flex: 1,
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
  backButton: {
    padding: 8,
    width: 44,
  },
  backIcon: {
    fontSize: 32,
    color: '#1A1A1A',
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
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C757D',
    marginBottom: 12,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainerMedia: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPequena: {
    width: 80,
    height: 80,
  },
  logoMedia: {
    width: 120,
    height: 120,
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderMedia: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  logoPlaceholderText: {
    fontSize: 10,
    color: '#6C757D',
  },
  // CORREÇÃO: Estilo do botão excluir
  excluirButton: {
    marginTop: 8,
  },
  excluirButtonText: {
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
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 11,
    color: '#FF3B30',
    marginTop: 4,
  },
});