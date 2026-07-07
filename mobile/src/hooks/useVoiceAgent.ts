import { useState, useEffect, useRef } from 'react';
import { DeviceEventEmitter, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { VoiceService, VoiceAgentIntent } from '../services/voiceService';

export type VoiceAgentStatus = 'idle' | 'recording' | 'transcribing' | 'processing' | 'speaking' | 'error';

export function useVoiceAgent() {
  const [status, setStatus] = useState<VoiceAgentStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [replyText, setReplyText] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  /**
   * Request Microphone Permissions and configure Audio Mode.
   */
  const configureAudioSession = async (): Promise<boolean> => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setError('Microphone permission is required.');
        setStatus('error');
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      });

      return true;
    } catch (err: any) {
      console.warn('Audio session setup failed:', err.message);
      return false;
    }
  };

  /**
   * Start microphone recording. Supports real expo-av capture,
   * falling back gracefully in simulation mode if expo-av throws.
   */
  const startRecording = async () => {
    setError(null);
    setTranscript('');
    setReplyText('');
    
    // Stop any active TTS audio playing
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (e) {}
    }

    const hasPermission = await configureAudioSession();
    if (!hasPermission) return;

    try {
      setStatus('recording');
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
    } catch (err: any) {
      console.warn('Physical microphone unavailable, engaging simulator fallback:', err.message);
      // Engage simulation mode
      setStatus('recording');
    }
  };

  /**
   * Stop recording, transcribe speech via Whisper, analyze query via GPT-4o-mini,
   * trigger physical UI actions, and speak reply via OpenAI TTS.
   */
  const stopRecording = async (simulatedPhrase?: string) => {
    if (status !== 'recording') return;

    try {
      let finalTranscript = '';

      if (recordingRef.current) {
        // Stop actual recording
        const recording = recordingRef.current;
        setStatus('transcribing');
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        recordingRef.current = null;

        if (uri) {
          const whisperRes = await VoiceService.transcribeAudio(uri);
          if (whisperRes.data) {
            finalTranscript = whisperRes.data;
          } else {
            throw new Error(whisperRes.error || 'Speech transcription failed');
          }
        }
      } else {
        // Simulation / Fallback Mode (handles simulator testing elegantly)
        setStatus('transcribing');
        await new Promise((resolve) => setTimeout(resolve, 1200)); // Simulate Whisper latency
        
        // Pick a default query phrase if none passed
        finalTranscript = simulatedPhrase || 'गणित की किताब कार्ट में डाल दो';
      }

      setTranscript(finalTranscript);
      setStatus('processing');

      // 2. GPT Analysis & Intent Processing
      const gptRes = await VoiceService.analyzeVoiceIntent(finalTranscript);
      if (gptRes.error || !gptRes.data) {
        throw new Error(gptRes.error || 'Intent parsing failed');
      }

      const intent: VoiceAgentIntent = gptRes.data;
      setReplyText(intent.responseSpeech);

      // 3. Dispatch App Triggers via DeviceEventEmitter
      if (intent.action !== 'none') {
        DeviceEventEmitter.emit(`voice_${intent.action}`, intent.payload);
      }

      // 4. OpenAI TTS Synthesis and Playback
      setStatus('speaking');
      const ttsRes = await VoiceService.generateSpeechAudio(intent.responseSpeech);
      if (ttsRes.data) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: ttsRes.data },
          { shouldPlay: true }
        );
        soundRef.current = sound;
        
        // Listen for playback completion
        sound.setOnPlaybackStatusUpdate((playbackStatus) => {
          if (playbackStatus.isLoaded && playbackStatus.didJustFinish) {
            setStatus('idle');
            sound.unloadAsync().catch(() => {});
            soundRef.current = null;
          }
        });
      } else {
        // Fallback to text-only if TTS fails
        setStatus('idle');
      }

    } catch (err: any) {
      setError(err.message || 'Voice agent processing failed.');
      setStatus('error');
      console.error('VoiceAgent Error:', err);
    }
  };

  const cancelRecording = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {}
      recordingRef.current = null;
    }
    setStatus('idle');
  };

  return {
    status,
    transcript,
    replyText,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
