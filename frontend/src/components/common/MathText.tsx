import React, { useState } from 'react';
import { Text, TextStyle, StyleProp, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

const HAS_MATH = /\$[^$]+\$/;
// Deliberately broad, not precise: `*`/`_`/`` ` `` anywhere covers bold,
// italic, and inline code (including single-char emphasis, not just **bold**)
// without needing to distinguish them, plus headings/list items/links. Erring
// toward "treat as markdown" is the safe direction here — the cost of a false
// positive is just an unnecessary WebView for plain text that happens to
// contain a literal asterisk; a false negative would silently show literal
// `*`/`_` characters instead of parsed formatting, which is worse.
const HAS_MARKDOWN = /[*_`]|^#{1,4}\s|^[-+]\s|^\d+\.\s|\[.+\]\(.+\)/m;

function tryParseFraction(text: string): { num: string; den: string } | null {
  const m = text.trim().match(/^\s*\$?\s*\\(?:d|t)?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}\s*\$?\s*$/);
  return m ? { num: m[1], den: m[2] } : null;
}

function buildHtml(content: string, fontSize: number, lineHeight: number, color: string, numberOfLines?: number, markdown?: boolean): string {
  const clampCss = numberOfLines
    ? `display: -webkit-box; -webkit-line-clamp: ${numberOfLines}; -webkit-box-orient: vertical; overflow: hidden;`
    : '';
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked@13.0.3/marked.min.js"></script>
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
  p { margin: 0 0 8px 0; }
  ul, ol { margin: 0 0 8px 0; padding-left: 20px; }
  h1, h2, h3, h4 { margin: 12px 0 8px 0; font-size: 1.1em; font-weight: 600; }
  code { background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 4px; font-family: monospace; }
  pre code { display: block; padding: 8px; overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 8px; font-size: 0.9em; }
  th, td { border: 1px solid rgba(0,0,0,0.1); padding: 4px 8px; text-align: left; }
</style>
</head>
<body>
  <div id="content"></div>
  <script>
    function post() {
      var height = document.getElementById('content').scrollHeight;
      window.ReactNativeWebView.postMessage(String(height));
    }
    document.addEventListener('DOMContentLoaded', function () {
      var rawContent = ${JSON.stringify(content)};
      var contentDiv = document.getElementById('content');
      
      function escapeHtml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br/>');
      }

      if (${markdown ? 'true' : 'false'}) {
        // A script failing to load (CDN hiccup, this device's network) leaves
        // marked undefined — marked.parse() throwing here used to be
        // uncaught, which skipped setTimeout(post) entirely and left the
        // WebView permanently stuck at its initial tiny height with nothing
        // ever rendered. Falls back to escaped plain text instead of leaving
        // the bubble blank.
        try {
          contentDiv.innerHTML = marked.parse(rawContent);
        } catch (e) {
          contentDiv.innerHTML = escapeHtml(rawContent);
        }
      } else {
        contentDiv.innerHTML = escapeHtml(rawContent);
      }

      try {
        renderMathInElement(contentDiv, {
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
  markdown = false,
}: {
  children: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  markdown?: boolean;
}) {
  const flat = StyleSheet.flatten(style) ?? {};
  const fontSize = typeof flat.fontSize === 'number' ? flat.fontSize : 15;
  const lineHeight = typeof flat.lineHeight === 'number' ? flat.lineHeight : Math.round(fontSize * 1.35);
  const color = typeof flat.color === 'string' ? flat.color : '#111111';
  const clampedHeight = numberOfLines ? lineHeight * numberOfLines : undefined;
  const [height, setHeight] = useState(clampedHeight ?? lineHeight);

  if (!markdown) {
    const frac = tryParseFraction(children);
    if (frac) {
      return (
        <View style={[style, { justifyContent: 'center' }]}>
          <View style={{ alignSelf: 'flex-start' }}>
            <Text style={{ fontSize, lineHeight, color, textAlign: 'center' }}>{frac.num}</Text>
            <View style={{ height: 1, backgroundColor: color, alignSelf: 'stretch', marginVertical: 2 }} />
            <Text style={{ fontSize, lineHeight, color, textAlign: 'center' }}>{frac.den}</Text>
          </View>
        </View>
      );
    }
  }

  // Plain-text fast path applies in both modes, not just non-markdown: a
  // WebView is real, non-trivial cost on weak/older Android devices — one
  // spun up per message, each pulling in 3-4 external CDN scripts — and most
  // markdown=true text (ordinary chat replies) has no math or markdown syntax
  // in it at all. Forcing all of it through WebView regardless of content is
  // what let multiple concurrent instances crash the shared WebView renderer
  // process on a low-end test device, taking every open WebView blank with it
  // — including this one, independent of what it was even trying to show.
  if (!HAS_MATH.test(children) && (!markdown || !HAS_MARKDOWN.test(children))) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {children}
      </Text>
    );
  }

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: buildHtml(children, fontSize, lineHeight, color, numberOfLines, markdown) }}
      style={[style, { height: clampedHeight ?? height, backgroundColor: 'transparent' }]}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      cacheEnabled={true}
      cacheMode="LOAD_CACHE_ELSE_NETWORK"
      onMessage={(e) => {
        if (clampedHeight) return;
        const next = Number(e.nativeEvent.data);
        if (!Number.isNaN(next) && next > 0) setHeight(next);
      }}
    />
  );
}

export function MathPreloader() {
  return (
    <View pointerEvents="none" style={{ width: 0, height: 0, overflow: 'hidden', position: 'absolute' }}>
      <WebView
        source={{ html: buildHtml('$x$', 12, 16, '#000') }}
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        style={{ width: 1, height: 1 }}
      />
    </View>
  );
}