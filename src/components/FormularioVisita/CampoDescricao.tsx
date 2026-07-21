/**
 * COMPONENTE: CampoDescricao
 *
 * FUNCAO:
 * Controla a descricao do atendimento e insere textos predefinidos.
 */

import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import TextoPredefinidoModal
from './TextoPredefinidoModal';

type Props = {
  value: string;
  onChange: (
    texto: string
  ) => void;
  onFocus?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
};

export default function CampoDescricao({
  value,
  onChange,
  onFocus,
  inputRef,
}: Props) {

  const [modalVisible,
    setModalVisible] =
      useState(false);

  function inserirTexto(
    texto: string
  ) {
    const textoAtual = value.trimEnd();
    const textoSelecionado = texto.trim();

    if (!textoAtual) {

      onChange(textoSelecionado);

      return;
    }

    onChange(
      `${textoAtual}\n${textoSelecionado}`
    );

  }

  return (

    <View>

      <Text style={styles.label}>
        Descrição do Atendimento
        <Text style={styles.required}>
          *
        </Text>
      </Text>

      <TouchableOpacity
        style={styles.botao}
        onPress={() =>
          setModalVisible(true)
        }
      >

        <Text style={styles.botaoTexto}>
          📋 Inserir Texto Predefinido
        </Text>

      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        multiline
        numberOfLines={8}
        value={value}
        onChangeText={onChange}
        onFocus={onFocus}
        placeholder="Descreva os serviços executados..."
        style={styles.input}
      />

      <TextoPredefinidoModal
        visible={modalVisible}
        onClose={() =>
          setModalVisible(false)
        }
        onSelecionar={
          inserirTexto
        }
      />

    </View>

  );

}

const styles =
  StyleSheet.create({

    label: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
    },

    required: {
      color: '#E53935',
    },

    botao: {
      borderWidth: 1,
      borderColor: '#DDD',
      borderRadius: 10,
      padding: 15,
      marginBottom: 15,
    },

    botaoTexto: {
      color: '#1976D2',
      fontSize: 16,
    },

    input: {
      borderWidth: 1,
      borderColor: '#DDD',
      borderRadius: 10,
      padding: 15,
      minHeight: 180,
      textAlignVertical: 'top',
    },

});
