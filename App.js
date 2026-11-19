import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Platform, TouchableOpacity, View } from 'react-native';
import { Text } from './lib/components';
import { ConfigContext } from './lib/contexts';
import { API_URL, ERRO } from './lib/utils';
import CadastroScreen from './Screens/CadastroScreen';
import CalendarioScreen from './Screens/CalendarioScreen';
import FocoScreen from './Screens/FocoScreen';
import HomeScreen from './Screens/HomeScreen';
import HorariosScreen from './Screens/HorariosScreen';
import LembretesScreen from './Screens/LembretesScreen';
import LoginScreen from './Screens/LoginScreen';
import MetasScreen from './Screens/MetasScreen';
import NotasScreen from './Screens/NotasScreen';
import PerfilScreen from './Screens/PerfilScreen';
import TarefaScreen from './Screens/TarefaScreen';
import { colors, styles } from './styles';

export { API_URL };

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MENU = [
  { nome: 'Home', rotulo: 'Início', icone: 'home-outline', aba: true },
  { nome: 'Tarefa', rotulo: 'Tarefas', icone: 'clipboard-outline', aba: true },
  { nome: 'Calendario', rotulo: 'Calendário', icone: 'calendar-number-outline', aba: true },
  { nome: 'Horarios', rotulo: 'Horários', icone: 'time-outline', aba: true },
  { nome: 'Lembretes', rotulo: 'Lembretes', icone: 'notifications-outline' },
  { nome: 'Notas', rotulo: 'Notas e Desempenho', icone: 'bar-chart-outline' },
  { nome: 'Metas', rotulo: 'Metas de Estudo', icone: 'flag-outline' },
  { nome: 'Foco', rotulo: 'Modo de foco', icone: 'timer-outline' },
  { nome: 'Perfil', rotulo: 'Perfil e Acessibilidade', icone: 'person-outline' },
];
const ICONES = Object.fromEntries(MENU.map((m) => [m.nome, m.icone]));

const navRef = createNavigationContainerRef();
const MenuContext = createContext({ abrir: () => {} });

function MenuProvider({ children }) {
  const [menu, setMenu] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const LARGURA = Math.min(320, Dimensions.get('window').width * 0.78);

  const abrir = () => {
    setMenu(true);
    Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: Platform.OS !== 'web' }).start();
  };

  const fechar = (depois) => {
    Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start(() => {
      setMenu(false);
      if (depois) depois();
    });
  };

  const ir = (item) => fechar(() => {
    if (item.aba) navRef.navigate('Main', { screen: item.nome });
    else navRef.navigate(item.nome);
  });

  const sair = async () => {
    await AsyncStorage.removeItem('usuario');
    fechar(() => navRef.reset({ index: 0, routes: [{ name: 'Login' }] }));
  };

  const linha = { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12 };
  const caixaIcone = { width: 28, alignItems: 'center' };

  return (
    <MenuContext.Provider value={{ abrir }}>
      {children}
      <Modal visible={menu} transparent animationType="none" onRequestClose={() => fechar()}>
  <View style={styles.flex1}>
    <Animated.View style={[styles.menuFundo, { opacity: anim }]}>
      <TouchableOpacity activeOpacity={1} style={styles.flex1} onPress={() => fechar()} />
    </Animated.View>
    <Animated.View style={[styles.menuPainel, { width: LARGURA, paddingTop: (Constants.statusBarHeight || 0) + 24, transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-LARGURA, 0] }) }] }]}>
      <TouchableOpacity onPress={() => fechar()} style={[styles.menuItem, styles.menuTopo]}>
        <View style={styles.menuIcone}>
          <Ionicons name="menu" size={28} color={colors.text} style={styles.menuGirado} />
        </View>
      </TouchableOpacity>
      {MENU.map((item) => (
        <TouchableOpacity key={item.nome} style={styles.menuItem} onPress={() => ir(item)}>
          <View style={styles.menuIcone}>
            <Ionicons name={item.icone} size={22} color={colors.olive} />
          </View>
          <Text style={styles.menuTexto}>{item.rotulo}</Text>
        </TouchableOpacity>
      ))}
      <View style={styles.menuSep} />
      <TouchableOpacity style={styles.menuItem} onPress={sair}>
        <View style={styles.menuIcone}>
          <Ionicons name="log-out-outline" size={22} color={ERRO} />
        </View>
        <Text style={[styles.menuTexto, styles.menuSair]}>Sair</Text>
      </TouchableOpacity>
    </Animated.View>
  </View>
</Modal>
    </MenuContext.Provider>
  );
}

function BotaoMenu() {
  const { abrir } = useContext(MenuContext);
  return (
    <TouchableOpacity onPress={abrir} style={{ marginLeft: 16 }}>
      <Ionicons name="menu" size={28} color={colors.text} />
    </TouchableOpacity>
  );
}

const telaMenu = (title) => ({
  headerShown: true,
  title,
  headerBackVisible: false,
  headerLeft: () => <BotaoMenu />,
});

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitle: '',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerLeft: () => <BotaoMenu />,
        tabBarActiveTintColor: colors.olive,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ color, size }) => <Ionicons name={ICONES[route.name]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tarefa" component={TarefaScreen} options={{ title: 'Tarefas' }} />
      <Tab.Screen name="Calendario" component={CalendarioScreen} options={{ title: 'Calendário' }} />
      <Tab.Screen name="Horarios" component={HorariosScreen} options={{ title: 'Horários' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [escala, setEscalaState] = useState(1);
  const [inicial, setInicial] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('escala').then((v) => v && setEscalaState(parseFloat(v)));
    AsyncStorage.getItem('usuario').then((v) => setInicial(v ? 'Main' : 'Login'));
  }, []);

  const setEscala = (v) => {
    setEscalaState(v);
    AsyncStorage.setItem('escala', String(v));
  };

  // Espera ler a sessão salva antes de montar a navegação
  if (!inicial) return null;

  return (
    <ConfigContext.Provider value={{ escala, setEscala }}>
      <NavigationContainer ref={navRef}>
        <MenuProvider>
          <Stack.Navigator initialRouteName={inicial} screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Cadastro" component={CadastroScreen} />
            <Stack.Screen name="Main" component={Tabs} />
            <Stack.Screen name="Lembretes" component={LembretesScreen} options={telaMenu('Lembretes')} />
            <Stack.Screen name="Notas" component={NotasScreen} options={telaMenu('Notas e Desempenho')} />
            <Stack.Screen name="Metas" component={MetasScreen} options={telaMenu('Metas de Estudo')} />
            <Stack.Screen name="Foco" component={FocoScreen} options={telaMenu('Modo de foco')} />
            <Stack.Screen name="Perfil" component={PerfilScreen} options={telaMenu('Perfil e Acessibilidade')} />
          </Stack.Navigator>
        </MenuProvider>
      </NavigationContainer>
    </ConfigContext.Provider>
  );
}