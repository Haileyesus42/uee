import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { useChatHistory, useSendChatMessage } from '../../hooks/useChat';
import { useUnityChat } from '../../context/UnityChatContext';
import { RobotMascot } from './RobotMascot';
import { MathText } from '../common/MathText';

type Message = { id: string; from: 'user' | 'unity'; text: string };

const SUGGESTIONS = ['Explain a topic', 'Recommend what to study', 'Track my progress', 'Create a quiz for me'];
const FALLBACK_REPLY = "Sorry, I'm having trouble responding right now — please try again in a moment.";

const PANEL_WIDTH = Math.min(380, Dimensions.get('window').width * 0.9);

function getDisplayText(text: string): string {
  if (text.startsWith('[Q_CONTEXT]')) {
    const firstLine = text.split('\n')[0];
    return firstLine.replace('[Q_CONTEXT] ', '');
  }
  return text;
}

export function UnityChatPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const anim = useRef(new Animated.Value(0)).current;

  const { pendingPrompt, clearPendingPrompt } = useUnityChat();

  const { data: history } = useChatHistory();
  const sendMutation = useSendChatMessage();
  const [pending, setPending] = useState<string | null>(null);
  const [localError, setLocalError] = useState(false);
  const [input, setInput] = useState('');

  const messages: Message[] = [
    { id: 'intro', from: 'unity', text: "Hi! I'm Unity, your AI tutor. What would you like help with today?" },
    ...(history ?? []).map((m): Message => ({ id: m.id, from: m.role, text: getDisplayText(m.text) })),
    ...(pending ? [{ id: 'pending', from: 'user' as const, text: getDisplayText(pending) }] : []),
    ...(localError ? [{ id: 'local-error', from: 'unity' as const, text: FALLBACK_REPLY }] : []),
  ];

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length, sendMutation.isPending]);

  function send(text: string) {
    if (!text.trim() || sendMutation.isPending) return;
    setPending(text);
    setLocalError(false);
    setInput('');
    sendMutation.mutate(text, {
      onSettled: () => setPending(null),
      onError: () => setLocalError(true),
    });
  }

  useEffect(() => {
    if (!pendingPrompt) return;
    if (sendMutation.isPending) return;
    const text = pendingPrompt.text;
    clearPendingPrompt();
    send(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt, sendMutation.isPending]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [PANEL_WIDTH, 0] });
  const backdropOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.shadowWrap, { width: PANEL_WIDTH, transform: [{ translateX }] }]}>
        <View
          style={[
            styles.panel,
            { backgroundColor: t.colors.bg, paddingTop: insets.top + 12, paddingBottom: insets.bottom },
          ]}
        >
          <View style={[styles.header, { paddingHorizontal: t.spacing.md, borderBottomColor: t.colors.border }]}>
            <RobotMascot size={26} />
            <Text style={[t.typography.h3, { color: t.colors.textPrimary, marginLeft: 8, flex: 1 }]}>Unity</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={[styles.closeButton, { backgroundColor: t.colors.surfaceAlt }]}
            >
              <Ionicons name="close" size={16} color={t.colors.textSecondary} />
            </Pressable>
          </View>

          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={{ padding: t.spacing.md, gap: 12 }}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            >
              {messages.map((msg) =>
                msg.from === 'unity' ? (
                  <View key={msg.id} style={styles.unityRow}>
                    <RobotMascot size={26} />
                    <View style={[styles.bubble, styles.unityBubble, { backgroundColor: t.colors.surface }]}>
                      <MathText markdown style={[styles.bubbleText, { color: t.colors.textPrimary }]}>
                        {msg.text}
                      </MathText>
                    </View>
                  </View>
                ) : (
                  <View key={msg.id} style={styles.userRow}>
                    <View style={[styles.bubble, styles.userBubble, { backgroundColor: t.colors.brand }]}>
                      <Text style={[styles.bubbleText, { color: t.colors.textInverse }]}>{msg.text}</Text>
                    </View>
                  </View>
                )
              )}

              {sendMutation.isPending && (
                <View style={styles.unityRow}>
                  <RobotMascot size={26} />
                  <View style={[styles.bubble, styles.unityBubble, { backgroundColor: t.colors.surface }]}>
                    <ActivityIndicator size="small" color={t.colors.textSecondary} />
                  </View>
                </View>
              )}

              {messages.length <= 1 && (
                <View style={styles.suggestionsWrap}>
                  {SUGGESTIONS.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => send(s)}
                      style={[
                        styles.suggestionChip,
                        { backgroundColor: t.colors.chip, borderColor: t.colors.chipBorder },
                      ]}
                    >
                      <Text style={[styles.suggestionText, { color: t.colors.textPrimary }]}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={[styles.inputRow, { paddingHorizontal: t.spacing.md, borderTopColor: t.colors.border }]}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask Unity anything…"
                placeholderTextColor={t.colors.textSecondary}
                style={[styles.input, { color: t.colors.textPrimary, backgroundColor: t.colors.surface }]}
                onSubmitEditing={() => send(input)}
              />
              <Pressable onPress={() => send(input)} style={[styles.sendButton, { backgroundColor: t.colors.brand }]}>
                <Ionicons name="arrow-up" size={18} color={t.colors.textInverse} />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,20,18,0.4)' },
  shadowWrap: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    shadowColor: '#000000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 16,
  },
  panel: {
    flex: 1,
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  closeButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  unityRow: { flexDirection: 'row', alignItems: 'flex-end' },
  userRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', borderRadius: 16, padding: 12 },
  unityBubble: { marginLeft: 8, borderBottomLeftRadius: 4 },
  userBubble: { borderBottomRightRadius: 4 },
  bubbleText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  suggestionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  suggestionChip: { borderRadius: 999, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12 },
  suggestionText: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16, fontSize: 12 },
  sendButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});