import { useState } from 'react';
import { View } from 'react-native';
import { Campo, Card, Check, Filtro, Tela, Text } from '../lib/components';
import { useCrud } from '../lib/hooks';
import { colors, styles } from '../styles';
import { ERRO, dataHora, dataValida, horaValida, hojeMs, mascaraData, mascaraHora, paraData, rotuloDias, sincronizarEvento, toMin } from '../lib/utils';

export default function LembretesScreen() {
  const { itens, f, gravar, remover, alterar } = useCrud('lembretes', { titulo: '', data: '', hora: '' });
  const [filtro, setFiltro] = useState('Pendentes');
  const { titulo, data, hora } = f.campos;

  const confirmar = async () => {
    if (!titulo || !data || !hora) return f.setErro('Preencha título, data e hora.');
    if (!dataValida(data)) return f.setErro('Data inválida. Use dd/mm.');
    if (!horaValida(hora)) return f.setErro('Horário inválido. Use hh:mm.');
    const inicio = dataHora(data, hora);
    const eventoId = await sincronizarEvento(itens.find((x) => x.id === f.editandoId)?.eventoId, {
      title: titulo,
      startDate: inicio,
      endDate: new Date(inicio.getTime() + 3600000),
      alarms: [{ relativeOffset: -30 }],
    });
    gravar({ titulo, data, hora, eventoId }, { feito: false });
  };

  const hoje = hojeMs();
  const pendentes = itens.filter((l) => !l.feito).length;
  const lista = itens
    .filter((l) => filtro === 'Todos' || !l.feito)
    .sort((a, b) => a.feito - b.feito || paraData(a.data) - paraData(b.data) || toMin(a.hora) - toMin(b.hora));

  return (
    <Tela
      titulo="Lembretes" dados={lista} f={f} onSubmit={confirmar} vazio="Nenhum lembrete aqui."
      campos={<>
        <Campo f={f} k="titulo" ph="Lembrete (ex: Prova de Física)" />
        <Campo f={f} k="data" ph="Data (ex: 2509)" mask={mascaraData} keyboardType="number-pad" />
        <Campo f={f} k="hora" ph="Hora (ex: 0800)" mask={mascaraHora} keyboardType="number-pad" />
      </>}
      resumo={<>
        <View style={styles.chips}>
          <Filtro opcoes={['Pendentes', 'Todos']} valor={filtro} onChange={setFiltro} />
        </View>
        <Text style={styles.contador}>{pendentes} pendente(s) de {itens.length}</Text>
      </>}
      renderItem={({ item }) => {
        const atrasado = !item.feito && paraData(item.data) < hoje;
        return (
          <Card
            esq={<Check on={item.feito} onPress={() => alterar(item.id, (l) => ({ feito: !l.feito }))} />}
            onPress={() => f.editar(item)} onRemover={() => remover(item.id)}
          >
            <Text style={[styles.cardTitulo, item.feito && styles.feita]}>{item.titulo}</Text>
            <Text style={[styles.cardTipo, { color: atrasado ? ERRO : colors.olive }]}>{item.data} às {item.hora} · {atrasado ? 'Atrasado' : rotuloDias(item.data)}</Text>
          </Card>
        );
      }}
    />
  );
}
