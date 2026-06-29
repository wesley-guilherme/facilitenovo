import React from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

type Props = {
  value: string;
  onPress: () => void;
};

export default function CampoData({
  value,
  onPress,
}: Props) {

  return (
    <View style={styles.field}>

      <Text style={styles.label}>
        Data da Visita
        <Text style={styles.required}>
          {' '}*
        </Text>
      </Text>

      <TouchableOpacity
        onPress={onPress}
        style={styles.input}
      >
        <Text>
          📅 {value}
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  field: {
    marginBottom: 16,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },

  required: {
    color: '#DC3545',
  },

  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },

  inputText: {
    fontSize: 16,
    color: '#212529',
  },

});