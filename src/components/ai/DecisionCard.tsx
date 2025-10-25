import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AIDecision } from '../../types/AIFeatures';

interface DecisionCardProps {
  decision: AIDecision;
  onPress?: (decision: AIDecision) => void;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({
  decision,
  onPress,
}) => {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(decision)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {decision.decision}
        </Text>
      </View>

      <Text style={styles.description}>{decision.context}</Text>

      <View style={styles.footer}>
        <Text style={styles.dateText}>📅 {formatDate(decision.decidedAt)}</Text>
        {decision.markedBy && (
          <Text style={styles.deciderText}>by {decision.markedBy}</Text>
        )}
      </View>

      {decision.participants && decision.participants.length > 0 && (
        <View style={styles.participantsContainer}>
          <Text style={styles.participantsLabel}>
            👥 Participants: {decision.participants.join(', ')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderLeftColor: '#007AFF',
    borderLeftWidth: 4,
    borderRadius: 12,
    elevation: 3,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateText: {
    color: '#666666',
    fontSize: 12,
  },
  deciderText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  header: {
    marginBottom: 8,
  },
  participantsContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginTop: 8,
    padding: 8,
  },
  participantsLabel: {
    color: '#666666',
    fontSize: 12,
  },
  title: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
