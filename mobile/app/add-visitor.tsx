import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '../src/components/PageHeader';
import { Button, Input } from '../src/components/ui';
import { colors, spacing, borderRadius, shadows } from '../src/theme';
import { createGuestVisit, fetchGuests } from '../src/services/guests.service';
import { GuestHost } from '../src/types';

const FALLBACK_PURPOSES = ['Guest', 'Delivery', 'Family', 'Cab / Ride', 'Maintenance', 'Other'];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'R';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function AddVisitorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ buildingId?: string }>();
  const buildingId = Array.isArray(params.buildingId) ? params.buildingId[0] : params.buildingId;

  const [residents, setResidents] = useState<GuestHost[]>([]);
  const [purposes, setPurposes] = useState<string[]>(FALLBACK_PURPOSES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [residentId, setResidentId] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [purpose, setPurpose] = useState('Guest');
  const [customPurpose, setCustomPurpose] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchGuests(buildingId || undefined);
      setResidents(data.residents ?? []);
      setPurposes(data.purposes?.length ? data.purposes : FALLBACK_PURPOSES);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load residents');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const selected = residents.find((item) => item.id === residentId);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return residents;
    return residents.filter((item) => {
      const haystack = `${item.name} ${item.unitNumber ?? ''} ${item.phone ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, residents]);

  const handleSend = async () => {
    const name = visitorName.trim();
    const phone = visitorPhone.trim();
    const reason = purpose === 'Other' ? customPurpose.trim() : purpose;
    if (!residentId) {
      setFormError('Select the resident to notify.');
      return;
    }
    if (name.length < 2) {
      setFormError('Enter the visitor name.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 3) {
      setFormError('Enter a valid phone number.');
      return;
    }
    if (reason.length < 2) {
      setFormError('Enter the visit purpose.');
      return;
    }

    setCreating(true);
    setFormError(null);
    try {
      await createGuestVisit({
        name,
        phone,
        purpose: reason,
        residentId,
        buildingId: buildingId || undefined,
      });
      router.back();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to send request');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.root}>
      <PageHeader title="Add visitor" onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Resident</Text>
          <Text style={styles.sectionHint}>Search by name or unit, then tap a card.</Text>
          <Input
            placeholder="Search name or unit"
            value={query}
            onChangeText={(value) => {
              setQuery(value);
              setFormError(null);
            }}
            autoCorrect={false}
          />

          {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {!loading && !filtered.length ? (
            <Text style={styles.muted}>No residents match that search.</Text>
          ) : null}

          {filtered.map((resident) => {
            const active = resident.id === residentId;
            return (
              <Pressable
                key={resident.id}
                onPress={() => {
                  setResidentId(resident.id);
                  setFormError(null);
                }}
                style={[styles.residentCard, active && styles.residentCardActive]}
              >
                <View style={styles.residentAvatar}>
                  <Text style={styles.residentInitial}>{initials(resident.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.residentName}>{resident.name}</Text>
                  <Text style={styles.residentMeta}>
                    {resident.unitNumber ? `Apt ${resident.unitNumber}` : 'No unit listed'}
                  </Text>
                  {resident.phone ? (
                    <Text style={styles.residentPhone}>{resident.phone}</Text>
                  ) : null}
                </View>
                {active ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={colors.slate200} />
                )}
              </Pressable>
            );
          })}

          {selected ? (
            <View style={styles.formBlock}>
              <Text style={styles.sectionTitle}>Visitor details</Text>
              <Text style={styles.sectionHint}>
                Request will be sent to {selected.name}
                {selected.unitNumber ? ` · Apt ${selected.unitNumber}` : ''}.
              </Text>
              <Input
                label="Visitor name"
                value={visitorName}
                onChangeText={setVisitorName}
                placeholder="Full name"
              />
              <Input
                label="Phone number"
                value={visitorPhone}
                onChangeText={setVisitorPhone}
                placeholder="01XXXXXXXXX"
                keyboardType="phone-pad"
              />
              <Text style={styles.fieldLabel}>Purpose</Text>
              <View style={styles.purposeRow}>
                {purposes.map((item) => {
                  const active = purpose === item;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => setPurpose(item)}
                      style={[styles.purposeChip, active && styles.purposeChipActive]}
                    >
                      <Text style={[styles.purposeText, active && styles.purposeTextActive]}>{item}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {purpose === 'Other' ? (
                <Input
                  value={customPurpose}
                  onChangeText={setCustomPurpose}
                  placeholder="Describe the purpose"
                />
              ) : null}
              {formError ? <Text style={styles.error}>{formError}</Text> : null}
              <Button title="Send request" loading={creating} onPress={() => void handleSend()} />
            </View>
          ) : (
            <Text style={styles.muted}>Select a resident to continue.</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  sectionHint: { fontSize: 13, color: colors.textSecondary, marginTop: -8 },
  residentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  residentCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  residentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  residentInitial: { fontWeight: '800', color: colors.primary, fontSize: 16 },
  residentName: { fontWeight: '700', fontSize: 16, color: colors.text },
  residentMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  residentPhone: { fontSize: 12, fontWeight: '600', color: colors.text, marginTop: 4 },
  formBlock: { gap: spacing.md, marginTop: spacing.sm },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  purposeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  purposeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.slate100,
  },
  purposeChipActive: { backgroundColor: colors.primary },
  purposeText: { fontWeight: '600', fontSize: 13, color: colors.text },
  purposeTextActive: { color: colors.white },
  error: { color: colors.error, fontSize: 13, textAlign: 'center' },
  muted: { color: colors.textSecondary, textAlign: 'center', paddingVertical: 8 },
});
