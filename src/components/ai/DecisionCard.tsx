import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AIFeatures } from '../../types/AIFeatures';

interface DecisionCardProps {
  decision: AIFeatures.Decision;
  onPress?: (decision: AIFeatures.Decision) => void;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({
  decision,
  onPress
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
          <Text style={styles.deciderText}>
            by {decision.decidedBy}
          </Text>
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#666666',
  },
  deciderText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  contextContainer: {
    marginBottom: 8,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  contextText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#333333',
  },
  impactContainer: {
    marginBottom: 8,
  },
  impactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  impactText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#333333',
  },
});
