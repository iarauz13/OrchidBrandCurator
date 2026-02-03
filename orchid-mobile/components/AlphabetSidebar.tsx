import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';

interface AlphabetSidebarProps {
  letters: string[];
  activeLetter: string;
  onLetterPress: (letter: string) => void;
  theme: {
    text: string;
    textTertiary: string;
    tint: string;
    background: string;
  };
}

const ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'
];

export const AlphabetSidebar: React.FC<AlphabetSidebarProps> = ({
  letters,
  activeLetter,
  onLetterPress,
  theme,
}) => {
  return (
    <View style={styles.container}>
      {ALPHABET.map((letter) => {
        const hasContent = letters.includes(letter);
        const isActive = activeLetter === letter;

        return (
          <TouchableOpacity
            key={letter}
            onPress={() => hasContent && onLetterPress(letter)}
            disabled={!hasContent}
            style={[
              styles.letterButton,
              isActive && { backgroundColor: theme.tint }
            ]}
          >
            <Text
              style={[
                styles.letterText,
                {
                  color: isActive
                    ? '#fff'
                    : hasContent
                      ? theme.text
                      : theme.textTertiary,
                  fontWeight: isActive ? '700' : hasContent ? '600' : '400',
                  opacity: hasContent ? 1 : 0.4,
                }
              ]}
            >
              {letter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    zIndex: 10,
  } as ViewStyle,
  letterButton: {
    width: 20,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  } as ViewStyle,
  letterText: {
    fontSize: 11,
    textAlign: 'center',
  } as TextStyle,
});
