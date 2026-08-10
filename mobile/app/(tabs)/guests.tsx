import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockGuests, GuestRequest } from '../../src/data/mockData';
import { PageHeader } from '../../src/components/PageHeader';
import { colors, spacing, borderRadius, shadows } from '../../src/theme';

export default function GuestsScreen() {
  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [guests, setGuests] = useState<GuestRequest[]>(mockGuests);

  const pending = guests.filter((g) => g.status === 'pending');
  const history = guests.filter((g) => g.status !== 'pending');

  const updateStatus = (id: string, status: 'approved' | 'denied') => {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, status } : g)));
  };

  return (
    <View style={styles.root}>
      <PageHeader title="Guest Approvals">
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'pending' && styles.tabActive]}
            onPress={() => setTab('pending')}
          >
            <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>
              Pending ({pending.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'history' && styles.tabActive]}
            onPress={() => setTab('history')}
          >
            <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
              Entry Records
            </Text>
          </Pressable>
        </View>
      </PageHeader>

      <View style={styles.preApprove}>
        <Pressable
          style={styles.preApproveBtn}
          onPress={() =>
            Alert.alert('Pre-approve Guest', 'QR / OTP pre-approval UI will connect in a later phase.')
          }
        >
          <Ionicons name="qr-code" size={20} color={colors.white} />
          <Text style={styles.preApproveText}>Pre-approve Guest</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {tab === 'pending' ? (
          pending.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="shield-checkmark" size={32} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyText}>No pending approvals</Text>
            </View>
          ) : (
            pending.map((guest) => (
              <View key={guest.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.guestName}>{guest.name}</Text>
                    <Text style={styles.guestTime}>
                      <Ionicons name="time-outline" size={12} /> {guest.time}
                    </Text>
                  </View>
                  <View style={styles.waitingBadge}>
                    <Text style={styles.waitingText}>WAITING</Text>
                  </View>
                </View>
                <View style={styles.metaBox}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Purpose</Text>
                    <Text style={styles.metaValue}>{guest.purpose}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Phone</Text>
                    <Text style={styles.metaValue}>{guest.phone}</Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.actionBtn, styles.allowBtn]}
                    onPress={() => updateStatus(guest.id, 'approved')}
                  >
                    <Ionicons name="checkmark" size={16} color={colors.success} />
                    <Text style={[styles.actionText, { color: colors.success }]}>Allow</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.denyBtn]}
                    onPress={() => updateStatus(guest.id, 'denied')}
                  >
                    <Ionicons name="close" size={16} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Deny</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )
        ) : (
          history.map((guest) => (
            <View key={guest.id} style={[styles.historyCard, { opacity: 0.85 }]}>
              <View>
                <Text style={styles.historyName}>{guest.name}</Text>
                <Text style={styles.historyMeta}>
                  {guest.time} • {guest.purpose}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  guest.status === 'approved'
                    ? { backgroundColor: colors.successLight }
                    : { backgroundColor: colors.errorLight },
                ]}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    color: guest.status === 'approved' ? colors.success : colors.error,
                  }}
                >
                  {guest.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.slate100,
    borderRadius: borderRadius.md,
    padding: 4,
    marginTop: spacing.md,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.white, ...shadows.sm },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.text },
  preApprove: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  preApproveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.slate800,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
  },
  preApproveText: { color: colors.white, fontWeight: '600', fontSize: 15 },
  list: { padding: spacing.md, paddingBottom: 120, gap: spacing.md },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyText: { color: colors.textSecondary, fontWeight: '500' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    ...shadows.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  guestName: { fontSize: 18, fontWeight: '700', color: colors.text },
  guestTime: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  waitingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  waitingText: { fontSize: 10, fontWeight: '700', color: '#B45309', letterSpacing: 0.5 },
  metaBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: 6,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { fontSize: 13, color: colors.textSecondary },
  metaValue: { fontSize: 13, fontWeight: '500', color: colors.slate800 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  allowBtn: { backgroundColor: colors.successLight, borderColor: '#A7F3D0' },
  denyBtn: { backgroundColor: colors.errorLight, borderColor: '#FECDD3' },
  actionText: { fontWeight: '600', fontSize: 14 },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.sm,
  },
  historyName: { fontWeight: '700', color: colors.text },
  historyMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
});
