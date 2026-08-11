import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing, shadows } from '../theme';

const PADS = [
  { id: 0, color: '#2D5A4C', name: 'Verde' },
  { id: 1, color: '#C25433', name: 'Laranja' },
  { id: 2, color: '#E0A030', name: 'Amarelo' },
  { id: 3, color: '#3A7D8F', name: 'Azul' },
];

// Nível define: velocidade de exibição e meta de pontos para passar
const LEVELS = [
  { label: 'Nível 1', desc: 'Muito fácil', speed: 900,  goal: 3  },
  { label: 'Nível 2', desc: 'Fácil',       speed: 750,  goal: 5  },
  { label: 'Nível 3', desc: 'Médio',       speed: 600,  goal: 8  },
  { label: 'Nível 4', desc: 'Difícil',     speed: 450,  goal: 12 },
  { label: 'Nível 5', desc: 'Expert',      speed: 300,  goal: 18 },
];

export default function SequenceGame() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userIdx, setUserIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showing, setShowing] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Escolha um nível e toque em "Começar".');
  const [levelUp, setLevelUp] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const start = (idx: number) => {
    setLevelIdx(idx);
    const first = [Math.floor(Math.random() * 4)];
    setSequence(first);
    setUserIdx(0);
    setScore(0);
    setPlaying(true);
    setLevelUp(false);
    setMessage('Preste atenção na sequência...');
    Speech.speak(`${LEVELS[idx].label}. Preste atenção!`, { language: 'pt-BR' });
    setTimeout(() => playSequence(first, idx), 600);
  };

  const playSequence = async (seq: number[], lvIdx: number) => {
    const spd = LEVELS[lvIdx].speed;
    setShowing(true);
    for (let i = 0; i < seq.length; i++) {
      await new Promise<void>((resolve) => {
        timerRef.current = setTimeout(() => {
          setActive(seq[i]);
          timerRef.current = setTimeout(() => {
            setActive(null);
            timerRef.current = setTimeout(resolve, 200);
          }, spd);
        }, 100);
      });
    }
    setShowing(false);
    setMessage('Agora repita a sequência! 👆');
  };

  const press = (id: number) => {
    if (!playing || showing) return;
    setActive(id);
    setTimeout(() => setActive(null), 200);

    if (sequence[userIdx] === id) {
      const next = userIdx + 1;
      if (next === sequence.length) {
        const newScore = score + 1;
        setScore(newScore);
        const goal = LEVELS[levelIdx].goal;

        // Passou de nível?
        if (newScore >= goal && levelIdx < LEVELS.length - 1) {
          setPlaying(false);
          setLevelUp(true);
          setMessage(`🎉 Parabéns! Você passou para o ${LEVELS[levelIdx + 1].label}!`);
          Speech.speak('Incrível! Você subiu de nível!', { language: 'pt-BR' });
          return;
        }

        setMessage(`Muito bem! ✨ ${newScore}/${goal} para próximo nível`);
        Speech.speak('Muito bem!', { language: 'pt-BR' });
        const newSeq = [...sequence, Math.floor(Math.random() * 4)];
        setSequence(newSeq);
        setUserIdx(0);
        setTimeout(() => playSequence(newSeq, levelIdx), 900);
      } else {
        setUserIdx(next);
      }
    } else {
      setPlaying(false);
      setMessage(`Quase! 💛 Pontuação: ${score}/${LEVELS[levelIdx].goal}`);
      Speech.speak(`Quase! Você fez ${score} pontos.`, { language: 'pt-BR' });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

      <View style={styles.statusCard}>
        <Text style={styles.statusText}>{message}</Text>
        <Text style={styles.scoreText}>
          Pontuação: {score} / meta: {LEVELS[levelIdx].goal}
        </Text>
      </View>

      <View style={styles.grid}>
        {PADS.map((p) => (
          <TouchableOpacity
            key={p.id}
            disabled={!playing || showing}
            onPress={() => press(p.id)}
            style={[styles.pad, { backgroundColor: p.color }, active === p.id && styles.padActive]}
            activeOpacity={0.7}
          >
            <Text style={styles.padText}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {levelUp && levelIdx < LEVELS.length - 1 && (
        <TouchableOpacity style={styles.nextLevelBtn} onPress={() => start(levelIdx + 1)}>
          <Text style={styles.nextLevelText}>Ir para {LEVELS[levelIdx + 1].label} ▶</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.startBtn} onPress={() => start(levelIdx)}>
        <Ionicons name="play" size={28} color="#fff" />
        <Text style={styles.startText}>{playing ? 'Recomeçar' : 'Começar'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  levelsRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.md, justifyContent: 'center' },
  levelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary, borderWidth: 2, borderColor: colors.border,
  },
  levelBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  levelNum: { fontSize: 18, fontWeight: '900', color: colors.textPrimary },
  levelDesc: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  statusCard: {
    backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.border, marginBottom: spacing.lg, alignItems: 'center',
  },
  statusText: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  scoreText: { marginTop: spacing.sm, fontSize: fontSize.body, color: colors.primary, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' },
  pad: { width: 150, height: 150, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  padActive: { opacity: 0.5, transform: [{ scale: 0.95 }] },
  padText: { color: '#fff', fontSize: fontSize.h3, fontWeight: '900' },
  nextLevelBtn: {
    backgroundColor: colors.secondary, padding: spacing.md, borderRadius: radius.md,
    alignItems: 'center', marginTop: spacing.lg,
  },
  nextLevelText: { color: '#fff', fontSize: fontSize.bodyLarge, fontWeight: '900' },
  startBtn: {
    marginTop: spacing.xl, height: 72, backgroundColor: colors.primary, borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...shadows.card,
  },
  startText: { color: '#fff', fontSize: fontSize.bodyLarge, fontWeight: '800' },
});
