import { Directory, File, Paths } from 'expo-file-system';

export async function salvarLogo(
  origem: string
): Promise<string> {

  const pastaLogos = new Directory(
    Paths.document,
    'logos'
  );

  if (!pastaLogos.exists) {
    pastaLogos.create();
  }

  const extensao =
    origem.split('.').pop() || 'jpg';

  const nomeArquivo =
    `logo_${Date.now()}.${extensao}`;

  const destino = new File(
    pastaLogos,
    nomeArquivo
  );

  await new File(origem).copy(destino);

  return destino.uri;
}

export async function excluirImagem(
  caminho: string
) {
  try {

        console.log(
      '🗑️ Tentando excluir:',
      caminho
    );

    const arquivo = new File(caminho);

    if (arquivo.exists) {
      arquivo.delete();

          console.log(
        '✅ Arquivo excluído'
      );  

    }


  } catch (error) {
    console.error(
      'Erro ao excluir imagem:',
      error
    );
  }
}

export async function salvarPerfil(
  origem: string
): Promise<string> {

  const pastaPerfis =
    new Directory(
      Paths.document,
      'perfis'
    );

  if (!pastaPerfis.exists) {
    pastaPerfis.create();
  }

  const extensao =
    origem.split('.').pop() || 'jpg';

  const nomeArquivo =
    `perfil_${Date.now()}.${extensao}`;

  const destino =
    new File(
      pastaPerfis,
      nomeArquivo
    );

  await new File(origem).copy(destino);

  return destino.uri;
}

