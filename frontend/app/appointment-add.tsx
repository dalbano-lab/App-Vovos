import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/api';
import { colors, fontSize, radius, spacing, shadows } from '@/src/theme';

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AppointmentAdd() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(toISO(new Date()));
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Atenção', 'Informe o título do compromisso.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Data inválida', 'Use o formato AAAA-MM-DD');
      return;
    }
    if (!/^\d{1,2}:\d{2}$/.test(time)) {
      Alert.alert('Hora inválida', 'Use o formato HH:MM');
      return;
    }
    setSaving(true);
    try {
      await api.addAppointment({
        title: title.trim(),
        date,
        time,
        location: location.trim() || null,
        notes: notes.trim() || null,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSaving(false);
    }
  };

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
        <Text style={styles.title}>Novo Compromisso</Text>
        <View style={{ width: 56 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Consulta cardiologista"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            testID="input-apt-title"
          />

          <Text style={styles.label}>Data (AAAA-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="2026-02-15"
            placeholderTextColor={colors.textSecondary}
            value={date}
            onChangeText={setDate}
            testID="input-apt-date"
          />

          <Text style={styles.label}>Hora (HH:MM)</Text>
          <TextInput
            style={styles.input}
            placeholder="14:00"
            placeholderTextColor={colors.textSecondary}
            value={time}
            onChangeText={setTime}
            testID="input-apt-time"
          />

          <Text style={styles.label}>Local (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Hospital São Lucas"
            placeholderTextColor={colors.textSecondary}
            value={location}
            onChangeText={setLocation}
            testID="input-apt-location"
          />

          <Text style={styles.label}>Anotações (opcional)</Text>
          <TextInput
            style={[styles.input, { height: 110, textAlignVertical: 'top' }]}
            placeholder="Ex: Levar exames antigos"
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            testID="input-apt-notes"
          />

          <TouchableOpacity
            style={[styles.primaryBtn, saving && { opacity: 0.5 }]}
            onPress={save}
            disabled={saving}
            testID="btn-save-appointment"
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={28} color="#fff" />
                <Text style={styles.primaryBtnText}>Salvar compromisso</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  title: { fontSize: fontSize.h2, fontWeight: '800', color: colors.primary },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  label: {
    fontSize: fontSize.body,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    height: 64,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.bodyLarge,
    color: colors.textPrimary,
    backgroundColor: '#fff',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    height: 72,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: spacing.xl,
    ...shadows.card,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: fontSize.bodyLarge,
    fontWeight: '800',
  },
});
