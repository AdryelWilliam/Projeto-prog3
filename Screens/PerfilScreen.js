import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext, useEffect, useState } from 'react';
import { ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Chips, Text } from '../lib/components';
import { ConfigContext } from '../lib/contexts';
import { colors, styles } from '../styles';

const TAMANHOS = { Normal: 1, Grande: 1.2, 'Muito grande': 1.4 };

export default function PerfilScreen({ navigation }) {
  const { escala, setEscala } = useContext(ConfigContext);
  const [usuario, setUsuario] = useState(null);
  const [nome, setNome] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('usuario').then((v) => {
      if (!v) return;
      const u = JSON.parse(v);
      setUsuario(u);
      setNome(u.nome || '');
    });
  }, []);

  const salvarNome = async () => {
    if (!nome.trim()) return setMsg('Digite um nome.');
    const novo = { ...(usuario || {}), nome: nome.trim() };
    setUsuario(novo);
    await AsyncStorage.setItem('usuario', JSON.stringify(novo));
    setMsg('Nome salvo!');
  };

  const tamanhoAtual = Object.keys(TAMANHOS).find((k) => TAMANHOS[k] === escala) || 'Normal';

  return (
    <ScrollView style={styles.container} contentContainerStyle={ styles.conteudo }>
      <Text style={[styles.secaoTitulo, styles.mb16]}>Perfil</Text>
      <Text style={styles.rotulo}>E-mail</Text>
      <Text style={[styles.cardTitulo, { marginBottom: 16 }]}>{usuario?.email || 'Modo demo (sem login)'}</Text>

      <Text style={styles.rotulo}>Nome</Text>
      <TextInput
        style={styles.input}
        placeholder="Seu nome"
        placeholderTextColor={colors.textSecondary}
        value={nome}
        onChangeText={(v) => { setNome(v); setMsg(''); }}
      />
      {msg ? <Text style={styles.contador}>{msg}</Text> : null}
      <TouchableOpacity style={styles.botao} onPress={salvarNome}>
        <Text style={styles.botaoTexto}>Salvar nome</Text>
      </TouchableOpacity>

      <Text style={[styles.secaoTitulo, styles.mt28]}>Acessibilidade</Text>
      <Text style={styles.rotulo}>Tamanho do texto</Text>
      <Chips opcoes={Object.keys(TAMANHOS)} valor={tamanhoAtual} onChange={(k) => setEscala(TAMANHOS[k])} />
      <Text style={styles.cardDescricao}>O tamanho escolhido fica salvo e vale para todas as telas.</Text>
    </ScrollView>
  );
}
