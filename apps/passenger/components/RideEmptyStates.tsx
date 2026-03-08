import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';

export const PastRidesEmpty = ({ width = 200, height = 200 }: { width?: number; height?: number }) => (
  <Svg width={width} height={height} viewBox="0 0 200 200" fill="none">
    {/* Person body */}
    <G>
      {/* Legs */}
      <Rect x="75" y="120" width="18" height="60" rx="9" fill="#1f2937" />
      <Rect x="107" y="120" width="18" height="60" rx="9" fill="#1f2937" />
      
      {/* Torso */}
      <Rect x="70" y="70" width="60" height="55" rx="8" fill="#10b981" />
      
      {/* Arms raised */}
      <Path
        d="M70 85 L45 70 Q40 68 42 75 L60 95"
        stroke="#d4a574"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M130 85 L155 70 Q160 68 158 75 L140 95"
        stroke="#d4a574"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Head */}
      <Circle cx="100" cy="50" r="20" fill="#d4a574" />
      
      {/* Shoes */}
      <Rect x="73" y="175" width="22" height="8" rx="4" fill="#374151" />
      <Rect x="105" y="175" width="22" height="8" rx="4" fill="#374151" />
    </G>

    {/* Suitcase */}
    <G>
      <Rect x="135" y="125" width="35" height="48" rx="4" fill="#10b981" />
      <Rect x="138" y="128" width="29" height="42" rx="2" fill="#059669" />
      
      {/* Handle */}
      <Path
        d="M147 125 L147 118 Q147 115 150 115 L160 115 Q163 115 163 118 L163 125"
        stroke="#374151"
        strokeWidth="3"
        fill="none"
      />
      
      {/* Wheels */}
      <Circle cx="142" cy="173" r="3" fill="#374151" />
      <Circle cx="163" cy="173" r="3" fill="#374151" />
    </G>
  </Svg>
);

export const UpcomingRidesEmpty = ({ width = 200, height = 200 }: { width?: number; height?: number }) => (
  <Svg width={width} height={height} viewBox="0 0 200 200" fill="none">
    <Defs>
      <LinearGradient id="calendarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#f3f4f6" />
        <Stop offset="100%" stopColor="#e5e7eb" />
      </LinearGradient>
    </Defs>
    
    {/* Calendar */}
    <G>
      {/* Calendar body */}
      <Rect x="50" y="60" width="100" height="110" rx="8" fill="url(#calendarGrad)" />
      <Rect x="50" y="60" width="100" height="30" rx="8" fill="#10b981" />
      
      {/* Calendar rings */}
      <Circle cx="70" cy="65" r="4" fill="#374151" />
      <Circle cx="100" cy="65" r="4" fill="#374151" />
      <Circle cx="130" cy="65" r="4" fill="#374151" />
      
      {/* Grid */}
      <Rect x="60" y="100" width="15" height="15" rx="2" fill="#d1d5db" />
      <Rect x="82" y="100" width="15" height="15" rx="2" fill="#d1d5db" />
      <Rect x="104" y="100" width="15" height="15" rx="2" fill="#d1d5db" />
      <Rect x="126" y="100" width="15" height="15" rx="2" fill="#d1d5db" />
      
      <Rect x="60" y="122" width="15" height="15" rx="2" fill="#d1d5db" />
      <Rect x="82" y="122" width="15" height="15" rx="2" fill="#10b981" opacity="0.8" />
      <Rect x="104" y="122" width="15" height="15" rx="2" fill="#d1d5db" />
      <Rect x="126" y="122" width="15" height="15" rx="2" fill="#d1d5db" />
      
      <Rect x="60" y="144" width="15" height="15" rx="2" fill="#d1d5db" />
      <Rect x="82" y="144" width="15" height="15" rx="2" fill="#d1d5db" />
      <Rect x="104" y="144" width="15" height="15" rx="2" fill="#d1d5db" />
      <Rect x="126" y="144" width="15" height="15" rx="2" fill="#d1d5db" />
    </G>

    {/* Clock overlay */}
    <G>
      {/* Clock background */}
      <Circle cx="135" cy="45" r="28" fill="#10b981" />
      <Circle cx="135" cy="45" r="24" fill="white" />
      
      {/* Clock hands */}
      <Path
        d="M135 45 L135 30"
        stroke="#374151"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M135 45 L148 45"
        stroke="#374151"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* Clock center dot */}
      <Circle cx="135" cy="45" r="3" fill="#10b981" />
    </G>
  </Svg>
);
