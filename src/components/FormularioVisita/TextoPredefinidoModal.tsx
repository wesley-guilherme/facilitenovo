import React, {
  useEffect,
  useState,
} from 'react';

import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { TextosPredefinidosRepository } from '../../database/textosPredefinidosRepository';

type TextoPredefinido = {
  id: string;
  texto: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelecionar: (
    texto: string
  ) => void;
};

export default function TextoPredefinidoModal({
  visible,
  onClose,
  onSelecionar,
}: Props) {

  const [textos, setTextos] =
    useState<TextoPredefinido[]>([]);

  useEffect(() => {

    if (visible) {
      carregar();
    }

  }, [visible]);

  async function carregar() {

    try {

      const dados =
        await TextosPredefinidosRepository.listar();

      setTextos(
        dados as TextoPredefinido[]
      );

    } catch (error) {

      console.error(
        'Erro textos:',
        error
      );

    }

  }

  function selecionar(
    texto: string
  ) {

    onSelecionar(texto);

    onClose();

  }

  return (

    <Modal
      visible={visible}
      animationType="slide"
      transparent
    >

      <View style={styles.overlay}>

        <View style={styles.container}>

          <Text style={styles.titulo}>
            Textos Predefinidos
          </Text>

          <FlatList
            data={textos}
            keyExtractor={
              item => item.id
            }
            renderItem={({ item }) => (

              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  selecionar(
                    item.texto
                  )
                }
              >

                <Text
                  style={styles.texto}
                >
                  {item.texto}
                </Text>

              </TouchableOpacity>

            )}
          />

          <TouchableOpacity
            style={styles.fechar}
            onPress={onClose}
          >

            <Text
              style={styles.fecharTexto}
            >
              Fechar
            </Text>

          </TouchableOpacity>

        </View>

      </View>

    </Modal>

  );

}

const styles =
  StyleSheet.create({

    overlay: {
      flex: 1,
      backgroundColor:
        'rgba(0,0,0,0.5)',
      justifyContent:
        'center',
    },

    container: {
      margin: 20,
      backgroundColor:
        '#FFF',
      borderRadius: 12,
      padding: 20,
      maxHeight: '80%',
    },

    titulo: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 15,
    },

    card: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor:
        '#EEE',
    },

    texto: {
      fontSize: 16,
    },

    fechar: {
      marginTop: 15,
      alignItems: 'center',
    },

    fecharTexto: {
      color: '#1976D2',
      fontSize: 16,
      fontWeight: '600',
    },

});