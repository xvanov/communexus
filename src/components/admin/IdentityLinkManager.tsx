/**
 * Identity Link Manager Component
 *
 * Admin UI component for managing identity links between external identifiers
 * (phone numbers, emails, Facebook IDs) and internal user identities.
 *
 * Features:
 * - Link identities (phone, email, Facebook ID)
 * - Display existing identity links for a user
 * - Remove identity links
 * - Verify/unverify identities
 * - Search users by external identifier
 *
 * @example
 * ```typescript
 * <IdentityLinkManager
 *   organizationId="org-456"
 *   onIdentityLinked={(link) => console.log('Linked:', link)}
 * />
 * ```
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../utils/theme';
import {
  useLinkIdentity,
  useLookupIdentity,
  useIdentityLinks,
  useVerifyIdentity,
} from '../../hooks/useIdentity';
import { getUser } from '../../services/users';
import type { User } from '../../types/User';
import type {
  IdentityLink,
  ExternalIdentity,
  ExternalIdentityType,
} from '../../types/Identity';

interface IdentityLinkManagerProps {
  /** Organization ID for multi-tenancy support */
  organizationId: string;
  /** Callback when identity is linked */
  onIdentityLinked?: (link: IdentityLink) => void;
  /** Callback when identity is removed */
  onIdentityRemoved?: (identity: ExternalIdentity) => void;
  /** Callback when identity is verified */
  onIdentityVerified?: (identity: ExternalIdentity) => void;
}

export const IdentityLinkManager: React.FC<IdentityLinkManagerProps> = ({
  organizationId,
  onIdentityLinked,
  onIdentityRemoved,
  onIdentityVerified,
}) => {
  // Form state
  const [userId, setUserId] = useState<string>('');
  const [externalIdentifier, setExternalIdentifier] = useState<string>('');
  const [identityType, setIdentityType] =
    useState<ExternalIdentityType>('phone');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userSearchModalVisible, setUserSearchModalVisible] = useState(false);

  // Hooks
  const { linkPhoneNumber, linkEmail, linkFacebookId, loading, error } =
    useLinkIdentity();
  const { lookupIdentity } = useLookupIdentity();
  const { identityLinks, loading: linksLoading, refresh } = useIdentityLinks(
    userId || null,
    organizationId || null
  );
  const {
    verifyPhoneNumber,
    verifyEmail,
    verifyFacebookId,
    unverifyPhoneNumber,
    unverifyEmail,
    unverifyFacebookId,
  } = useVerifyIdentity();

  // Handle identity type selection
  const handleIdentityTypeChange = useCallback(
    (type: ExternalIdentityType) => {
      setIdentityType(type);
      setExternalIdentifier('');
    },
    []
  );

  // Handle user search by external identifier
  const handleSearchUser = useCallback(async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter an external identifier to search');
      return;
    }

    setSearchLoading(true);
    try {
      const foundUserId = await lookupIdentity(searchQuery, organizationId);
      if (foundUserId) {
        const user = await getUser(foundUserId);
        if (user) {
          setSearchResults([user]);
          setUserId(foundUserId);
          setUserSearchModalVisible(false);
        } else {
          Alert.alert('User Not Found', 'User ID found but user data not available');
        }
      } else {
        Alert.alert('Not Found', 'No user found with that external identifier');
        setSearchResults([]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to search user');
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, organizationId, lookupIdentity]);

  // Handle link identity
  const handleLinkIdentity = useCallback(async () => {
    if (!userId.trim()) {
      Alert.alert('Error', 'Please select or enter a user ID');
      return;
    }

    if (!externalIdentifier.trim()) {
      Alert.alert('Error', 'Please enter an external identifier');
      return;
    }

    try {
      let result: IdentityLink | null = null;

      switch (identityType) {
        case 'phone':
          result = await linkPhoneNumber(
            userId,
            externalIdentifier,
            organizationId
          );
          break;
        case 'email':
          result = await linkEmail(userId, externalIdentifier, organizationId);
          break;
        case 'facebook_id':
          result = await linkFacebookId(
            userId,
            externalIdentifier,
            organizationId
          );
          break;
        default:
          Alert.alert('Error', 'Unsupported identity type');
          return;
      }

      if (result) {
        Alert.alert('Success', 'Identity linked successfully');
        setExternalIdentifier('');
        refresh();
        onIdentityLinked?.(result);
      } else {
        Alert.alert('Error', 'Failed to link identity');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to link identity');
      console.error('Link error:', err);
    }
  }, [
    userId,
    externalIdentifier,
    identityType,
    organizationId,
    linkPhoneNumber,
    linkEmail,
    linkFacebookId,
    refresh,
    onIdentityLinked,
  ]);

  // Handle remove identity
  const handleRemoveIdentity = useCallback(
    async (identity: ExternalIdentity) => {
      Alert.alert(
        'Confirm Removal',
        `Are you sure you want to remove this ${identity.type} identity?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                const { identityService } = await import('../../services/identity');
                await identityService.removeExternalIdentity(
                  userId,
                  identity,
                  organizationId
                );
                Alert.alert('Success', 'Identity removed successfully');
                refresh();
                onIdentityRemoved?.(identity);
              } catch (err) {
                Alert.alert('Error', 'Failed to remove identity');
                console.error('Remove error:', err);
              }
            },
          },
        ]
      );
    },
    [userId, organizationId, refresh, onIdentityRemoved]
  );

  // Handle verify/unverify identity
  const handleVerifyIdentity = useCallback(
    async (identity: ExternalIdentity) => {
      try {
        let result = false;

        if (identity.verified) {
          // Unverify the identity
          switch (identity.type) {
            case 'phone':
              result = await unverifyPhoneNumber(
                identity.value,
                organizationId
              );
              break;
            case 'email':
              result = await unverifyEmail(identity.value, organizationId);
              break;
            case 'facebook_id':
              result = await unverifyFacebookId(
                identity.value,
                organizationId
              );
              break;
          }

          if (result) {
            Alert.alert('Success', 'Identity unverified successfully');
          } else {
            Alert.alert('Error', 'Failed to unverify identity');
          }
        } else {
          // Verify the identity
          switch (identity.type) {
            case 'phone':
              result = await verifyPhoneNumber(
                identity.value,
                'admin-verification',
                organizationId
              );
              break;
            case 'email':
              result = await verifyEmail(
                identity.value,
                'admin-verification',
                organizationId
              );
              break;
            case 'facebook_id':
              result = await verifyFacebookId(
                identity.value,
                'admin-verification',
                organizationId
              );
              break;
          }

          if (result) {
            Alert.alert('Success', 'Identity verified successfully');
          } else {
            Alert.alert('Error', 'Failed to verify identity');
          }
        }

        if (result) {
          refresh();
          onIdentityVerified?.(identity);
        }
      } catch (err) {
        Alert.alert(
          'Error',
          `Failed to ${identity.verified ? 'unverify' : 'verify'} identity`
        );
        console.error('Verify/unverify error:', err);
      }
    },
    [
      organizationId,
      verifyPhoneNumber,
      verifyEmail,
      verifyFacebookId,
      unverifyPhoneNumber,
      unverifyEmail,
      unverifyFacebookId,
      refresh,
      onIdentityVerified,
    ]
  );

  // Render identity type selector
  const renderIdentityTypeSelector = () => {
    const types: ExternalIdentityType[] = ['phone', 'email', 'facebook_id'];
    const typeLabels = {
      phone: 'Phone',
      email: 'Email',
      facebook_id: 'Facebook ID',
    };

    return (
      <View style={styles.typeSelector}>
        {types.map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              identityType === type && styles.typeButtonActive,
            ]}
            onPress={() => handleIdentityTypeChange(type)}
            accessibilityLabel={`Select ${typeLabels[type]} identity type`}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.typeButtonText,
                identityType === type && styles.typeButtonTextActive,
              ]}
            >
              {typeLabels[type]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render identity link item
  const renderIdentityLinkItem = ({ item }: { item: ExternalIdentity }) => {
    const typeLabels = {
      phone: 'Phone',
      email: 'Email',
      facebook_id: 'Facebook ID',
      whatsapp_id: 'WhatsApp ID',
    };

    return (
      <View style={styles.identityItem}>
        <View style={styles.identityInfo}>
          <Text style={styles.identityType}>
            {typeLabels[item.type] || item.type}
          </Text>
          <Text style={styles.identityValue}>{item.value}</Text>
          <View style={styles.identityStatus}>
            <View
              style={[
                styles.statusBadge,
                item.verified ? styles.statusBadgeVerified : styles.statusBadgeUnverified,
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {item.verified ? 'Verified' : 'Unverified'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.identityActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleVerifyIdentity(item)}
            accessibilityLabel={
              item.verified ? 'Unverify identity' : 'Verify identity'
            }
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>
              {item.verified ? 'Unverify' : 'Verify'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={() => handleRemoveIdentity(item)}
            accessibilityLabel="Remove identity"
            accessibilityRole="button"
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
              Remove
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Search User by Identifier</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter phone, email, or Facebook ID..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search user by external identifier"
            accessibilityRole="searchbox"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearchUser}
            disabled={searchLoading}
            accessibilityLabel="Search user"
            accessibilityRole="button"
          >
            {searchLoading ? (
              <ActivityIndicator size="small" color={Colors.textPrimary} />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>
        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.map(user => (
              <TouchableOpacity
                key={user.id}
                style={styles.searchResultItem}
                onPress={() => {
                  setUserId(user.id);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <Text style={styles.searchResultName}>{user.name}</Text>
                <Text style={styles.searchResultEmail}>{user.email}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Link Identity</Text>
        <TextInput
          style={styles.input}
          placeholder="User ID"
          placeholderTextColor={Colors.textTertiary}
          value={userId}
          onChangeText={setUserId}
          accessibilityLabel="User ID input"
          accessibilityRole="textbox"
        />
        {renderIdentityTypeSelector()}
        <TextInput
          style={styles.input}
          placeholder={
            identityType === 'phone'
              ? 'Phone number (E.164 format, e.g., +15551234567)'
              : identityType === 'email'
              ? 'Email address'
              : 'Facebook ID'
          }
          placeholderTextColor={Colors.textTertiary}
          value={externalIdentifier}
          onChangeText={setExternalIdentifier}
          keyboardType={
            identityType === 'phone'
              ? 'phone-pad'
              : identityType === 'email'
              ? 'email-address'
              : 'default'
          }
          accessibilityLabel={`${identityType} identifier input`}
          accessibilityRole="textbox"
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLinkIdentity}
          disabled={loading}
          accessibilityLabel="Link identity"
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.textPrimary} />
          ) : (
            <Text style={styles.buttonText}>Link Identity</Text>
          )}
        </TouchableOpacity>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {userId && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Existing Identity Links</Text>
          {linksLoading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={styles.loader}
            />
          ) : identityLinks?.externalIdentities &&
            identityLinks.externalIdentities.length > 0 ? (
            <FlatList
              data={identityLinks.externalIdentities}
              renderItem={renderIdentityLinkItem}
              keyExtractor={(item, index) =>
                `${item.type}-${item.value}-${index}`
              }
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>No identity links found</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: 16,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  typeButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: Colors.textPrimary,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    marginTop: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  searchButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  searchResults: {
    marginTop: Spacing.sm,
  },
  searchResultItem: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  searchResultName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  searchResultEmail: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  identityItem: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  identityInfo: {
    marginBottom: Spacing.sm,
  },
  identityType: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  identityValue: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  identityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeVerified: {
    backgroundColor: Colors.success + '20',
  },
  statusBadgeUnverified: {
    backgroundColor: Colors.error + '20',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  identityActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  actionButtonDanger: {
    backgroundColor: Colors.error + '20',
  },
  actionButtonText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextDanger: {
    color: Colors.error,
  },
  loader: {
    marginVertical: Spacing.lg,
  },
  emptyText: {
    color: Colors.textTertiary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});

