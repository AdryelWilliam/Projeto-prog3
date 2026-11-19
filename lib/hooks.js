import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { apagarEvento } from './utils';

// Chave separada por usuário: "uid:tarefas". Sem login (modo demo) usa "demo:tarefas".
const chaveUsuario = async (chave) => {
  const u = await AsyncStorage.getItem('usuario');
  let uid = 'demo';
  try { uid = (u && JSON.parse(u).uid) || 'demo'; } catch {}
  return `${uid}:${chave}`;
};

export function useLista(chave) {
  const [itens, setItens] = useState([]);
  const focada = useIsFocused();
  useEffect(() => {
    if (!focada) return;
    chaveUsuario(chave).then((k) =>
      AsyncStorage.getItem(k).then((v) => setItens(v ? JSON.parse(v) : []))
    );
  }, [focada]);
  const salvar = async (novos) => {
    setItens(novos);
    AsyncStorage.setItem(await chaveUsuario(chave), JSON.stringify(novos));
  };
  return [itens, salvar];
}
export function useForm(inicial) {
  const [campos, setCampos] = useState(inicial);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState('');
  const set = (k) => (v) => setCampos((c) => ({ ...c, [k]: v }));
  const limpar = () => { setCampos(inicial); setEditandoId(null); setErro(''); };
  const editar = (item) => {
    setCampos(Object.fromEntries(Object.keys(inicial).map((k) => [k, String(item[k] ?? inicial[k])])));
    setEditandoId(item.id);
    setErro('');
  };
  return { campos, set, editandoId, erro, setErro, limpar, editar };
}
export function useCrud(chave, inicial) {
  const [itens, salvar] = useLista(chave);
  const f = useForm(inicial);
  const gravar = (novo, extra = {}) => {
    salvar(f.editandoId
      ? itens.map((x) => (x.id === f.editandoId ? { ...x, ...novo } : x))
      : [...itens, { id: Date.now().toString(), ...extra, ...novo }]);
    f.limpar();
  };
  const remover = (id) => {
    apagarEvento(itens.find((x) => x.id === id)?.eventoId);
    if (f.editandoId === id) f.limpar();
    salvar(itens.filter((x) => x.id !== id));
  };
  const alterar = (id, fn) => salvar(itens.map((x) => (x.id === id ? { ...x, ...fn(x) } : x)));
  return { itens, salvar, f, gravar, remover, alterar };
}