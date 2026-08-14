import React from 'react';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// Just the head — same coordinates/gradients as RobotMascot, viewBox cropped
// right above where the body would start, for the small floating bubble.
export function RobotHead({ size = 34 }: { size?: number }) {
  return (
    <Svg width={size} height={(size * 132) / 220} viewBox="0 0 220 132">
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

      <Circle cx={38} cy={80} r={16} fill="url(#metal)" />
      <Circle cx={182} cy={80} r={16} fill="url(#metal)" />
      <Circle cx={38} cy={80} r={7} fill="url(#purp)" />
      <Circle cx={182} cy={80} r={7} fill="url(#purp)" />

      <Rect x={48} y={28} width={124} height={100} rx={48} fill="url(#metal)" />
      <Rect x={64} y={46} width={92} height={64} rx={32} fill="#0d0a17" />

      <Path d="M82 88 Q93 70 104 88" stroke="#a78bfa" strokeWidth={7} fill="none" strokeLinecap="round" />
      <Path d="M116 88 Q127 70 138 88" stroke="#a78bfa" strokeWidth={7} fill="none" strokeLinecap="round" />

      <Ellipse cx={80} cy={40} rx={22} ry={8} fill="#ffffff" opacity={0.35} />
    </Svg>
  );
}
