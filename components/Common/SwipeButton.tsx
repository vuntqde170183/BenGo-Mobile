import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const SWIPE_WIDTH = width - 40; // padding 20 on both sides
const BUTTON_SIZE = 56;
const SWIPE_RANGE = SWIPE_WIDTH - BUTTON_SIZE;

interface SwipeButtonProps {
  onSwipeSuccess: () => void;
  title: string;
  color?: string; // e.g. '#F59E0B'
}

const SwipeButton = ({ onSwipeSuccess, title, color = '#F59E0B' }: SwipeButtonProps) => {
  const [completed, setCompleted] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !completed,
      onMoveShouldSetPanResponder: () => !completed,
      onPanResponderMove: (_, gestureState) => {
        let newX = gestureState.dx;
        if (newX < 0) newX = 0;
        if (newX > SWIPE_RANGE) newX = SWIPE_RANGE;
        pan.setValue({ x: newX, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_RANGE * 0.75) {
          Animated.spring(pan, {
            toValue: { x: SWIPE_RANGE, y: 0 },
            useNativeDriver: false,
          }).start(() => {
            setCompleted(true);
            onSwipeSuccess();
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={[styles.container, { width: SWIPE_WIDTH }]}>
      <Animated.Text 
        style={[
          styles.text, 
          { color },
          { opacity: pan.x.interpolate({ inputRange: [0, SWIPE_RANGE], outputRange: [1, 0] }) }
        ]}
      >
        {title}
      </Animated.Text>
      
      <Animated.View
        style={[styles.thumb, { backgroundColor: color, transform: [{ translateX: pan.x }] }]}
        {...panResponder.panHandlers}
      >
        <Ionicons name="chevron-forward-outline" size={28} color="#FFF" />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: BUTTON_SIZE,
    backgroundColor: '#F3F4F6', // gray-100
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  text: {
    fontFamily: 'JakartaBold',
    fontSize: 14,
    letterSpacing: 1,
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    zIndex: 1,
  },
  thumb: {
    height: BUTTON_SIZE,
    width: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default SwipeButton;
