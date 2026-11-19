import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Chips, Text } from '../lib/components';
import { useLista } from '../lib/hooks';
import { colors, styles } from '../styles';

const DURACOES = { Foco: [15, 25, 45, 60], Pausa: [5, 10, 15] };
const fmtTempo = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function FocoScreen() {
  const [metas, salvarMetas] = useLista('metas');
  const [sessoes, salvarSessoes] = useLista('foco');
  const [modo, setModo] = useState('Foco');
  const [minutos, setMinutos] = useState(25);
  const [restante, setRestante] = useState(25 * 60);
  const [rodando, setRodando] = useState(false);
  const [metaId, setMetaId] = useState(null);
  const fim = useRef(0);

  const total = minutos * 60;
  const iniciada = restante < total;

  const trocarModo = (m, min = DURACOES[m][m === 'Foco' ? 1 : 0]) => {
    setRodando(false);
    setModo(m);
    setMinutos(min);
    setRestante(min * 60);
  };

  const escolherDuracao = (min) => {
    setMinutos(min);
    setRestante(min * 60);
  };

  const alternar = () => {
    if (!rodando) fim.current = Date.now() + restante * 1000;
    setRodando(!rodando);
  };

  // Calcula pelo horário de término: continua certo mesmo se o app ficar em segundo plano
  useEffect(() => {
    if (!rodando) return;
    const t = setInterval(() => setRestante(Math.max(0, Math.round((fim.current - Date.now()) / 1000))), 500);
    return () => clearInterval(t);
  }, [rodando]);

  useEffect(() => {
    if (rodando && restante === 0) concluir();
  }, [restante, rodando]);

  const concluir = () => {
    setRodando(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
    if (modo === 'Foco') {
      salvarSessoes([...sessoes, { id: Date.now().toString(), data: new Date().toISOString(), minutos }]);
      if (metaId) {
        salvarMetas(metas.map((m) => (m.id === metaId ? { ...m, feito: Math.round((m.feito + minutos / 60) * 100) / 100 } : m)));
      }
      Alert.alert('Sessão concluída!', `Você focou por ${minutos} min. Hora de uma pausa.`);
      trocarModo('Pausa');
    } else {
      Alert.alert('Pausa terminada', 'Vamos voltar ao foco?');
      trocarModo('Foco');
    }
  };

  const hoje = new Date().toDateString();
  const deHoje = sessoes.filter((s) => new Date(s.data).toDateString() === hoje);
  const minHoje = deHoje.reduce((soma, s) => soma + s.minutos, 0);
  const metaAtual = metas.find((m) => m.id === metaId);
  const pct = total ? ((total - restante) / total) * 100 : 0;
  const cor = modo === 'Foco' ? colors.olive : colors.tan;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <Chips opcoes={['Foco', 'Pausa']} valor={modo} onChange={(m) => !rodando && trocarModo(m)} />

      <View style={styles.tempoBox}>
        <Text style={[styles.tempo, { color: cor }]}>{fmtTempo(restante)}</Text>
        <View style={styles.barra}>
          <View style={[styles.barraPct, { width: `${pct}%`, backgroundColor: cor }]} />
        </View>
        {modo === 'Foco' && metaAtual ? <Text style={[styles.cardDescricao, styles.mt12]}>Contando para: {metaAtual.titulo}</Text> : null}
      </View>
      <View style={{ opacity: rodando ? 0.4 : 1, marginTop: 24 }} pointerEvents={rodando ? 'none' : 'auto'}>
        <Text style={styles.rotulo}>Duração (minutos)</Text>
        <Chips opcoes={DURACOES[modo].map(String)} valor={String(minutos)} onChange={(v) => escolherDuracao(Number(v))} />
        {modo === 'Foco' && metas.length > 0 ? (
          <>
            <Text style={styles.rotulo}>Contar horas em qual meta?</Text>
            <Chips
              opcoes={['Nenhuma', ...metas.map((m) => m.titulo)]}
              valor={metaAtual?.titulo || 'Nenhuma'}
              onChange={(t) => setMetaId(metas.find((m) => m.titulo === t)?.id || null)}
            />
          </>
        ) : null}
      </View>

      <Text style={[styles.secaoTitulo, { marginTop: 16 }]}>Hoje</Text>
      <Text style={styles.cardDescricao}>
        {deHoje.length} sessão(ões) de foco · {minHoje} min
      </Text>
    </ScrollView>
  );
}
