import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  FlatList, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useProjects } from '@/src/hooks/useProjects';
import ProjectCard from '@/src/components/features/ProjectCard';
import Loader from '@/src/components/common/Loader';
import { SPACING, TYPOGRAPHY } from '@/src/utils/constants';

const SORT_OPTIONS = [
  { key: 'date',  label: 'Date'  },
  { key: 'score', label: 'Score' },
  { key: 'city',  label: 'City'  },
];

export default function SavedScreen() {
  const { colors } = useTheme();
  const { projects, isLoading, refreshProjects, deleteProject } = useProjects();
  const [search, setSearch] = useState('');
  const [sort, setSort]     = useState('date');

  useEffect(() => { refreshProjects(); }, []);

  const filtered = useMemo(() => {
    let list = [...projects];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q)
      );
    }
    if (sort === 'score')     list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    else if (sort === 'city') list.sort((a, b) => (a.city ?? '').localeCompare(b.city ?? ''));
    else                      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return list;
  }, [projects, search, sort]);

  const handlePress = useCallback((project) => {
    router.push(`/details/${project.id}`);
  }, []);

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <LinearGradient
        colors={['#9760d225', '#06B6D425']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyIconCircle}
      >
        <Ionicons name="folder-open-outline" size={44} color={colors.textLight} />
      </LinearGradient>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No projects yet</Text>
      <Text style={[styles.emptySub, { color: colors.textLight }]}>
        Create your first project to see it here
      </Text>
      <LinearGradient
        colors={['#6366F1', '#06B6D4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyBtnGradient}
      >
        <Pressable
          onPress={() => router.push('/new-project')}
          style={({ pressed }) => [styles.emptyBtn, { opacity: pressed ? 0.88 : 1 }]}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.emptyBtnText}>Create New</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Saved Projects</Text>
          {/* Gradient underline below title */}
          <LinearGradient
            colors={['#9760d2', '#7ee887']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titleUnderline}
          />
        </View>
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
        {SORT_OPTIONS.map((opt) => {
          const active = sort === opt.key;
          return active ? (
            <LinearGradient
              key={opt.key}
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.chipGradient}
            >
              <Pressable
                onPress={() => setSort(opt.key)}
                style={styles.chipInner}
              >
                <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                <Text style={[styles.chipText, { color: '#FFFFFF' }]}>{opt.label}</Text>
              </Pressable>
            </LinearGradient>
          ) : (
            <Pressable
              key={opt.key}
              onPress={() => setSort(opt.key)}
              style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.chipText, { color: colors.textLight }]}>{opt.label}</Text>
            </Pressable>
          );
        })}
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

      {/* Gradient FAB */}
      {projects.length > 0 && (
        <LinearGradient
          colors={['#6366F1', '#06B6D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Pressable
            onPress={() => router.push('/new-project')}
            style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.88 : 1 }]}
          >
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </Pressable>
        </LinearGradient>
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
  titleUnderline: {
    height: 2, borderRadius: 1,
    marginTop: 4, width: '100%',
  },
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
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
  },
  chipGradient: { borderRadius: 20 },
  chipInner: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.md, paddingVertical: 6,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5,
  },
  chipText: { ...TYPOGRAPHY.caption, fontWeight: '600' },

  list: { padding: SPACING.lg, paddingBottom: SPACING.xl + 60 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  emptyWrap: { alignItems: 'center', paddingTop: SPACING.xl * 2, gap: SPACING.sm },
  emptyIconCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { ...TYPOGRAPHY.h3, fontWeight: '700', marginTop: SPACING.sm },
  emptySub: { ...TYPOGRAPHY.bodySmall, textAlign: 'center', maxWidth: 220 },
  emptyBtnGradient: { borderRadius: 10, marginTop: SPACING.md },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2,
  },
  emptyBtnText: { ...TYPOGRAPHY.body, color: '#FFFFFF', fontWeight: '700' },

  fabGradient: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  fab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});