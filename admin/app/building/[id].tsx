import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '../../src/components/PageHeader';
import { Button, Input } from '../../src/components/ui';
import { useAutoRefresh } from '../../src/hooks/useAutoRefresh';
import { fetchBuildingDetail } from '../../src/services/buildings.service';
import { setBuildingAccess } from '../../src/services/platform.service';
import { colors, spacing, borderRadius, shadows, typography } from '../../src/theme';
import {
  ROLE_LABELS,
  type Building,
  type BuildingAccessStatus,
  type User,
  type UserRole,
} from '../../src/types';

const ACCESS_LABELS: Record<BuildingAccessStatus, string> = {
  locked: 'Locked',
  trial: 'Free trial',
  active: 'Activated',
  expired: 'Expired',
};

function accessBadgeStyle(status?: BuildingAccessStatus) {
  switch (status) {
    case 'active':
      return { box: styles.badgeOn, text: styles.badgeOnText };
    case 'trial':
      return { box: styles.badgeTrial, text: styles.badgeTrialText };
    case 'expired':
      return { box: styles.badgeWarn, text: styles.badgeWarnText };
    default:
      return { box: styles.badgeOff, text: styles.badgeOffText };
  }
}

const OTHER_ROLES: UserRole[] = ['committee', 'guard', 'resident'];

function UserCard({ user, highlight }: { user: User; highlight?: boolean }) {
  const userActive = user.isActive ?? true;
  return (
    <View style={[styles.userCard, highlight && styles.adminCard]}>
      <View style={styles.userTop}>
        <Text style={styles.userName}>{user.name}</Text>
        <View style={[styles.badge, userActive ? styles.badgeOn : styles.badgeOff]}>
          <Text style={[styles.badgeText, userActive ? styles.badgeOnText : styles.badgeOffText]}>
            {userActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <Text style={styles.roleLabel}>{ROLE_LABELS[user.role] ?? user.role}</Text>
      {user.unitNumber ? <Text style={styles.detail}>Unit · {user.unitNumber}</Text> : null}
      <Text style={styles.detail}>Email · {user.email || '—'}</Text>
      <Text style={styles.detail}>Phone · {user.phone || '—'}</Text>
    </View>
  );
}

export default function BuildingDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const buildingId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [building, setBuilding] = useState<Building | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessBusy, setAccessBusy] = useState(false);
  const [accessMsg, setAccessMsg] = useState<string | null>(null);
  const [activateDays, setActivateDays] = useState('365');

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!buildingId) {
        setError('Building not found');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      if (!opts?.silent) setError(null);
      try {
        const data = await fetchBuildingDetail(buildingId);
        setBuilding(data.building);
        setUsers(data.users);
        setAdmins(data.admins);
        setError(null);
      } catch (err) {
        if (!opts?.silent) {
          setError(err instanceof Error ? err.message : 'Failed to load building users');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [buildingId],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useAutoRefresh(() => load({ silent: true }), 8000);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.name} ${u.email ?? ''} ${u.phone ?? ''} ${u.role} ${u.unitNumber ?? ''}`
        .toLowerCase()
        .includes(q),
    );
  }, [query, users]);

  const filteredAdmins = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list =
      admins.length > 0
        ? admins
        : users.filter((u) => u.role === 'building_admin' || u.role === 'app_admin');
    if (!q) return list;
    return list.filter((u) =>
      `${u.name} ${u.email ?? ''} ${u.phone ?? ''} ${u.role}`.toLowerCase().includes(q),
    );
  }, [admins, users, query]);

  const otherSections = useMemo(() => {
    const adminIds = new Set(filteredAdmins.map((u) => u.id));
    return OTHER_ROLES.map((role) => ({
      role,
      label: ROLE_LABELS[role],
      users: filtered.filter((u) => u.role === role && !adminIds.has(u.id)),
    })).filter((section) => section.users.length > 0);
  }, [filtered, filteredAdmins]);

  const active = building?.isActive ?? true;
  const accessStatus = (building?.accessStatus || 'locked') as BuildingAccessStatus;
  const accessStyle = accessBadgeStyle(accessStatus);

  const updateAccess = async (
    payload: { accessStatus: 'locked' | 'active' | 'expired'; days?: number },
  ) => {
    if (!buildingId) return;
    setAccessBusy(true);
    setAccessMsg(null);
    try {
      const result = await setBuildingAccess(buildingId, payload);
      setBuilding(result.building);
      setAccessMsg(
        payload.accessStatus === 'active'
          ? 'Building activated for the resident app'
          : payload.accessStatus === 'locked'
            ? 'Building locked'
            : 'Building marked expired',
      );
    } catch (err) {
      setAccessMsg(err instanceof Error ? err.message : 'Could not update access');
    } finally {
      setAccessBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <PageHeader title={building?.name ?? 'Building'} onBack={() => router.back()}>
        <Input
          placeholder="Search users by name, email, phone"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </PageHeader>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
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
        {building ? (
          <View style={styles.summary}>
            <View style={styles.summaryTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.code}>Code · {building.code}</Text>
                <Text style={styles.summaryMeta}>
                  {building.userCount ?? users.length} users · {building.activeUserCount ?? 0} active
                </Text>
              </View>
              <View style={styles.badgeCol}>
                <View style={[styles.badge, active ? styles.badgeOn : styles.badgeOff]}>
                  <Text
                    style={[styles.badgeText, active ? styles.badgeOnText : styles.badgeOffText]}
                  >
                    {active ? 'Listed' : 'Inactive'}
                  </Text>
                </View>
                <View style={[styles.badge, accessStyle.box]}>
                  <Text style={[styles.badgeText, accessStyle.text]}>
                    {ACCESS_LABELS[accessStatus]}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.accessPanel}>
              <Text style={styles.accessTitle}>App access</Text>
              <Text style={styles.accessBody}>
                {accessStatus === 'trial' && building.trialDaysGranted
                  ? `Free trial · ${building.trialDaysGranted} days granted${
                      building.trialEndsAt
                        ? ` · ends ${new Date(building.trialEndsAt).toLocaleDateString()}`
                        : ''
                    }. Changing platform trial length will not shorten this clock.`
                  : accessStatus === 'active'
                    ? building.expiresAt
                      ? `Activated until ${new Date(building.expiresAt).toLocaleDateString()}`
                      : 'Fully activated (no expiry set)'
                    : accessStatus === 'expired'
                      ? 'Trial or subscription ended — resident app is locked for everyone in this building.'
                      : 'Locked — building admin can claim a free trial (if enabled) or contact support.'}
              </Text>

              {accessStatus === 'trial' ? (
                <Text style={styles.accessNote}>
                  Trial claimed{building.trialClaimed ? '' : ''} — remaining days are frozen.
                </Text>
              ) : null}

              <View style={styles.accessActions}>
                {accessStatus !== 'active' ? (
                  <>
                    <Input
                      label="Activation days (optional)"
                      value={activateDays}
                      onChangeText={setActivateDays}
                      keyboardType="number-pad"
                      placeholder="365 leave blank for open-ended"
                    />
                    <Button
                      title="Activate building"
                      loading={accessBusy}
                      onPress={() => {
                        const days = Number(activateDays);
                        void updateAccess({
                          accessStatus: 'active',
                          ...(Number.isFinite(days) && days > 0 ? { days } : {}),
                        });
                      }}
                      fullWidth
                    />
                  </>
                ) : null}
                {accessStatus !== 'locked' ? (
                  <Button
                    title="Lock building"
                    variant="outline"
                    loading={accessBusy}
                    onPress={() => void updateAccess({ accessStatus: 'locked' })}
                    fullWidth
                  />
                ) : null}
                {accessStatus === 'active' || accessStatus === 'trial' ? (
                  <Pressable
                    onPress={() => void updateAccess({ accessStatus: 'expired' })}
                    disabled={accessBusy}
                  >
                    <Text style={styles.expireLink}>Mark as expired</Text>
                  </Pressable>
                ) : null}
              </View>
              {accessMsg ? <Text style={styles.accessMsg}>{accessMsg}</Text> : null}
            </View>
          </View>
        ) : null}

        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && !error ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Building Admin · primary contact ({filteredAdmins.length})
            </Text>
            {filteredAdmins.length === 0 ? (
              <Text style={styles.emptyInline}>No building admin assigned</Text>
            ) : (
              filteredAdmins.map((user) => <UserCard key={user.id} user={user} highlight />)
            )}
          </View>
        ) : null}

        {otherSections.map((section) => (
          <View key={section.role} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {section.label} ({section.users.length})
            </Text>
            {section.users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  badgeCol: { gap: 6, alignItems: 'flex-end' },
  code: { fontWeight: '700', color: colors.text, fontSize: 15 },
  summaryMeta: { marginTop: 4, color: colors.textSecondary, fontSize: 13 },
  accessPanel: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  accessTitle: { ...typography.h3, color: colors.text },
  accessBody: { ...typography.bodySmall, color: colors.textSecondary },
  accessNote: { ...typography.bodySmall, color: colors.warning, fontWeight: '600' },
  accessActions: { gap: spacing.sm, marginTop: spacing.xs },
  accessMsg: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  expireLink: {
    textAlign: 'center',
    color: colors.error,
    fontWeight: '600',
    paddingVertical: 8,
  },
  section: { gap: spacing.sm },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 4,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  adminCard: {
    borderColor: colors.primaryMuted,
    backgroundColor: colors.primaryLight,
  },
  userTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  userName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  roleLabel: { marginTop: 4, fontWeight: '600', color: colors.primary, fontSize: 13 },
  detail: { marginTop: 4, color: colors.textSecondary, fontSize: 13 },
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
  emptyInline: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textSecondary,
  },
  error: { color: colors.error, textAlign: 'center' },
});
