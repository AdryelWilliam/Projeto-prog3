import { useState } from 'react';
import { View } from 'react-native';
import { Campo, Card, Filtro, Seletor, Tela, Text } from '../lib/components';
import { useCrud } from '../lib/hooks';
import { colors, styles } from '../styles';
import { DIAS, DIAS_SEMANA, horaValida, mascaraHora, toMin } from '../lib/utils';

export default function HorariosScreen() {
  const { itens, f, gravar, remover } = useCrud('horarios', { materia: '', dia: 'Seg', inicio: '', fim: '', local: '' });
  const [filtro, setFiltro] = useState('Todos');
  const { materia, dia, inicio, fim, local } = f.campos;

  const confirmar = () => {
    if (!materia || !inicio || !fim) return f.setErro('Preencha matéria, início e fim.');
    if (!horaValida(inicio) || !horaValida(fim)) return f.setErro('Horário inválido. Use hh:mm.');
    if (toMin(fim) <= toMin(inicio)) return f.setErro('O fim precisa ser depois do início.');
    const c = itens.find((h) => h.id !== f.editandoId && h.dia === dia && toMin(inicio) < toMin(h.fim) && toMin(fim) > toMin(h.inicio));
    if (c) return f.setErro(`Conflito com ${c.materia} (${c.inicio}–${c.fim}).`);
    gravar({ materia, dia, inicio, fim, local });
  };

  const hoje = DIAS_SEMANA[new Date().getDay()];
  const aulasHoje = itens.filter((h) => h.dia === hoje).length;
  const exibidos = itens
    .filter((h) => filtro === 'Todos' || h.dia === filtro)
    .sort((a, b) => DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia) || toMin(a.inicio) - toMin(b.inicio));

  return (
    <Tela
      titulo="Horários" dados={exibidos} f={f} onSubmit={confirmar} vazio="Nenhum horário aqui."
      campos={<>
        <Campo f={f} k="materia" ph="Matéria" />
        <Seletor rotulo="Dia da semana" opcoes={DIAS} valor={dia} onChange={f.set('dia')} />
        <Campo f={f} k="inicio" ph="Início (ex: 0800)" mask={mascaraHora} keyboardType="number-pad" />
        <Campo f={f} k="fim" ph="Fim (ex: 0940)" mask={mascaraHora} keyboardType="number-pad" />
        <Campo f={f} k="local" ph="Sala ou professor (opcional)" />
      </>}
      resumo={<>
        <View style={styles.chips}>
          <Filtro opcoes={['Todos', ...DIAS]} valor={filtro} onChange={setFiltro} />
        </View>
        <Text style={styles.contador}>{itens.length} aula(s) na semana · {aulasHoje} hoje</Text>
      </>}
      renderItem={({ item }) => (
        <Card
          esq={<View style={styles.dataBox}><Text style={styles.dataTexto}>{item.dia}</Text><Text style={styles.dataTexto}>{item.inicio}</Text></View>}
          onPress={() => f.editar(item)} onRemover={() => remover(item.id)}
        >
          <Text style={styles.cardTitulo}>{item.materia}</Text>
          <Text style={styles.cardDescricao}>{item.inicio}–{item.fim}{item.local ? ` · ${item.local}` : ''}</Text>
          {item.dia === hoje ? <Text style={[styles.cardTipo, { color: colors.olive }]}>Hoje</Text> : null}
        </Card>
      )}
    />
  );
}
