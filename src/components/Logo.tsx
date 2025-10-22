// Logo.tsx - Communexus logo component
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 40, color = '#1E3A8A' }) => {
  const logoSize = size;
  const bubbleSize = logoSize * 0.6;
  const nodeSize = logoSize * 0.15;

  return (
    <View style={[styles.container, { width: logoSize, height: logoSize }]}>
      {/* Speech Bubble */}
      <View
        style={[
          styles.speechBubble,
          {
            width: bubbleSize,
            height: bubbleSize * 0.7,
            backgroundColor: color,
          },
        ]}
      >
        {/* Three dots inside bubble */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, { backgroundColor: '#FFFFFF' }]} />
          <View style={[styles.dot, { backgroundColor: '#FFFFFF' }]} />
          <View style={[styles.dot, { backgroundColor: '#FFFFFF' }]} />
        </View>
      </View>

      {/* Network Structure */}
      <View style={styles.networkContainer}>
        {/* Central Node */}
        <View
          style={[
            styles.node,
            {
              width: nodeSize,
              height: nodeSize,
              backgroundColor: color,
              left: bubbleSize - nodeSize * 0.5,
              top: bubbleSize * 0.3,
            },
          ]}
        />

        {/* Top Node */}
        <View
          style={[
            styles.node,
            {
              width: nodeSize,
              height: nodeSize,
              backgroundColor: color,
              left: bubbleSize - nodeSize * 0.5,
              top: bubbleSize * 0.1,
            },
          ]}
        />

        {/* Bottom Node */}
        <View
          style={[
            styles.node,
            {
              width: nodeSize,
              height: nodeSize,
              backgroundColor: color,
              left: bubbleSize - nodeSize * 0.5,
              top: bubbleSize * 0.5,
            },
          ]}
        />

        {/* Right Node */}
        <View
          style={[
            styles.node,
            {
              width: nodeSize,
              height: nodeSize,
              backgroundColor: color,
              left: bubbleSize + nodeSize * 0.5,
              top: bubbleSize * 0.2,
            },
          ]}
        />

        {/* Connection Lines */}
        <View
          style={[
            styles.line,
            {
              width: nodeSize * 0.3,
              height: 2,
              backgroundColor: color,
              left: bubbleSize - nodeSize * 0.2,
              top: bubbleSize * 0.35,
              transform: [{ rotate: '45deg' }],
            },
          ]}
        />

        <View
          style={[
            styles.line,
            {
              width: nodeSize * 0.3,
              height: 2,
              backgroundColor: color,
              left: bubbleSize - nodeSize * 0.2,
              top: bubbleSize * 0.25,
              transform: [{ rotate: '-45deg' }],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dot: {
    borderRadius: 1.5,
    height: 3,
    width: 3,
  },
  dotsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
  },
  line: {
    position: 'absolute',
  },
  networkContainer: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  node: {
    borderRadius: 50,
    position: 'absolute',
  },
  speechBubble: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    top: 0,
  },
});
