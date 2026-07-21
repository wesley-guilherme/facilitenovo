/**
 * COMPONENTE: CampoHorario
 *
 * FUNCAO:
 * Mostra horarios de inicio/termino e abre os seletores correspondentes.
 */

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
      Horário
      <Text style={styles.required}>
        *
      </Text>
    </Text>

    <View style={styles.row}>

      <TouchableOpacity
        style={styles.input}
        onPress={onHoraInicio}
      >

        <Text style={styles.titulo}>
          Início
        </Text>

        <Text style={styles.texto}>
          {horaInicio
            ? `🕒 ${horaInicio}`
            : '--:--'}
        </Text>

      </TouchableOpacity>

      <TouchableOpacity
        style={styles.input}
        onPress={onHoraTermino}
      >

        <Text style={styles.titulo}>
          Término
        </Text>

        <Text style={styles.texto}>
          {horaTermino
            ? `🕒 ${horaTermino}`
            : '--:--'}
        </Text>

      </TouchableOpacity>

    </View>

  </View>

);

}

const styles = StyleSheet.create({

  container: {
    marginBottom: 10,
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
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    minHeight: 60,
  },

  titulo: {
    fontSize: 10,
    color: '#6C757D',
    marginBottom: 2,
  },

  texto: {
    fontSize: 18,
    fontWeight: 400,
    color: '#212529',
  },

  row: {

  flexDirection: 'row',
  justifyContent:'space-between',
  gap: 8,
    
},

});
