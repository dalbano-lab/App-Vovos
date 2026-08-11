import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing, shadows } from '../theme';

type Question = { q: string; options: string[]; correct: number };

// Nível 1 — muito fácil (cotidiano simples)
const POOL_1: Question[] = [
  { q: 'Qual desses é uma fruta?', options: ['Cenoura','Maçã','Batata','Alface'], correct: 1 },
  { q: 'Qual animal mia?', options: ['Cachorro','Vaca','Gato','Pato'], correct: 2 },
  { q: 'Qual a cor do céu em um dia claro?', options: ['Vermelho','Verde','Azul','Preto'], correct: 2 },
  { q: 'Quantos dias tem uma semana?', options: ['5','7','10','12'], correct: 1 },
  { q: 'O Sol nasce no...', options: ['Norte','Sul','Leste','Oeste'], correct: 2 },
  { q: 'Em que refeição tomamos café?', options: ['Almoço','Jantar','Café da manhã','Lanche'], correct: 2 },
  { q: 'Qual animal late?', options: ['Gato','Cachorro','Peixe','Pássaro'], correct: 1 },
  { q: 'Quantos meses tem um ano?', options: ['10','11','12','13'], correct: 2 },
];

// Nível 2 — fácil (conhecimentos gerais básicos)
const POOL_2: Question[] = [
  { q: 'Qual a capital do Brasil?', options: ['Rio de Janeiro','Brasília','São Paulo','Salvador'], correct: 1 },
  { q: 'Quanto é 5 + 3?', options: ['6','7','8','9'], correct: 2 },
  { q: 'Qual desses é uma cor primária?', options: ['Roxo','Laranja','Amarelo','Marrom'], correct: 2 },
  { q: 'Em que estação do ano faz mais calor?', options: ['Inverno','Outono','Primavera','Verão'], correct: 3 },
  { q: 'Quantos dias tem fevereiro normalmente?', options: ['28','29','30','31'], correct: 0 },
  { q: 'Qual o maior planeta do sistema solar?', options: ['Marte','Terra','Júpiter','Saturno'], correct: 2 },
  { q: 'Quanto é 10 - 4?', options: ['4','5','6','7'], correct: 2 },
  { q: 'Qual o idioma falado no Brasil?', options: ['Espanhol','Inglês','Português','Francês'], correct: 2 },
];

// Nível 3 — médio (história, ciências, cultura)
const POOL_3: Question[] = [
  { q: 'Quem pintou a Mona Lisa?', options: ['Miguel Ângelo','Leonardo da Vinci','Rafael','Picasso'], correct: 1 },
  { q: 'Quanto é 7 × 8?', options: ['54','56','58','62'], correct: 1 },
  { q: 'Qual o rio mais longo do mundo?', options: ['Nilo','Amazonas','Mississippi','Yangtzé'], correct: 0 },
  { q: 'Em que ano o Brasil foi descoberto?', options: ['1492','1498','1500','1502'], correct: 2 },
  { q: 'Qual o elemento químico do símbolo "O"?', options: ['Ouro','Ósmio','Oxigênio','Óleum'], correct: 2 },
  { q: 'Quantos lados tem um hexágono?', options: ['5','6','7','8'], correct: 1 },
  { q: 'Qual o país mais populoso do mundo?', options: ['Índia','EUA','China','Brasil'], correct: 2 },
  { q: 'Quem escreveu Dom Casmurro?', options: ['José de Alencar','Machado de Assis','Drummond','Guimarães Rosa'], correct: 1 },
];

// Nível 4 — difícil (ciências, história, geografia avançada)
const POOL_4: Question[] = [
  { q: 'Qual o menor país do mundo?', options: ['Mônaco','San Marino','Vaticano','Liechtenstein'], correct: 2 },
  { q: 'Quanto é a raiz quadrada de 144?', options: ['11','12','13','14'], correct: 1 },
  { q: 'Qual o osso mais longo do corpo humano?', options: ['Rádio','Ulna','Tíbia','Fêmur'], correct: 3 },
  { q: 'Em que ano começou a 2ª Guerra Mundial?', options: ['1937','1938','1939','1940'], correct: 2 },
  { q: 'Qual a velocidade da luz (aprox)?', options: ['150.000 km/s','200.000 km/s','300.000 km/s','400.000 km/s'], correct: 2 },
  { q: 'Quem foi o primeiro homem na Lua?', options: ['Buzz Aldrin','Neil Armstrong','Yuri Gagarin','John Glenn'], correct: 1 },
  { q: 'Qual o símbolo químico do ouro?', options: ['Go','Ou','Au','Or'], correct: 2 },
  { q: 'Quantos cromossomos tem o ser humano?', options: ['23','44','46','48'], correct: 2 },
];

// Nível 5 — expert (cultura geral avançada)
const POOL_5: Question[] = [
  { q: 'Qual o teorema que diz a² + b² = c²?', options: ['Tales','Pitágoras','Euclides','Arquimedes'], correct: 1 },
  { q: 'Qual país tem mais fronteiras terrestres?', options: ['Brasil','Rússia','China','França'], correct: 2 },
  { q: 'Quem formulou a teoria da relatividade?', options: ['Newton','Bohr','Einstein','Hawking'], correct: 2 },
  { q: 'Qual o metal mais abundante na Terra?', options: ['Ferro','Alumínio','Silício','Cobre'], correct: 1 },
  { q: 'Em que século nasceu Leonardo da Vinci?', options: ['XIII','XIV','XV','XVI'], correct: 2 },
  { q: 'Qual o pH do sangue humano?', options: ['6.4','6.8','7.4','8.0'], correct: 2 },
  { q: 'Quem escreveu "Os Lusíadas"?', options: ['Fernando Pessoa','Eça de Queirós','Camões','Gil Vicente'], correct: 2 },
  { q: 'Qual o país com maior área do mundo?', options: ['China','EUA','Canadá','Rússia'], correct: 3 },
];

const ALL_POOLS = [POOL_1, POOL_2, POOL_3, POOL_4, POOL_5];
const LEVEL_NAMES = [
  { label: 'Nível 1', desc: 'Muito fácil' },
  { label: 'Nível 2', desc: 'Fácil' },
  { label: 'Nível 3', desc: 'Médio' },
  { label: 'Nível 4', desc: 'Difícil' },
  { label: 'Nível 5', desc: 'Expert' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuestionsGame() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [questions, setQuestions] = useState<Question[]>(() => shuffle(POOL_1).slice(0, 5));
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [idx, setIdx] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = questions[idx];

  const startLevel = (lvIdx: number) => {
    setLevelIdx(lvIdx);
    setQuestions(shuffle(ALL_POOLS[lvIdx]).slice(0, 5));
    setIdx(0);
    setSelected(null);
    setCorrect(0);
    setFinished(false);
    Speech.speak(`${LEVEL_NAMES[lvIdx].label}. ${LEVEL_NAMES[lvIdx].desc}. Vamos lá!`, { language: 'pt-BR' });
  };

  const choose = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const right = i === current.correct;
    if (right) {
      setCorrect((c) => c + 1);
      Speech.speak('Resposta correta! Muito bem!', { language: 'pt-BR' });
    } else {
      Speech.speak(`A resposta certa era: ${current.options[current.correct]}`, { language: 'pt-BR' });
    }
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      setFinished(true);
      const total = questions.length;
      Speech.speak(`Você acertou ${correct + (selected === current.correct ? 0 : 0)} de ${total} perguntas!`, { language: 'pt-BR' });
      return;
    }
    setIdx((p) => p + 1);
    setSelected(null);
  };

  const speakQ = () => Speech.speak(current.q, { language: 'pt-BR', rate: 0.9 });

  if (finished) {
    const total = questions.length;
    const pct = Math.round((correct / total) * 100);
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.levelsRow}>
          {LEVEL_NAMES.map((lv, i) => (
            <TouchableOpacity key={i} style={[styles.levelBtn, levelIdx === i && styles.levelBtnActive]} onPress={() => startLevel(i)}>
              <Text style={[styles.levelNum, levelIdx === i && { color: '#fff' }]}>{i + 1}</Text>
              <Text style={[styles.levelDesc, levelIdx === i && { color: '#fff' }]}>{lv.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.doneCard}>
          <Ionicons name="trophy" size={64} color={colors.secondary} />
          <Text style={styles.doneTitle}>Resultado!</Text>
          <Text style={styles.donePct}>{pct}%</Text>
          <Text style={styles.doneText}>{correct} de {total} acertos</Text>
          {pct >= 80 && levelIdx < LEVEL_NAMES.length - 1 && (
            <TouchableOpacity style={styles.nextLevelBtn} onPress={() => startLevel(levelIdx + 1)}>
              <Text style={styles.nextLevelText}>Próximo nível ▶</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.nextLevelBtn, { backgroundColor: colors.primary, marginTop: 8 }]} onPress={() => startLevel(levelIdx)}>
            <Text style={styles.nextLevelText}>Jogar de novo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Seletor de nível */}
      <View style={styles.levelsRow}>
        {LEVEL_NAMES.map((lv, i) => (
          <TouchableOpacity key={i} style={[styles.levelBtn, levelIdx === i && styles.levelBtnActive]} onPress={() => startLevel(i)}>
            <Text style={[styles.levelNum, levelIdx === i && { color: '#fff' }]}>{i + 1}</Text>
            <Text style={[styles.levelDesc, levelIdx === i && { color: '#fff' }]}>{lv.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressText}>Pergunta {idx + 1} de {questions.length}</Text>
        <Text style={styles.scoreText}>Acertos: {correct}</Text>
      </View>

      <View style={styles.qCard}>
        <Text style={styles.question}>{current.q}</Text>
        <TouchableOpacity style={styles.listenBtn} onPress={speakQ}>
          <Ionicons name="volume-high" size={24} color={colors.primary} />
          <Text style={styles.listenText}>Ouvir pergunta</Text>
        </TouchableOpacity>
      </View>

      {current.options.map((opt, i) => {
        const isSelected = selected === i;
        const isRight = selected !== null && i === current.correct;
        const isWrong = isSelected && i !== current.correct;
        return (
          <TouchableOpacity
            key={i}
            style={[styles.optionBtn, isRight && styles.optionRight, isWrong && styles.optionWrong]}
            onPress={() => choose(i)}
            disabled={selected !== null}
          >
            <View style={[styles.optionLetter, isRight && { backgroundColor: colors.success }, isWrong && { backgroundColor: colors.sos }]}>
              <Text style={styles.optionLetterText}>{String.fromCharCode(65 + i)}</Text>
            </View>
            <Text style={styles.optionText}>{opt}</Text>
            {isRight && <Ionicons name="checkmark-circle" size={32} color={colors.success} />}
            {isWrong && <Ionicons name="close-circle" size={32} color={colors.sos} />}
          </TouchableOpacity>
        );
      })}

      {selected !== null && (
        <TouchableOpacity style={styles.nextBtn} onPress={next}>
          <Text style={styles.nextText}>{idx + 1 >= questions.length ? 'Ver resultado' : 'Próxima'}</Text>
          <Ionicons name="arrow-forward" size={28} color="#fff" />
        </TouchableOpacity>
      )}
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
  progressCard: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: colors.surface, padding: spacing.md,
    borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, marginBottom: spacing.md,
  },
  progressText: { fontSize: fontSize.body, fontWeight: '800', color: colors.primary },
  scoreText: { fontSize: fontSize.body, fontWeight: '800', color: colors.secondary },
  qCard: {
    backgroundColor: colors.primaryLight, padding: spacing.lg, borderRadius: radius.lg,
    borderWidth: 2, borderColor: colors.primary, marginBottom: spacing.md,
  },
  question: { fontSize: fontSize.h3, fontWeight: '800', color: colors.textPrimary, lineHeight: 36 },
  listenBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: spacing.md,
    backgroundColor: '#fff', padding: spacing.sm, borderRadius: radius.md, alignSelf: 'flex-start',
  },
  listenText: { fontSize: fontSize.body, color: colors.primary, fontWeight: '700' },
  optionBtn: {
    backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.lg,
    borderWidth: 2, borderColor: colors.border, flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, marginBottom: spacing.sm, minHeight: 80, ...shadows.card,
  },
  optionRight: { borderColor: colors.success, backgroundColor: '#E9F5EF' },
  optionWrong: { borderColor: colors.sos, backgroundColor: colors.sosLight },
  optionLetter: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  optionLetterText: { color: '#fff', fontSize: fontSize.body, fontWeight: '900' },
  optionText: { flex: 1, fontSize: fontSize.bodyLarge, color: colors.textPrimary, fontWeight: '700' },
  nextBtn: {
    backgroundColor: colors.primary, height: 72, borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginTop: spacing.lg, ...shadows.card,
  },
  nextText: { color: '#fff', fontSize: fontSize.bodyLarge, fontWeight: '800' },
  doneCard: {
    backgroundColor: colors.secondaryLight, padding: spacing.xl, borderRadius: radius.lg,
    borderWidth: 2, borderColor: colors.secondary, alignItems: 'center', marginTop: spacing.lg,
  },
  doneTitle: { fontSize: fontSize.h2, fontWeight: '900', color: colors.secondary, marginTop: spacing.sm },
  donePct: { fontSize: 64, fontWeight: '900', color: colors.primary },
  doneText: { fontSize: fontSize.body, color: colors.textPrimary },
  nextLevelBtn: {
    marginTop: spacing.md, backgroundColor: colors.secondary,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: radius.md,
  },
  nextLevelText: { color: '#fff', fontSize: fontSize.body, fontWeight: '900' },
});
