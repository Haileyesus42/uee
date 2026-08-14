import React from 'react';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

// Ported directly from the reference's inline SVG (viewBox 0 0 220 240) —
// same shapes/gradients/coordinates, just translated to react-native-svg
// element names. Orbit-dot twinkle and float animations from the CSS
// reference aren't replicated (no Animated wiring set up for this pass).
export function RobotMascot({ size = 128 }: { size?: number }) {
  return (
    <Svg width={size} height={(size * 240) / 220} viewBox="0 0 220 240">
      <Defs>
        <LinearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ffffff" />
          <Stop offset="0.55" stopColor="#dfe2f2" />
          <Stop offset="1" stopColor="#a9adcc" />
        </LinearGradient>
        <LinearGradient id="purp" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#9a70ff" />
          <Stop offset="1" stopColor="#6a3ff0" />
        </LinearGradient>
      </Defs>

      <Circle cx={24} cy={34} r={3} fill="#8b5cf6" />
      <Circle cx={198} cy={60} r={2.6} fill="#a78bfa" />
      <Circle cx={14} cy={150} r={2.2} fill="#8b5cf6" />
      <Circle cx={206} cy={152} r={3} fill="#a78bfa" />
      <Circle cx={110} cy={8} r={2.4} fill="#8b5cf6" />

      <Ellipse cx={110} cy={90} rx={102} ry={78} fill="none" stroke="#8b5cf6" strokeOpacity={0.18} />

      <Circle cx={38} cy={80} r={16} fill="url(#metal)" />
      <Circle cx={182} cy={80} r={16} fill="url(#metal)" />
      <Circle cx={38} cy={80} r={7} fill="url(#purp)" />
      <Circle cx={182} cy={80} r={7} fill="url(#purp)" />

      <Rect x={48} y={28} width={124} height={100} rx={48} fill="url(#metal)" />
      <Rect x={64} y={46} width={92} height={64} rx={32} fill="#0d0a17" />

      <Path d="M82 88 Q93 70 104 88" stroke="#a78bfa" strokeWidth={7} fill="none" strokeLinecap="round" />
      <Path d="M116 88 Q127 70 138 88" stroke="#a78bfa" strokeWidth={7} fill="none" strokeLinecap="round" />

      <Ellipse cx={80} cy={40} rx={22} ry={8} fill="#ffffff" opacity={0.35} />

      <Circle cx={110} cy={180} r={54} fill="url(#metal)" />
      <Circle cx={110} cy={180} r={27} fill="url(#purp)" />
      <SvgText x={110} y={191} textAnchor="middle" fontFamily="Manrope_800ExtraBold" fontSize={30} fill="#ffffff">
        U
      </SvgText>
    </Svg>
  );
}
