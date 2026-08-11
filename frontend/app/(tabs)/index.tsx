import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { api } from '@/src/api';
import { colors, fontSize, radius, spacing, shadows } from '@/src/theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Bom dia', emoji: '☀️' };
  if (h < 18) return { text: 'Boa tarde', emoji: '🌤️' };
  return { text: 'Boa noite', emoji: '🌙' };
}

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function formatDateBR(iso: string) {
  const [y, m, day] = iso.split('-');
  return `${day}/${m}/${y}`;
}

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [meds, setMeds] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, m, a] = await Promise.all([
        api.getProfile(),
        api.listMedications(),
        api.listAppointments(),
      ]);
      setProfile(p);
      setMeds(m || []);
      setAppointments(a || []);
    } catch (e) {
      console.warn('load home', e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const g = greeting();
  const today = todayStr();
  const todayAppointments = appointments.filter((a) => a.date === today);

  const speakGreeting = () => {
    if (!profile) return;
    const phrase = `${g.text}, ${profile.called_as}. Hoje é ${formatDateBR(
      today
    )}. Você tem ${meds.length} ${
      meds.length === 1 ? 'remédio cadastrado' : 'remédios cadastrados'
    } e ${todayAppointments.length} ${
      todayAppointments.length === 1
        ? 'compromisso hoje'
        : 'compromissos hoje'
    }.`;
    Speech.speak(phrase, { language: 'pt-BR', rate: 0.95 });
  };

  const handleSOS = () => {
    if (!profile?.emergency_phone) {
      Alert.alert(
        'SOS',
        'Nenhum contato de emergência cadastrado. Adicione em Configurações.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Configurações',
            onPress: () => router.push('/settings'),
          },
        ]
      );
      return;
    }
    Alert.alert(
      '🚨 Emergência',
      `Ligar para ${profile.emergency_name || 'contato'}: ${profile.emergency_phone}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ligar agora',
          style: 'destructive',
          onPress: () => {
            Linking.openURL(`tel:${profile.emergency_phone.replace(/\D/g, '')}`);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with avatar and greeting */}
        <View style={styles.headerCard} testID="home-header">
          <View style={styles.avatarRow}>
            {profile?.photo_base64 ? (
              <Image
                source={{ uri: profile.photo_base64 }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={56} color={colors.primary} />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.greeting} testID="home-greeting">
                {g.text}, {g.emoji}
              </Text>
              <Text style={styles.name} numberOfLines={1}>
                {profile?.called_as || 'Visitante'} ❤️
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={styles.iconBtn}
              testID="btn-settings"
            >
              <Ionicons name="settings-outline" size={32} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.listenBtn}
            onPress={speakGreeting}
            testID="btn-listen-greeting"
          >
            <Ionicons name="volume-high" size={28} color={colors.primary} />
            <Text style={styles.listenBtnText}>Ouvir minha agenda</Text>
          </TouchableOpacity>
        </View>

        {/* Today's appointments */}
        <Text style={styles.sectionTitle}>Hoje, {formatDateBR(today)}</Text>
        {todayAppointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>
              Sem compromissos para hoje. Bom descanso!
            </Text>
          </View>
        ) : (
          todayAppointments.map((a) => (
            <View key={a.id} style={styles.itemCard} testID={`appointment-${a.id}`}>
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>{a.time}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.itemTitle}>{a.title}</Text>
                {a.location ? (
                  <Text style={styles.itemSubtitle}>📍 {a.location}</Text>
                ) : null}
              </View>
            </View>
          ))
        )}

        {/* Medications quick view */}
        <Text style={styles.sectionTitle}>Meus Remédios</Text>
        {meds.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyCard}
            onPress={() => router.push('/(tabs)/medications')}
            testID="empty-meds-cta"
          >
            <Ionicons name="medkit-outline" size={48} color={colors.secondary} />
            <Text style={styles.emptyText}>
              Nenhum remédio cadastrado. Toque aqui para adicionar.
            </Text>
          </TouchableOpacity>
        ) : (
          meds.slice(0, 3).map((m) => (
            <View key={m.id} style={styles.itemCard}>
              <View style={styles.pillBadge}>
                <Ionicons name="medkit" size={32} color={colors.secondary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.itemTitle}>{m.name}</Text>
                {m.dosage ? (
                  <Text style={styles.itemSubtitle}>{m.dosage}</Text>
                ) : null}
                {m.times && m.times.length > 0 ? (
                  <Text style={styles.itemSubtitle}>
                    ⏰ {m.times.join(' · ')}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        )}

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Atalhos</Text>
        <View style={styles.gridRow}>
          <TouchableOpacity
            style={styles.gridBtn}
            onPress={() => router.push('/(tabs)/medications')}
            testID="quick-medications"
          >
            <Ionicons name="medkit" size={44} color={colors.primary} />
            <Text style={styles.gridBtnText}>Remédios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.gridBtn}
            onPress={() => router.push('/appointment-add')}
            testID="quick-add-appointment"
          >
            <Ionicons name="calendar" size={44} color={colors.primary} />
            <Text style={styles.gridBtnText}>Compromisso</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.gridRow}>
          <TouchableOpacity
            style={styles.gridBtn}
            onPress={() => router.push('/(tabs)/games')}
            testID="quick-games"
          >
            <Ionicons name="happy" size={44} color={colors.primary} />
            <Text style={styles.gridBtnText}>Jogos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.gridBtn}
            onPress={() => router.push('/(tabs)/family')}
            testID="quick-family"
          >
            <Ionicons name="heart" size={44} color={colors.secondary} />
            <Text style={styles.gridBtnText}>Família</Text>
          </TouchableOpacity>
        </View>

        {/* SOS button */}
        <TouchableOpacity
          style={styles.sosBtn}
          onPress={handleSOS}
          testID="sos-emergency-button"
        >
          <Ionicons name="warning" size={36} color="#fff" />
          <Text style={styles.sosBtnText}>SOS — EMERGÊNCIA</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          “A tecnologia também pode ajudar a cuidar com carinho!”
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.card,
    marginBottom: spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.primaryLight,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: fontSize.bodyLarge,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  name: {
    fontSize: fontSize.h2,
    color: colors.primary,
    fontWeight: '800',
    marginTop: 2,
  },
  iconBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  listenBtn: {
    marginTop: spacing.md,
    height: 60,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  listenBtnText: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: fontSize.h3,
    fontWeight: '800',
    color: colors.textPrimary,
    marginVertical: spacing.md,
  },
  itemCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  timeBadge: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBadgeText: { color: '#fff', fontSize: fontSize.body, fontWeight: '800' },
  pillBadge: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: fontSize.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  itemSubtitle: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  gridBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    height: 120,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    gap: 6,
    ...shadows.card,
  },
  gridBtnText: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sosBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.sos,
    height: 84,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    ...shadows.big,
  },
  sosBtnText: { color: '#fff', fontSize: fontSize.h3, fontWeight: '900' },
  footer: {
    textAlign: 'center',
    fontSize: fontSize.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xl,
  },
});
