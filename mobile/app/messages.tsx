import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mockChats } from '../src/data/mockData';
import { colors, spacing, borderRadius, shadows } from '../src/theme';

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');

  const chat = mockChats.find((c) => c.id === activeChat);
  const filtered = mockChats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (activeChat && chat) {
    return (
      <View style={styles.root}>
        <View style={[styles.chatHeader, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => setActiveChat(null)} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={colors.slate800} />
          </Pressable>
          <View style={styles.chatAvatar}>
            <Ionicons name="person" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.chatName}>{chat.name}</Text>
            <Text style={styles.chatRole}>{chat.role}</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
          <View style={styles.bubbleLeft}>
            <Text style={styles.bubbleLeftText}>Hello, this is {chat.name}.</Text>
            <Text style={styles.timeLeft}>09:45 AM</Text>
          </View>
          <View style={styles.bubbleRight}>
            <Text style={styles.bubbleRightText}>Hi! Noted, thank you.</Text>
            <Text style={styles.timeRight}>09:48 AM</Text>
          </View>
          <View style={styles.bubbleLeft}>
            <Text style={styles.bubbleLeftText}>{chat.lastMsg}</Text>
            <Text style={styles.timeLeft}>10:02 AM</Text>
          </View>
        </ScrollView>
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            value={draft}
            onChangeText={setDraft}
          />
          <Pressable
            style={styles.send}
            onPress={() => setDraft('')}
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.listHeader, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.listHeaderRow}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={colors.slate800} />
          </Pressable>
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.search}
            placeholder="Search residents, guards, manager..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map((c) => (
          <Pressable key={c.id} style={styles.chatRow} onPress={() => setActiveChat(c.id)}>
            <View style={styles.rowAvatar}>
              <Ionicons name="person" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.rowTop}>
                <Text style={styles.rowName}>{c.name}</Text>
                <Text style={styles.rowTime}>{c.time}</Text>
              </View>
              <Text style={styles.rowMsg} numberOfLines={1}>
                {c.lastMsg}
              </Text>
            </View>
            {c.unread > 0 && (
              <View style={styles.unread}>
                <Text style={styles.unreadText}>{c.unread}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  listHeader: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 20,
  },
  listHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  back: { padding: 8, marginLeft: -8 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  searchWrap: { position: 'relative', justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: 12, zIndex: 1 },
  search: {
    backgroundColor: colors.slate100,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingLeft: 40,
    paddingRight: 14,
    fontSize: 14,
    color: colors.text,
  },
  list: { padding: spacing.md, gap: 4, paddingBottom: 40 },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius['2xl'],
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  rowName: { fontWeight: '700', color: colors.text },
  rowTime: { fontSize: 11, color: colors.textMuted },
  rowMsg: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  unread: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
    zIndex: 20,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatName: { fontWeight: '700', color: colors.text },
  chatRole: { fontSize: 11, color: colors.textSecondary },
  messages: { padding: spacing.md, gap: 12, flexGrow: 1, justifyContent: 'flex-end' },
  bubbleLeft: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: borderRadius['2xl'],
    borderTopLeftRadius: 4,
    padding: 12,
    ...shadows.sm,
  },
  bubbleLeftText: { color: colors.text, fontSize: 14 },
  timeLeft: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  bubbleRight: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius['2xl'],
    borderTopRightRadius: 4,
    padding: 12,
  },
  bubbleRightText: { color: colors.white, fontSize: 14 },
  timeRight: { fontSize: 10, color: '#C7D2FE', marginTop: 4, textAlign: 'right' },
  composer: {
    flexDirection: 'row',
    gap: 8,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
  },
  input: {
    flex: 1,
    backgroundColor: colors.slate100,
    borderRadius: borderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
