import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { api } from '@/src/api';
import { colors, fontSize, radius, spacing, shadows } from '@/src/theme';

export default function Family() {
  const [messages, setMessages] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sender, setSender] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await api.listFamilyMessages();
      setMessages(list || []);
    } catch (e) {
      console.warn(e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const send = async () => {
    if (!sender.trim() || !text.trim()) {
      Alert.alert('Atenção', 'Preencha o nome e a mensagem.');
      return;
    }
    setSaving(true);
    try {
      await api.addFamilyMessage({
        sender_name: sender.trim(),
        text: text.trim(),
      });
      setText('');
      load();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSaving(false);
    }
  };

  const speak = (m: any) => {
    Speech.speak(`Mensagem de ${m.sender_name}: ${m.text}`, {
      language: 'pt-BR',
      rate: 0.95,
    });
  };

  const remove = (id: string) => {
    Alert.alert('Remover mensagem', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await api.deleteFamilyMessage(id);
          load();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
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
          <Text style={styles.title}>Área da Família ❤️</Text>
          <Text style={styles.subtitle}>
            Recados carinhosos da família para o seu dia.
          </Text>

          <View style={styles.composer}>
            <Text style={styles.label}>Quem está enviando?</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Filha Ana"
              placeholderTextColor={colors.textSecondary}
              value={sender}
              onChangeText={setSender}
              testID="input-sender"
            />
            <Text style={styles.label}>Mensagem</Text>
            <TextInput
              style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
              placeholder="Escreva um recado de carinho..."
              placeholderTextColor={colors.textSecondary}
              value={text}
              onChangeText={setText}
              multiline
              testID="input-message"
            />
            <TouchableOpacity
              style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
              onPress={send}
              disabled={saving}
              testID="btn-send-message"
            >
              <Ionicons name="send" size={26} color="#fff" />
              <Text style={styles.primaryBtnText}>Enviar recado</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Recados recebidos</Text>
          {messages.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="heart-outline"
                size={64}
                color={colors.secondary}
              />
              <Text style={styles.emptyText}>
                Ainda não há recados. Use o formulário acima para deixar o
                primeiro!
              </Text>
            </View>
          ) : (
            messages.map((m) => (
              <View key={m.id} style={styles.msgCard} testID={`msg-${m.id}`}>
                <View style={styles.msgHeader}>
                  <View style={styles.senderBadge}>
                    <Ionicons name="heart" size={20} color="#fff" />
                  </View>
                  <Text style={styles.senderName}>{m.sender_name}</Text>
                </View>
                <Text style={styles.msgText}>{m.text}</Text>
                <View style={styles.msgActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => speak(m)}
                    testID={`btn-listen-msg-${m.id}`}
                  >
                    <Ionicons
                      name="volume-high"
                      size={22}
                      color={colors.primary}
                    />
                    <Text style={styles.actionText}>Ouvir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.sosLight }]}
                    onPress={() => remove(m.id)}
                    testID={`btn-delete-msg-${m.id}`}
                  >
                    <Ionicons name="trash" size={22} color={colors.sos} />
                    <Text style={[styles.actionText, { color: colors.sos }]}>
                      Remover
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    fontSize: fontSize.h2,
    fontWeight: '800',
    color: colors.secondary,
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    marginTop: 4,
  },
  composer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.card,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.body,
    color: colors.textPrimary,
    backgroundColor: '#fff',
    minHeight: 60,
  },
  primaryBtn: {
    backgroundColor: colors.secondary,
    height: 68,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: spacing.md,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: fontSize.bodyLarge,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: fontSize.h3,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  emptyCard: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.xl,
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
  msgCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  msgHeader: { flexDirection: 'row', alignItems: 'center' },
  senderBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  senderName: {
    fontSize: fontSize.body,
    fontWeight: '800',
    color: colors.secondary,
  },
  msgText: {
    fontSize: fontSize.bodyLarge,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    lineHeight: 34,
  },
  msgActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.primary,
  },
});
