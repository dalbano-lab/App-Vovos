import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/api';
import { colors, fontSize, radius, spacing, shadows } from '@/src/theme';

export default function Settings() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [called, setCalled] = useState('');
  const [emName, setEmName] = useState('');
  const [emPhone, setEmPhone] = useState('');

  useEffect(() => {
    (async () => {
      const p = await api.getProfile();
      if (p) {
        setProfile(p);
        setName(p.full_name || '');
        setCalled(p.called_as || '');
        setEmName(p.emergency_name || '');
        setEmPhone(p.emergency_phone || '');
      }
    })();
  }, []);

  const save = async () => {
    try {
      await api.saveProfile({
        full_name: name.trim(),
        called_as: called.trim(),
        photo_base64: profile?.photo_base64 || null,
        emergency_name: emName.trim() || null,
        emergency_phone: emPhone.trim() || null,
      });
      Alert.alert('✅ Pronto', 'Suas informações foram salvas.');
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  };

  const resetAll = () => {
    Alert.alert(
      'Apagar tudo?',
      'Isso vai remover seu perfil, remédios, compromissos e recados. Tem certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar tudo',
          style: 'destructive',
          onPress: async () => {
            await api.resetAll();
            router.replace('/onboarding');
          },
        },
      ]
    );
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
        <Text style={styles.title}>Configurações</Text>
        <View style={{ width: 56 }} />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.section}>Meu Perfil</Text>
          <Text style={styles.label}>Nome completo</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            testID="input-name"
          />
          <Text style={styles.label}>Como gostaria de ser chamado</Text>
          <TextInput
            style={styles.input}
            value={called}
            onChangeText={setCalled}
            testID="input-called"
          />

          <Text style={[styles.section, { marginTop: spacing.xl }]}>
            Contato de Emergência (SOS)
          </Text>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={emName}
            onChangeText={setEmName}
            testID="input-em-name"
          />
          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            value={emPhone}
            onChangeText={setEmPhone}
            keyboardType="phone-pad"
            testID="input-em-phone"
          />

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={save}
            testID="btn-save-settings"
          >
            <Ionicons name="checkmark" size={28} color="#fff" />
            <Text style={styles.primaryBtnText}>Salvar alterações</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={resetAll}
            testID="btn-reset-all"
          >
            <Ionicons name="trash" size={24} color={colors.sos} />
            <Text style={styles.dangerText}>Apagar todos os dados</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            DoctorVovô · A tecnologia também pode ajudar a cuidar com carinho!
          </Text>
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
  section: {
    fontSize: fontSize.h3,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: '700',
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
  dangerBtn: {
    backgroundColor: colors.sosLight,
    height: 64,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: spacing.lg,
    borderWidth: 2,
    borderColor: colors.sos,
  },
  dangerText: { color: colors.sos, fontSize: fontSize.body, fontWeight: '800' },
  footerText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: fontSize.body,
    marginTop: spacing.xl,
    fontStyle: 'italic',
  },
});
