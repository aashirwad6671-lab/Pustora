import { useState, useRef } from 'react';
import { VoiceService, VoiceAgentIntent } from '../services/voiceService';

export interface UseWebVoiceAgentReturn {
  isRecording: boolean;
  isAnalyzing: boolean;
  transcript: string;
  aiResponse: string | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearState: () => void;
}

export function useWebVoiceAgent(
  onIntentAction?: (intent: VoiceAgentIntent) => void
): UseWebVoiceAgentReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);
    setTranscript('');
    setAiResponse(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsAnalyzing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // 1. Transcribe audio using Whisper
          const transcriptionResult = await VoiceService.transcribeAudio(audioBlob);
          if (transcriptionResult.error || !transcriptionResult.data) {
            throw new Error(transcriptionResult.error || 'Failed to transcribe audio.');
          }

          const userText = transcriptionResult.data;
          setTranscript(userText);

          // 2. Analyze intent using GPT-4o-mini
          const intentResult = await VoiceService.analyzeVoiceIntent(userText, []);
          if (intentResult.error || !intentResult.data) {
            throw new Error(intentResult.error || 'Failed to analyze user intent.');
          }

          const intent = intentResult.data;
          setAiResponse(intent.responseSpeech);

          // 3. Play natural bilingual response TTS
          const ttsResult = await VoiceService.generateSpeechAudio(intent.responseSpeech);
          if (ttsResult.data) {
            const audio = new Audio(ttsResult.data);
            audio.play().catch((err) => console.error('Audio play failed:', err));
          }

          // 4. Trigger UI action callback
          if (onIntentAction) {
            onIntentAction(intent);
          }
        } catch (err: any) {
          setError(err.message || 'Error processing voice input.');
        } finally {
          setIsAnalyzing(false);
          // Stop media stream tracks
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setError(err.message || 'Failed to access microphone.');
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearState = () => {
    setIsRecording(false);
    setIsAnalyzing(false);
    setTranscript('');
    setAiResponse(null);
    setError(null);
  };

  return {
    isRecording,
    isAnalyzing,
    transcript,
    aiResponse,
    error,
    startRecording,
    stopRecording,
    clearState,
  };
}
