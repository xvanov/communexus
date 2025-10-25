import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SearchResult } from '../../types/AIFeatures';
import { getDb } from '../../services/firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';

interface SmartSearchProps {
  threadId?: string;
  onResultPress?: (result: SearchResult) => void;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  threadId,
  onResultPress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Starting smart search for:', searchQuery);
      console.log('🔍 ThreadId filter:', threadId || 'all threads');

      // Step 1: Fetch messages from Firestore
      const db = await getDb();
      const messagesRef = collection(db, 'messages');
      
      // Fetch recent messages (limit to 100 for performance)
      let messagesQuery;
      if (threadId) {
        messagesQuery = query(
          messagesRef,
          orderBy('createdAt', 'desc'),
          limit(100)
        );
      } else {
        messagesQuery = query(
          messagesRef,
          orderBy('createdAt', 'desc'),
          limit(100)
        );
      }

      const snapshot = await getDocs(messagesQuery);
      console.log('🔍 Fetched', snapshot.size, 'messages from Firestore');

      const allMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text || '',
          sender: data.senderName || 'Unknown',
          threadId: data.threadId || '',
          timestamp: data.createdAt?.toDate?.() || new Date(),
        };
      });

      // Filter by threadId if specified
      const messagesToSearch = threadId
        ? allMessages.filter(m => m.threadId === threadId)
        : allMessages;

      console.log('🔍 Searching through', messagesToSearch.length, 'messages');

      if (messagesToSearch.length === 0) {
        setError('No messages found to search');
        setResults([]);
        setLoading(false);
        return;
      }

      // Step 2: Simple keyword filter first (for performance)
      const keywords = searchQuery.toLowerCase().split(' ');
      const keywordMatches = messagesToSearch.filter(msg =>
        keywords.some(keyword => msg.text.toLowerCase().includes(keyword))
      );

      console.log('🔍 Keyword matches:', keywordMatches.length);

      // If we have keyword matches, use AI to rank them semantically
      // If no keyword matches, use AI on all messages (slower but more semantic)
      const messagesToRank = keywordMatches.length > 0 
        ? keywordMatches.slice(0, 50) // Limit to 50 for AI processing
        : messagesToSearch.slice(0, 30); // Use fewer if no keyword match

      // Step 3: Send to AI for semantic ranking
      const url = __DEV__
        ? 'http://127.0.0.1:5001/communexus/us-central1/aiSmartSearch'
        : 'https://us-central1-communexus.cloudfunctions.net/aiSmartSearch';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            query: searchQuery,
            messages: messagesToRank.map(m => ({
              messageId: m.id,
              text: m.text,
              sender: m.sender,
              threadId: m.threadId,
              timestamp: m.timestamp.toISOString(),
            })),
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const jsonResponse = await response.json();
      console.log('🔍 AI response:', jsonResponse);
      
      const data = jsonResponse.result || jsonResponse.data;

      if (data.success && data.results) {
        console.log('🔍 Found', data.results.length, 'relevant results');
        setResults(data.results);
      } else {
        setError(data.error || 'Failed to perform smart search');
        setResults([]);
      }
    } catch (err: any) {
      console.error('❌ Error performing smart search:', err);
      setError(`Error: ${err.message || 'Unknown error'}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const renderResultItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => onResultPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.resultSender}>{item.sender}</Text>
        <Text style={styles.resultRelevance}>
          {Math.round((item.relevance || 0) * 100)}% match
        </Text>
      </View>
      <Text style={styles.resultText} numberOfLines={3}>
        {item.text}
      </Text>
      {item.snippet && (
        <Text style={styles.resultSnippet} numberOfLines={2}>
          💡 "{item.snippet}"
        </Text>
      )}
      <Text style={styles.resultTimestamp}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations with AI..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={performSearch}
          returnKeyType="search"
          autoFocus
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={performSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.searchButtonText}>🔍</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={results}
        renderItem={renderResultItem}
        keyExtractor={(item) => item.messageId}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && !error && searchQuery.length > 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results for "{searchQuery}"</Text>
              <Text style={styles.emptySubtext}>
                Try different keywords or search terms
              </Text>
            </View>
          ) : null
        }
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  emptySubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderLeftColor: '#FF3B30',
    borderLeftWidth: 4,
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  resultHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  resultRelevance: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resultSender: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  resultSnippet: {
    backgroundColor: '#FFF9E6',
    borderLeftColor: '#FFB300',
    borderLeftWidth: 3,
    borderRadius: 4,
    color: '#666',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  resultText: {
    color: '#000000',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  resultTimestamp: {
    color: '#999',
    fontSize: 11,
    textAlign: 'right',
  },
  resultsList: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    elevation: 3,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    flex: 1,
    fontSize: 16,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});
