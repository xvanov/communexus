import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/utils/auth/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { User, Bell, Shield, LogOut, Camera, Edit } from 'lucide-react-native';
import { router } from 'expo-router';
import { useUpload } from '@/utils/useUpload';
import * as ImagePicker from 'expo-image-picker';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { auth, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [upload] = useUpload();

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      return data.user;
    },
    enabled: !!auth,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates) => {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      Alert.alert('Success', 'Profile updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update profile');
    },
  });

  const handleSignOut = useCallback(async () => {
    Alert.alert(
      'Sign Out', 
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => signOut()
        },
      ]
    );
  }, [signOut]);

  const handleChangeAvatar = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Upload the image
        const uploadResult = await upload({ 
          reactNativeAsset: {
            uri: asset.uri,
            name: asset.fileName || 'avatar.jpg',
            mimeType: asset.type || 'image/jpeg'
          }
        });
        
        if (uploadResult.error) {
          Alert.alert('Upload Error', uploadResult.error);
          return;
        }

        // Update profile with new avatar
        updateProfileMutation.mutate({ avatar_url: uploadResult.url });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to change avatar');
    }
  }, [upload, updateProfileMutation]);

  const handleStatusChange = useCallback((newStatus) => {
    updateProfileMutation.mutate({ status: newStatus });
  }, [updateProfileMutation]);

  if (!profile && !isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        paddingTop: insets.top,
        backgroundColor: '#F9FAFB'
      }}>
        <Text>Failed to load profile</Text>
      </View>
    );
  }

  const displayName = profile?.display_name || profile?.name || 'User';
  const currentStatus = profile?.status || 'offline';

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#F9FAFB',
      paddingTop: insets.top,
    }}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={{
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#111827',
        }}>
          Settings
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={{
          backgroundColor: 'white',
          paddingHorizontal: 20,
          paddingVertical: 24,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <View style={{
              position: 'relative',
              marginRight: 16,
            }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#E5E7EB',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                {profile?.avatar_url ? (
                  <Image
                    source={{ uri: profile.avatar_url }}
                    style={{ width: 80, height: 80, borderRadius: 40 }}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={{ 
                    fontSize: 32, 
                    fontWeight: '600', 
                    color: '#6B7280' 
                  }}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              
              <TouchableOpacity
                onPress={handleChangeAvatar}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#007AFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 3,
                  borderColor: 'white',
                }}
              >
                <Camera size={14} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 4,
              }}>
                {displayName}
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#6B7280',
                marginBottom: 8,
              }}>
                {profile?.email || auth?.user?.email}
              </Text>
              
              {/* Status Indicator */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: currentStatus === 'online' ? '#22C55E' : 
                                   currentStatus === 'away' ? '#F59E0B' : '#9CA3AF',
                  marginRight: 6,
                }} />
                <Text style={{
                  fontSize: 12,
                  color: '#6B7280',
                  textTransform: 'capitalize',
                }}>
                  {currentStatus}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Status Settings */}
        <View style={{
          backgroundColor: 'white',
          marginTop: 20,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: '#E5E7EB',
        }}>
          <View style={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#111827',
            }}>
              Availability Status
            </Text>
          </View>
          
          {['online', 'away', 'offline'].map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => handleStatusChange(status)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: status !== 'offline' ? 1 : 0,
                borderBottomColor: '#F3F4F6',
              }}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: status === 'online' ? '#22C55E' : 
                                   status === 'away' ? '#F59E0B' : '#9CA3AF',
                  marginRight: 12,
                }} />
                <Text style={{
                  fontSize: 16,
                  color: '#111827',
                  textTransform: 'capitalize',
                }}>
                  {status}
                </Text>
              </View>
              
              {currentStatus === status && (
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#007AFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}>
                    ✓
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications Section */}
        <View style={{
          backgroundColor: 'white',
          marginTop: 20,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: '#E5E7EB',
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Bell size={20} color="#6B7280" style={{ marginRight: 12 }} />
              <Text style={{
                fontSize: 16,
                color: '#111827',
              }}>
                Push Notifications
              </Text>
            </View>
            <Switch
              value={true}
              onValueChange={(value) => {
                // Handle notification toggle
                Alert.alert('Info', 'Notification settings will be implemented in a future update');
              }}
            />
          </View>
        </View>

        {/* Account Actions */}
        <View style={{
          backgroundColor: 'white',
          marginTop: 20,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: '#E5E7EB',
        }}>
          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 16,
            }}
          >
            <LogOut size={20} color="#EF4444" style={{ marginRight: 12 }} />
            <Text style={{
              fontSize: 16,
              color: '#EF4444',
            }}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={{
          paddingHorizontal: 20,
          paddingVertical: 32,
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: 14,
            color: '#9CA3AF',
            textAlign: 'center',
          }}>
            Communexus v1.0{'\n'}
            Reliable messaging for small business operators
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}