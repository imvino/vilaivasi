import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useAudioPlayer } from 'expo-audio';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';

interface AudioBubbleProps {
  audioUri: string;
}

const AudioBubble: React.FC<AudioBubbleProps> = ({ audioUri }) => {
  const player: any = useAudioPlayer(audioUri);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  
  const progressWidth = useSharedValue(0);
  const PROGRESS_BAR_WIDTH = 150;
  
  // Generate static waveform once to prevent re-rendering
  const waveformBars = React.useMemo(() => {
    const bars = [];
    for (let i = 0; i < 30; i++) {
      bars.push(Math.random() * 12 + 4); // Random height between 4-16
    }
    return bars;
  }, [audioUri]); // Only regenerate if audioUri changes

  // Initialize duration once
  React.useEffect(() => {
    if (player?.duration && duration === 0) {
      setDuration(player.duration);
    }
  }, [player?.duration, duration]);

  // Set up interval for time updates only when playing
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isPlaying) {
      interval = setInterval(() => {
        if (player?.currentTime !== undefined) {
          const currentPos = player.currentTime;
          setCurrentTime(currentPos);
          
          if (!isDragging && duration > 0) {
            progressWidth.value = (currentPos / duration) * PROGRESS_BAR_WIDTH;
          }
          
          // Check if finished
          if (duration > 0 && currentPos >= duration - 0.1) {
            setIsPlaying(false);
            setCurrentTime(duration);
            progressWidth.value = PROGRESS_BAR_WIDTH;
          }
        }
      }, 200);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, duration, isDragging]); // Removed player from deps to prevent loop

  // Format duration in mm:ss
  const formatDuration = (sec: number) => {
    if (!sec && sec !== 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const onToggle = React.useCallback(async () => {
    try {
      if (isPlaying) {
        // Pause audio
        if (player?.pause) {
          await player.pause();
        }
        setIsPlaying(false);
      } else {
        // If at end, seek back to start before playing
        if (duration > 0 && currentTime >= duration - 0.1) {
          if (player?.seekTo) {
            await player.seekTo(0);
          }
          setCurrentTime(0);
          progressWidth.value = 0;
        }
        
        // Play audio
        if (player?.play) {
          await player.play();
        }
        setIsPlaying(true);
      }
    } catch (error) {
      console.warn('Audio playback error:', error);
    }
  }, [isPlaying, duration, currentTime, player, progressWidth]);

  const seekTo = React.useCallback(async (position: number) => {
    try {
      if (player?.seekTo) {
        await player.seekTo(position);
        setCurrentTime(position);
      } else {
        console.warn('Seek not supported by current audio player');
      }
    } catch (error) {
      console.warn('Seek error:', error);
    }
  }, [player]);

  const onPanGestureEvent = React.useCallback((event: any) => {
    if (duration > 0) {
      const x = event.nativeEvent.x;
      const newProgress = Math.max(0, Math.min(PROGRESS_BAR_WIDTH, x));
      progressWidth.value = newProgress;
      const newTime = (newProgress / PROGRESS_BAR_WIDTH) * duration;
      runOnJS(setCurrentTime)(newTime);
    }
  }, [duration, progressWidth]);

  const onPanStateChange = React.useCallback((event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      setIsDragging(true);
    } else if (
      event.nativeEvent.state === State.END ||
      event.nativeEvent.state === State.CANCELLED ||
      event.nativeEvent.state === State.FAILED
    ) {
      setIsDragging(false);
      const newTime = (progressWidth.value / PROGRESS_BAR_WIDTH) * duration;
      runOnJS(seekTo)(newTime);
    }
  }, [progressWidth, duration, seekTo]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: progressWidth.value,
    };
  });

  // Generate waveform bars using memoized heights
  const renderWaveform = () => {
    return waveformBars.map((height, i) => (
      <View
        key={i}
        style={[
          styles.waveBar,
          {
            height,
            backgroundColor: (currentTime / duration) * 30 > i ? '#4CAF50' : '#E0E0E0'
          }
        ]}
      />
    ));
  };

  return (
    <View style={styles.audioContainer}>
      <View style={styles.audioRow}>
        <TouchableOpacity style={styles.audioButton} onPress={onToggle}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={'#4CAF50'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.waveformContainer}
          onPress={(event) => {
            if (duration > 0) {
              const { locationX } = event.nativeEvent;
              const newTime = (locationX / PROGRESS_BAR_WIDTH) * duration;
              seekTo(newTime);
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.waveform}>
            {duration > 0 ? renderWaveform() : (
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground} />
                <Animated.View style={[styles.progressBar, progressStyle]} />
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        <View style={styles.timeContainer}>
          <Text style={styles.currentTime}>{formatDuration(currentTime)}</Text>
          <Text style={styles.totalDuration}>/{formatDuration(duration)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  audioContainer: {
    minWidth: 280,
    paddingVertical: 4,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  audioButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  waveformContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    justifyContent: 'space-between',
  },
  waveBar: {
    width: 2,
    borderRadius: 1,
    marginHorizontal: 0.5,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    flex: 1,
    position: 'relative',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    position: 'absolute',
    width: '100%',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
    position: 'absolute',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  currentTime: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  totalDuration: {
    fontSize: 11,
    color: '#6B7280',
  },
});

export default AudioBubble;
