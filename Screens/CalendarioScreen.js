import { useState } from 'react';
import { View } from 'react-native';
import { Campo, Card, Filtro, Seletor, Tela, Text } from '../lib/components';
import { useCrud } from '../lib/hooks';
import { colors, styles } from '../styles';
import { COR_TIPO, TIPOS, dataHora, dataValida, hojeMs, mascaraData, paraData, rotuloDias, sincronizarEvento } from '../lib/utils';

export default function CalendarioScreen() {
  const { itens, f, gravar, remover } = useCrud('atividades', { titulo: '', data: '', tipo: 'Tarefa', obs: '' });
  const [filtroTipo, setFiltroTipo] = useState('Todas');
  const [periodo, setPeriodo] = useState('Próximas');
  const { titulo, data, tipo, obs } = f.campos;

  const confirmar = async () => {
    if (!titulo || !data) return f.setErro('Preencha o título e a data.');
    if (!dataValida(data)) return f.setErro('Data inválida. Use dd/mm.');
    const inicio = dataHora(data);
    const eventoId = await sincronizarEvento(itens.find((x) => x.id === f.editandoId)?.eventoId, {
      title: `${tipo}: ${titulo}`,
      notes: obs,
      startDate: inicio,
      endDate: new Date(inicio.getTime() + 86399000),
      allDay: true,
    });
    gravar({ titulo, data, tipo, obs, eventoId });
  };

  const hoje = hojeMs();
  const proximas = itens.filter((a) => paraData(a.data) >= hoje).length;
  const lista = itens
    .filter((a) => filtroTipo === 'Todas' || a.tipo === filtroTipo)
    .filter((a) => periodo === 'Todas' || (periodo === 'Próximas' ? paraData(a.data) >= hoje : paraData(a.data) < hoje))
    .sort((a, b) => (periodo === 'Passadas' ? -1 : 1) * (paraData(a.data) - paraData(b.data)));

  return (
    <Tela
      titulo="Calendário" dados={lista} f={f} onSubmit={confirmar} vazio="Nenhuma atividade aqui."
      campos={<>
        <Campo f={f} k="titulo" ph="Título da atividade" />
        <Campo f={f} k="data" ph="Data (ex: 2509)" mask={mascaraData} keyboardType="number-pad" />
        <Seletor rotulo="Tipo" opcoes={TIPOS} valor={tipo} onChange={f.set('tipo')} />
        <Campo f={f} k="obs" ph="Observação (opcional)" />
      </>}
      resumo={<>
        <View style={styles.chips}>
          <Filtro opcoes={['Próximas', 'Passadas', 'Todas']} valor={periodo} onChange={setPeriodo} />
          <Filtro opcoes={['Todas', ...TIPOS]} valor={filtroTipo} onChange={setFiltroTipo} />
        </View>
        <Text style={styles.contador}>{proximas} atividade(s) próxima(s) de {itens.length}</Text>
      </>}
      renderItem={({ item }) => (
        <Card
          esq={<View style={[styles.dataBox, { backgroundColor: COR_TIPO[item.tipo] || colors.olive }]}><Text style={styles.dataTexto}>{item.data}</Text></View>}
          onPress={() => f.editar(item)} onRemover={() => remover(item.id)}
        >
          <Text style={styles.cardTitulo}>{item.titulo}</Text>
          {item.obs ? <Text style={styles.cardDescricao}>{item.obs}</Text> : null}
          <Text style={[styles.cardTipo, { color: COR_TIPO[item.tipo] || colors.textSecondary }]}>{item.tipo} · {rotuloDias(item.data)}</Text>
        </Card>
      )}
    />
  );
}
