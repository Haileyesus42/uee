import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  PanResponder,
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

type Message = {
  id: string;
  from: 'user' | 'unity';
  text: string;
  followUps?: { q: string; a: string }[];
};

const SUGGESTIONS = ['Explain a topic', 'Recommend what to study', 'Track my progress', 'Create a quiz for me'];
const FALLBACK_REPLY = "Sorry, I'm having trouble responding right now — please try again in a moment.";

const PANEL_WIDTH = Math.min(380, Dimensions.get('window').width * 0.9);
const SCREEN_HEIGHT = Dimensions.get('window').height;

function getDisplayText(text: string): string {
  if (text.startsWith('[Q_CONTEXT]')) {
    const firstLine = text.split('\n')[0];
    return firstLine.replace('[Q_CONTEXT] ', '');
  }
  return text;
}

// LaTeX → Unicode so the panel needs no WebView.
function latexToUnicode(text: string): string {
  let s = text;

  // Strip math delimiters, keep contents
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, '$1');
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, '$1');
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
  s = s.replace(/\$([^$\n]+)\$/g, '$1');

  // Bracket display math
  s = s.replace(/\[\s*([^\[\]]*\\[a-zA-Z][^\[\]]*)\s*\]/g, '$1');

  // Superscripts / subscripts
  const sup: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ', 'i': 'ⁱ',
  };
  const sub: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
    'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ', 'n': 'ₙ',
  };
  function toScript(content: string, m: Record<string, string>): string | null {
    if (content.length === 0) return null;
    if (content.split('').every((c) => m[c])) {
      return content.split('').map((c) => m[c]).join('');
    }
    return null;
  }
  s = s.replace(/\^\{([^{}]+)\}/g, (_, c) => toScript(c, sup) ?? `^(${c})`);
  s = s.replace(/\^(\d)/g, (_, c) => toScript(c, sup) ?? `^${c}`);
  s = s.replace(/_\{([^{}]+)\}/g, (_, c) => toScript(c, sub) ?? `_(${c})`);
  s = s.replace(/_(\d)/g, (_, c) => toScript(c, sub) ?? `_${c}`);

  // \command{...} — iterate until stable
  let prev = '';
  let iter = 0;
  while (prev !== s && iter < 15) {
    prev = s;
    iter++;
    s = s.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)');
    s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, '√($1)');
    s = s.replace(/\\(?:text|mathrm|mathbf|mathit|operatorname)\s*\{([^{}]*)\}/g, '$1');
    s = s.replace(/\\boxed\s*\{([^{}]*)\}/g, '$1');
    s = s.replace(/\\(?:overline|bar|hat|vec)\s*\{([^{}]*)\}/g, '$1');
  }

  // \left( \right)
  s = s.replace(/\\left\s*([([{])/g, '$1');
  s = s.replace(/\\right\s*([)\]}])/g, '$1');

  // Simple commands → Unicode
  const simple: [RegExp, string][] = [
    [/\\pi\b/g, 'π'], [/\\alpha\b/g, 'α'], [/\\beta\b/g, 'β'],
    [/\\gamma\b/g, 'γ'], [/\\delta\b/g, 'δ'], [/\\Delta\b/g, 'Δ'],
    [/\\epsilon\b/g, 'ε'], [/\\theta\b/g, 'θ'], [/\\lambda\b/g, 'λ'],
    [/\\mu\b/g, 'μ'], [/\\nu\b/g, 'ν'], [/\\rho\b/g, 'ρ'],
    [/\\sigma\b/g, 'σ'], [/\\Sigma\b/g, 'Σ'], [/\\tau\b/g, 'τ'],
    [/\\phi\b/g, 'φ'], [/\\chi\b/g, 'χ'], [/\\psi\b/g, 'ψ'],
    [/\\omega\b/g, 'ω'], [/\\Omega\b/g, 'Ω'],
    [/\\times\b/g, '×'], [/\\div\b/g, '÷'], [/\\cdot\b/g, '·'],
    [/\\pm\b/g, '±'], [/\\mp\b/g, '∓'],
    [/\\leq?\b/g, '≤'], [/\\geq?\b/g, '≥'], [/\\neq?\b/g, '≠'],
    [/\\approx\b/g, '≈'], [/\\equiv\b/g, '≡'], [/\\infty\b/g, '∞'],
    [/\\sum\b/g, 'Σ'], [/\\prod\b/g, '∏'], [/\\int\b/g, '∫'],
    [/\\partial\b/g, '∂'], [/\\to\b/g, '→'], [/\\rightarrow\b/g, '→'],
    [/\\leftarrow\b/g, '←'], [/\\Rightarrow\b/g, '⇒'],
    [/\\degree\b/g, '°'], [/\\circ\b/g, '°'], [/\\angle\b/g, '∠'],
    [/\\perp\b/g, '⊥'], [/\\parallel\b/g, '∥'],
    [/\\ldots\b/g, '…'], [/\\dots\b/g, '…'], [/\\cdots\b/g, '⋯'],
    [/\\quad\b/g, '  '], [/\\qquad\b/g, '    '],
    [/\\[,;:!]/g, ' '],
    [/\\%/g, '%'], [/\\&/g, '&'], [/\\#/g, '#'],
    [/\\_/g, '_'], [/\\\$/g, '$'], [/\\\{/g, '{'], [/\\\}/g, '}'],
  ];
  for (const [p, r] of simple) s = s.replace(p, r);

  // Orphan / incomplete LaTeX cleanup — handles output truncated mid-formula
  // (see backfill 2000-char truncation). Paired regexes above can't match
  // these, so the raw fragments leak through otherwise.
  s = s.replace(/\\\[[\d.]+\s*(?:mm|cm|pt|em|ex)\\\]/g, ' '); // \[2mm\]
  s = s.replace(/\[\s*\d+(?:\.\d+)?\s*(?:mm|cm|pt|em|ex)\s*\]/g, ' '); // [2mm]
  s = s.replace(/^\s*\\\[\s*$/gm, ''); // orphan \[ on its own line
  s = s.replace(/^\s*\\\]\s*$/gm, ''); // orphan \] on its own line
  s = s.replace(/\\\[/g, ''); // any leftover \[
  s = s.replace(/\\\]/g, ''); // any leftover \]
  s = s.replace(/^\s*end\s*\{[^}]*$/gm, ''); // orphan end{aligned} (unclosed)
  s = s.replace(/^\s*begin\s*\{[^}]*$/gm, ''); // orphan begin{aligned}
  s = s.replace(/\\begin\{[^}]*\}/g, '');
  s = s.replace(/\\end\{[^}]*\}/g, '');
  s = s.replace(/&=/g, '='); // alignment operator
  s = s.replace(/^\s*&\s*/gm, ''); // leading & on a line
  s = s.replace(/\\\\/g, '\n'); // line breaks in align env
  s = s.replace(/\\([a-zA-Z]+)/g, '$1'); // any remaining \word → word

  // Whitespace cleanup
  s = s.replace(/[ \t]+/g, ' ');
  s = s.replace(/\n{3,}/g, '\n\n');

  return s.trim();
}

// Convert markdown headers (##, ###) into **bold** so they render with weight.
function stripMarkdownHeaders(text: string): string {
  return text.replace(/^(#{1,6})\s+(.+)$/gm, (_, _hashes, content) => `**${content}**`);
}

// Bold renderer — splits on **bold** markers and returns styled Text nodes.
function renderBold(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let keyCounter = 0;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));
    parts.push(
      <Text key={`b-${keyCounter++}`} style={{ fontWeight: '600' }}>
        {m[1]}
      </Text>,
    );
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}

// Full pipeline: markdown headers → bold, LaTeX → Unicode, bold segments → styled Text.
function renderRichText(text: string): React.ReactNode {
  const withHeadersAsBold = stripMarkdownHeaders(text);
  return renderBold(latexToUnicode(withHeadersAsBold));
}

export function UnityChatPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const anim = useRef(new Animated.Value(0)).current;

  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const { pendingPrompt, clearPendingPrompt } = useUnityChat();
  const { data: history } = useChatHistory();

  const sendMutation = useSendChatMessage();
  const [pending, setPending] = useState<string | null>(null);
  const [localError, setLocalError] = useState(false);
  const [input, setInput] = useState('');

  const [localAnswers, setLocalAnswers] = useState<Message[]>([]);

  function tapChip(chip: { q: string; a: string }) {
    const ts = Date.now();
    setLocalAnswers((prev) => [
      ...prev,
      { id: `chip-q-${ts}`, from: 'user', text: chip.q },
      { id: `chip-a-${ts + 1}`, from: 'unity', text: chip.a },
    ]);
  }

  const messages: Message[] = [
    { id: 'intro', from: 'unity', text: "Hi! I'm Unity, your AI tutor. What would you like help with today?" },
    ...(history ?? []).map((m): Message => ({
      id: m.id,
      from: m.role,
      text: getDisplayText(m.text),
      followUps: (m as any).context?.followUps,
    })),
    ...localAnswers,
    ...(pending ? [{ id: 'pending', from: 'user' as const, text: getDisplayText(pending) }] : []),
    ...(localError ? [{ id: 'local-error', from: 'unity' as const, text: FALLBACK_REPLY }] : []),
  ];

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [visible, anim]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length, sendMutation.isPending, localAnswers.length]);

  function send(text: string, context?: { questionId?: string; stepId?: string }) {
    if (!text.trim() || sendMutation.isPending) return;
    setPending(text);
    setLocalError(false);
    setInput('');
    sendMutation.mutate(
      { text, context },
      {
        onSettled: () => setPending(null),
        onError: () => setLocalError(true),
      },
    );
  }

  useEffect(() => {
    if (!pendingPrompt) return;
    if (sendMutation.isPending) return;
    const { text, context } = pendingPrompt;
    clearPendingPrompt();
    send(text, context);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt, sendMutation.isPending]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        const horizontalRight = g.dx > 15 && g.dx > Math.abs(g.dy) * 1.3;
        const verticalFromHeader = g.y0 < 120 && g.dy > 15 && g.dy > Math.abs(g.dx) * 1.3;
        return horizontalRight || verticalFromHeader;
      },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > Math.abs(g.dy)) panX.setValue(Math.max(0, g.dx));
        else panY.setValue(Math.max(0, g.dy));
      },
      onPanResponderRelease: (_, g) => {
        const horizontal = Math.abs(g.dx) > Math.abs(g.dy);
        const shouldDismiss = horizontal ? g.dx > 80 || g.vx > 0.5 : g.dy > 80 || g.vy > 0.5;
        if (shouldDismiss) {
          const targetX = horizontal ? PANEL_WIDTH : 0;
          const targetY = horizontal ? 0 : SCREEN_HEIGHT;
          Animated.parallel([
            Animated.timing(panX, { toValue: targetX, duration: 200, useNativeDriver: false }),
            Animated.timing(panY, { toValue: targetY, duration: 200, useNativeDriver: false }),
            Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: false }),
          ]).start(() => {
            panX.setValue(0);
            panY.setValue(0);
            onCloseRef.current();
          });
        } else {
          Animated.parallel([
            Animated.spring(panX, { toValue: 0, useNativeDriver: false, speed: 20, bounciness: 4 }),
            Animated.spring(panY, { toValue: 0, useNativeDriver: false, speed: 20, bounciness: 4 }),
          ]).start();
        }
      },
    }),
  ).current;

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [PANEL_WIDTH, 0] });
  const backdropOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const combinedX = Animated.add(translateX, panX);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.shadowWrap,
          { width: PANEL_WIDTH, transform: [{ translateX: combinedX }, { translateY: panY }] },
        ]}
        {...panResponder.panHandlers}
      >
        <View
          style={[
            styles.panel,
            { backgroundColor: t.colors.bg, paddingTop: insets.top + 12, paddingBottom: insets.bottom },
          ]}
        >
          <View style={styles.grabber}>
            <View style={[styles.grabberBar, { backgroundColor: t.colors.border }]} />
          </View>

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
                  msg.text.length > 250 ? (
                    <View
                      key={msg.id}
                      style={[styles.deepCard, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}
                    >
                      <View style={[styles.deepHeader, { borderBottomColor: t.colors.border }]}>
                        <RobotMascot size={18} />
                        <Text style={[styles.deepHeaderText, { color: t.colors.textSecondary }]}>
                          Unity · Deep explanation
                        </Text>
                      </View>
                      <Text style={[styles.deepBody, { color: t.colors.textPrimary }]}>
                        {msg.text && msg.text.trim().length > 0 ? renderRichText(msg.text) : '(empty response)'}
                      </Text>
                      {msg.followUps && msg.followUps.length > 0 && (
                        <View style={[styles.chipsWrap, { borderTopColor: t.colors.border }]}>
                          <Text style={[styles.chipsLabel, { color: t.colors.textSecondary }]}>Still curious?</Text>
                          {msg.followUps.map((chip, i) => (
                            <Pressable
                              key={i}
                              onPress={() => tapChip(chip)}
                              style={[styles.chip, { borderColor: t.colors.brand, backgroundColor: t.colors.bg }]}
                            >
                              <Text style={[styles.chipText, { color: t.colors.brand }]}>{chip.q}</Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>
                  ) : (
                    <View key={msg.id} style={styles.unityRow}>
                      <RobotMascot size={26} />
                      <View style={[styles.bubble, styles.unityBubble, { backgroundColor: t.colors.surface }]}>
                        <Text style={[styles.bubbleText, { color: t.colors.textPrimary }]}>
                          {renderRichText(msg.text)}
                        </Text>
                      </View>
                    </View>
                  )
                ) : (
                  <View key={msg.id} style={styles.userRow}>
                    <View style={[styles.bubble, styles.userBubble, { backgroundColor: t.colors.brand }]}>
                      <Text style={[styles.bubbleText, { color: t.colors.textInverse }]}>{msg.text}</Text>
                    </View>
                  </View>
                ),
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
                      style={[styles.suggestionChip, { backgroundColor: t.colors.chip, borderColor: t.colors.chipBorder }]}
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
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,10,30,0.4)' },
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
  panel: { flex: 1, borderTopLeftRadius: 22, borderBottomLeftRadius: 22, overflow: 'hidden' },
  grabber: { alignItems: 'center', paddingTop: 6, paddingBottom: 4 },
  grabberBar: { width: 36, height: 4, borderRadius: 2, opacity: 0.5 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
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
  deepCard: { marginVertical: 8, borderRadius: 14, borderWidth: 1, padding: 14 },
  deepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  deepHeaderText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 14,
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  deepBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  chipsWrap: { marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  chipsLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 14, marginBottom: 4 },
  chip: { borderRadius: 10, borderWidth: 1.5, paddingVertical: 10, paddingHorizontal: 12 },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 16 },
});