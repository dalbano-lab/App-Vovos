import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing, shadows } from '@/src/theme';

const games = [
  {
    id: 'memory',
    title: 'Jogo da Memória',
    description: 'Encontre os pares de figuras iguais.',
    icon: 'grid' as const,
    color: '#2D5A4C',
  },
  {
    id: 'sequence',
    title: 'Sequência Lógica',
    description: 'Memorize e repita a sequência de cores.',
    icon: 'apps' as const,
    color: '#C25433',
  },
  {
    id: 'questions',
    title: 'Perguntas Simples',
    description: 'Responda perguntas do dia a dia.',
    icon: 'help-circle' as const,
    color: '#3A7D52',
  },
];

export default function Games() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Jogos para a Mente 🧠</Text>
        <Text style={styles.subtitle}>
          Pequenos desafios para manter a memória e a atenção em dia.
        </Text>

        {games.map((g) => (
          <TouchableOpacity
            key={g.id}
            style={styles.card}
            onPress={() => router.push(`/game/${g.id}` as any)}
            testID={`game-card-${g.id}`}
          >
            <View style={[styles.iconWrap, { backgroundColor: g.color }]}>
              <Ionicons name={g.icon} size={48} color="#fff" />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.cardTitle}>{g.title}</Text>
              <Text style={styles.cardDesc}>{g.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={36} color={colors.primary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    fontSize: fontSize.h2,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: fontSize.h3,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cardDesc: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
