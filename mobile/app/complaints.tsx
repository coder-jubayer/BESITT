import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '../src/components/PageHeader';
import { mockComplaints, Complaint } from '../src/data/mockData';
import { colors, spacing, borderRadius, shadows } from '../src/theme';

export default function ComplaintsScreen() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');

  const raiseTicket = () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Enter a complaint title.');
      return;
    }
    const next: Complaint = {
      id: String(Date.now()),
      title: title.trim(),
      category: 'General',
      status: 'open',
      date: 'Just now',
    };
    setComplaints((prev) => [next, ...prev]);
    setTitle('');
    setShowForm(false);
    Alert.alert('Ticket raised', 'Your complaint was submitted (demo).');
  };

  const statusStyle = (status: Complaint['status']) => {
    if (status === 'open') return { bg: '#FEF3C7', color: '#B45309' };
    if (status === 'in_progress') return { bg: '#DBEAFE', color: '#1D4ED8' };
    return { bg: colors.successLight, color: colors.success };
  };

  return (
    <View style={styles.root}>
      <PageHeader title="Complaints & Fixes" onBack={() => router.back()} />
      <View style={styles.topBar}>
        <Pressable style={styles.raiseBtn} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.raiseText}>+ Raise New Ticket</Text>
        </Pressable>
        {showForm && (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Describe the issue..."
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
            <Pressable style={styles.submit} onPress={raiseTicket}>
              <Text style={styles.submitText}>Submit</Text>
            </Pressable>
          </View>
        )}
      </View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {complaints.map((c) => {
          const s = statusStyle(c.status);
          return (
            <View key={c.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.title}>{c.title}</Text>
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeText, { color: s.color }]}>
                    {c.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <View style={styles.meta}>
                <Text style={styles.metaText}>
                  <Ionicons name="construct" size={12} /> {c.category}
                </Text>
                <Text style={styles.metaText}>{c.date}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: { padding: spacing.md, gap: 12 },
  raiseBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.md,
  },
  raiseText: { color: colors.white, fontWeight: '600' },
  form: { gap: 8 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
  },
  submit: {
    backgroundColor: colors.slate800,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  submitText: { color: colors.white, fontWeight: '600' },
  list: { paddingHorizontal: spacing.md, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  title: { flex: 1, fontWeight: '600', color: colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: 13, color: colors.textSecondary },
});
