import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Modal,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '../../src/components/PageHeader';
import { Button, Input } from '../../src/components/ui';
import { useAutoRefresh } from '../../src/hooks/useAutoRefresh';
import {
  BuildingReportRole,
  downloadBuildingsReport,
  fetchBuildings,
  setBuildingActive,
} from '../../src/services/buildings.service';
import { colors, spacing, borderRadius, shadows, typography } from '../../src/theme';
import type { Building } from '../../src/types';

const REPORT_ROLE_OPTIONS: Array<{ value: BuildingReportRole; label: string }> = [
  { value: 'building_admin', label: 'Building admins' },
  { value: 'committee', label: 'Committee' },
  { value: 'resident', label: 'Residents' },
  { value: 'guard', label: 'Security guards' },
];

export default function BuildingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Building | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportRoles, setReportRoles] = useState<BuildingReportRole[]>([
    'building_admin',
    'committee',
    'resident',
    'guard',
  ]);
  const [reportBuildingId, setReportBuildingId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2400);
  };

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setError(null);
    try {
      setBuildings(await fetchBuildings());
      setError(null);
    } catch (err) {
      if (!opts?.silent) {
        setError(err instanceof Error ? err.message : 'Failed to load buildings');
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

  useAutoRefresh(() => load({ silent: true }), 8000);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return buildings;
    return buildings.filter((b) => `${b.name} ${b.code}`.toLowerCase().includes(q));
  }, [buildings, query]);

  const handleToggle = async () => {
    if (!confirm) return;
    const next = !(confirm.isActive ?? true);
    setBusyId(confirm.id);
    try {
      await setBuildingActive(confirm.id, next);
      setConfirm(null);
      await load();
      showToast(
        next
          ? 'Building activated'
          : 'Building deactivated — all its users were deactivated',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const openBuilding = (building: Building) => {
    router.push(`/building/${building.id}`);
  };

  const openReport = (buildingId?: string) => {
    setReportBuildingId(buildingId ?? null);
    setReportError(null);
    setReportOpen(true);
  };

  const toggleReportRole = (role: BuildingReportRole) => {
    setReportRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    );
  };

  const handleDownloadReport = async () => {
    if (!reportRoles.length) {
      setReportError('Select at least one role.');
      return;
    }
    setDownloading(true);
    setReportError(null);
    try {
      await downloadBuildingsReport({
        roles: reportRoles,
        buildingId: reportBuildingId || undefined,
      });
      setReportOpen(false);
      showToast('Report ready to share');
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.root}>
      <PageHeader
        title="Buildings"
        rightAction={
          <Pressable
            style={styles.reportHeaderBtn}
            onPress={() => openReport()}
            hitSlop={8}
            accessibilityLabel="Download buildings report"
          >
            <Ionicons name="download-outline" size={20} color={colors.primary} />
          </Pressable>
        }
      >
        <View style={styles.headerTools}>
          <Input
            placeholder="Search by name or code"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          <Pressable style={styles.reportBtn} onPress={() => openReport()}>
            <Ionicons name="download-outline" size={18} color={colors.primary} />
            <Text style={styles.reportBtnText}>Download report</Text>
          </Pressable>
        </View>
      </PageHeader>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && filtered.length === 0 ? (
          <Text style={styles.empty}>No buildings found</Text>
        ) : null}

        {filtered.map((building) => {
          const active = building.isActive ?? true;
          const access = building.accessStatus || 'locked';
          const accessLabel =
            access === 'active'
              ? 'Activated'
              : access === 'trial'
                ? 'Trial'
                : access === 'expired'
                  ? 'Expired'
                  : 'Locked';
          return (
            <View key={building.id} style={styles.card}>
              <Pressable
                style={({ pressed }) => [styles.cardBody, pressed && styles.cardPressed]}
                onPress={() => openBuilding(building)}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.name}>{building.name}</Text>
                    <Text style={styles.meta}>Code · {building.code}</Text>
                    <Text style={styles.meta}>
                      {building.userCount ?? 0} users · {building.activeUserCount ?? 0} active
                    </Text>
                    <Text style={styles.hint}>Tap to view building users</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <View style={[styles.badge, active ? styles.badgeOn : styles.badgeOff]}>
                      <Text
                        style={[
                          styles.badgeText,
                          active ? styles.badgeOnText : styles.badgeOffText,
                        ]}
                      >
                        {active ? 'Listed' : 'Inactive'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        access === 'active'
                          ? styles.badgeOn
                          : access === 'trial'
                            ? styles.badgeTrial
                            : access === 'expired'
                              ? styles.badgeWarn
                              : styles.badgeOff,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          access === 'active'
                            ? styles.badgeOnText
                            : access === 'trial'
                              ? styles.badgeTrialText
                              : access === 'expired'
                                ? styles.badgeWarnText
                                : styles.badgeOffText,
                        ]}
                      >
                        {accessLabel}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </View>
                </View>
              </Pressable>

              <Pressable
                style={[styles.action, active ? styles.actionOff : styles.actionOn]}
                onPress={() => setConfirm(building)}
                disabled={busyId === building.id}
              >
                {busyId === building.id ? (
                  <ActivityIndicator size="small" color={active ? colors.error : colors.success} />
                ) : (
                  <Text
                    style={[styles.actionText, { color: active ? colors.error : colors.success }]}
                  >
                    {active ? 'Deactivate building' : 'Activate building'}
                  </Text>
                )}
              </Pressable>
              <Pressable style={styles.miniReportBtn} onPress={() => openReport(building.id)}>
                <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                <Text style={styles.miniReportText}>Report this building</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={reportOpen} transparent animationType="fade">
        <View style={styles.modalRoot}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Download buildings report</Text>
            <Text style={styles.modalBody}>
              {reportBuildingId
                ? `PDF for ${buildings.find((b) => b.id === reportBuildingId)?.name ?? 'this building'}. Choose which roles to include.`
                : 'PDF for all buildings. Choose which roles to include.'}
            </Text>
            <View style={styles.roleList}>
              {REPORT_ROLE_OPTIONS.map((option) => {
                const checked = reportRoles.includes(option.value);
                return (
                  <Pressable
                    key={option.value}
                    style={styles.roleRow}
                    onPress={() => toggleReportRole(option.value)}
                  >
                    <Ionicons
                      name={checked ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={checked ? colors.primary : colors.textSecondary}
                    />
                    <Text style={styles.roleRowText}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {reportError ? <Text style={styles.error}>{reportError}</Text> : null}
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                style={styles.modalBtn}
                onPress={() => setReportOpen(false)}
              />
              <Button
                title="Generate PDF"
                loading={downloading}
                style={styles.modalBtn}
                onPress={() => void handleDownloadReport()}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(confirm)} transparent animationType="fade">
        <View style={styles.modalRoot}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {(confirm?.isActive ?? true) ? 'Deactivate building?' : 'Activate building?'}
            </Text>
            <Text style={styles.modalBody}>
              {(confirm?.isActive ?? true)
                ? `Deactivating "${confirm?.name}" will also deactivate all users in that building.`
                : `Activate "${confirm?.name}"? Users stay inactive until you activate them individually.`}
            </Text>
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                style={styles.modalBtn}
                onPress={() => setConfirm(null)}
              />
              <Button
                title={(confirm?.isActive ?? true) ? 'Deactivate' : 'Activate'}
                variant={(confirm?.isActive ?? true) ? 'danger' : 'primary'}
                loading={Boolean(busyId)}
                style={styles.modalBtn}
                onPress={() => void handleToggle()}
              />
            </View>
          </View>
        </View>
      </Modal>

      {toast ? (
        <View style={[styles.toast, { bottom: insets.bottom + 24 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    ...shadows.sm,
  },
  cardBody: {},
  cardPressed: { opacity: 0.94 },
  cardTop: { flexDirection: 'row' },
  cardRight: { alignItems: 'flex-end', gap: 10 },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  hint: { fontSize: 12, color: colors.primary, marginTop: 8, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  badgeOn: { backgroundColor: colors.successLight },
  badgeOff: { backgroundColor: colors.errorLight },
  badgeTrial: { backgroundColor: colors.primaryLight },
  badgeWarn: { backgroundColor: colors.warningLight },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  badgeOnText: { color: colors.success },
  badgeOffText: { color: colors.error },
  badgeTrialText: { color: colors.primary },
  badgeWarnText: { color: colors.warning },
  action: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionOff: { backgroundColor: colors.errorLight, borderColor: '#FECDD3' },
  actionOn: { backgroundColor: colors.successLight, borderColor: '#A7F3D0' },
  actionText: { fontWeight: '600', fontSize: 14 },
  reportHeaderBtn: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    marginLeft: spacing.sm,
  },
  headerTools: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  reportBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  miniReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
  },
  miniReportText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  roleList: { gap: 12, marginTop: spacing.xs },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 2 },
  roleRowText: { fontSize: 15, fontWeight: '600', color: colors.text, flexShrink: 1 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 32 },
  error: { color: colors.error, textAlign: 'center' },
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  modalTitle: { ...typography.h2, color: colors.text },
  modalBody: { ...typography.body, color: colors.textSecondary },
  modalActions: {
    flexDirection: 'column',
    gap: 10,
    marginTop: spacing.xs,
  },
  modalBtn: {
    width: '100%',
  },
  toast: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.text,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  toastText: { color: colors.white, textAlign: 'center', fontWeight: '600' },
});
