import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Checklist, ChecklistItem } from '../../types/Checklist';
import {
  getChecklist,
  updateChecklistItem,
  markItemComplete,
  calculateProgress,
} from '../../services/checklistService';
import { useAuth } from '../../hooks/useAuth';
import { ChecklistNLPInput } from './ChecklistNLPInput';
import { ChecklistCommandDialog } from './ChecklistCommandDialog';
import { ImageAnalysisModal } from './ImageAnalysisModal';
import { ChecklistQueryInput } from './ChecklistQueryInput';
import {
  checklistNLPService,
  CommandPreview,
} from '../../services/checklistNLPService';
import {
  visionAnalysisService,
  ImageAnalysisResult,
  MatchedItem,
} from '../../services/visionAnalysisService';
import {
  checklistQueryService,
  QueryResult,
} from '../../services/checklistQueryService';

interface ChecklistDetailViewProps {
  checklistId: string;
  onBack?: () => void;
}

export const ChecklistDetailView: React.FC<ChecklistDetailViewProps> = ({
  checklistId,
  onBack,
}) => {
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<{
    total: number;
    completed: number;
    percentage: number;
  } | null>(null);
  const [commandPreview, setCommandPreview] = useState<CommandPreview | null>(null);
  const [showCommandDialog, setShowCommandDialog] = useState(false);
  const [executingCommand, setExecutingCommand] = useState(false);
  const [showImageAnalysisModal, setShowImageAnalysisModal] = useState(false);
  const [imageAnalysisUrl, setImageAnalysisUrl] = useState<string>('');
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [matchedItems, setMatchedItems] = useState<MatchedItem[]>([]);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadChecklist();
    // Poll for updates every 3 seconds
    const intervalId = setInterval(loadChecklist, 3000);
    return () => clearInterval(intervalId);
  }, [checklistId]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      setError(null);
      const loaded = await getChecklist(checklistId);
      if (loaded) {
        setChecklist(loaded);
        const progressData = await calculateProgress(checklistId);
        setProgress(progressData);
      } else {
        setError('Checklist not found');
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load checklist:', err);
      setError('Failed to load checklist');
      setLoading(false);
    }
  };

  const handleToggleItem = async (item: ChecklistItem) => {
    if (updatingIds.has(item.id)) return;

    const newStatus =
      item.status === 'completed' ? 'pending' : 'completed';

    try {
      setUpdatingIds(prev => new Set(prev).add(item.id));

      if (newStatus === 'completed') {
        await markItemComplete(checklistId, item.id, user?.uid);
      } else {
        await updateChecklistItem(checklistId, item.id, {
          status: newStatus,
          completedAt: undefined,
          completedBy: undefined,
        });
      }

      // Reload checklist to get updated data
      await loadChecklist();
    } catch (err) {
      console.error('Failed to update item:', err);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleCommandPreview = async (preview: CommandPreview) => {
    // Handle error cases
    if (preview.intent === 'unknown' || preview.confidence < 0.5) {
      Alert.alert(
        'Command Not Understood',
        preview.suggestedAction || 'Unable to understand command. Please try rephrasing.',
        [{ text: 'OK' }]
      );
      return;
    }

    // For query_status, show result immediately without confirmation
    if (preview.intent === 'query_status') {
      Alert.alert('Checklist Status', preview.queryResult || preview.suggestedAction, [
        { text: 'OK' },
      ]);
      return;
    }

    // Automatically execute high-confidence mark_complete commands (>= 0.85)
    if (preview.intent === 'mark_complete' && preview.matchedItem && preview.confidence >= 0.85) {
      try {
        console.log(`Auto-executing high-confidence command: ${preview.matchedItem.title} (confidence: ${preview.confidence})`);
        const result = await checklistNLPService.executeCommand(
          preview,
          checklistId,
          user?.uid
        );

        if (result.success) {
          // Reload checklist to show updates
          await loadChecklist();
          
          Alert.alert(
            'Auto-Executed',
            `"${preview.matchedItem.title}" was automatically marked as complete based on high-confidence match.`
          );
        } else {
          // Fall back to confirmation dialog if execution fails
          setCommandPreview(preview);
          setShowCommandDialog(true);
        }
      } catch (error) {
        console.error('Error auto-executing command:', error);
        // Fall back to confirmation dialog on error
        setCommandPreview(preview);
        setShowCommandDialog(true);
      }
      return;
    }

    // For create_item and lower-confidence mark_complete, show confirmation dialog
    setCommandPreview(preview);
    setShowCommandDialog(true);
  };

  const handleCommandApprove = async () => {
    if (!commandPreview || !checklist) {
      return;
    }

    try {
      setExecutingCommand(true);
      const result = await checklistNLPService.executeCommand(
        commandPreview,
        checklistId,
        user?.uid
      );

      if (result.success) {
        // Reload checklist to show updates
        await loadChecklist();
        Alert.alert('Success', result.message || 'Command executed successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to execute command');
      }

      setShowCommandDialog(false);
      setCommandPreview(null);
    } catch (error) {
      console.error('Error executing command:', error);
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to execute command. Please try again.'
      );
    } finally {
      setExecutingCommand(false);
    }
  };

  const handleCommandReject = () => {
    setShowCommandDialog(false);
    setCommandPreview(null);
  };

  const handleNLPError = (error: string) => {
    Alert.alert('Error', error);
  };

  const handleAnalyzeImage = async (imageUrl: string) => {
    if (!imageUrl || !imageUrl.trim()) {
      Alert.alert('Error', 'Please provide a valid image URL');
      return;
    }

    try {
      setAnalyzingImage(true);
      setImageAnalysisUrl(imageUrl);
      setShowImageAnalysisModal(true);
      setImageAnalysis(null);
      setMatchedItems([]);

      // Analyze image
      const analysis = await visionAnalysisService.analyzeImageForChecklist(
        imageUrl.trim(),
        checklistId
      );
      setImageAnalysis(analysis);

      // Match to checklist items
      const matches = await visionAnalysisService.matchImageToChecklistItems(
        analysis,
        checklistId
      );
      setMatchedItems(matches);

      // Automatically approve high-confidence matches (>= 0.85)
      const highConfidenceMatches = matches.filter(
        match => match.confidenceScore >= 0.85 && match.confidence === 'high'
      );
      
      if (highConfidenceMatches.length > 0) {
        console.log(`Auto-approving ${highConfidenceMatches.length} high-confidence matches`);
        for (const match of highConfidenceMatches) {
          try {
            // Mark item as complete
            await markItemComplete(checklistId, match.item.id, user?.uid);
            
            // Link photo to item
            await visionAnalysisService.linkPhotoToItem(
              checklistId,
              match.item.id,
              imageUrl.trim()
            );
            
            console.log(`Auto-approved: ${match.item.title} (confidence: ${match.confidenceScore})`);
          } catch (error) {
            console.error(`Error auto-approving ${match.item.title}:`, error);
          }
        }
        
        // Reload checklist to show updates
        await loadChecklist();
        
        // Show notification
        if (highConfidenceMatches.length === 1) {
          Alert.alert(
            'Auto-Approved',
            `"${highConfidenceMatches[0].item.title}" was automatically marked as complete based on high-confidence match.`
          );
        } else {
          Alert.alert(
            'Auto-Approved',
            `${highConfidenceMatches.length} items were automatically marked as complete based on high-confidence matches.`
          );
        }
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze image. Please try again.';
      
      // Show more helpful error message
      Alert.alert(
        'Image Analysis Error',
        errorMessage + '\n\nTip: Make sure the image URL is publicly accessible and starts with https://'
      );
      setShowImageAnalysisModal(false);
    } finally {
      setAnalyzingImage(false);
    }
  };

  const handleImageAnalysisApprove = async (item: ChecklistItem, photoUrl: string) => {
    try {
      // Mark item as complete
      await markItemComplete(checklistId, item.id, user?.uid);
      
      // Link photo to item
      await visionAnalysisService.linkPhotoToItem(checklistId, item.id, photoUrl);
      
      // Reload checklist to show updates
      await loadChecklist();
      
      Alert.alert('Success', `"${item.title}" marked as complete with photo linked`);
    } catch (error) {
      console.error('Error approving image analysis:', error);
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to approve suggestion. Please try again.'
      );
    }
  };

  const handleImageAnalysisReject = (item: ChecklistItem) => {
    // Just dismiss the suggestion, no action needed
    console.log('Rejected suggestion for item:', item.title);
  };

  const handleOpenImageAnalysis = () => {
    Alert.prompt(
      'Analyze Image for Checklist',
      'Enter the image URL to analyze:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Analyze',
          onPress: (url) => {
            if (url) {
              handleAnalyzeImage(url.trim());
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const handleQueryResult = (result: QueryResult) => {
    setQueryResult(result);
  };

  const handleQueryError = (error: string) => {
    Alert.alert('Query Error', error);
  };

  const handleNavigateToItem = (itemId: string) => {
    // Scroll to item in the list
    // For MVP, we'll just show an alert - can be improved later with FlatList ref
    const item = checklist?.items.find(i => i.id === itemId);
    if (item) {
      Alert.alert('Item', `Navigate to: ${item.title}`, [{ text: 'OK' }]);
    }
  };

  const renderItem = ({ item }: { item: ChecklistItem }) => {
    const isUpdating = updatingIds.has(item.id);
    const isCompleted = item.status === 'completed';

    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          isCompleted && styles.itemContainerCompleted,
        ]}
        onPress={() => handleToggleItem(item)}
        disabled={isUpdating}
        activeOpacity={0.7}
      >
        <View style={styles.itemRow}>
          <View
            testID={`checklist-item-${item.order + 1}-checkbox`}
            style={[
              styles.checkbox,
              isCompleted && styles.checkboxChecked,
            ]}
          >
            {isCompleted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text
            style={[
              styles.itemTitle,
              isCompleted && styles.itemTitleCompleted,
            ]}
          >
            {item.title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !checklist) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading checklist...</Text>
      </View>
    );
  }

  if (error && !checklist) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!checklist) {
    return null;
  }

  // Deduplicate items by ID (in case of duplicates from polling/updates)
  // Use Map for O(1) lookup instead of O(n) find
  const itemsMap = new Map<string, ChecklistItem>();
  checklist.items.forEach(item => {
    if (!itemsMap.has(item.id)) {
      itemsMap.set(item.id, item);
    } else {
      // Log duplicate if found (for debugging)
      console.warn(`Duplicate item ID detected: ${item.id}`);
    }
  });
  const uniqueItems = Array.from(itemsMap.values());

  const sortedItems = [...uniqueItems].sort((a, b) => a.order - b.order);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{checklist.title}</Text>
        {progress && (
          <Text style={styles.progressText}>
            {progress.completed}/{progress.total} items complete
            {progress.percentage > 0 && ` (${progress.percentage}%)`}
          </Text>
        )}
      </View>

      {sortedItems.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No items in this checklist</Text>
        </View>
      ) : (
        <FlatList
          data={sortedItems}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Query Results Display */}
      {queryResult && (
        <View style={styles.queryResultContainer} testID="query-result-container">
          <View style={styles.queryResultHeader}>
            <Text style={styles.queryResultTitle}>Query Result</Text>
            <TouchableOpacity
              onPress={() => setQueryResult(null)}
              testID="close-query-result-button"
            >
              <Text style={styles.closeQueryResultText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.queryAnswer}>{queryResult.answer}</Text>
          
          {queryResult.nextTask && (
            <TouchableOpacity
              style={styles.queryItemLink}
              onPress={() => handleNavigateToItem(queryResult.nextTask!.id)}
              testID="next-task-link"
            >
              <Text style={styles.queryItemLinkText}>
                → {queryResult.nextTask.title}
              </Text>
            </TouchableOpacity>
          )}
          
          {queryResult.incompleteItems && queryResult.incompleteItems.length > 0 && (
            <View style={styles.queryItemsList}>
              <Text style={styles.queryItemsTitle}>Incomplete Items:</Text>
              {queryResult.incompleteItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.queryItemLink}
                  onPress={() => handleNavigateToItem(item.id)}
                  testID={`incomplete-item-link-${item.id}`}
                >
                  <Text style={styles.queryItemLinkText}>→ {item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {queryResult.progress && (
            <View style={styles.queryProgressContainer}>
              <Text style={styles.queryProgressText}>
                Progress: {queryResult.progress.completed}/{queryResult.progress.total} 
                {queryResult.progress.percentage > 0 && ` (${queryResult.progress.percentage}%)`}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Image Analysis Button */}
      <TouchableOpacity
        style={styles.analyzeImageButton}
        onPress={handleOpenImageAnalysis}
        testID="analyze-image-button"
      >
        <Text style={styles.analyzeImageButtonText}>📷 Analyze Image for Checklist</Text>
      </TouchableOpacity>

      {/* Query Input Component */}
      <ChecklistQueryInput
        checklistId={checklistId}
        onQueryResult={handleQueryResult}
        onError={handleQueryError}
      />

      {/* NLP Input Component */}
      <ChecklistNLPInput
        checklistId={checklistId}
        items={sortedItems}
        onCommandPreview={handleCommandPreview}
        onError={handleNLPError}
      />

      {/* Command Confirmation Dialog */}
      <ChecklistCommandDialog
        visible={showCommandDialog}
        preview={commandPreview}
        onApprove={handleCommandApprove}
        onReject={handleCommandReject}
      />

      {/* Image Analysis Modal */}
      <ImageAnalysisModal
        visible={showImageAnalysisModal}
        imageUrl={imageAnalysisUrl}
        analysis={imageAnalysis}
        matchedItems={matchedItems}
        loading={analyzingImage}
        onApprove={handleImageAnalysisApprove}
        onReject={handleImageAnalysisReject}
        onClose={() => {
          setShowImageAnalysisModal(false);
          setImageAnalysis(null);
          setMatchedItems([]);
          setImageAnalysisUrl('');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  listContainer: {
    padding: 16,
  },
  itemContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  itemContainerCompleted: {
    backgroundColor: '#F8F8F8',
    borderLeftColor: '#34C759',
    opacity: 0.7,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  itemTitleCompleted: {
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  analyzeImageButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  analyzeImageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  queryResultContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  queryResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  queryResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  closeQueryResultText: {
    fontSize: 20,
    color: '#8E8E93',
  },
  queryAnswer: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 12,
    lineHeight: 24,
  },
  queryItemsList: {
    marginTop: 8,
  },
  queryItemsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  queryItemLink: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  queryItemLinkText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  queryProgressContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  queryProgressText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
});

