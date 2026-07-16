import React from 'react';

import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';

type Props = {
  value: string;
  onChange: (texto: string) => void;
  onFocus?: () => void;
};

export default function CampoSolicitante({
  value,
  onChange,
  onFocus,
}: Props) {

  return (
    <View style={styles.container}>

      <Text style={styles.label}>
        Solicitante *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nome do solicitante"
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChange}
        onFocus={onFocus}
        autoCapitalize="words"
        returnKeyType="next"
      />

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    marginBottom: 16,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },

  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#212529',
  },

});

