import React, { useState } from 'react';
import { Text, TextStyle, StyleProp, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

// Route to WebView if the content looks like math at all — either $...$,
// \(...\), \[...\], or bare LaTeX commands like \boxed, \frac, \pi.
const HAS_MATH = /\$[^$]+\$|\\\(|\\\[|\\[a-zA-Z]+/;

// Bare LaTeX command — anything starting with \ + letters. Used by
// wrapBareLatex to decide whether inline wrapping is needed.
const HAS_BARE_LATEX_COMMAND = /\\[a-zA-Z]+/;

const SINGLE_FRACTION = /^\s*\$?\s*\\(?:d|t)?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}\s*\$?\s*$/;

function tryParseFraction(text: string): { num: string; den: string } | null {
  const m = text.trim().match(SINGLE_FRACTION);
  return m ? { num: m[1], den: m[2] } : null;
}

// Exam content (and some past papers) ship bare LaTeX commands inline, with
// no $...$ or \(...\) delimiters — e.g. "The answer is \frac{1}{2}". KaTeX
// auto-render only recognizes delimited math, so those commands leak through
// as raw backslashes. This wraps each bare \command{...} run in $...$ before
// the WebView sees it, so KaTeX picks it up.
//
// Bracket-form math (e.g. "[ \frac{1}{2} ]") is protected first — the
// WebView's bracketMathToDollarMath converts those to $$...$$ for display
// math, and wrapping the inner command here would break that conversion.
function wrapBareLatex(content: string): string {
  // Already has real delimiters — trust the source, don't double-wrap.
  if (/\$[^$]+\$|\\\(|\\\[/.test(content)) return content;
  // No LaTeX commands at all — return unchanged, no WebView needed.
  if (!HAS_BARE_LATEX_COMMAND.test(content)) return content;

  // Extract bracket-form blocks so the wrapping pass below doesn't touch
  // their inner commands. Placeholders use Unicode private-use chars, which
  // won't appear in real question content or LaTeX source.
  const brackets: string[] = [];
  let text = content.replace(/\[\s*([^\[\]]*\\[a-zA-Z][^\[\]]*)\s*\]/g, (match) => {
    brackets.push(match);
    return `\uE000BRK${brackets.length - 1}\uE001`;
  });

  // Wrap each bare \command or \command{args} in $...$
  text = text.replace(/(\\[a-zA-Z]+(?:\{[^{}]*\})*)/g, (_, cmd) => `$${cmd}$`);

  // Restore bracket blocks
  for (let i = 0; i < brackets.length; i++) {
    text = text.replace(`\uE000BRK${i}\uE001`, brackets[i]);
  }

  return text;
}

function renderPlainWithMath(text: string, fontSize: number, lineHeight: number): React.ReactNode {
  const regex = /([\^_])(?:\(([^)]+)\)|\{([^}]+)\}|(.))/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let keyCounter = 0;

  while ((m = regex.exec(text)) !== null) {
    const [full, marker, parenGroup, braceGroup, singleChar] = m;
    const content = parenGroup ?? braceGroup ?? singleChar;
    const isSuper = marker === '^';

    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));

    parts.push(
      <Text
        key={`ss-${keyCounter++}`}
        style={{
          fontSize: fontSize * 0.68,
          lineHeight: lineHeight * 0.9,
          ...(isSuper
            ? { top: -fontSize * 0.35, position: 'relative' as const }
            : { top: fontSize * 0.15, position: 'relative' as const }),
        }}
      >
        {content}
      </Text>,
    );
    lastIndex = m.index + full.length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}

function buildHtml(
  content: string,
  fontSize: number,
  lineHeight: number,
  color: string,
  numberOfLines?: number,
  markdown?: boolean,
): string {
  const clampCss = numberOfLines
    ? `display: -webkit-box; -webkit-line-clamp: ${numberOfLines}; -webkit-box-orient: vertical; overflow: hidden;`
    : '';

  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<style>
  * { -webkit-user-select: none; user-select: none; }
  html, body { margin: 0; padding: 0; background: transparent; }
  body {
    font-family: -apple-system, Roboto, sans-serif;
    font-size: ${fontSize}px;
    line-height: ${lineHeight}px;
    color: ${color};
    overflow-wrap: break-word;
    word-wrap: break-word;
  }
  #content { padding: 0; ${clampCss} }
  .katex { font-size: 1em; }
  .katex-display { overflow-x: auto; overflow-y: hidden; padding: 4px 0; }
  p { margin: 0 0 8px 0; }
  ul, ol { margin: 0 0 8px 0; padding-left: 20px; }
  h1, h2, h3, h4 { margin: 12px 0 8px 0; font-size: 1.1em; font-weight: 600; }
  code { background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 4px; font-family: monospace; }
  pre { white-space: pre-wrap; word-wrap: break-word; overflow-x: auto; }
  pre code { display: block; padding: 8px; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 8px; font-size: 0.9em; }
  th, td { border: 1px solid rgba(0,0,0,0.1); padding: 4px 8px; text-align: left; }
</style>
</head>
<body>
  <div id="content"></div>
  <script>
    function post() {
      var el = document.getElementById('content');
      if (!el) return;
      var h = Math.max(el.scrollHeight, el.offsetHeight, 1);
      window.ReactNativeWebView.postMessage(String(h));
    }

    function escapeHtml(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br/>');
    }

    function bracketMathToDollarMath(html) {
      // Convert "[ \\command... ]" to "$$ \\command... $$" so KaTeX sees it
      // as display math. Requires the inner content to contain a LaTeX
      // command so a regular sentence in brackets like "[sic]" stays intact.
      return html.replace(/\\[([^\\[\\]]*\\\\[a-zA-Z][^\\[\\]]*)\\]/g, function(_, inner) {
        return '$$' + inner + '$$';
      });
    }

    document.addEventListener('DOMContentLoaded', function () {
      var rawContent = ${JSON.stringify(content)};
      var contentDiv = document.getElementById('content');
      var usedFallback = false;

      try {
        if (${markdown ? 'true' : 'false'}) {
          var latexBlocks = [];
          var protectedText = rawContent.replace(/\\$\\$?[^$]+\\$\\$?/g, function(m) {
            latexBlocks.push(m);
            return 'KATEXBLOCK' + (latexBlocks.length - 1) + 'X';
          });

          protectedText = bracketMathToDollarMath(protectedText);

          var moreBlocks = [];
          protectedText = protectedText.replace(/\\$\\$[^$]+\\$\\$/g, function(m) {
            moreBlocks.push(m);
            return 'KATEXBLOCK' + (latexBlocks.length + moreBlocks.length - 1) + 'X';
          });
          latexBlocks = latexBlocks.concat(moreBlocks);

          contentDiv.innerHTML = marked.parse(protectedText);
          contentDiv.innerHTML = contentDiv.innerHTML.replace(/KATEXBLOCK(\\d+)X/g, function(_, i) {
            return latexBlocks[parseInt(i, 10)] || '';
          });
        } else {
          contentDiv.innerHTML = bracketMathToDollarMath(escapeHtml(rawContent));
        }
      } catch (e) {
        contentDiv.innerHTML = escapeHtml(rawContent);
        usedFallback = true;
      }

      try {
        renderMathInElement(contentDiv, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\\\(', right: '\\\\)', display: false },
            { left: '\\\\[', right: '\\\\]', display: true }
          ],
          throwOnError: false,
          ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
        });
      } catch (e) {}

      var finalLen = (contentDiv.textContent || '').trim().length;
      if (finalLen < 5 && rawContent.length > 5 && !usedFallback) {
        contentDiv.innerHTML = escapeHtml(rawContent);
      }

      post();
      setTimeout(post, 30);
      setTimeout(post, 100);
      setTimeout(post, 300);
      setTimeout(post, 800);
      setTimeout(post, 1500);

      try {
        var obs = new MutationObserver(function () { post(); });
        obs.observe(contentDiv, { childList: true, subtree: true, characterData: true, attributes: true });
      } catch (e) {}
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
  const lineHeight =
    typeof flat.lineHeight === 'number' ? flat.lineHeight : Math.round(fontSize * 1.35);
  const color = typeof flat.color === 'string' ? flat.color : '#111111';
  const clampedHeight = numberOfLines ? lineHeight * numberOfLines : undefined;
  const [height, setHeight] = useState(clampedHeight ?? lineHeight * 3);

  // Fast path 1: single fraction — native, no WebView. Checked on original
  // children so `\frac{1}{2}` (pure) still gets the native fraction view
  // instead of going through the wrapping pass and into KaTeX.
  if (!markdown) {
    const frac = tryParseFraction(children);
    if (frac) {
      return (
        <View style={[style, { justifyContent: 'center' }]}>
          <View style={{ alignSelf: 'flex-start' }}>
            <Text style={{ fontSize, lineHeight, color, textAlign: 'center' }}>{frac.num}</Text>
            <View
              style={{ height: 1, backgroundColor: color, alignSelf: 'stretch', marginVertical: 2 }}
            />
            <Text style={{ fontSize, lineHeight, color, textAlign: 'center' }}>{frac.den}</Text>
          </View>
        </View>
      );
    }
  }

  // Wrap bare inline LaTeX (e.g. "The answer is \frac{1}{2}") into $...$ so
  // KaTeX auto-render picks it up. No-op for content that already has $...$,
  // \(...\), \[...\], or no LaTeX commands at all.
  const processed = markdown ? children : wrapBareLatex(children);

  if (!markdown && !HAS_MATH.test(processed)) {
    // Fast path 2: no math — sup/sub renderer for ^ or _ notation.
    if (/[\^_]/.test(processed)) {
      return (
        <Text style={style} numberOfLines={numberOfLines}>
          {renderPlainWithMath(processed, fontSize, lineHeight)}
        </Text>
      );
    }
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {processed}
      </Text>
    );
  }

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: buildHtml(processed, fontSize, lineHeight, color, numberOfLines, markdown) }}
      style={[style, { height: clampedHeight ?? height, backgroundColor: 'transparent' }]}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      cacheEnabled={true}
      cacheMode="LOAD_CACHE_ELSE_NETWORK"
      onMessage={(e) => {
        if (clampedHeight) return;
        const next = Number(e.nativeEvent.data);
        if (!Number.isNaN(next) && next > 0 && next !== height) {
          setHeight(next);
        }
      }}
    />
  );
}