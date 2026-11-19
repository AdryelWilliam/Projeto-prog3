import { Ionicons } from '@expo/vector-icons';
import { useContext, useState } from 'react';
import { FlatList, Modal, Text as RNText, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ConfigContext } from './contexts';
import { colors, comCor, styles } from '../styles';

export function Text({ style, ...p }) {
  const { escala } = useContext(ConfigContext);
  const base = StyleSheet.flatten(style)?.fontSize || 14;
  return <RNText {...p} style={[style, { fontSize: base * escala }]} />;
}

export function Chips({ opcoes, valor, onChange }) {
  return (
    <View style={styles.chips}>
      {opcoes.map((o) => (
        <TouchableOpacity key={o} style={[styles.chip, valor === o && styles.chipAtivo]} onPress={() => onChange(o)}>
          <Text style={[styles.chipTexto, valor === o && styles.chipTextoAtivo]}>{o}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function Filtro({ opcoes, valor, onChange }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <TouchableOpacity style={[styles.chip, styles.chipAtivo, styles.linha]} onPress={() => setAberto(true)}>
        <Ionicons name="funnel-outline" size={16} color="#fff" />
        <Text style={[styles.chipTexto, styles.chipTextoAtivo, styles.filtroTexto]}>{valor}</Text>
      </TouchableOpacity>
      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setAberto(false)} style={styles.modalFundo}>
          <View style={styles.modalCaixa}>
            {opcoes.map((o) => (
              <TouchableOpacity key={o} style={styles.menuItem} onPress={() => { onChange(o); setAberto(false); }}>
                <Text style={[styles.menuTexto, o === valor && styles.menuAtivo]}>{o}</Text></TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

export const Seletor = ({ rotulo, ...p }) => (
  <>
    <Text style={styles.rotulo}>{rotulo}</Text>
    <Chips {...p} />
  </>
);

export const Campo = ({ f, k, ph, mask, ...p }) => (
  <TextInput
    style={styles.input}
    placeholder={ph}
    placeholderTextColor={colors.textSecondary}
    value={f.campos[k]}
    onChangeText={(v) => f.set(k)(mask ? mask(v) : v)}
    {...p}
  />
);

export const Check = ({ on, onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <Ionicons name={on ? 'checkbox' : 'square-outline'} size={26} color={colors.olive} style={{ marginRight: 12 }} />
  </TouchableOpacity>
);

export const Card = ({ cor = colors.olive, esq, extra, onPress, onRemover, children }) => (
  <View style={[styles.card, comCor(cor)]}>
    {esq}
    <TouchableOpacity style={styles.flex1} onPress={onPress}>{children}</TouchableOpacity>
    {extra}
    <TouchableOpacity onPress={onRemover}>
      <Ionicons name="trash-outline" size={22} color={colors.textSecondary} />
    </TouchableOpacity>
  </View>
);
export function Tela({ titulo, acao, dados, f, onSubmit, campos, resumo, vazio, renderItem }) {
  return (
    <View style={styles.container}>
      {titulo && (
        <View style={styles.header}>
          <Text style={styles.titulo}>{titulo}</Text>
          {acao}
        </View>
      )}
      <FlatList
        data={dados}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <View style={styles.formAgenda}>
              {campos}
              {f.erro ? <Text style={styles.erro}>{f.erro}</Text> : null}
              <TouchableOpacity style={styles.botao} onPress={onSubmit}>
                <Text style={styles.botaoTexto}>{f.editandoId ? 'Salvar alterações' : 'Adicionar'}</Text>
              </TouchableOpacity>
              {f.editandoId ? (
                <TouchableOpacity style={[styles.botao, styles.botaoCancelar]} onPress={f.limpar}>
                  <Text style={styles.botaoTexto}>Cancelar edição</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {resumo}
          </View>
        }
        ListEmptyComponent={<Text style={styles.cardDescricao}>{vazio}</Text>}
        renderItem={renderItem}
      />
    </View>
  );
}
