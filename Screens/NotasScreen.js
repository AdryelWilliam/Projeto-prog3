import { useState } from 'react';
import { View } from 'react-native';
import { Campo, Card, Filtro, Tela, Text } from '../lib/components';
import { useCrud } from '../lib/hooks';
import { styles } from '../styles';
import { corNota } from '../lib/utils';

export default function NotasScreen() {
  const { itens, f, gravar, remover } = useCrud('notas', { materia: '', avaliacao: '', nota: '' });
  const [filtro, setFiltro] = useState('Todas');
  const { materia, avaliacao, nota } = f.campos;

  const confirmar = () => {
    const n = parseFloat(nota.replace(',', '.'));
    if (!materia || !avaliacao || !nota) return f.setErro('Preencha matéria, avaliação e nota.');
    if (isNaN(n) || n < 0 || n > 10) return f.setErro('Nota inválida. Use de 0 a 10.');
    gravar({ materia, avaliacao, nota: n });
  };

  const materias = [...new Set(itens.map((x) => x.materia))];
  const lista = itens.filter((x) => filtro === 'Todas' || x.materia === filtro);
  const media = lista.length ? (lista.reduce((s, x) => s + x.nota, 0) / lista.length).toFixed(1) : '–';

  return (
    <Tela
      dados={lista} f={f} onSubmit={confirmar} vazio="Nenhuma nota aqui."
      campos={<>
        <Campo f={f} k="materia" ph="Matéria" />
        <Campo f={f} k="avaliacao" ph="Avaliação (ex: Prova 1)" />
        <Campo f={f} k="nota" ph="Nota (0 a 10)" keyboardType="numbers-and-punctuation" />
      </>}
      resumo={<>
        <View style={styles.chips}>
          <Filtro opcoes={['Todas', ...materias]} valor={filtro} onChange={setFiltro} />
        </View>
        <Text style={styles.contador}>Média {media} · {lista.length} nota(s)</Text>
      </>}
      renderItem={({ item }) => (
        <Card
          esq={<View style={[styles.dataBox, { backgroundColor: corNota(item.nota) }]}><Text style={styles.dataTexto}>{item.nota.toFixed(1)}</Text></View>}
          onPress={() => f.editar(item)} onRemover={() => remover(item.id)}
        >
          <Text style={styles.cardTitulo}>{item.materia}</Text>
          <Text style={styles.cardDescricao}>{item.avaliacao}</Text>
        </Card>
      )}
    />
  );
}
