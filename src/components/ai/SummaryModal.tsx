import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { AIFeatures } from '../../types/AIFeatures';

interface SummaryModalProps {
  visible: boolean;
  onClose: () => void;
  summary?: AIFeatures.ThreadSummary;
  loading: boolean;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  visible,
  onClose,
  summary,
  loading
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Thread Summary</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Generating summary...</Text>
            </View>
          ) : summary ? (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>{summary.summary}</Text>
              {summary.keyPoints && summary.keyPoints.length > 0 && (
                <View style={styles.keyPointsContainer}>
                  <Text style={styles.keyPointsTitle}>Key Points:</Text>
                  {summary.keyPoints.map((point, index) => (
                    <Text key={index} style={styles.keyPoint}>• {point}</Text>
                  ))}
                </View>
              )}
              {summary.actionItems && summary.actionItems.length > 0 && (
                <View style={styles.actionItemsContainer}>
                  <Text style={styles.actionItemsTitle}>Action Items:</Text>
                  {summary.actionItems.map((item, index) => (
                    <Text key={index} style={styles.actionItem}>• {item}</Text>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.errorText}>No summary available</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  summaryContainer: {
    flex: 1,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000000',
    marginBottom: 16,
  },
  keyPointsContainer: {
    marginBottom: 16,
  },
  keyPointsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  keyPoints: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
    marginLeft: 8,
  },
  actionItemsContainer: {
    marginBottom: 16,
  },
  actionItemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  actionItem: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 32,
  },
});
