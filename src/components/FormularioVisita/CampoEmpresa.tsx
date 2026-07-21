/**
 * COMPONENTE: CampoEmpresa
 *
 * FUNCAO:
 * Busca empresas ativas por codigo/nome e seleciona a empresa da visita.
 */

import React, {
  useEffect,
  useState
} from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet
} from 'react-native';

import {
  EmpresaRepository,
  EmpresaDB
} from '../../database/empresaRepository';

type Props = {

  value: EmpresaDB | null;

  onSelect: (
    empresa: EmpresaDB
  ) => void;
};

export default function CampoEmpresa({
  value,
  onSelect
}: Props) {

  const [texto, setTexto] =
    useState('');

  const [empresas, setEmpresas] =
    useState<EmpresaDB[]>([]);

  const [resultado, setResultado] =
    useState<EmpresaDB[]>([]);

  useEffect(() => {

    carregarEmpresas();

  }, []);

  useEffect(() => {

  if (!value) {

    setTexto('');
    setResultado([]);

  }

}, [value]);

  async function carregarEmpresas() {

    try {

      const dados =
        await EmpresaRepository.listar();

      const ativos =
        dados.filter(
          (empresa: EmpresaDB) =>
            empresa.ativo === 1
        );

      setEmpresas(ativos);

    } catch (error) {

      console.error(
        'Erro empresas:',
        error
      );

    }

  }

  function pesquisar(
    valor: string
  ) {

    setTexto(valor);

    if (!valor.trim()) {

      setResultado([]);

      return;
    }

    const busca =
      valor.toLowerCase();

    const filtrado =
      empresas.filter(
        empresa =>

          empresa.nome_fantasia
            .toLowerCase()
            .includes(busca)
            

          ||

          empresa.codigo_referencia
            .toLowerCase()
            .includes(busca)
      );
      

    setResultado(filtrado);

  }

  function selecionar(
    empresa: EmpresaDB
  ) {

    onSelect(empresa);

    setTexto('')
    ;

    setResultado([]);

  }

  return (

    <View>

      <Text style={styles.label}>
        Empresa *
      </Text>

    {!value && (
      <TextInput
        value={texto}
        onChangeText={pesquisar}
        placeholder="Código ou empresa"
        style={styles.input}
        returnKeyType="done"
      />
    )}

      {!value && resultado.length > 0 && (

        <FlatList
          scrollEnabled={false}
          style={styles.lista}
          keyboardShouldPersistTaps="handled"
          data={resultado}
          keyExtractor={
            item => item.id
          }
          renderItem={({ item }) => (

            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                selecionar(item)
              }
            >

              {item.logo ? (

                <Image
                  source={{
                    uri: item.logo
                  }}
                  style={styles.logo}
                />

              ) : null}

              <View>

                <Text
                  style={
                    styles.codigo
                  }
                >
                  {
                    item.codigo_referencia
                  }
                </Text>

                <Text
                  style={
                    styles.nome
                  }
                >
                  {
                    item.nome_fantasia
                  }
                </Text>

                <Text
                  style={
                    styles.cidade
                  }
                >
                  {
                    item.cidade
                  }
                </Text>

              </View>

            </TouchableOpacity>

          )}
        />

      )}

    </View>

  );

}

const styles =
  StyleSheet.create({

    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 10,
    },

    input: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 12
    },

    lista: {
      marginTop: 10,
      maxHeight: 250
    },

    card: {
      flexDirection: 'row',
      padding: 10,
      borderBottomWidth: 1,
      borderColor: '#eee'
    },

    logo: {
      width: 50,
      height: 50,
      borderRadius: 6,
      marginRight: 10
    },

    codigo: {
      fontWeight: '700'
    },

    nome: {
      fontSize: 15
    },

    cidade: {
      color: '#666'
    }

});
