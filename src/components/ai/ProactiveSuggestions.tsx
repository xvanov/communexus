import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { ProactiveSuggestion } from '../../types/AIFeatures';
import { PriorityBadge } from '../common/PriorityBadge';

interface ProactiveSuggestionsProps {
  suggestions: ProactiveSuggestion[];
  onSuggestionPress?: (suggestion: ProactiveSuggestion) => void;
  onDismiss?: (suggestion: ProactiveSuggestion) => void;
  position?: 'top' | 'bottom';
}

export const ProactiveSuggestions: React.FC<ProactiveSuggestionsProps> = ({
  suggestions,
  onSuggestionPress,
  onDismiss,
  position = 'bottom',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));

  const currentSuggestion =
    suggestions.length > 0 ? suggestions[currentIndex] : null;

  useEffect(() => {
    if (currentSuggestion) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [currentSuggestion, fadeAnim]);

  const handleDismiss = () => {
    if (currentSuggestion) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onDismiss?.(currentSuggestion);
        // Move to next suggestion
        if (currentIndex < suggestions.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      });
    }
  };

  const handlePress = () => {
    if (currentSuggestion) {
      onSuggestionPress?.(currentSuggestion);
      handleDismiss();
    }
  };

  const getTypeIcon = (type: ProactiveSuggestion['type']): string => {
    switch (type) {
      case 'reminder':
        return '⏰';
      case 'followup':
        return '📧';
      case 'action':
        return '✅';
      case 'insight':
        return '💡';
      default:
        return '💬';
    }
  };

  const getTypeLabel = (type: ProactiveSuggestion['type']): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (!currentSuggestion) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        { opacity: fadeAnim },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.header}>
          <View style={styles.typeContainer}>
            <Text style={styles.typeIcon}>
              {getTypeIcon(currentSuggestion.type)}
            </Text>
            <Text style={styles.typeText}>
              {getTypeLabel(currentSuggestion.type)}
            </Text>
          </View>
          <View style={styles.actions}>
            <PriorityBadge priority={currentSuggestion.priority} size="small" />
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.dismissText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.message}>{currentSuggestion.message}</Text>

        {currentSuggestion.suggestedAction && (
          <View style={styles.actionContainer}>
            <Text style={styles.actionLabel}>Suggested:</Text>
            <Text style={styles.actionText}>
              {currentSuggestion.suggestedAction}
            </Text>
          </View>
        )}

        {currentSuggestion.context && (
          <Text style={styles.contextText} numberOfLines={2}>
            Context: {currentSuggestion.context}
          </Text>
        )}

        {suggestions.length > 1 && (
          <View style={styles.pagination}>
            <Text style={styles.paginationText}>
              {currentIndex + 1} of {suggestions.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  actionContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginTop: 8,
    padding: 8,
  },
  actionLabel: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  actionText: {
    color: '#1B5E20',
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  bottomPosition: {
    bottom: 80,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 8,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  container: {
    left: 16,
    position: 'absolute',
    right: 16,
    zIndex: 1000,
  },
  contextText: {
    color: '#8E8E93',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  dismissButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  dismissText: {
    color: '#8E8E93',
    fontSize: 20,
    lineHeight: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  message: {
    color: '#000000',
    fontSize: 15,
    lineHeight: 21,
  },
  pagination: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
  },
  paginationText: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '500',
  },
  topPosition: {
    top: Platform.OS === 'ios' ? 100 : 80,
  },
  typeContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  typeIcon: {
    fontSize: 18,
  },
  typeText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
