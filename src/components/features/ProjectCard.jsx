import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/src/components/common/Card';
import Badge from '@/src/components/common/Badge';
import { useTheme } from '@/src/hooks/useTheme';
import { formatDate, truncateText } from '@/src/utils/helpers';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';

const ProjectCard = ({ project, onPress, onDelete }) => {
  const { colors } = useTheme();

  const handleDelete = useCallback(() => {
    onDelete?.(project.id);
  }, [project.id, onDelete]);

  return (
    <Card onPress={() => onPress?.(project)} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>
            {truncateText(project.name, 28)}
          </Text>
          <View style={styles.meta}>
            <Ionicons name="location-outline" size={13} color={colors.textLight} />
            <Text style={[styles.city, { color: colors.textLight }]}> {project.city}</Text>
          </View>
          <Text style={[styles.date, { color: colors.textLight }]}>
            {formatDate(project.created_at)}
          </Text>
        </View>
        <View style={styles.right}>
          {project.score != null && <Badge score={project.score} />}
          <Pressable onPress={handleDelete} style={styles.deleteBtn} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: SPACING.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1, marginRight: SPACING.md },
  name: { ...TYPOGRAPHY.body, fontWeight: '600', marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  city: { ...TYPOGRAPHY.bodySmall },
  date: { ...TYPOGRAPHY.caption, marginTop: 2 },
  right: { alignItems: 'center', gap: SPACING.sm },
  deleteBtn: { padding: 4 },
});

export default React.memo(ProjectCard);