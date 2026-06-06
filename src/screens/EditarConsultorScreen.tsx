/**
 * TELA: EditarConsultorScreen
 * 
 * FUNÇÃO:
 * Permite editar os dados de um consultor existente:
 * - Foto (opcional, com opção de excluir)
 * - Nome (obrigatório, apenas letras)
 * - Email (obrigatório, formato válido)
 * - WhatsApp (obrigatório, formato (99)-99999-9999)
 * - Rota (obrigatório)
 * - Excluir Cadastro (botão de ação)
 * 
 * OBS: O campo "Desativar Cadastro" foi removido, pois o consultor
 * precisa estar sempre ativo no sistema.
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
  SafeAreaView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootDrawerParamList } from '../types/navigation';
import { useConsultor } from '../contexts/ConsultorContext';
import * as ImagePicker from 'expo-image-picker';
import { ConsultorRepository } from '../database/consultorRepository';
import { salvarPerfil, excluirImagem } from '../services/imageService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;
const HEADER_HEIGHT = 56;

type EditarConsultorScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'EditarConsultor'>;

export default function EditarConsultorScreen() {
  const navigation = useNavigation<EditarConsultorScreenNavigationProp>();
  const { consultor: consultorContext, atualizarConsultor } = useConsultor();
  
  // Refs para os inputs
  const scrollViewRef = useRef<ScrollView>(null);
  const nomeInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const whatsappInputRef = useRef<TextInput>(null);
  const rotaInputRef = useRef<TextInput>(null);

  // Estados do formulário (preenchidos com os dados do consultor do contexto)
  const [foto, setFoto] = useState<string | null>(consultorContext?.foto || null);
  const [nome, setNome] = useState(consultorContext?.nome || '');
  const [email, setEmail] = useState(consultorContext?.email || '');
  const [whatsapp, setWhatsapp] = useState(consultorContext?.whatsapp || '');
  const [rota, setRota] = useState(consultorContext?.rota || '');

  // Estados de erro
  const [errors, setErrors] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    rota: '',
  });

  // Função para validar nome (apenas letras)
  const validarNome = (texto: string) => {
    const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]*$/;
    if (texto.trim() === '') {
      return 'Nome é obrigatório';
    }
    if (!regex.test(texto)) {
      return 'Nome deve conter apenas letras';
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

  // Função para formatar WhatsApp
  const formatarWhatsApp = (texto: string) => {
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

  const handleWhatsAppChange = (texto: string) => {
    const numeros = texto.replace(/\D/g, '');
    const formatado = formatarWhatsApp(numeros);
    setWhatsapp(formatado);
    
    if (numeros.length === 0) {
      setErrors(prev => ({ ...prev, whatsapp: 'WhatsApp é obrigatório' }));
    } else if (numeros.length !== 11) {
      setErrors(prev => ({ ...prev, whatsapp: 'WhatsApp deve ter 11 dígitos (DDD + 9 números)' }));
    } else {
      setErrors(prev => ({ ...prev, whatsapp: '' }));
    }
  };

  const validarRota = (texto: string) => {
    if (texto.trim() === '') {
      return 'Rota é obrigatória';
    }
    return '';
  };

const handleSelecionarFoto = async () => {
  const { status } =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Permissão negada',
      'Precisamos de acesso à galeria para adicionar foto'
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
      const fotoAntiga = foto;

      const caminhoFinal =
        await salvarPerfil(
          result.assets[0].uri
        );

      console.log(
        '📸 Foto salva em:',
        caminhoFinal
      );
      setFoto(caminhoFinal);

      if (fotoAntiga) {
        await excluirImagem(fotoAntiga);
      }

      setFoto(caminhoFinal);

    } catch (error) {
      console.error(
        'Erro ao salvar foto:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível salvar a foto.'
      );
    }
  }
};

  const handleExcluirFoto = () => {
    Alert.alert(
      'Excluir Foto',
      'Tem certeza que deseja remover a foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => setFoto(null)
        }
      ]
    );
  };

  // Função para excluir o cadastro completo
  const handleExcluirCadastro = () => {
    Alert.alert(
      'Excluir Cadastro',
      'Tem certeza que deseja excluir permanentemente este consultor? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            console.log('Consultor excluído');
            Alert.alert(
              'Sucesso',
              'Consultor excluído com sucesso!',
              [{ text: 'OK', onPress: () => navigation.navigate('MeuPerfil') }]
            );
          }
        }
      ]
    );
  };

  const handleSalvar = async () => {
    const nomeError = validarNome(nome);
    const emailError = validarEmail(email);
    const rotaError = validarRota(rota);
    const numerosWhats = whatsapp.replace(/\D/g, '');
    const whatsError = numerosWhats.length === 0 ? 'WhatsApp é obrigatório' : numerosWhats.length !== 11 ? 'WhatsApp deve ter 11 dígitos' : '';
    
    setErrors({
      nome: nomeError,
      email: emailError,
      whatsapp: whatsError,
      rota: rotaError,
    });
    
    if (nomeError || emailError || whatsError || rotaError) {
      Alert.alert('Erro', 'Preencha todos os campos corretamente');
      return;
    }
    
    // Atualizar o contexto com os novos dados (consultor sempre ativo)
    try {

      await ConsultorRepository.salvar(
        nome,
        email,
        whatsapp,
        '',
        rota,
        foto
      );
      console.log('✅ Consultor salvo no banco');

      atualizarConsultor({
        nome,
        email,
        whatsapp,
        rota,
        foto
      });

    } catch (error) {

      console.error(
        'Erro ao salvar consultor:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível salvar o perfil.'
      );

      return;
    }
    
    Alert.alert(
      'Sucesso',
      'Perfil atualizado com sucesso!',
      [{ text: 'OK', onPress: () => navigation.navigate('MeuPerfil') }]
    );
  };

  const handleCancelar = () => {
    navigation.navigate('MeuPerfil');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      
      {/* Cabeçalho com título "Editar Perfil" */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 50 : STATUS_BAR_HEIGHT + 8 }]}>
        <TouchableOpacity onPress={handleCancelar} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <TouchableOpacity onPress={handleSalvar} style={styles.saveButton}>
          <Text style={styles.saveText}>Salvar</Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo rolável */}
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
            {/* Seção da Foto */}
            <View style={styles.fotoSection}>
              <TouchableOpacity 
                style={styles.fotoContainer} 
                onPress={handleSelecionarFoto}
                activeOpacity={0.7}
              >
                {foto ? (
                  <Image source={{ uri: foto }} style={styles.foto} />
                ) : (
                  <View style={styles.fotoPlaceholder}>
                    <Text style={styles.fotoPlaceholderIcon}>📷</Text>
                    <Text style={styles.fotoPlaceholderText}>Adicionar Foto</Text>
                  </View>
                )}
              </TouchableOpacity>
              {foto && (
                <TouchableOpacity onPress={handleExcluirFoto} style={styles.excluirFotoButton}>
                  <Text style={styles.excluirFotoText}>Excluir Foto</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.form}>
              {/* Campo Nome */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Nome <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  ref={nomeInputRef}
                  style={[styles.input, errors.nome ? styles.inputError : null]}
                  placeholder="Digite o nome completo"
                  placeholderTextColor="#ADB5BD"
                  value={nome}
                  onChangeText={(text) => {
                    setNome(text);
                    setErrors(prev => ({ ...prev, nome: validarNome(text) }));
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {errors.nome ? <Text style={styles.errorText}>{errors.nome}</Text> : null}
              </View>

              {/* Campo E-mail */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  E-mail <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  ref={emailInputRef}
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  placeholder="exemplo@email.com"
                  placeholderTextColor="#ADB5BD"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrors(prev => ({ ...prev, email: validarEmail(text) }));
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => whatsappInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>

              {/* Campo WhatsApp */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  WhatsApp <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  ref={whatsappInputRef}
                  style={[styles.input, errors.whatsapp ? styles.inputError : null]}
                  placeholder="(99)-99999-9999"
                  placeholderTextColor="#ADB5BD"
                  keyboardType="numeric"
                  value={whatsapp}
                  onChangeText={handleWhatsAppChange}
                  returnKeyType="next"
                  onSubmitEditing={() => rotaInputRef.current?.focus()}
                  blurOnSubmit={false}
                />
                <Text style={styles.helperText}>Digite DDD + 9 números (ex: 11999999999)</Text>
                {errors.whatsapp ? <Text style={styles.errorText}>{errors.whatsapp}</Text> : null}
              </View>

              {/* Campo Rota */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Rota <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  ref={rotaInputRef}
                  style={[styles.input, errors.rota ? styles.inputError : null]}
                  placeholder="Digite a rota do consultor"
                  placeholderTextColor="#ADB5BD"
                  value={rota}
                  onChangeText={(text) => {
                    setRota(text);
                    setErrors(prev => ({ ...prev, rota: validarRota(text) }));
                  }}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
                {errors.rota ? <Text style={styles.errorText}>{errors.rota}</Text> : null}
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
  fotoSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  fotoContainer: {
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
  foto: {
    width: '100%',
    height: '100%',
  },
  fotoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
  },
  fotoPlaceholderIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  fotoPlaceholderText: {
    fontSize: 10,
    color: '#6C757D',
  },
  excluirFotoButton: {
    marginTop: 8,
  },
  excluirFotoText: {
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