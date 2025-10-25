import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { ThreadSummary } from '../../types/AIFeatures';
import { Message } from '../../types/Message';

interface SummaryModalProps {
  visible: boolean;
  onClose: () => void;
  threadId: string;
  messages: Message[];
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  visible,
  onClose,
  threadId,
  messages,
}) => {
  const [summary, setSummary] = useState<ThreadSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && messages.length > 0) {
      generateSummary();
    }
  }, [visible, threadId]);

  const generateSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🤖 Calling AI summary via direct HTTP...');

      // Call the emulator directly via HTTP
      const url = __DEV__
        ? 'http://127.0.0.1:5001/communexus/us-central1/aiThreadSummary'
        : 'https://us-central1-communexus.cloudfunctions.net/aiThreadSummary';

      console.log('🌐 URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            threadId,
            messages: messages.map(m => ({
              text: m.text,
              sender: m.senderName,
            })),
          },
        }),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Got result:', result);

      const data = result.result || result.data;
      if (data.success && data.summary) {
        setSummary({
          summary: data.summary,
          keyPoints: data.keyPoints || [],
          actionItems: data.actionItems || [],
          generatedAt: data.generatedAt || new Date().toISOString(),
        });
      } else {
        setError(data.error || 'Failed to generate summary');
      }
    } catch (err: any) {
      console.error('❌ Error generating summary:', err);
      console.error('Error code:', err.code);
      console.error('Error details:', err.details);
      console.error('Error message:', err.message);
      setError(
        `${err.code || 'Error'}: ${err.message || 'Failed to generate summary'}`
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>✨ AI Thread Summary</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            testID="close-summary"
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Generating AI summary...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                onPress={generateSummary}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : summary ? (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>{summary.summary}</Text>
              {summary.keyPoints && summary.keyPoints.length > 0 && (
                <View style={styles.keyPointsContainer}>
                  <Text style={styles.keyPointsTitle}>Key Points:</Text>
                  {summary.keyPoints.map((point, index) => (
                    <Text key={index} style={styles.keyPoint}>
                      • {point}
                    </Text>
                  ))}
                </View>
              )}
              {summary.actionItems && summary.actionItems.length > 0 && (
                <View style={styles.actionItemsContainer}>
                  <Text style={styles.actionItemsTitle}>Action Items:</Text>
                  {summary.actionItems.map((item, index) => (
                    <Text key={index} style={styles.actionItem}>
                      • {item}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages to summarize</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  actionItem: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
    marginVertical: 2,
  },
  actionItemsContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
  },
  actionItemsTitle: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: '#007AFF',
    fontSize: 18,
  },
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: 32,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: 32,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#E5E5E7',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  keyPoint: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
    marginVertical: 2,
  },
  keyPointsContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
  },
  keyPointsTitle: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#666666',
    fontSize: 16,
    marginTop: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryContainer: {
    flex: 1,
  },
  summaryText: {
    color: '#000000',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  title: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
});
