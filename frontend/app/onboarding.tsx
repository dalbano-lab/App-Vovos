import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Image, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/api';
import { colors, fontSize, radius, spacing, shadows } from '@/src/theme';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState('');
  const [calledAs, setCalledAs] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permissão necessária', 'Precisamos do acesso à galeria para escolher sua foto.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
      });
      if (!result.canceled && result.assets[0].base64) {
        setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível acessar a galeria.');
    }
  };

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permissão necessária', 'Precisamos do acesso à câmera.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
      });
      if (!result.canceled && result.assets[0].base64) {
        setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível acessar a câmera.');
    }
  };

  const finish = async () => {
    if (!fullName.trim() || !calledAs.trim()) {
      Alert.alert('Atenção', 'Preencha seu nome e como gostaria de ser chamado.');
      return;
    }
    setSaving(true);
    try {
      // Timeout de 8 segundos para não travar
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Servidor demorou demais. Verifique se o backend está rodando.')), 8000)
      );
      await Promise.race([
        api.saveProfile({
          full_name: fullName.trim(),
          called_as: calledAs.trim(),
          photo_base64: photo,
          emergency_name: emergencyName.trim() || undefined,
          emergency_phone: emergencyPhone.trim() || undefined,
        }),
        timeoutPromise,
      ]);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert(
        'Erro ao salvar',
        e.message || 'Não foi possível salvar. Verifique se o backend está rodando.',
        [
          { text: 'Tentar novamente', onPress: finish },
          {
            text: 'Continuar sem salvar',
            onPress: () => router.replace('/(tabs)'),
            style: 'cancel',
          },
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <Text style={styles.welcome}>Bem-vindo ao{'\n'}DoctorVovô ❤️</Text>
            <Text style={styles.subtitle}>A tecnologia também pode ajudar a cuidar com carinho!</Text>
          </View>

          {/* PASSO 1 — Nome */}
          {step === 0 && (
            <View style={styles.card}>
              <Text style={styles.stepLabel}>Passo 1 de 3</Text>
              <Text style={styles.question}>Qual é o seu nome?</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Antônio Silva"
                placeholderTextColor={colors.textSecondary}
                value={fullName}
                onChangeText={setFullName}
              />
              <Text style={[styles.question, { marginTop: spacing.lg }]}>
                Como gostaria de ser chamado?
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Seu Antônio, Vovó Maria"
                placeholderTextColor={colors.textSecondary}
                value={calledAs}
                onChangeText={setCalledAs}
              />
              <TouchableOpacity
                style={[styles.primaryBtn, (!fullName.trim() || !calledAs.trim()) && styles.btnDisabled]}
                onPress={() => setStep(1)}
                disabled={!fullName.trim() || !calledAs.trim()}
              >
                <Text style={styles.primaryBtnText}>Continuar</Text>
                <Ionicons name="arrow-forward" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* PASSO 2 — Foto */}
          {step === 1 && (
            <View style={styles.card}>
              <Text style={styles.stepLabel}>Passo 2 de 3</Text>
              <Text style={styles.question}>Coloque sua foto ✨</Text>
              <Text style={styles.helper}>Opcional — sua foto aparece na tela inicial.</Text>

              <View style={styles.avatarWrap}>
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={80} color={colors.textSecondary} />
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.secondaryBtn} onPress={takePhoto}>
                <Ionicons name="camera" size={28} color={colors.primary} />
                <Text style={styles.secondaryBtnText}>Tirar foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
                <Ionicons name="images" size={28} color={colors.primary} />
                <Text style={styles.secondaryBtnText}>Escolher da galeria</Text>
              </TouchableOpacity>

              <View style={styles.row}>
                <TouchableOpacity style={[styles.outlineBtn, { flex: 1 }]} onPress={() => setStep(0)}>
                  <Ionicons name="arrow-back" size={26} color={colors.textPrimary} />
                  <Text style={styles.outlineBtnText}>Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={() => setStep(2)}>
                  <Text style={styles.primaryBtnText}>Continuar</Text>
                  <Ionicons name="arrow-forward" size={26} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* PASSO 3 — Emergência */}
          {step === 2 && (
            <View style={styles.card}>
              <Text style={styles.stepLabel}>Passo 3 de 3</Text>
              <Text style={styles.question}>Contato de emergência</Text>
              <Text style={styles.helper}>
                Opcional — pessoa para ligar no botão SOS.{'\n'}
                Pode pular e adicionar depois nas configurações.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Nome (ex: Filha Ana)"
                placeholderTextColor={colors.textSecondary}
                value={emergencyName}
                onChangeText={setEmergencyName}
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                placeholder="Telefone (ex: 11 99999-9999)"
                placeholderTextColor={colors.textSecondary}
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
                keyboardType="phone-pad"
                returnKeyType="done"
                onSubmitEditing={finish}
              />

              <View style={styles.row}>
                <TouchableOpacity style={[styles.outlineBtn, { flex: 1 }]} onPress={() => setStep(1)}>
                  <Ionicons name="arrow-back" size={26} color={colors.textPrimary} />
                  <Text style={styles.outlineBtnText}>Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1 }]}
                  onPress={finish}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="large" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Pronto!</Text>
                      <Ionicons name="checkmark" size={28} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Botão pular */}
              <TouchableOpacity style={styles.skipBtn} onPress={finish} disabled={saving}>
                <Text style={styles.skipText}>Pular e entrar sem contato de emergência</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginVertical: spacing.lg, alignItems: 'center' },
  welcome: { fontSize: fontSize.h1, fontWeight: '800', color: colors.primary, textAlign: 'center', lineHeight: 48 },
  subtitle: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center', fontStyle: 'italic' },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 2, borderColor: colors.border, ...shadows.card },
  stepLabel: { fontSize: fontSize.label, color: colors.secondary, fontWeight: '700', marginBottom: spacing.sm, textTransform: 'uppercase' },
  question: { fontSize: fontSize.h3, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  helper: { fontSize: fontSize.body, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 24 },
  input: {
    height: 68, borderWidth: 2, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, fontSize: fontSize.bodyLarge, color: colors.textPrimary,
    backgroundColor: '#fff', marginBottom: spacing.md,
  },
  primaryBtn: {
    backgroundColor: colors.primary, height: 68, borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: spacing.md,
  },
  primaryBtnText: { color: '#fff', fontSize: fontSize.bodyLarge, fontWeight: '800' },
  secondaryBtn: {
    backgroundColor: colors.primaryLight, height: 64, borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: spacing.sm,
  },
  secondaryBtnText: { color: colors.primary, fontSize: fontSize.body, fontWeight: '700' },
  outlineBtn: {
    backgroundColor: colors.surfaceSecondary, height: 68, borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderColor: colors.border, marginTop: spacing.md,
  },
  outlineBtnText: { color: colors.textPrimary, fontSize: fontSize.body, fontWeight: '700' },
  row: { flexDirection: 'row', gap: spacing.md },
  btnDisabled: { opacity: 0.4 },
  avatarWrap: { alignItems: 'center', marginBottom: spacing.md },
  avatarImage: { width: 180, height: 180, borderRadius: 90, borderWidth: 4, borderColor: colors.primaryLight },
  avatarPlaceholder: {
    width: 180, height: 180, borderRadius: 90, backgroundColor: colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border,
  },
  skipBtn: { marginTop: spacing.md, padding: spacing.sm, alignItems: 'center' },
  skipText: { color: colors.textSecondary, fontSize: fontSize.body, textDecorationLine: 'underline' },
});
