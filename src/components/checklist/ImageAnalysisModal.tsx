// ImageAnalysisModal.tsx - Modal for displaying image analysis results
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  ImageAnalysisResult,
  MatchedItem,
  ConfidenceLevel,
} from '../../services/visionAnalysisService';
import { ChecklistItem } from '../../types/Checklist';

interface ImageAnalysisModalProps {
  visible: boolean;
  imageUrl: string;
  analysis: ImageAnalysisResult | null;
  matchedItems: MatchedItem[];
  loading?: boolean;
  onApprove: (item: ChecklistItem, photoUrl: string) => void;
  onReject: (item: ChecklistItem) => void;
  onClose: () => void;
}

interface Suggestion {
  item: ChecklistItem;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  reasoning?: string;
  approved: boolean;
  rejected: boolean;
}

export const ImageAnalysisModal: React.FC<ImageAnalysisModalProps> = ({
  visible,
  imageUrl,
  analysis,
  matchedItems,
  loading = false,
  onApprove,
  onReject,
  onClose,
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Update suggestions when matchedItems change
  React.useEffect(() => {
    if (matchedItems && matchedItems.length > 0) {
      const newSuggestions: Suggestion[] = matchedItems.map(match => ({
        item: match.item,
        confidence: match.confidence,
        confidenceScore: match.confidenceScore,
        reasoning: match.reasoning,
        approved: false,
        rejected: false,
      }));
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [matchedItems]);

  const getConfidenceColor = (confidence: ConfidenceLevel) => {
    switch (confidence) {
      case 'high':
        return '#34C759'; // Green
      case 'medium':
        return '#FF9500'; // Orange
      case 'low':
        return '#FF3B30'; // Red
      default:
        return '#8E8E93'; // Gray
    }
  };

  const getConfidenceText = (confidence: ConfidenceLevel) => {
    return confidence.charAt(0).toUpperCase() + confidence.slice(1);
  };

  const getCompletionStatusText = (status: string) => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'incomplete':
        return 'Incomplete';
      case 'partial':
        return 'Partially Complete';
      case 'unknown':
        return 'Unknown';
      default:
        return status;
    }
  };

  const handleApprove = (suggestion: Suggestion) => {
    setSuggestions(prev =>
      prev.map(s =>
        s.item.id === suggestion.item.id ? { ...s, approved: true } : s
      )
    );
    onApprove(suggestion.item, imageUrl);
  };

  const handleReject = (suggestion: Suggestion) => {
    setSuggestions(prev =>
      prev.map(s =>
        s.item.id === suggestion.item.id ? { ...s, rejected: true } : s
      )
    );
    onReject(suggestion.item);
  };

  const pendingSuggestions = suggestions.filter(
    s => !s.approved && !s.rejected
  );
  const approvedSuggestions = suggestions.filter(s => s.approved);
  const rejectedSuggestions = suggestions.filter(s => s.rejected);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal} testID="image-analysis-modal">
          <View style={styles.header}>
            <Text style={styles.title}>Image Analysis Results</Text>
            <TouchableOpacity
              testID="close-modal-button"
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Image Preview */}
            {imageUrl && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Loading State */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Analyzing image...</Text>
              </View>
            )}

            {/* Analysis Results */}
            {analysis && !loading && (
              <>
                {/* Summary */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Summary</Text>
                  <Text style={styles.summaryText}>{analysis.summary}</Text>
                </View>

                {/* Completion Status */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Completion Status</Text>
                  <Text style={styles.statusText}>
                    {getCompletionStatusText(analysis.completionStatus)}
                  </Text>
                </View>

                {/* Detected Tasks */}
                {analysis.detectedTasks && analysis.detectedTasks.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detected Tasks</Text>
                    {analysis.detectedTasks.map((task, index) => (
                      <View key={index} style={styles.taskItem}>
                        <Text style={styles.taskDescription}>
                          • {task.description}
                        </Text>
                        <View style={styles.confidenceContainer}>
                          <View
                            style={[
                              styles.confidenceBar,
                              {
                                width: `${task.confidenceScore * 100}%`,
                                backgroundColor: getConfidenceColor(
                                  task.confidence
                                ),
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.confidenceText,
                              {
                                color: getConfidenceColor(task.confidence),
                              },
                            ]}
                          >
                            {getConfidenceText(task.confidence)} (
                            {Math.round(task.confidenceScore * 100)}%)
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Suggested Updates */}
                {pendingSuggestions.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Suggested Updates</Text>
                    {pendingSuggestions.map((suggestion, index) => (
                      <View
                        key={suggestion.item.id}
                        style={styles.suggestionItem}
                        testID={`suggestion-${suggestion.item.id}`}
                      >
                        <Text style={styles.suggestionText}>
                          Mark "{suggestion.item.title}" as complete?
                        </Text>
                        {suggestion.reasoning && (
                          <Text style={styles.reasoningText}>
                            {suggestion.reasoning}
                          </Text>
                        )}
                        <View style={styles.confidenceContainer}>
                          <View
                            style={[
                              styles.confidenceBar,
                              {
                                width: `${suggestion.confidenceScore * 100}%`,
                                backgroundColor: getConfidenceColor(
                                  suggestion.confidence
                                ),
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.confidenceText,
                              {
                                color: getConfidenceColor(suggestion.confidence),
                              },
                            ]}
                          >
                            {getConfidenceText(suggestion.confidence)} (
                            {Math.round(suggestion.confidenceScore * 100)}%)
                          </Text>
                        </View>
                        <View style={styles.suggestionButtons}>
                          <TouchableOpacity
                            testID={`reject-suggestion-${suggestion.item.id}`}
                            style={[styles.suggestionButton, styles.rejectButton]}
                            onPress={() => handleReject(suggestion)}
                          >
                            <Text style={styles.rejectButtonText}>Reject</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            testID={`approve-suggestion-${suggestion.item.id}`}
                            style={[
                              styles.suggestionButton,
                              styles.approveButton,
                            ]}
                            onPress={() => handleApprove(suggestion)}
                          >
                            <Text style={styles.approveButtonText}>Approve</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Approved Suggestions */}
                {approvedSuggestions.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Approved</Text>
                    {approvedSuggestions.map(suggestion => (
                      <View
                        key={suggestion.item.id}
                        style={styles.approvedItem}
                      >
                        <Text style={styles.approvedText}>
                          ✓ {suggestion.item.title}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Rejected Suggestions */}
                {rejectedSuggestions.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Rejected</Text>
                    {rejectedSuggestions.map(suggestion => (
                      <View
                        key={suggestion.item.id}
                        style={styles.rejectedItem}
                      >
                        <Text style={styles.rejectedText}>
                          ✕ {suggestion.item.title}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* No Matches */}
                {matchedItems.length === 0 && analysis.detectedTasks.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.noMatchesText}>
                      No matching checklist items found for the detected tasks.
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* No Analysis Yet */}
            {!analysis && !loading && (
              <View style={styles.section}>
                <Text style={styles.noAnalysisText}>
                  Analysis results will appear here.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              testID="close-button"
              style={[styles.button, styles.closeButtonFooter]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonFooterText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#8E8E93',
  },
  content: {
    padding: 20,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#F2F2F7',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
  },
  statusText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  taskItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  taskDescription: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 8,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  confidenceBar: {
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  suggestionItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  reasoningText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  suggestionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  suggestionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#F2F2F7',
  },
  rejectButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '500',
  },
  approveButton: {
    backgroundColor: '#007AFF',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  approvedItem: {
    padding: 12,
    backgroundColor: '#D4EDDA',
    borderRadius: 8,
    marginBottom: 8,
  },
  approvedText: {
    fontSize: 16,
    color: '#155724',
    fontWeight: '500',
  },
  rejectedItem: {
    padding: 12,
    backgroundColor: '#F8D7DA',
    borderRadius: 8,
    marginBottom: 8,
  },
  rejectedText: {
    fontSize: 16,
    color: '#721C24',
    fontWeight: '500',
  },
  noMatchesText: {
    fontSize: 16,
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  noAnalysisText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    padding: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonFooter: {
    backgroundColor: '#F2F2F7',
  },
  closeButtonFooterText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
  },
});


