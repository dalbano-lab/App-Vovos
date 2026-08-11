import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { api } from '@/src/api';
import { colors, fontSize, radius, spacing, shadows } from '@/src/theme';

export default function Medications() {
  const router = useRouter();
  const [meds, setMeds] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await api.listMedications();
      setMeds(list || []);
    } catch (e) {
      console.warn(e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onDelete = (id: string, name: string) => {
    Alert.alert('Remover remédio', `Tem certeza que deseja remover ${name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await api.deleteMedication(id);
          load();
        },
      },
    ]);
  };

  const speak = (m: any) => {
    const phrase = `${m.name}. ${m.dosage || ''}. ${m.instructions || ''}. ${
      m.times?.length ? 'Horários: ' + m.times.join(', ') : ''
    }`;
    Speech.speak(phrase, { language: 'pt-BR', rate: 0.95 });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Meus Remédios</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/medication-add')}
          testID="btn-add-medication"
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        {meds.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="medkit-outline" size={72} color={colors.secondary} />
            <Text style={styles.emptyTitle}>Nenhum remédio ainda</Text>
            <Text style={styles.emptyText}>
              Toque em + acima ou no botão abaixo para cadastrar o primeiro
              remédio.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push('/medication-add')}
              testID="btn-add-first-medication"
            >
              <Ionicons name="camera" size={28} color="#fff" />
              <Text style={styles.primaryBtnText}>Cadastrar com foto</Text>
            </TouchableOpacity>
          </View>
        ) : (
          meds.map((m) => (
            <View key={m.id} style={styles.card} testID={`med-${m.id}`}>
              <View style={styles.cardRow}>
                {m.photo_base64 ? (
                  <Image
                    source={{ uri: m.photo_base64 }}
                    style={styles.medImage}
                  />
                ) : (
                  <View style={styles.medImageFallback}>
                    <Ionicons
                      name="medkit"
                      size={44}
                      color={colors.secondary}
                    />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.medName}>{m.name}</Text>
                  {m.dosage ? (
                    <Text style={styles.medMeta}>{m.dosage}</Text>
                  ) : null}
                  {m.instructions ? (
                    <Text style={styles.medMeta}>{m.instructions}</Text>
                  ) : null}
                  {m.times?.length > 0 ? (
                    <Text style={styles.medTimes}>
                      ⏰ {m.times.join(' · ')}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => speak(m)}
                  testID={`btn-listen-med-${m.id}`}
                >
                  <Ionicons
                    name="volume-high"
                    size={26}
                    color={colors.primary}
                  />
                  <Text style={styles.actionText}>Ouvir</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionDanger]}
                  onPress={() => onDelete(m.id, m.name)}
                  testID={`btn-delete-med-${m.id}`}
                >
                  <Ionicons name="trash" size={26} color={colors.sos} />
                  <Text style={[styles.actionText, { color: colors.sos }]}>
                    Remover
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  title: {
    fontSize: fontSize.h2,
    fontWeight: '800',
    color: colors.primary,
  },
  addBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  list: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardRow: { flexDirection: 'row' },
  medImage: { width: 96, height: 96, borderRadius: radius.md },
  medImageFallback: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: {
    fontSize: fontSize.h3,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  medMeta: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  medTimes: {
    fontSize: fontSize.body,
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionDanger: { backgroundColor: colors.sosLight },
  actionText: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.h3,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    height: 68,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: spacing.lg,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: fontSize.bodyLarge,
    fontWeight: '800',
  },
});
