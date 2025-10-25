// Logo.tsx - Communexus logo component using PNG image
import React from 'react';
import { Image, StyleSheet, ImageStyle } from 'react-native';

interface LogoProps {
  size?: number;
  style?: ImageStyle;
}

export const Logo: React.FC<LogoProps> = ({ size = 40, style }) => {
  return (
    <Image
      source={require('../../assets/icon.png')}
      style={[
        styles.logo,
        {
          width: size,
          height: size,
        },
        style,
      ]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  logo: {
    // Additional styling can be added here if needed
  },
});
