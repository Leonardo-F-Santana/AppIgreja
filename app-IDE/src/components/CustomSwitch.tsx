import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
}

const SWITCH_WIDTH = 56;
const SWITCH_HEIGHT = 32;
const THUMB_SIZE = 26;
const PADDING = (SWITCH_HEIGHT - THUMB_SIZE) / 2; // 3
const TRANSLATE_X_MAX = SWITCH_WIDTH - THUMB_SIZE - PADDING * 2; // 24

export default function CustomSwitch({ value, onValueChange, label }: CustomSwitchProps) {
  const progress = useSharedValue(value ? 1 : 0);
  const isPressed = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, {
      mass: 1,
      damping: 15,
      stiffness: 120,
      overshootClamping: false,
    });
  }, [value, progress]);

  const handlePressIn = () => {
    isPressed.value = withSpring(1, { mass: 1, damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    isPressed.value = withSpring(0, { mass: 1, damping: 15, stiffness: 200 });
  };

  const trackAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ['#333333', '#4ade80'] // Modern dark gray to vibrant green
    );
    return { backgroundColor };
  });

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    // Squish effect: the thumb stretches slightly when pressed
    const extraWidth = interpolate(isPressed.value, [0, 1], [0, 8]);
    const width = THUMB_SIZE + extraWidth;
    
    // Adjust translation so the stretching always goes inward, never overflowing the track
    const baseTranslateX = progress.value * TRANSLATE_X_MAX;
    const adjustTranslateX = interpolate(progress.value, [0, 1], [0, -extraWidth]);
    
    const translateX = baseTranslateX + adjustTranslateX;

    return {
      width,
      transform: [{ translateX }],
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    // The check icon smoothly fades in, scales up, and rotates into place
    return {
      opacity: progress.value,
      transform: [
        { scale: progress.value },
        { rotate: `${interpolate(progress.value, [0, 1], [-90, 0])}deg` }
      ],
    };
  });

  return (
    <Pressable
      style={styles.wrapper}
      onPress={() => onValueChange(!value)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={10}
    >
      <Animated.View style={[styles.track, trackAnimatedStyle]}>
        <Animated.View style={[styles.thumb, thumbAnimatedStyle]}>
          <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
            <Feather name="check" size={16} color="#4ade80" />
          </Animated.View>
        </Animated.View>
      </Animated.View>
      {label && <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  track: {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    borderRadius: SWITCH_HEIGHT / 2,
    padding: PADDING,
    justifyContent: 'center',
  },
  thumb: {
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginLeft: 12,
    color: '#E0E0E0',
    fontSize: 16,
    fontWeight: '500',
  },
});
