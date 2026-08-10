import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Linking,
  Image,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows } from '../src/theme';
import {
  contactSeller,
  fetchMarketplaceChats,
  fetchMarketplaceThread,
  sendMarketplaceMessage,
} from '../src/services/marketplace.service';
import { fetchInboxDirectory, fetchInboxThread, openInboxThread, sendInboxMessage } from '../src/services/inbox.service';
import { formatChatTime } from '../src/utils/date';
import {
  InboxCategory,
  InboxChatMessage,
  InboxContact,
  MarketplaceChatMessage,
  MarketplaceThread,
  ROLE_LABELS,
  UserRole,
} from '../src/types';

type TabKey = 'marketplace' | 'inbox';
type ChatKind = TabKey;

const CATEGORIES: Array<{ value: InboxCategory; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { value: 'committee', label: 'Committee', icon: 'people' },
  { value: 'resident', label: 'Resident', icon: 'home' },
  { value: 'guard', label: 'Security Guard', icon: 'shield-checkmark' },
];

function firstParam(value?: string | string[]): string {
  if (!value) return '';
  return Array.isArray(value) ? value[0] ?? '' : value;
}

function roleLabel(role?: string) {
  if (!role) return '';
  return ROLE_LABELS[role as UserRole] ?? role.replace(/_/g, ' ');
}

function SeenTicks({ seen }: { seen?: boolean }) {
  return (
    <Ionicons
      name={seen ? 'checkmark-done' : 'checkmark'}
      size={14}
      color={seen ? '#93C5FD' : '#C7D2FE'}
      style={{ marginLeft: 4 }}
    />
  );
}

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string; listingId?: string; userId?: string; threadId?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const openedKey = useRef('');

  const [tab, setTab] = useState<TabKey>(firstParam(params.tab) === 'marketplace' ? 'marketplace' : 'inbox');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<InboxCategory>('committee');
  const [marketThreads, setMarketThreads] = useState<MarketplaceThread[]>([]);
  const [contacts, setContacts] = useState<Record<InboxCategory, InboxContact[]>>({
    committee: [],
    resident: [],
    guard: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [chatKind, setChatKind] = useState<ChatKind | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState('');
  const [chatSubtitle, setChatSubtitle] = useState('');
  const [chatImage, setChatImage] = useState<string | undefined>();
  const [chatPhone, setChatPhone] = useState<string | undefined>();
  const [messages, setMessages] = useState<Array<MarketplaceChatMessage | InboxChatMessage>>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const loadLists = useCallback(async () => {
    setError(null);
    try {
      const [threads, directory] = await Promise.all([fetchMarketplaceChats(), fetchInboxDirectory()]);
      setMarketThreads(threads);
      setContacts(directory.contacts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const applyMarketThread = (
    thread: MarketplaceThread,
    nextMessages: MarketplaceChatMessage[],
  ) => {
    setChatKind('marketplace');
    setChatId(thread.id);
    setChatTitle(thread.listingTitle);
    setChatSubtitle(thread.isSeller ? `Buyer · ${thread.otherName}` : `Seller · ${thread.otherName}`);
    setChatImage(thread.listingImage);
    setChatPhone(undefined);
    setMessages(nextMessages);
    setMarketThreads((current) => {
      const rest = current.filter((item) => item.id !== thread.id);
      return [thread, ...rest];
    });
  };

  const applyInboxThread = (
    thread: { id: string; otherName: string; otherRole: string },
    nextMessages: InboxChatMessage[],
    phone?: string,
  ) => {
    setChatKind('inbox');
    setChatId(thread.id);
    setChatTitle(thread.otherName);
    setChatSubtitle(roleLabel(thread.otherRole));
    setChatImage(undefined);
    setChatPhone(phone);
    setMessages(nextMessages);
  };

  const openMarketChat = async (threadId: string, silent = false) => {
    try {
      const detail = await fetchMarketplaceThread(threadId);
      applyMarketThread(detail.thread, detail.messages);
    } catch (err) {
      if (!silent) showToast(err instanceof Error ? err.message : 'Failed to open chat');
    }
  };

  const openListingChat = async (listingId: string) => {
    try {
      setTab('marketplace');
      const detail = await contactSeller(listingId);
      applyMarketThread(detail.thread, detail.messages);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to contact seller');
    }
  };

  const openUserChat = async (userId: string, phone?: string) => {
    try {
      setTab('inbox');
      const detail = await openInboxThread(userId);
      applyInboxThread(detail.thread, detail.messages, phone);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to open inbox');
    }
  };

  const openInboxChat = async (threadId: string, phone?: string, silent = false) => {
    try {
      const detail = await fetchInboxThread(threadId);
      applyInboxThread(detail.thread, detail.messages, phone);
    } catch (err) {
      if (!silent) showToast(err instanceof Error ? err.message : 'Failed to open chat');
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadLists();
      const listingId = firstParam(params.listingId);
      const userId = firstParam(params.userId);
      const threadId = firstParam(params.threadId);
      const nextTab = firstParam(params.tab);
      if (nextTab === 'marketplace' || nextTab === 'inbox') setTab(nextTab);
      const key = `${nextTab}|${listingId}|${userId}|${threadId}`;
      if (!listingId && !userId && !threadId) return;
      if (openedKey.current === key) return;
      openedKey.current = key;
      if (listingId) void openListingChat(listingId);
      else if (userId) void openUserChat(userId);
      else if (threadId && nextTab === 'marketplace') void openMarketChat(threadId);
      else if (threadId) void openInboxChat(threadId);
    }, [loadLists, params.listingId, params.userId, params.threadId, params.tab]),
  );

  useEffect(() => {
    if (!chatId || !chatKind) return;
    const timer = setInterval(() => {
      if (chatKind === 'marketplace') void openMarketChat(chatId, true);
      else void openInboxChat(chatId, chatPhone, true);
    }, 4000);
    return () => clearInterval(timer);
  }, [chatId, chatKind, chatPhone]);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length, chatId]);

  const filteredMarket = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return marketThreads;
    return marketThreads.filter(
      (thread) =>
        thread.listingTitle.toLowerCase().includes(q) || thread.otherName.toLowerCase().includes(q),
    );
  }, [marketThreads, search]);

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = contacts[category] ?? [];
    if (!q) return list;
    return list.filter((person) =>
      [person.name, person.roleLabel, person.phone, person.unitNumber, person.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [contacts, category, search]);

  const handleSend = async () => {
    if (!chatId || !chatKind || !draft.trim() || sending) return;
    setSending(true);
    const text = draft.trim();
    setDraft('');
    try {
      if (chatKind === 'marketplace') {
        const result = await sendMarketplaceMessage(chatId, text);
        setMessages((current) => [...current, result.message]);
        setMarketThreads((current) => {
          const rest = current.filter((item) => item.id !== result.thread.id);
          return [result.thread, ...rest];
        });
      } else {
        const result = await sendInboxMessage(chatId, text);
        setMessages((current) => [...current, result.message]);
      }
    } catch (err) {
      setDraft(text);
      showToast(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const callNumber = async (phone?: string) => {
    if (!phone) return;
    try {
      await Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);
    } catch {
      showToast(phone);
    }
  };

  if (chatKind && chatId) {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.chatHeader, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable
            onPress={() => {
              setChatKind(null);
              setChatId(null);
              setMessages([]);
              setDraft('');
              void loadLists();
            }}
            style={styles.back}
          >
            <Ionicons name="arrow-back" size={22} color={colors.slate800} />
          </Pressable>
          {chatImage ? (
            <Image source={{ uri: chatImage }} style={styles.chatListingImage} />
          ) : (
            <View style={styles.chatAvatar}>
              <Ionicons name={chatKind === 'marketplace' ? 'storefront' : 'person'} size={18} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.chatName} numberOfLines={1}>
              {chatTitle}
            </Text>
            <Text style={styles.chatRole} numberOfLines={1}>
              {chatSubtitle}
            </Text>
          </View>
          {chatPhone ? (
            <Pressable style={styles.headerCall} onPress={() => void callNumber(chatPhone)}>
              <Ionicons name="call" size={18} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
        >
          {!messages.length ? (
            <Text style={styles.emptyChat}>
              {chatKind === 'marketplace' ? 'Say hello about this listing.' : 'Start the conversation.'}
            </Text>
          ) : null}
          {messages.map((item) => (
            <View key={item.id} style={item.mine ? styles.bubbleRight : styles.bubbleLeft}>
              <Text style={item.mine ? styles.bubbleRightText : styles.bubbleLeftText}>{item.text}</Text>
              <View style={styles.metaRow}>
                <Text style={item.mine ? styles.timeRight : styles.timeLeft}>{formatChatTime(item.createdAt)}</Text>
                {item.mine ? <SeenTicks seen={item.seen} /> : null}
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <Pressable style={styles.send} onPress={() => void handleSend()} disabled={sending || !draft.trim()}>
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
        {toast ? (
          <View style={[styles.toast, { bottom: insets.bottom + 88 }]}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.listHeader, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.listHeaderRow}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={colors.slate800} />
          </Pressable>
          <Text style={styles.title}>{tab === 'marketplace' ? 'Marketplace' : 'Inbox'}</Text>
        </View>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.search}
            placeholder={
              tab === 'marketplace' ? 'Search listings or sellers...' : 'Search committee, residents, guards...'
            }
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {tab === 'inbox' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map((item) => {
              const active = category === item.value;
              const count = contacts[item.value]?.length ?? 0;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => setCategory(item.value)}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                >
                  <Ionicons name={item.icon} size={14} color={active ? colors.white : colors.primary} />
                  <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{item.label}</Text>
                  <View style={[styles.countPill, active && styles.countPillActive]}>
                    <Text style={[styles.countText, active && styles.countTextActive]}>{count}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 88 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadLists();
            }}
          />
        }
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading && tab === 'marketplace' && !marketThreads.length ? (
          <Text style={styles.muted}>Loading marketplace chats…</Text>
        ) : null}
        {loading && tab === 'inbox' && !filteredContacts.length ? <Text style={styles.muted}>Loading people…</Text> : null}

        {tab === 'marketplace' ? (
          <>
            {!loading && !filteredMarket.length ? (
              <Text style={styles.muted}>No listing chats yet. Contact a seller from Marketplace.</Text>
            ) : null}
            {filteredMarket.map((thread) => (
              <Pressable key={thread.id} style={styles.chatRow} onPress={() => void openMarketChat(thread.id)}>
                {thread.listingImage ? (
                  <Image source={{ uri: thread.listingImage }} style={styles.rowImage} />
                ) : (
                  <View style={styles.rowAvatar}>
                    <Ionicons name="storefront" size={20} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTop}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {thread.listingTitle}
                    </Text>
                    <Text style={styles.rowTime}>{formatChatTime(thread.lastMessageAt)}</Text>
                  </View>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {thread.isSeller ? `Buyer · ${thread.otherName}` : `Seller · ${thread.otherName}`}
                  </Text>
                  <Text style={styles.rowMsg} numberOfLines={1}>
                    {thread.lastMessage || 'Tap to open this listing inbox'}
                  </Text>
                </View>
                {thread.unread > 0 ? (
                  <View style={styles.unread}>
                    <Text style={styles.unreadText}>{thread.unread}</Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </>
        ) : (
          <>
            {!loading && !filteredContacts.length ? (
              <Text style={styles.muted}>No {CATEGORIES.find((item) => item.value === category)?.label.toLowerCase()} available.</Text>
            ) : null}
            {filteredContacts.map((person) => (
              <Pressable
                key={person.id}
                style={styles.personCard}
                onPress={() => void openUserChat(person.id, person.phone)}
              >
                <View style={styles.rowAvatar}>
                  <Ionicons
                    name={category === 'guard' ? 'shield-checkmark' : category === 'committee' ? 'people' : 'person'}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTop}>
                    <Text style={styles.rowName}>{person.name}</Text>
                    {person.lastMessageAt ? (
                      <Text style={styles.rowTime}>{formatChatTime(person.lastMessageAt)}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.rowSub}>
                    {person.roleLabel}
                    {person.unitNumber ? ` · Apt ${person.unitNumber}` : ''}
                  </Text>
                  {person.phone ? <Text style={styles.rowPhone}>{person.phone}</Text> : null}
                  {person.lastMessage ? (
                    <Text style={styles.rowMsg} numberOfLines={1}>
                      {person.lastMessage}
                    </Text>
                  ) : (
                    <Text style={styles.rowHint}>Tap to message</Text>
                  )}
                </View>
                <View style={styles.personActions}>
                  {person.unread ? (
                    <View style={styles.unread}>
                      <Text style={styles.unreadText}>{person.unread}</Text>
                    </View>
                  ) : null}
                  {person.phone ? (
                    <Pressable
                      style={styles.miniCall}
                      onPress={(event) => {
                        event.stopPropagation();
                        void callNumber(person.phone);
                      }}
                    >
                      <Ionicons name="call" size={16} color={colors.primary} />
                    </Pressable>
                  ) : null}
                  <View style={styles.miniChat}>
                    <Ionicons name="chatbubble-ellipses" size={16} color={colors.white} />
                  </View>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>

      <View style={[styles.bottomSwitch, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <Pressable
          style={[styles.bottomTab, tab === 'marketplace' && styles.bottomTabActive]}
          onPress={() => setTab('marketplace')}
        >
          <Ionicons name="storefront" size={20} color={tab === 'marketplace' ? colors.primary : colors.textMuted} />
          <Text style={[styles.bottomLabel, tab === 'marketplace' && styles.bottomLabelActive]}>Marketplace</Text>
        </Pressable>
        <Pressable style={[styles.bottomTab, tab === 'inbox' && styles.bottomTabActive]} onPress={() => setTab('inbox')}>
          <Ionicons name="chatbubbles" size={20} color={tab === 'inbox' ? colors.primary : colors.textMuted} />
          <Text style={[styles.bottomLabel, tab === 'inbox' && styles.bottomLabelActive]}>Inbox</Text>
        </Pressable>
      </View>

      {toast ? (
        <View style={[styles.toast, { bottom: insets.bottom + 88 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
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
    gap: 12,
  },
  listHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  categoryRow: { gap: 8, paddingTop: 2 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
  },
  categoryChipActive: { backgroundColor: colors.primary },
  categoryText: { fontWeight: '700', fontSize: 13, color: colors.primary },
  categoryTextActive: { color: colors.white },
  countPill: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countPillActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  countText: { fontSize: 10, fontWeight: '800', color: colors.primary },
  countTextActive: { color: colors.white },
  list: { padding: spacing.md, gap: 4 },
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
    ...shadows.sm,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius['2xl'],
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  rowAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowImage: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.slate100 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  rowName: { flex: 1, fontWeight: '700', color: colors.text },
  rowTime: { fontSize: 11, color: colors.textMuted },
  rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  rowPhone: { fontSize: 12, color: colors.text, marginTop: 2, fontWeight: '600' },
  rowMsg: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  rowHint: { fontSize: 12, color: colors.primary, marginTop: 2, fontWeight: '600' },
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
  personActions: { alignItems: 'center', gap: 8 },
  miniCall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniChat: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.md },
  error: { color: colors.error, fontSize: 13, textAlign: 'center', marginBottom: 8 },
  emptyChat: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
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
  chatListingImage: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.slate100 },
  chatName: { fontWeight: '700', color: colors.text },
  chatRole: { fontSize: 11, color: colors.textSecondary },
  headerCall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  timeLeft: { fontSize: 10, color: colors.textMuted },
  bubbleRight: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius['2xl'],
    borderTopRightRadius: 4,
    padding: 12,
  },
  bubbleRightText: { color: colors.white, fontSize: 14 },
  timeRight: { fontSize: 10, color: '#C7D2FE' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, justifyContent: 'flex-end' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    maxHeight: 120,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSwitch: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: borderRadius.lg,
  },
  bottomTabActive: { backgroundColor: colors.primaryLight },
  bottomLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  bottomLabelActive: { color: colors.primary },
  toast: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.text,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
  },
  toastText: { color: colors.white, textAlign: 'center', fontWeight: '600' },
});
