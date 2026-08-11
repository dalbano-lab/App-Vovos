import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/api';
import { colors, fontSize, radius, spacing, shadows } from '@/src/theme';

export default function MedicationAdd() {
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoB64, setPhotoB64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [times, setTimes] = useState<string[]>([]);
  const [newTime, setNewTime] = useState('');

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Acesso à câmera negado.');
      return;
    }
    const r = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (!r.canceled && r.assets[0].base64) {
      setPhoto(`data:image/jpeg;base64,${r.assets[0].base64}`);
      setPhotoB64(r.assets[0].base64);
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Acesso à galeria negado.');
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (!r.canceled && r.assets[0].base64) {
      setPhoto(`data:image/jpeg;base64,${r.assets[0].base64}`);
      setPhotoB64(r.assets[0].base64);
    }
  };

  const analyze = async () => {
    if (!photoB64) {
      Alert.alert('Atenção', 'Tire ou escolha uma foto do medicamento primeiro.');
      return;
    }
    setAnalyzing(true);
    setAiResult(null);
    try {
      const data = await api.identifyMedication(photoB64);
      setAiResult(data);
      if (data.name && data.name !== 'Desconhecido') setName(data.name);
      if (data.dosage) setDosage(data.dosage);
      if (data.instructions) setInstructions(data.instructions);
      if (Array.isArray(data.suggested_times)) setTimes(data.suggested_times);
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Não foi possível identificar.');
    } finally {
      setAnalyzing(false);
    }
  };

  const addTime = () => {
    const t = newTime.trim();
    if (!/^\d{1,2}:\d{2}$/.test(t)) {
      Alert.alert('Formato inválido', 'Use o formato HH:MM, ex: 08:00');
      return;
    }
    setTimes((prev) => [...prev, t]);
    setNewTime('');
  };

  const removeTime = (idx: number) => {
    setTimes((prev) => prev.filter((_, i) => i !== idx));
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Informe o nome do medicamento.');
      return;
    }
    setSaving(true);
    try {
      await api.addMedication({
        name: name.trim(),
        dosage: dosage.trim() || null,
        instructions: instructions.trim() || null,
        times,
        photo_base64: photo,
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
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          testID="btn-back"
        >
          <Ionicons name="arrow-back" size={32} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Novo Remédio</Text>
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
          <View style={styles.photoCard}>
            {photo ? (
              <Image
                source={{ uri: photo }}
                style={styles.photo}
                testID="med-photo"
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={64} color={colors.textSecondary} />
                <Text style={styles.placeholderText}>
                  Tire uma foto do remédio
                </Text>
              </View>
            )}
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={pickFromCamera}
                testID="btn-camera"
              >
                <Ionicons name="camera" size={26} color={colors.primary} />
                <Text style={styles.secondaryText}>Câmera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={pickFromGallery}
                testID="btn-gallery"
              >
                <Ionicons name="images" size={26} color={colors.primary} />
                <Text style={styles.secondaryText}>Galeria</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.aiBtn, (!photoB64 || analyzing) && { opacity: 0.5 }]}
              onPress={analyze}
              disabled={!photoB64 || analyzing}
              testID="btn-ai-identify"
            >
              {analyzing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={26} color="#fff" />
                  <Text style={styles.aiBtnText}>
                    Identificar com Inteligência Artificial
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {aiResult && (
              <View style={styles.aiResult} testID="ai-result">
                <Text style={styles.aiResultTitle}>
                  ✨ Sugestão da IA (confiança: {aiResult.confidence})
                </Text>
                <Text style={styles.aiResultText}>
                  Confira e edite os campos abaixo se necessário.
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.label}>Nome do remédio</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Losartana"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            testID="input-med-name"
          />

          <Text style={styles.label}>Dosagem</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 50mg, 1 comprimido"
            placeholderTextColor={colors.textSecondary}
            value={dosage}
            onChangeText={setDosage}
            testID="input-med-dosage"
          />

          <Text style={styles.label}>Instruções</Text>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            placeholder="Ex: Tomar após o café da manhã"
            placeholderTextColor={colors.textSecondary}
            value={instructions}
            onChangeText={setInstructions}
            multiline
            testID="input-med-instructions"
          />

          <Text style={styles.label}>Horários</Text>
          <View style={styles.timesContainer}>
            {times.map((t, i) => (
              <View key={`${t}-${i}`} style={styles.timeChip}>
                <Text style={styles.timeChipText}>⏰ {t}</Text>
                <TouchableOpacity
                  onPress={() => removeTime(i)}
                  testID={`btn-remove-time-${i}`}
                >
                  <Ionicons name="close-circle" size={26} color={colors.sos} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="HH:MM"
              placeholderTextColor={colors.textSecondary}
              value={newTime}
              onChangeText={setNewTime}
              testID="input-new-time"
            />
            <TouchableOpacity
              style={styles.addTimeBtn}
              onPress={addTime}
              testID="btn-add-time"
            >
              <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, saving && { opacity: 0.5 }]}
            onPress={save}
            disabled={saving}
            testID="btn-save-medication"
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={28} color="#fff" />
                <Text style={styles.primaryBtnText}>Salvar remédio</Text>
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
  title: {
    fontSize: fontSize.h2,
    fontWeight: '800',
    color: colors.primary,
  },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  photoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.card,
    marginBottom: spacing.lg,
  },
  photo: {
    width: '100%',
    height: 240,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  photoPlaceholder: {
    width: '100%',
    height: 240,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  placeholderText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  secondaryBtn: {
    flex: 1,
    height: 64,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryText: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: '700',
  },
  aiBtn: {
    backgroundColor: colors.secondary,
    height: 68,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: spacing.md,
  },
  aiBtnText: {
    color: '#fff',
    fontSize: fontSize.body,
    fontWeight: '800',
  },
  aiResult: {
    marginTop: spacing.md,
    backgroundColor: colors.secondaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  aiResultTitle: {
    fontSize: fontSize.body,
    fontWeight: '800',
    color: colors.secondary,
  },
  aiResultText: {
    fontSize: fontSize.body,
    color: colors.textPrimary,
    marginTop: 4,
  },
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
    marginBottom: spacing.sm,
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  timeChipText: {
    fontSize: fontSize.body,
    color: colors.primary,
    fontWeight: '700',
  },
  addTimeBtn: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: fontSize.bodyLarge,
    fontWeight: '800',
  },
});
