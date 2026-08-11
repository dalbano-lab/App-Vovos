import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing, shadows } from '../theme';

const ICONS = ['🐶','🌻','🍎','⭐','🐱','🍰','☀️','❤️','🦋','🌈','🐘','🎵','🍓','🏆','🌙','🎨'];

const LEVELS = [
  { label: 'Nível 1', pairs: 3, desc: 'Muito fácil' },
  { label: 'Nível 2', pairs: 4, desc: 'Fácil' },
  { label: 'Nível 3', pairs: 6, desc: 'Médio' },
  { label: 'Nível 4', pairs: 8, desc: 'Difícil' },
  { label: 'Nível 5', pairs: 10, desc: 'Expert' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Card = { id: number; symbol: string; flipped: boolean; matched: boolean };

export default function MemoryGame() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);

  const start = (idx: number) => {
    const n = LEVELS[idx].pairs;
    const symbols = shuffle(ICONS).slice(0, n);
    const deck = shuffle(
      [...symbols, ...symbols].map((s, i) => ({ id: i, symbol: s, flipped: false, matched: false }))
    );
    setCards(deck);
    setSelected([]);
    setMoves(0);
    setDone(false);
    setLevelIdx(idx);
    Speech.speak(`${LEVELS[idx].label}. ${n} pares. Boa sorte!`, { language: 'pt-BR' });
  };

  useEffect(() => { start(0); }, []);

  useEffect(() => {
    if (selected.length === 2) {
      const [a, b] = selected;
      setMoves((m) => m + 1);
      if (cards[a].symbol === cards[b].symbol) {
        setTimeout(() => {
          setCards((prev) => prev.map((c, i) => i === a || i === b ? { ...c, matched: true } : c));
          setSelected([]);
        }, 400);
      } else {
        setTimeout(() => {
          setCards((prev) => prev.map((c, i) => i === a || i === b ? { ...c, flipped: false } : c));
          setSelected([]);
        }, 900);
      }
    }
  }, [selected, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.matched)) {
      setDone(true);
      Speech.speak('Parabéns! Você completou o jogo da memória!', { language: 'pt-BR' });
    }
  }, [cards]);

  const flip = (i: number) => {
    if (cards[i].flipped || cards[i].matched || selected.length >= 2) return;
    setCards((prev) => prev.map((c, idx) => idx === i ? { ...c, flipped: true } : c));
    setSelected((prev) => [...prev, i]);
  };

  const level = LEVELS[levelIdx];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.headerText}>Jogadas: {moves}</Text>
        <Text style={styles.headerText}>
          Pares: {cards.filter((c) => c.matched).length / 2}/{level.pairs}
        </Text>
      </View>

      {/* Seletor de nível */}
      <View style={styles.levelsRow}>
        {LEVELS.map((lv, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.levelBtn, levelIdx === i && styles.levelBtnActive]}
            onPress={() => start(i)}
          >
            <Text style={[styles.levelNum, levelIdx === i && { color: '#fff' }]}>{i + 1}</Text>
            <Text style={[styles.levelDesc, levelIdx === i && { color: '#fff' }]}>{lv.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.grid}>
        {cards.map((c, i) => (
          <TouchableOpacity
            key={c.id}
            style={[
              styles.card,
              (c.flipped || c.matched) && styles.cardFlipped,
              c.matched && styles.cardMatched,
              level.pairs >= 8 && styles.cardSmall,
            ]}
            onPress={() => flip(i)}
            activeOpacity={0.8}
          >
            <Text style={[styles.cardSymbol, level.pairs >= 8 && styles.cardSymbolSmall]}>
              {c.flipped || c.matched ? c.symbol : '?'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {done && (
        <View style={styles.doneCard}>
          <Ionicons name="trophy" size={64} color={colors.secondary} />
          <Text style={styles.doneTitle}>Parabéns! 🎉</Text>
          <Text style={styles.doneText}>Você completou em {moves} jogadas!</Text>
          {levelIdx < LEVELS.length - 1 && (
            <TouchableOpacity style={styles.nextLevelBtn} onPress={() => start(levelIdx + 1)}>
              <Text style={styles.nextLevelText}>Próximo nível ▶</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.btn} onPress={() => start(levelIdx)}>
        <Ionicons name="refresh" size={26} color="#fff" />
        <Text style={styles.btnText}>Reiniciar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  headerCard: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: colors.surface, padding: spacing.md,
    borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, marginBottom: spacing.md,
  },
  headerText: { fontSize: fontSize.body, fontWeight: '800', color: colors.primary },
  levelsRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.md, justifyContent: 'center' },
  levelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary, borderWidth: 2, borderColor: colors.border,
  },
  levelBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  levelNum: { fontSize: 18, fontWeight: '900', color: colors.textPrimary },
  levelDesc: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  card: {
    width: 92, height: 110, backgroundColor: colors.primary,
    borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', ...shadows.card,
  },
  cardSmall: { width: 70, height: 84 },
  cardFlipped: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary },
  cardMatched: { backgroundColor: colors.primaryLight, borderColor: colors.success },
  cardSymbol: { fontSize: 42, color: colors.textPrimary, fontWeight: '800' },
  cardSymbolSmall: { fontSize: 32 },
  doneCard: {
    marginTop: spacing.xl, backgroundColor: colors.secondaryLight, padding: spacing.lg,
    borderRadius: radius.lg, alignItems: 'center', borderWidth: 2, borderColor: colors.secondary,
  },
  doneTitle: { fontSize: fontSize.h2, fontWeight: '900', color: colors.secondary, marginTop: spacing.sm },
  doneText: { fontSize: fontSize.body, color: colors.textPrimary, marginTop: spacing.xs },
  nextLevelBtn: {
    marginTop: spacing.md, backgroundColor: colors.secondary, paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: radius.md,
  },
  nextLevelText: { color: '#fff', fontSize: fontSize.body, fontWeight: '900' },
  btn: {
    backgroundColor: colors.primary, height: 60, paddingHorizontal: spacing.lg,
    borderRadius: radius.md, flexDirection: 'row', alignItems: 'center',
    gap: 8, marginTop: spacing.lg, alignSelf: 'center',
  },
  btnText: { color: '#fff', fontSize: fontSize.body, fontWeight: '800' },
});
