import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  FlatList, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useProjects } from '@/src/hooks/useProjects';
import ProjectCard from '@/src/components/features/ProjectCard';
import Loader from '@/src/components/common/Loader';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';

const SORT_OPTIONS = [
  { key: 'date', label: 'Date' },
  { key: 'score', label: 'Score' },
  { key: 'city', label: 'City' },
];

export default function SavedScreen() {
  const { colors } = useTheme();
  const { projects, isLoading, refreshProjects, deleteProject } = useProjects();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date');

  useEffect(() => { refreshProjects(); }, []);

  const filtered = useMemo(() => {
    let list = [...projects];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q)
      );
    }
    if (sort === 'score') list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    else if (sort === 'city') list.sort((a, b) => (a.city ?? '').localeCompare(b.city ?? ''));
    else list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return list;
  }, [projects, search, sort]);

  const handlePress = useCallback((project) => {
    router.push(`/details/${project.id}`);
  }, []);

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <Ionicons name="folder-open-outline" size={52} color={colors.textLight} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No projects yet</Text>
      <Text style={[styles.emptySub, { color: colors.textLight }]}>
        Create your first project to see it here
      </Text>
      <Pressable
        onPress={() => router.push('/new-project')}
        style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
      >
        <Ionicons name="add" size={16} color="#FFFFFF" />
        <Text style={styles.emptyBtnText}>Create New</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Saved Projects</Text>
        <View style={[styles.syncBadge, { backgroundColor: colors.secondary + '15' }]}>
          <Ionicons name="cloud-done-outline" size={13} color={colors.secondary} />
          <Text style={[styles.syncText, { color: colors.secondary }]}>Synced</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textLight} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search projects..."
          placeholderTextColor={colors.textLight}
          style={[styles.searchInput, { color: colors.text }]}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textLight} />
          </Pressable>
        )}
      </View>

      {/* Sort chips */}
      <View style={styles.chipRow}>
        {SORT_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => setSort(opt.key)}
            style={[
              styles.chip,
              {
                backgroundColor: sort === opt.key ? colors.primary : colors.surface,
                borderColor: sort === opt.key ? colors.primary : colors.border,
              },
            ]}
          >
            {sort === opt.key && (
              <Ionicons name="checkmark" size={13} color="#FFFFFF" />
            )}
            <Text style={[
              styles.chipText,
              { color: sort === opt.key ? '#FFFFFF' : colors.textLight },
            ]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loaderWrap}><Loader /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProjectCard
              project={item}
              onPress={handlePress}
              onDelete={deleteProject}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      {projects.length > 0 && (
        <Pressable
          onPress={() => router.push('/new-project')}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </Pressable>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  title: { ...TYPOGRAPHY.h2, fontWeight: '800' },
  syncBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: 20,
  },
  syncText: { ...TYPOGRAPHY.caption, fontWeight: '600' },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: { flex: 1, ...TYPOGRAPHY.body, paddingVertical: 2 },

  chipRow: {
    flexDirection: 'row', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5,
  },
  chipText: { ...TYPOGRAPHY.caption, fontWeight: '600' },

  list: { padding: SPACING.lg, paddingBottom: SPACING.xl + 60 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  emptyWrap: {
    alignItems: 'center', paddingTop: SPACING.xl * 2, gap: SPACING.sm,
  },
  emptyTitle: { ...TYPOGRAPHY.h3, fontWeight: '700', marginTop: SPACING.sm },
  emptySub: { ...TYPOGRAPHY.bodySmall, textAlign: 'center', maxWidth: 220 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: SPACING.md, paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2, borderRadius: 10,
  },
  emptyBtnText: { ...TYPOGRAPHY.body, color: '#FFFFFF', fontWeight: '700' },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
});