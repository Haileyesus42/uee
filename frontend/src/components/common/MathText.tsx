import React, { useState } from 'react';
import { Text, TextStyle, StyleProp, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

// Ingested question/lesson content stores real LaTeX (see backend/scripts/ingest/
// groq.ts's transcription prompts) — e.g. "$f(x) = (1 - 2x)^\frac{1}{2}$" — but
// until now every screen rendered that string through a plain <Text>, so users
// saw the raw LaTeX source instead of a typeset equation. This renders it with
// KaTeX inside a WebView (react-native-webview ships with Expo Go, no dev-client
// rebuild needed) when the string actually contains math, and falls back to a
// normal <Text> otherwise — most option/prompt strings have no math at all, and
// a WebView per string would be wasteful overhead for plain text.
const HAS_MATH = /\$[^$]+\$/;

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
}

function buildHtml(content: string, fontSize: number, lineHeight: number, color: string, numberOfLines?: number): string {
  // Line-clamping a WebView's content only makes sense paired with a fixed
  // outer height (see the component below) — an auto-resized WebView would
  // just grow to swallow its own "overflow: hidden", defeating the clamp.
  const clampCss = numberOfLines
    ? `display: -webkit-box; -webkit-line-clamp: ${numberOfLines}; -webkit-box-orient: vertical; overflow: hidden;`
    : '';
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
<style>
  * { -webkit-user-select: none; user-select: none; }
  html, body { margin: 0; padding: 0; background: transparent; }
  body {
    font-family: -apple-system, Roboto, sans-serif;
    font-size: ${fontSize}px;
    line-height: ${lineHeight}px;
    color: ${color};
  }
  #content { padding: 0; ${clampCss} }
  .katex { font-size: 1em; }
</style>
</head>
<body>
  <div id="content">${escapeHtml(content)}</div>
  <script>
    function post() {
      var height = document.getElementById('content').scrollHeight;
      window.ReactNativeWebView.postMessage(String(height));
    }
    document.addEventListener('DOMContentLoaded', function () {
      try {
        renderMathInElement(document.getElementById('content'), {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      } catch (e) {}
      setTimeout(post, 50);
    });
  </script>
</body></html>`;
}

export function MathText({
  children,
  style,
  numberOfLines,
}: {
  children: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const flat = StyleSheet.flatten(style) ?? {};
  const fontSize = typeof flat.fontSize === 'number' ? flat.fontSize : 15;
  const lineHeight = typeof flat.lineHeight === 'number' ? flat.lineHeight : Math.round(fontSize * 1.35);
  const color = typeof flat.color === 'string' ? flat.color : '#111111';
  // When clamped, the WebView's height is fixed up front from lineHeight *
  // numberOfLines rather than grown to fit content — see buildHtml's clampCss.
  const clampedHeight = numberOfLines ? lineHeight * numberOfLines : undefined;
  const [height, setHeight] = useState(clampedHeight ?? lineHeight);

  if (!HAS_MATH.test(children)) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {children}
      </Text>
    );
  }

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: buildHtml(children, fontSize, lineHeight, color, numberOfLines) }}
      style={[style, { height: clampedHeight ?? height, backgroundColor: 'transparent' }]}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      onMessage={(e) => {
        if (clampedHeight) return;
        const next = Number(e.nativeEvent.data);
        if (!Number.isNaN(next) && next > 0) setHeight(next);
      }}
    />
  );
}
