import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from '../lib/components';
import { useLista } from '../lib/hooks';
import { COR_PRIORIDADE, COR_TIPO, DIAS_SEMANA, ERRO, corNota, hojeMs, paraData, rotuloDias, toMin } from '../lib/utils';
import { colors, comCor, styles } from '../styles';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const NOMES_DIA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

const AZUL = '#3B6E8F';
const ROXO = '#7A5C99';
const ROSA = '#B5527A';

const HIT = { top: 10, bottom: 10, left: 10, right: 10 };

const ATALHOS = [
  { nome: 'Lembretes', icone: 'notifications-outline', cor: ROXO },
  { nome: 'Notas', icone: 'bar-chart-outline', cor: AZUL },
  { nome: 'Metas', icone: 'flag-outline', cor: colors.olive },
  { nome: 'Foco', icone: 'timer-outline', cor: colors.tan },
  { nome: 'Perfil', icone: 'person-outline', cor: ROSA },
];

function Secao({ titulo, icone, cor = colors.text, acao, onAcao, children }) {
  return (
    <View style={styles.secao}>
      <View style={styles.secaoCab}>
        <View style={styles.linha}>
          {icone ? (
            <View style={[styles.secaoIcone, { backgroundColor: cor }]}>
              <Ionicons name={icone} size={18} color="#fff" />
            </View>
          ) : null}
          <Text style={styles.secaoNome}>{titulo}</Text>
        </View>
        {acao ? (
          <TouchableOpacity onPress={onAcao} hitSlop={HIT}>
            <Text style={[styles.textoLink, { color: cor }]}>{acao}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Vazio({ texto, botao, onPress, cor }) {
  return (
    <View style={[styles.cartao, comCor(cor)]}>
      <Text style={styles.vazioTexto}>{texto}</Text>
      {botao ? (
        <TouchableOpacity onPress={onPress} style={styles.mt12}>
          <Text style={[styles.textoLink, { color: cor }]}>{botao}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function Numero({ valor, rotulo, cor, icone, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.cartao, styles.numero, { backgroundColor: cor + '1A', borderColor: cor + '55' }]}>
      <Ionicons name={icone} size={20} color={cor} style={styles.numeroIcone} />
      <Text style={[styles.numeroValor, { color: cor }]}>{valor}</Text>
      <Text style={styles.numeroRotulo}>{rotulo}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation, route }) {
  const [usuario, setUsuario] = useState(route.params?.usuario ?? null);
  const [tarefas] = useLista('tarefas');
  const [horarios] = useLista('horarios');
  const [atividades] = useLista('atividades');
  const [lembretes] = useLista('lembretes');
  const [metas] = useLista('metas');
  const [notas] = useLista('notas');
  const [sessoes] = useLista('foco');

  useEffect(() => {
    const carregar = () => AsyncStorage.getItem('usuario').then((v) => v && setUsuario(JSON.parse(v)));
    carregar();
    return navigation.addListener('focus', carregar);
  }, [navigation]);

  const handleSair = async () => {
    await AsyncStorage.removeItem('usuario');
    navigation.getParent().replace('Login');
  };

  const ir = (tela) => () => navigation.navigate(tela);

  // Data e saudação
  const agora = new Date();
  const hora = agora.getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const primeiroNome = (usuario?.nome || '').trim().split(' ')[0];
  const dataExtenso = `${NOMES_DIA[agora.getDay()]}, ${agora.getDate()} de ${MESES[agora.getMonth()]}`;

  // Próxima aula (hoje, se ainda não terminou; senão a próxima da semana)
  const minAgora = hora * 60 + agora.getMinutes();
  const proximaAula = horarios
    .map((h) => {
      let desvio = (DIAS_SEMANA.indexOf(h.dia) - agora.getDay() + 7) % 7;
      if (desvio === 0 && toMin(h.fim) <= minAgora) desvio = 7;
      return { ...h, desvio };
    })
    .sort((a, b) => a.desvio - b.desvio || toMin(a.inicio) - toMin(b.inicio))[0];
  const emAndamento = proximaAula && proximaAula.desvio === 0 && toMin(proximaAula.inicio) <= minAgora;
  const quando = !proximaAula ? '' : proximaAula.desvio === 0 ? (emAndamento ? 'Agora' : 'Hoje') : proximaAula.desvio === 1 ? 'Amanhã' : proximaAula.dia;

  // Tarefas
  const hoje = hojeMs();
  const pendentes = tarefas.filter((t) => !t.feita);
  const atrasadas = pendentes.filter((t) => paraData(t.prazo) < hoje).length;
  const proximasTarefas = [...pendentes].sort((a, b) => paraData(a.prazo) - paraData(b.prazo)).slice(0, 3);

  // Calendário
  const proximasDatas = atividades
    .filter((a) => paraData(a.data) >= hoje)
    .sort((a, b) => paraData(a.data) - paraData(b.data))
    .slice(0, 3);

  // Outros números
  const lembretesPendentes = lembretes.filter((l) => !l.feito).length;
  const diaHoje = agora.toDateString();
  const minFocoHoje = sessoes.filter((s) => new Date(s.data).toDateString() === diaHoje).reduce((soma, s) => soma + s.minutos, 0);
  const media = notas.length ? (notas.reduce((s, n) => s + n.nota, 0) / notas.length).toFixed(1) : null;
  const corMedia = corNota(Number(media));
  const metasAbertas = metas.filter((m) => m.feito < m.alvo).slice(0, 3);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.homeConteudo}>
      <View style={styles.cabecalho}>
        <View style={styles.cabEsq}>
          <Text style={styles.saudacao}>{saudacao}{primeiroNome ? `, ${primeiroNome}` : ''}</Text>
          <Text style={styles.dataExtenso}>{dataExtenso}</Text>
        </View>
        <TouchableOpacity onPress={handleSair} hitSlop={HIT}>
          <Text style={styles.sair}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.aula}>
        <Text style={styles.aulaRotulo}>{proximaAula ? (emAndamento ? 'Aula em andamento' : 'Próxima aula') : 'Aulas'}</Text>
        {proximaAula ? (
          <>
            <Text style={styles.aulaMateria}>{proximaAula.materia}</Text>
            <Text style={styles.aulaHora}>{quando}, {proximaAula.inicio} às {proximaAula.fim}</Text>
            {proximaAula.local ? <Text style={styles.aulaLocal}>{proximaAula.local}</Text> : null}
          </>
        ) : (
          <>
            <Text style={styles.aulaVazio}>Nenhuma aula cadastrada</Text>
            <TouchableOpacity onPress={ir('Horarios')} style={styles.aulaLink}>
              <Text style={styles.aulaLinkTexto}>Montar meu horário</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.numeros}>
        <Numero valor={pendentes.length} rotulo="tarefas" icone="clipboard-outline" cor={atrasadas ? ERRO : colors.tan} onPress={ir('Tarefa')} />
        <Numero valor={lembretesPendentes} rotulo="lembretes" icone="notifications-outline" cor={ROXO} onPress={ir('Lembretes')} />
        <Numero valor={minFocoHoje} rotulo="min de foco" icone="timer-outline" cor={AZUL} onPress={ir('Foco')} />
      </View>
      {atrasadas ? <Text style={styles.atrasadas}>Você tem {atrasadas} tarefa(s) atrasada(s).</Text> : null}

      <Secao titulo="Para entregar" icone="clipboard-outline" cor={colors.tan} acao="Ver todas" onAcao={ir('Tarefa')}>
        {proximasTarefas.length === 0 ? (
          <Vazio texto={tarefas.length ? 'Tudo entregue. Aproveite!' : 'Você ainda não cadastrou tarefas.'} botao={tarefas.length ? null : 'Adicionar tarefa'} onPress={ir('Tarefa')} cor={colors.tan} />
        ) : (
          <View style={styles.pilha}>
            {proximasTarefas.map((t) => {
              const atrasada = paraData(t.prazo) < hoje;
              const corT = atrasada ? ERRO : COR_PRIORIDADE[t.prioridade || 'Média'];
              return (
                <View key={t.id} style={[styles.cartao, comCor(corT), styles.linha]}>
                  <View style={styles.itemCorpo}>
                    <Text style={styles.itemTitulo}>{t.titulo}</Text>
                    {t.materia ? <Text style={styles.itemSub}>{t.materia}</Text> : null}
                  </View>
                  <Text style={[styles.itemInfo, { color: corT }]}>{atrasada ? 'Atrasada' : rotuloDias(t.prazo)}</Text>
                </View>
              );
            })}
          </View>
        )}
      </Secao>

      <Secao titulo="Próximas datas" icone="calendar-number-outline" cor={AZUL} acao="Calendário" onAcao={ir('Calendario')}>
        {proximasDatas.length === 0 ? (
          <Vazio texto="Nenhuma prova ou trabalho à vista." botao="Adicionar atividade" onPress={ir('Calendario')} cor={AZUL} />
        ) : (
          <View style={styles.pilha}>
            {proximasDatas.map((a) => (
              <View key={a.id} style={[styles.cartao, comCor(COR_TIPO[a.tipo] || AZUL), styles.linha]}>
                <View style={[styles.dataBox, { backgroundColor: COR_TIPO[a.tipo] || colors.olive }]}>
                  <Text style={styles.dataTexto}>{a.data}</Text>
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.itemTitulo}>{a.titulo}</Text>
                  <Text style={[styles.itemSub, { color: COR_TIPO[a.tipo] || colors.textSecondary }]}>{a.tipo} · {rotuloDias(a.data)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Secao>

      <Secao titulo="Metas de estudo" icone="flag-outline" cor={colors.olive} acao="Ver metas" onAcao={ir('Metas')}>
        {metasAbertas.length === 0 ? (
          <Vazio texto={metas.length ? 'Todas as metas concluídas. Que tal criar outra?' : 'Defina quantas horas quer estudar e acompanhe aqui.'} botao={metas.length ? null : 'Criar meta'} onPress={ir('Metas')} cor={colors.olive} />
        ) : (
          <View style={styles.pilha}>
            {metasAbertas.map((m) => {
              const pct = Math.min(100, Math.round((m.feito / m.alvo) * 100));
              const corM = pct >= 66 ? colors.olive : pct >= 33 ? colors.tan : AZUL;
              return (
                <View key={m.id} style={[styles.cartao, comCor(corM)]}>
                  <View style={styles.metaTopo}>
                    <Text style={styles.metaTitulo}>{m.titulo}</Text>
                    <Text style={styles.metaValor}>{Math.round(m.feito * 10) / 10} de {m.alvo}h</Text>
                  </View>
                  <View style={[styles.barra, { backgroundColor: corM + '30' }]}>
                    <View style={[styles.barraPct, { width: `${pct}%`, backgroundColor: corM }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </Secao>

      {media ? (
        <TouchableOpacity onPress={ir('Notas')} style={[styles.cartao, comCor(corMedia), styles.linha, styles.secao]}>
          <View style={styles.flex1}>
            <Text style={styles.itemTitulo}>Média geral</Text>
            <Text style={styles.itemSub}>{notas.length} nota(s) lançada(s)</Text>
          </View>
          <Text style={[styles.mediaValor, { color: corMedia }]}>{media}</Text>
        </TouchableOpacity>
      ) : null}

      <Secao titulo="Atalhos" icone="apps-outline" cor={ROSA}>
        <View style={styles.atalhos}>
          {ATALHOS.map((a) => (
            <TouchableOpacity key={a.nome} onPress={ir(a.nome)} style={[styles.cartao, styles.atalho, { backgroundColor: a.cor + '1A', borderColor: a.cor + '55' }]}>
              <View style={[styles.atalhoIcone, { backgroundColor: a.cor }]}>
                <Ionicons name={a.icone} size={24} color="#fff" />
              </View>
              <Text style={styles.atalhoNome}>{a.nome}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Secao>
    </ScrollView>
  );
}