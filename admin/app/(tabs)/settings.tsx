import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
  Switch,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '../../src/components/PageHeader';
import { Button, Input } from '../../src/components/ui';
import {
  fetchPlatformSettings,
  updatePlatformSettings,
} from '../../src/services/platform.service';
import { colors, spacing, borderRadius, shadows, typography } from '../../src/theme';
import type { PlatformSettings, TrialDayOption } from '../../src/types';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [options, setOptions] = useState<TrialDayOption[]>([]);
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2400);
  };

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setError(null);
    try {
      const data = await fetchPlatformSettings();
      setSettings(data.settings);
      setOptions(data.trialDayOptions);
      setWhatsapp(data.settings.supportWhatsApp || '');
      setError(null);
    } catch (err) {
      if (!opts?.silent) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const persist = async (patch: {
    freeTrialEnabled?: boolean;
    freeTrialDays?: number;
    supportWhatsApp?: string;
  }) => {
    setSaving(true);
    setError(null);
    try {
      const next = await updatePlatformSettings(patch);
      setSettings(next);
      if (patch.supportWhatsApp !== undefined) setWhatsapp(next.supportWhatsApp);
      showToast('Settings saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  const openWhatsAppPreview = () => {
    const digits = whatsapp.replace(/[^\d]/g, '');
    if (!digits) return;
    void Linking.openURL(`https://wa.me/${digits}`);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <PageHeader title="Settings" subtitle="Free trial & support" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load({ silent: true });
              }}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="gift-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Free trial</Text>
            <Text style={styles.heroBody}>
              Control whether new buildings can unlock the resident app for a limited time.
              Changing the length only affects buildings that claim the trial after you save.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.rowText}>
                <Text style={styles.cardTitle}>Offer free trial</Text>
                <Text style={styles.cardHint}>
                  When off, locked buildings only see Contact Support.
                </Text>
              </View>
              <Switch
                value={Boolean(settings?.freeTrialEnabled)}
                onValueChange={(value) => void persist({ freeTrialEnabled: value })}
                disabled={saving}
                trackColor={{ false: colors.slate200, true: colors.primaryMuted }}
                thumbColor={settings?.freeTrialEnabled ? colors.primary : colors.textMuted}
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>Trial length</Text>
          <Text style={styles.sectionHint}>
            Shown to building admins when they claim. Already-claimed trials keep their original
            days.
          </Text>
          <View style={styles.chipGrid}>
            {options.map((opt) => {
              const selected = settings?.freeTrialDays === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    if (!selected) void persist({ freeTrialDays: opt.value });
                  }}
                  style={[styles.chip, selected && styles.chipSelected]}
                  disabled={saving}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Support WhatsApp</Text>
          <Text style={styles.sectionHint}>
            Country code + number, no spaces. Used on the locked screen in the resident app.
          </Text>
          <View style={styles.card}>
            <Input
              label="WhatsApp number"
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="8801XXXXXXXXX"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
            <View style={styles.actions}>
              <Button
                title="Save number"
                onPress={() => void persist({ supportWhatsApp: whatsapp.trim() })}
                loading={saving}
                fullWidth
              />
              {whatsapp.replace(/[^\d]/g, '').length >= 8 ? (
                <Button
                  title="Preview chat"
                  variant="outline"
                  onPress={openWhatsAppPreview}
                  fullWidth
                />
              ) : null}
            </View>
          </View>

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={18} color={colors.sky} />
            <Text style={styles.noteText}>
              Activate individual buildings from the building detail screen after payment. That does
              not rewrite a running free trial clock.
            </Text>
          </View>
        </ScrollView>
      )}

      {toast ? (
        <View style={[styles.toast, { bottom: insets.bottom + 72 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.md },
  hero: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { ...typography.h2, color: colors.text },
  heroBody: { ...typography.body, color: colors.textSecondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 4 },
  cardTitle: { ...typography.h3, color: colors.text },
  cardHint: { ...typography.bodySmall, color: colors.textSecondary },
  sectionLabel: {
    ...typography.label,
    color: colors.text,
    marginTop: spacing.sm,
  },
  sectionHint: { ...typography.bodySmall, color: colors.textSecondary, marginTop: -8 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.slate200,
    minWidth: '47%',
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipText: { ...typography.label, color: colors.textSecondary, flex: 1 },
  chipTextSelected: { color: colors.primary },
  actions: { gap: spacing.sm },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: '#F0F9FF',
    alignItems: 'flex-start',
  },
  noteText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  errorBox: {
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  errorText: { ...typography.body, color: colors.error },
  toast: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.slate800,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  toastText: { color: colors.white, textAlign: 'center', fontWeight: '600' },
});
