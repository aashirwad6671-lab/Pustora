import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useVoiceAgent, VoiceAgentStatus } from '../hooks/useVoiceAgent';

interface VoiceAssistantOverlayProps {
  visible: boolean;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export default function VoiceAssistantOverlay({ visible, onClose }: VoiceAssistantOverlayProps) {
  const {
    status,
    transcript,
    replyText,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceAgent();

  // Auto-start recording when the modal becomes visible
  useEffect(() => {
    if (visible) {
      startRecording();
    } else {
      cancelRecording();
    }
  }, [visible]);

  // Helper for status text
  const getStatusText = (currentStatus: VoiceAgentStatus) => {
    switch (currentStatus) {
      case 'recording':
        return 'Listening to you... (सुन रहे हैं)';
      case 'transcribing':
        return 'Transcribing audio... (अनुवाद कर रहे हैं)';
      case 'processing':
        return 'Thinking... (सोच रहे हैं)';
      case 'speaking':
        return 'Responding... (बोल रहे हैं)';
      case 'idle':
        return 'Ready to talk (बात करने के लिए तैयार)';
      case 'error':
        return 'Something went wrong';
      default:
        return '';
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.brandTitle}>Pustora Voice AI</Text>
          <Text style={styles.statusLabel}>{getStatusText(status)}</Text>

          {/* Visual Waveforms / Indicators */}
          <View style={styles.animationArea}>
            {status === 'recording' && (
              <View style={styles.micCircle}>
                <View style={styles.micRipple1} />
                <View style={styles.micRipple2} />
                <Text style={styles.micSphere}>🎤</Text>
              </View>
            )}
            
            {(status === 'transcribing' || status === 'processing') && (
              <ActivityIndicator size="large" color="#FFD700" style={styles.spinner} />
            )}

            {status === 'speaking' && (
              <View style={styles.speakingIndicator}>
                <View style={styles.soundBar1} />
                <View style={styles.soundBar2} />
                <View style={styles.soundBar3} />
                <View style={styles.soundBar4} />
                <Text style={styles.speakingSphere}>🔊</Text>
              </View>
            )}

            {status === 'idle' && (
              <TouchableOpacity style={styles.micCircleIdle} onPress={startRecording}>
                <Text style={styles.micSphere}>🎤</Text>
                <Text style={styles.tapToTalk}>Tap to speak</Text>
              </TouchableOpacity>
            )}

            {status === 'error' && (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorMsg}>{error || 'Connection Failed'}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={startRecording}>
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Conversation Speech timeline display */}
          <View style={styles.conversationLog}>
            {transcript.trim() !== '' && (
              <View style={styles.speechBubbleUser}>
                <Text style={styles.bubbleTag}>You Said</Text>
                <Text style={styles.speechText}>{transcript}</Text>
              </View>
            )}

            {replyText.trim() !== '' && (
              <View style={styles.speechBubbleAi}>
                <Text style={styles.bubbleTagAi}>Pustora AI</Text>
                <Text style={styles.speechText}>{replyText}</Text>
              </View>
            )}
          </View>

          {/* Quick-test Interactive Chips */}
          {status === 'recording' && (
            <View style={styles.simulationHub}>
              <Text style={styles.simHubTitle}>Simulator Quick-Test Checks:</Text>
              <View style={styles.chipsWrapper}>
                <TouchableOpacity
                  style={styles.simChip}
                  onPress={() => stopRecording('कक्षा ६ की गणित की किताब कार्ट में डाल दो')}
                >
                  <Text style={styles.simChipText}>📚 Add Class 6 Math (Hindi)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.simChip}
                  onPress={() => stopRecording('Science textbooks for Class 10 please')}
                >
                  <Text style={styles.simChipText}>🔍 Search Class 10 Science</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.simChip}
                  onPress={() => stopRecording('Recommend a birthday gift for 10 year old parent')}
                >
                  <Text style={styles.simChipText}>🎁 Gift Recommendations</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.simChip}
                  onPress={() => stopRecording('Proceed to checkout')}
                >
                  <Text style={styles.simChipText}>🚴 Voice Checkout Assistance</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Stop Button */}
          {status === 'recording' && (
            <TouchableOpacity style={styles.stopBtn} onPress={() => stopRecording()}>
              <Text style={styles.stopBtnText}>Tap when finished speaking</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(14, 11, 22, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: width * 0.9,
    backgroundColor: '#1E1738',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.15)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#5C2D91',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFD700',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statusLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  animationArea: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  micCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#5C2D91',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  micCircleIdle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: '#5C2D91',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapToTalk: {
    color: '#FFD700',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 4,
  },
  micSphere: {
    fontSize: 34,
  },
  micRipple1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(92, 45, 145, 0.4)',
    transform: [{ scale: 1 }],
  },
  micRipple2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  spinner: {
    transform: [{ scale: 1.2 }],
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
    height: 90,
  },
  speakingSphere: {
    fontSize: 30,
    zIndex: 10,
  },
  soundBar1: { width: 4, height: 40, backgroundColor: '#FFD700', borderRadius: 2 },
  soundBar2: { width: 4, height: 60, backgroundColor: '#5C2D91', borderRadius: 2 },
  soundBar3: { width: 4, height: 50, backgroundColor: '#FFD700', borderRadius: 2 },
  soundBar4: { width: 4, height: 30, backgroundColor: '#5C2D91', borderRadius: 2 },
  conversationLog: {
    width: '100%',
    marginVertical: 20,
    gap: 12,
  },
  speechBubbleUser: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    borderBottomLeftRadius: 2,
    width: '90%',
    alignSelf: 'flex-start',
  },
  speechBubbleAi: {
    backgroundColor: 'rgba(92, 45, 145, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(92, 45, 145, 0.4)',
    padding: 12,
    borderRadius: 12,
    borderBottomRightRadius: 2,
    width: '90%',
    alignSelf: 'flex-end',
  },
  bubbleTag: {
    fontSize: 8,
    fontWeight: '900',
    color: '#8E8A94',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bubbleTagAi: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFD700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  speechText: {
    color: '#FFF',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  simulationHub: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  simHubTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFD700',
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: 'center',
  },
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  simChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  simChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E2DFE5',
  },
  stopBtn: {
    backgroundColor: '#FFD700',
    width: '100%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtnText: {
    color: '#440F79',
    fontWeight: '800',
    fontSize: 13,
  },
  errorBox: {
    alignItems: 'center',
    gap: 8,
  },
  errorIcon: {
    fontSize: 24,
  },
  errorMsg: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginTop: 4,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
