import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontSizes, Spacing } from '../theme/colors';
import { t } from '../utils/i18n';
import { sets } from '../data/musicSets';
import { useAudio } from '../contexts/AudioContext';
import SetCard from './SetCard';

const STATS_API = 'https://airdox.netlify.app/api/stats';

const MusicSection = () => {
  const { playTrack, togglePlay, currentTrack, isPlaying } = useAudio();
  const [globalStats, setGlobalStats] = useState({});
  const [userVotes, setUserVotes] = useState({});

  // Load cached stats and votes
  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsStr, votesStr] = await Promise.all([
          AsyncStorage.getItem('airdox_global_stats'),
          AsyncStorage.getItem('airdox_user_votes'),
        ]);
        if (statsStr) setGlobalStats(JSON.parse(statsStr));
        if (votesStr) setUserVotes(JSON.parse(votesStr));
      } catch {
        // ignore
      }
    };
    loadData();
  }, []);

  // Fetch stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(STATS_API);
        if (res.ok) {
          const data = await res.json();
          if (data && !data._fallback) {
            setGlobalStats(data);
            await AsyncStorage.setItem('airdox_global_stats', JSON.stringify(data));
          }
        }
      } catch {
        // Use cached stats
      }
    };
    fetchStats();
  }, []);

  const handlePlay = (set) => {
    if (currentTrack?.id === set.id) {
      togglePlay();
    } else {
      playTrack(set);
      // Optimistic update
      setGlobalStats((prev) => ({
        ...prev,
        [set.id]: {
          ...prev[set.id],
          plays: (prev[set.id]?.plays || 0) + 1,
        },
      }));
      // API call
      fetch(STATS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: set.id, type: 'play' }),
      }).catch(() => {});
    }
  };

  const handleVote = async (setId, voteType) => {
    const currentVote = userVotes[setId];
    let typeToSend = voteType;

    if (currentVote === voteType) {
      typeToSend = `un${voteType}`;
      const newVotes = { ...userVotes };
      delete newVotes[setId];
      setUserVotes(newVotes);
      await AsyncStorage.setItem('airdox_user_votes', JSON.stringify(newVotes));
    } else {
      if (currentVote) {
        fetch(STATS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: setId, type: `un${currentVote}` }),
        }).catch(() => {});
      }
      const newVotes = { ...userVotes, [setId]: voteType };
      setUserVotes(newVotes);
      await AsyncStorage.setItem('airdox_user_votes', JSON.stringify(newVotes));
    }

    fetch(STATS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: setId, type: typeToSend }),
    }).catch(() => {});
  };

  return (
    <View style={styles.section}>
      <LinearGradient
        colors={['#000000', '#0a0510', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>{t('music.sectionLabel')}</Text>
          <Text style={styles.sectionTitle}>{t('music.title')}</Text>
          <Text style={styles.sectionSubtitle}>{t('music.subtitle')}</Text>
        </View>

        {/* Sets Grid */}
        <View style={styles.grid}>
          {sets.map((set, index) => (
            <SetCard
              key={set.id}
              set={set}
              index={index}
              globalStats={globalStats[set.id]}
              userVote={userVotes[set.id]}
              onPlay={handlePlay}
              onVote={handleVote}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingVertical: Spacing.section,
    position: 'relative',
  },
  container: {
    paddingHorizontal: Spacing.base,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  sectionLabel: {
    fontFamily: 'monospace',
    fontSize: FontSizes.xs,
    color: Colors.neonCyan,
    letterSpacing: 3,
    marginBottom: Spacing.base,
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  sectionSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  grid: {
    gap: Spacing.base,
  },
});

export default MusicSection;
