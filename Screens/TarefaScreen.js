import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Campo, Card, Check, Filtro, Seletor, Tela, Text } from '../lib/components';
import { useCrud } from '../lib/hooks';
import { colors, styles } from '../styles';
import { COR_PRIORIDADE, ERRO, PRIORIDADES, dataValida, hojeMs, mascaraData, paraData } from '../lib/utils';

export default function TarefaScreen() {
  const { itens, salvar, f, gravar, remover, alterar } = useCrud('tarefas', { titulo: '', materia: '', prazo: '', prioridade: 'Média' });
  const [filtro, setFiltro] = useState('Todas');
  const { titulo, materia, prazo, prioridade } = f.campos;

  const confirmar = () => {
    if (!titulo || !prazo) return f.setErro('Preencha o título e o prazo.');
    if (!dataValida(prazo)) return f.setErro('Prazo inválido. Use dd/mm.');
    gravar({ titulo, materia, prazo, prioridade }, { feita: false });
  };

  const hoje = hojeMs();
  const pendentes = itens.filter((t) => !t.feita).length;
  const lista = itens
    .filter((t) => filtro === 'Todas' || (filtro === 'Pendentes' ? !t.feita : t.feita))
    .sort((a, b) => a.feita - b.feita || paraData(a.prazo) - paraData(b.prazo));

  return (
    <Tela
      titulo="Tarefas" dados={lista} f={f} onSubmit={confirmar} vazio="Nenhuma tarefa aqui."
      acao={itens.length - pendentes > 0 ? (
        <TouchableOpacity onPress={() => salvar(itens.filter((t) => !t.feita))}>
          <Text style={styles.sair}>Limpar concluídas</Text>
        </TouchableOpacity>
      ) : null}
      campos={<>
        <Campo f={f} k="titulo" ph="Título da tarefa" />
        <Campo f={f} k="materia" ph="Matéria (opcional)" />
        <Campo f={f} k="prazo" ph="Prazo (ex: 1510)" mask={mascaraData} keyboardType="number-pad" />
        <Seletor rotulo="Prioridade" opcoes={PRIORIDADES} valor={prioridade} onChange={f.set('prioridade')} />
      </>}
      resumo={<>
        <View style={styles.chips}>
          <Filtro opcoes={['Todas', 'Pendentes', 'Concluídas']} valor={filtro} onChange={setFiltro} />
        </View>
        <Text style={styles.contador}>{pendentes} pendente(s) de {itens.length}</Text>
      </>}
      renderItem={({ item }) => {
        const p = item.prioridade || 'Média';
        const atrasada = !item.feita && paraData(item.prazo) < hoje;
        return (
          <Card
            esq={<Check on={item.feita} onPress={() => alterar(item.id, (t) => ({ feita: !t.feita }))} />}
            onPress={() => f.editar(item)} onRemover={() => remover(item.id)}
          >
            <Text style={[styles.cardTitulo, item.feita && styles.feita]}>{item.titulo}</Text>
            <Text style={styles.cardDescricao}>{item.materia ? `${item.materia} · ` : ''}Entrega até {item.prazo}</Text>
            <Text style={[styles.cardTipo, { color: atrasada ? ERRO : COR_PRIORIDADE[p] }]}>{atrasada ? 'Atrasada · ' : ''}Prioridade {p}</Text>
          </Card>
        );
      }}
    />
  );
}
