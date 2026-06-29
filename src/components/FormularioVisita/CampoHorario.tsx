import React from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

type Props = {
  horaInicio: string;
  horaTermino: string;
  onHoraInicio: () => void;
  onHoraTermino: () => void;
};

export default function CampoHorario({
  horaInicio,
  horaTermino,
  onHoraInicio,
  onHoraTermino
}: Props) {

  return (

    <View style={styles.container}>

      <Text style={styles.label}>
        Hora
        <Text style={styles.required}>
          *
        </Text>
      </Text>

      <TouchableOpacity
        style={styles.input}
        onPress={onHoraInicio}
      >

        <Text style={styles.texto}>
          {horaInicio
            ? `🕒 ${horaInicio}`
            : '🕒 Selecionar horário'}
        </Text>

      </TouchableOpacity>

      <TouchableOpacity
        style={styles.input}
        onPress={onHoraTermino}
      >

        <Text style={styles.texto}>
          {horaTermino
            ? `🕒 ${horaTermino}`
            : '🕒 Selecionar horário'}
        </Text>

      </TouchableOpacity>

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

  texto: {
    fontSize: 16,
    color: '#212529',
  },

});