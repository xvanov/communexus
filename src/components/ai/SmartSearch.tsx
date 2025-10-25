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

interface SmartSearchProps {
  threadId?: string;
  onResultPress?: (result: SearchResult) => void;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  threadId,
  onResultPress,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Starting smart search for:', query);

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
            threadId: threadId || '',
            query,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const jsonResponse = await response.json();
      console.log('🔍 Search response:', jsonResponse);
      
      const data = jsonResponse.result || jsonResponse.data;

      if (data.success && data.results) {
        console.log('🔍 Found', data.results.length, 'results');
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
      <Text style={styles.resultSender}>{item.sender}</Text>
      <Text style={styles.resultText}>{item.text}</Text>
      {item.snippet && (
        <Text style={styles.resultSnippet} numberOfLines={2}>
          "{item.snippet}"
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
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={performSearch}
          returnKeyType="search"
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

      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={results}
        renderItem={renderResultItem}
        keyExtractor={(item) => item.messageId}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && !error && query.length > 0 ? (
            <Text style={styles.emptyText}>No results for "{query}"</Text>
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
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 32,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
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
  resultSender: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 4,
  },
  resultSnippet: {
    color: '#333333',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  resultText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  resultTimestamp: {
    color: '#C7C7CC',
    fontSize: 12,
    textAlign: 'right',
  },
  resultsList: {
    flexGrow: 1,
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
