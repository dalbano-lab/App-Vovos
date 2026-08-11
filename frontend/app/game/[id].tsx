import { useLocalSearchParams, useRouter } from 'expo-router';
import MemoryGame from '@/src/games/MemoryGame';
import SequenceGame from '@/src/games/SequenceGame';
import QuestionsGame from '@/src/games/QuestionsGame';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '@/src/theme';

const titles: Record<string, string> = {
  memory: 'Jogo da Memória',
  sequence: 'Sequência Lógica',
  questions: 'Perguntas Simples',
};

export default function GameRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const gameId = String(id || '');
  const title = titles[gameId] || 'Jogo';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          testID="btn-back"
        >
          <Ionicons name="arrow-back" size={32} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 56 }} />
      </View>
      {gameId === 'memory' && <MemoryGame />}
      {gameId === 'sequence' && <SequenceGame />}
      {gameId === 'questions' && <QuestionsGame />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: fontSize.h3, fontWeight: '800', color: colors.primary },
});
