import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/constants/theme';
import { TeamMember } from '@/types';

const PALETTE = ['#FF5A1F', '#2F6FED', '#1FA463', '#7A5AF8', '#E5489B', '#0EA5A5'];

function initials(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
}

export function Avatar({ name, index = 0, size = 36 }: { name: string; index?: number; size?: number }) {
  const bg = PALETTE[index % PALETTE.length];
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.initials, { fontSize: size * 0.42 }]}>{initials(name)}</Text>
    </View>
  );
}

type Props = { members: TeamMember[]; max?: number; size?: number };

export function AvatarGroup({ members, max = 5, size = 36 }: Props) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <View style={styles.row}>
      {shown.map((m, i) => (
        <View key={m.id} style={[styles.overlap, { marginLeft: i === 0 ? 0 : -size * 0.3 }]}>
          <Avatar name={m.name} index={i} size={size} />
        </View>
      ))}
      {extra > 0 ? (
        <View style={[styles.overlap, { marginLeft: -size * 0.3 }]}>
          <View style={[styles.avatar, styles.more, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.initials, { color: colors.textSecondary, fontSize: size * 0.36 }]}>+{extra}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  overlap: { borderRadius: radii.pill },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  more: { backgroundColor: colors.surfaceAlt },
  initials: { color: colors.textInverse, fontWeight: '800' },
});
