import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SearchResult } from '../../types/AIFeatures';

interface SmartSearchProps {
  onSearch: (query: string) => Promise<SearchResult[]>;
  onResultPress?: (result: SearchResult) => void;
  placeholder?: string;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  onSearch,
  onResultPress,
  placeholder = 'Search messages with AI...',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const searchResults = await onSearch(query);
      setResults(searchResults);
    } catch (err) {
      setError('Failed to search. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => onResultPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.senderText}>{item.sender}</Text>
        <View style={styles.relevanceBadge}>
          <Text style={styles.relevanceText}>
            {Math.round(item.relevance * 100)}% match
          </Text>
        </View>
      </View>
      <Text style={styles.messageText} numberOfLines={3}>
        {item.snippet || item.text}
      </Text>
      <Text style={styles.dateText}>📅 {formatDate(item.timestamp)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.searchButtonText}>🔍 Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </Text>
          <FlatList
            data={results}
            renderItem={renderResult}
            keyExtractor={(item, index) => `${item.messageId || index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsList}
          />
        </View>
      )}

      {!loading && results.length === 0 && query.trim() && !error && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No results found. Try a different search term.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateText: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    marginTop: 8,
    padding: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
  },
  messageText: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  relevanceBadge: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  relevanceText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderLeftColor: '#007AFF',
    borderLeftWidth: 3,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  resultHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultsList: {
    paddingBottom: 16,
  },
  resultsContainer: {
    flex: 1,
    marginTop: 16,
  },
  resultsTitle: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 80,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    color: '#000000',
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  senderText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
