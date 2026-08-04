import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Pressable,
  Linking,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function SocialFabMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 5,
      tension: 50,
      useNativeDriver: true,
    }).start();
    setIsOpen(!isOpen);
  };

  const handlePress = (url: string) => {
    Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
    toggleMenu(); // Close after press
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Calculate positions for radial menu
  // Using an arc opening upwards and to the left (angles: 180, 135, 90 degrees relative to center right)
  // Distance: 80px

  const getTransform = (angleDeg: number, distance: number) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    const translateX = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, distance * Math.cos(angleRad)],
    });
    const translateY = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, distance * Math.sin(angleRad)],
    });
    const scale = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });
    return [{ translateX }, { translateY }, { scale }];
  };

  const instagramTransform = getTransform(-90, 80); // Straight up
  const youtubeTransform = getTransform(-135, 80);  // Up and Left
  const facebookTransform = getTransform(-180, 80); // Straight Left

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents="box-none">
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={isOpen ? toggleMenu : undefined}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: backdropOpacity },
          ]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        />
      </TouchableWithoutFeedback>

      {/* FAB Container */}
      <View style={styles.fabContainer} pointerEvents="box-none">

        {/* Instagram */}
        <Animated.View style={[styles.secondaryButtonWrapper, { transform: instagramTransform }]} pointerEvents={isOpen ? 'auto' : 'none'}>
          <Pressable
            style={[styles.secondaryButton, { borderColor: 'rgba(225, 48, 108, 0.4)' }]}
            onPress={() => handlePress('https://www.instagram.com/ministerioide.rj/')}
          >
            <Feather name="instagram" size={20} color="#E1306C" />
          </Pressable>
        </Animated.View>

        {/* YouTube */}
        <Animated.View style={[styles.secondaryButtonWrapper, { transform: youtubeTransform }]} pointerEvents={isOpen ? 'auto' : 'none'}>
          <Pressable
            style={[styles.secondaryButton, { borderColor: 'rgba(255, 0, 0, 0.4)' }]}
            onPress={() => handlePress('https://www.youtube.com/@MinisterioIDE_rj')}
          >
            <Feather name="youtube" size={20} color="#FF0000" />
          </Pressable>
        </Animated.View>

        {/* Facebook */}
        <Animated.View style={[styles.secondaryButtonWrapper, { transform: facebookTransform }]} pointerEvents={isOpen ? 'auto' : 'none'}>
          <Pressable
            style={[styles.secondaryButton, { borderColor: 'rgba(24, 119, 242, 0.4)' }]}
            onPress={() => handlePress('https://www.facebook.com/ministerioiderj')}
          >
            <Feather name="facebook" size={20} color="#1877F2" />
          </Pressable>
        </Animated.View>

        {/* Main Button */}
        <Pressable onPress={toggleMenu} style={styles.mainButton}>
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Feather name="plus" size={28} color="#FFFFFF" />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(15, 15, 25, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    position: 'absolute',
    zIndex: 102,
  },
  secondaryButtonWrapper: {
    position: 'absolute',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 101,
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 15, 25, 0.95)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});
