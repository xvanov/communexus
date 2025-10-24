import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AIFeatures } from '../../types/AIFeatures';

interface DecisionCardProps {
  decision: AIFeatures.Decision;
  onPress?: (decision: AIFeatures.Decision) => void;
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
        <Text style={styles.title}>{decision.title}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{decision.status}</Text>
        </View>
      </View>

      <Text style={styles.description}>{decision.description}</Text>

      <View style={styles.footer}>
        <Text style={styles.dateText}>
          Decided: {formatDate(decision.decidedAt)}
        </Text>
        {decision.decidedBy && (
          <Text style={styles.deciderText}>by {decision.decidedBy}</Text>
        )}
      </View>

      {decision.context && (
        <View style={styles.contextContainer}>
          <Text style={styles.contextLabel}>Context:</Text>
          <Text style={styles.contextText}>{decision.context}</Text>
        </View>
      )}

      {decision.impact && (
        <View style={styles.impactContainer}>
          <Text style={styles.impactLabel}>Impact:</Text>
          <Text style={styles.impactText}>{decision.impact}</Text>
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
  contextContainer: {
    marginBottom: 8,
  },
  contextLabel: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  contextText: {
    color: '#333333',
    fontSize: 13,
    lineHeight: 18,
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
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  impactContainer: {
    marginBottom: 8,
  },
  impactLabel: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  impactText: {
    color: '#333333',
    fontSize: 13,
    lineHeight: 18,
  },
  statusBadge: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    color: '#000000',
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});
