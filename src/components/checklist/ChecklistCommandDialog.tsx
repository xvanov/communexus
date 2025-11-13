// ChecklistCommandDialog.tsx - Confirmation dialog for checklist NLP commands
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { CommandPreview } from '../../services/checklistNLPService';

interface ChecklistCommandDialogProps {
  visible: boolean;
  preview: CommandPreview | null;
  onApprove: () => void;
  onReject: () => void;
}

export const ChecklistCommandDialog: React.FC<ChecklistCommandDialogProps> = ({
  visible,
  preview,
  onApprove,
  onReject,
}) => {
  if (!preview) {
    return null;
  }

  const getIntentDescription = (intent: string) => {
    switch (intent) {
      case 'create_item':
        return 'Create New Item';
      case 'mark_complete':
        return 'Mark Item Complete';
      case 'query_status':
        return 'Query Status';
      default:
        return 'Unknown Action';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#34C759'; // Green
    if (confidence >= 0.6) return '#FF9500'; // Orange
    return '#FF3B30'; // Red
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onReject}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog} testID="command-preview-dialog">
          <Text style={styles.title}>Confirm Action</Text>

          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.label}>Action Type:</Text>
              <Text style={styles.value}>{getIntentDescription(preview.intent)}</Text>
            </View>

            {preview.matchedItem && (
              <View style={styles.section}>
                <Text style={styles.label}>Item:</Text>
                <Text style={styles.value}>{preview.matchedItem.title}</Text>
                {preview.additionalMatches && preview.additionalMatches.length > 0 && (
                  <View style={styles.multipleMatchesContainer}>
                    <Text style={styles.multipleMatchesLabel}>
                      Other possible matches:
                    </Text>
                    {preview.additionalMatches.map((match, index) => (
                      <Text key={match.id} style={styles.multipleMatchItem}>
                        • {match.title} ({Math.round(match.confidence * 100)}%)
                      </Text>
                    ))}
                    <Text style={styles.multipleMatchesNote}>
                      Using best match. If incorrect, please specify the item more clearly.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {preview.newItemTitle && (
              <View style={styles.section}>
                <Text style={styles.label}>New Item:</Text>
                <Text style={styles.value}>{preview.newItemTitle}</Text>
              </View>
            )}

            {preview.queryResult && (
              <View style={styles.section}>
                <Text style={styles.label}>Result:</Text>
                <Text style={styles.value}>{preview.queryResult}</Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.label}>Action:</Text>
              <Text style={styles.actionText} testID="command-preview-action">{preview.suggestedAction}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Confidence:</Text>
              <View style={styles.confidenceContainer}>
                <View
                  style={[
                    styles.confidenceBar,
                    {
                      width: `${preview.confidence * 100}%`,
                      backgroundColor: getConfidenceColor(preview.confidence),
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.confidenceText,
                    { color: getConfidenceColor(preview.confidence) },
                  ]}
                >
                  {getConfidenceText(preview.confidence)} (
                  {Math.round(preview.confidence * 100)}%)
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              testID="reject-command-button"
              style={[styles.button, styles.rejectButton]}
              onPress={onReject}
            >
              <Text style={styles.rejectButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="approve-command-button"
              style={[styles.button, styles.approveButton]}
              onPress={onApprove}
            >
              <Text style={styles.approveButtonText}>Approve</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  content: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#000000',
  },
  actionText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  confidenceBar: {
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#F2F2F7',
  },
  rejectButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
  },
  approveButton: {
    backgroundColor: '#007AFF',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  multipleMatchesContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
  },
  multipleMatchesLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  multipleMatchItem: {
    fontSize: 12,
    color: '#000000',
    marginLeft: 8,
    marginBottom: 2,
  },
  multipleMatchesNote: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#8E8E93',
    marginTop: 4,
  },
});

