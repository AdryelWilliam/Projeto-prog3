import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { Campo, Card, Tela, Text } from '../lib/components';
import { useCrud } from '../lib/hooks';
import { colors, styles } from '../styles';

export default function MetasScreen() {
  const { itens, f, gravar, remover, alterar } = useCrud('metas', { titulo: '', alvo: '' });
  const { titulo, alvo } = f.campos;

  const confirmar = () => {
    const h = parseInt(alvo, 10);
    if (!titulo || !alvo) return f.setErro('Preencha o título e as horas.');
    if (isNaN(h) || h < 1) return f.setErro('Horas inválidas. Use um número maior que 0.');
    gravar({ titulo, alvo: h }, { feito: 0 });
  };

  const concluidas = itens.filter((m) => m.feito >= m.alvo).length;

  return (
    <Tela
      dados={itens} f={f} onSubmit={confirmar} vazio="Nenhuma meta aqui."
      campos={<>
        <Campo f={f} k="titulo" ph="Meta (ex: Estudar Cálculo)" />
        <Campo f={f} k="alvo" ph="Horas a estudar (ex: 10)" keyboardType="numeric" />
      </>}
      resumo={<Text style={styles.contador}>{concluidas} de {itens.length} meta(s) concluída(s)</Text>}
      renderItem={({ item }) => {
        const pct = Math.min(100, Math.round((item.feito / item.alvo) * 100));
        const ajustar = (d) => alterar(item.id, (m) => ({ feito: Math.max(0, m.feito + d) }));
        return (
          <Card
            onPress={() => f.editar(item)} onRemover={() => remover(item.id)}
            extra={<>
              <TouchableOpacity onPress={() => ajustar(-1)}>
                <Ionicons name="remove-circle-outline" size={26} color={colors.textSecondary} style={ styles.iconeAcao } />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => ajustar(1)}>
                <Ionicons name="add-circle-outline" size={26} color={colors.olive} style={ styles.iconeAcao } />
              </TouchableOpacity>
            </>}
          >
            <Text style={styles.cardTitulo}>{item.titulo}</Text>
            <Text style={styles.cardDescricao}>{Math.round(item.feito * 10) / 10}/{item.alvo}h</Text>
            <Text style={[styles.cardTipo, { color: pct >= 100 ? colors.olive : colors.tan }]}>{pct}%</Text>
          </Card>
        );
      }}
    />
  );
}
