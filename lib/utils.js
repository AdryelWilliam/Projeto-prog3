import * as Calendar from 'expo-calendar';
import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';
import { colors } from '../styles';

export const ERRO = '#B3261E';

export const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const DIAS_SEMANA = ['Dom', ...DIAS];
export const PRIORIDADES = ['Baixa', 'Média', 'Alta'];
export const COR_PRIORIDADE = { Baixa: colors.olive, Média: colors.tan, Alta: ERRO };
export const TIPOS = ['Prova', 'Trabalho', 'Tarefa', 'Evento'];
export const COR_TIPO = { Prova: ERRO, Trabalho: colors.tan, Tarefa: colors.olive, Evento: '#3B6E8F' };

export const hojeMs = () => new Date().setHours(0, 0, 0, 0);

export const paraData = (s) => {
  const [d, m] = s.split('/').map(Number);
  return new Date(new Date().getFullYear(), (m || 1) - 1, d || 1).getTime();
};

export const dataValida = (s) => {
  const m = /^(\d{1,2})\/(\d{1,2})$/.exec(s);
  return !!m && +m[1] >= 1 && +m[1] <= 31 && +m[2] >= 1 && +m[2] <= 12;
};

export const horaValida = (s) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(s);

export const mascaraData = (v) => {
  const n = v.replace(/\D/g, '').slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
};

export const mascaraHora = (v) => {
  const n = v.replace(/\D/g, '').slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)}:${n.slice(2)}` : n;
};

export const toMin = (s) => {
  const [h, m] = (s || '0:0').split(':').map(Number);
  return h * 60 + m;
};

export const rotuloDias = (data) => {
  const n = Math.round((paraData(data) - hojeMs()) / 86400000);
  return n === 0 ? 'Hoje' : n === 1 ? 'Amanhã' : n > 1 ? `Em ${n} dias` : 'Já passou';
};

export const corNota = (n) => (n >= 7 ? colors.olive : n >= 5 ? colors.tan : ERRO);

export function getApiUrl() {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const host = debuggerHost?.split(':')[0];
  if (host) return `http://${host}:3000`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}
export const API_URL = getApiUrl();

export const dataHora = (data, hora = '0:0') => {
  const [d, m] = data.split('/').map(Number);
  const [h, mi] = hora.split(':').map(Number);
  return new Date(new Date().getFullYear(), m - 1, d, h, mi);
};

export async function calendarioPadrao() {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') return null;
  const cals = (await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).filter((c) => c.allowsModifications);
  const google = cals.find((c) => /google|gmail/i.test(`${c.source?.name} ${c.source?.type}`));
  return google || cals.find((c) => c.isPrimary) || cals[0] || null;
}

export async function sincronizarEvento(eventoId, evento) {
  try {
    const cal = await calendarioPadrao();
    if (!cal) {
      Alert.alert('Agenda', 'Não foi possível acessar a agenda. Verifique a permissão e se há uma conta Google no celular.');
      return eventoId || null;
    }
    const dados = { ...evento, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    if (eventoId) {
      try {
        await Calendar.updateEventAsync(eventoId, dados);
        return eventoId;
      } catch {}
    }
    return await Calendar.createEventAsync(cal.id, dados);
  } catch (e) {
    Alert.alert('Erro ao sincronizar', String(e?.message || e));
    return eventoId || null;
  }
}

export async function apagarEvento(eventoId) {
  if (!eventoId) return;
  try {
    await Calendar.deleteEventAsync(eventoId);
  } catch {}
}
