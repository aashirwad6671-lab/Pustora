import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { SupportService } from '../../src/services/supportService';

export default function TicketChatScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Retrieve incoming router parameters
  const { ticketId, subject } = useLocalSearchParams<{ ticketId: string; subject: string }>();

  // States
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  // Load ticket chat messages on mount and poll/subscribe in real-time
  useEffect(() => {
    if (!ticketId) return;

    async function loadChat() {
      setLoading(true);
      const response = await SupportService.getTicketMessages(ticketId);
      if (response.data) {
        setMessages(response.data);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
      setLoading(false);
    }
    loadChat();

    // Setup a 5-second polling interval as a robust fallback for local schemas
    const interval = setInterval(async () => {
      const response = await SupportService.getTicketMessages(ticketId);
      if (response.data) {
        setMessages(response.data);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [ticketId]);

  // Handle message dispatch
  const handleSendMessage = async () => {
    if (!ticketId || !newMessage.trim()) return;

    setSending(true);
    const uid = user?.id || 'mock-user-id';
    const response = await SupportService.sendChatMessage(ticketId, uid, newMessage.trim());

    setSending(false);
    if (response.data) {
      setMessages([...messages, response.data]);
      setNewMessage('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>◀</Text>
        </TouchableOpacity>
        <View style={styles.headerDetails}>
          <Text style={styles.title} numberOfLines={1}>{subject || 'Live Chat'}</Text>
          <Text style={styles.subtitle}>Pustora Support Team</Text>
        </View>
      </View>

      {/* CHAT MESSAGES TIMELINE */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#5C2D91" />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.chatScroll}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 ? (
              <View style={styles.systemCard}>
                <Text style={styles.systemText}>
                  Welcome to Pustora Support. Our typical response ETA is under 5 mins. Tell us how we can help you today!
                </Text>
              </View>
            ) : (
              messages.map((msg) => {
                // Determine if message belongs to the user or is a reply from support representative
                const isUserMessage = msg.sender_id === (user?.id || 'mock-user-id');
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.bubbleWrapper,
                      isUserMessage ? styles.userWrapper : styles.adminWrapper,
                    ]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        isUserMessage ? styles.userBubble : styles.adminBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          isUserMessage ? styles.userText : styles.adminText,
                        ]}
                      >
                        {msg.message}
                      </Text>
                    </View>
                    <Text style={styles.messageTime}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* INPUT SEND BAR */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.inputField}
            placeholder="Type your message here..."
            placeholderTextColor="#8E8A94"
            value={newMessage}
            onChangeText={setNewMessage}
            editable={!sending}
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() ? styles.sendDisabled : null]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.sendIcon}>▶</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2DFE5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    fontSize: 16,
    color: '#5C2D91',
  },
  headerDetails: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#191C1D',
    fontFamily: 'Outfit-Bold',
  },
  subtitle: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
  },
  keyboardContainer: {
    flex: 1,
  },
  loaderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatScroll: {
    padding: 16,
    gap: 16,
  },
  systemCard: {
    backgroundColor: 'rgba(92, 45, 145, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(92, 45, 145, 0.1)',
    borderRadius: 12,
    padding: 14,
  },
  systemText: {
    fontSize: 13,
    color: '#5C2D91',
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: 'Nunito-Regular',
  },
  bubbleWrapper: {
    maxWidth: '80%',
    gap: 4,
  },
  userWrapper: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  adminWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#5C2D91',
    borderBottomRightRadius: 4,
  },
  adminBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DFE5',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 19,
  },
  userText: {
    color: '#FFFFFF',
    fontFamily: 'Nunito-Regular',
  },
  adminText: {
    color: '#191C1D',
    fontFamily: 'Nunito-Regular',
  },
  messageTime: {
    fontSize: 9,
    color: '#8E8A94',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2DFE5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
    height: 64,
  },
  inputField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2DFE5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#191C1D',
    backgroundColor: '#F3F4F5',
    fontFamily: 'Nunito-Regular',
  },
  sendButton: {
    backgroundColor: '#5C2D91',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    backgroundColor: '#8E8A94',
    opacity: 0.5,
  },
  sendIcon: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});
