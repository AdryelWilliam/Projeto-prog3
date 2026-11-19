import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Alert, TextInput, TouchableOpacity, View } from 'react-native';
import { Text } from '../lib/components';
import { API_URL } from '../lib/utils';
import { colors, styles } from '../styles';

export default function Auth({ navigation, cadastro }) {
  const [c, setC] = useState({ nome: '', email: '', senha: '' });
  const [carregando, setCarregando] = useState(false);
  const set = (k) => (v) => setC((x) => ({ ...x, [k]: v }));

  const enviar = async () => {
    if (!c.email || !c.senha || (cadastro && !c.nome)) return Alert.alert('Atenção', 'Preencha todos os campos.');
    if (cadastro && c.senha.length < 6) return Alert.alert('Atenção', 'A senha precisa ter pelo menos 6 caracteres.');
    const titulo = cadastro ? 'Erro ao cadastrar' : 'Erro ao entrar';
    let res;
    try {
      setCarregando(true);
      res = await fetch(`${API_URL}/${cadastro ? 'cadastro' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cadastro ? c : { email: c.email, senha: c.senha }),
      });
    } catch {
      setCarregando(false);
      return Alert.alert(titulo, 'Sem conexão com o servidor. Verifique se ele está ligado e se o celular está na mesma rede.');
    }
    try {
      const dados = await res.json();
      if (!res.ok) throw new Error();
      await AsyncStorage.setItem('usuario', JSON.stringify(dados));
      navigation.replace('Main', { screen: 'Home', params: { usuario: dados } });
    } catch {
      Alert.alert(titulo, cadastro ? 'Verifique os dados e tente novamente.' : 'E-mail ou senha inválidos.');
    } finally {
      setCarregando(false);
    }
  };

  const input = (k, ph, p) => (
    <TextInput style={styles.input} placeholder={ph} placeholderTextColor={colors.textSecondary} value={c[k]} onChangeText={set(k)} {...p} />
  );

  return (
    <View style={ styles.container }>
      <Text style={styles.titulo}>{cadastro ? 'Criar conta' : 'Rotina Escolar'}</Text>
      <Text style={styles.subtitulo}>{cadastro ? 'Comece a organizar sua rotina escolar' : 'Entre para continuar'}</Text>
      {cadastro && input('nome', 'Nome')}
      {input('email', 'E-mail', { autoCapitalize: 'none', keyboardType: 'email-address' })}
      {input('senha', cadastro ? 'Senha (mín. 6 caracteres)' : 'Senha', { secureTextEntry: true })}

      <TouchableOpacity style={styles.botao} onPress={enviar} disabled={carregando}>
        <Text style={styles.botaoTexto}>{carregando ? (cadastro ? 'Cadastrando...' : 'Entrando...') : cadastro ? 'Cadastrar' : 'Entrar'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.botao, styles.botaoDemo]} onPress={() => navigation.navigate('Main')}>
        <Text style={styles.botaoTexto}>{cadastro ? 'Entrar sem cadastro (Modo Demo)' : 'Entrar sem login (Modo Demo)'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate(cadastro ? 'Login' : 'Cadastro')}>
        <Text style={styles.link}>{cadastro ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastre-se'}</Text>
      </TouchableOpacity>
    </View>
  );
}