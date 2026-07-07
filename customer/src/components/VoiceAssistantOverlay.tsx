'use client';

import React from 'react';
import { VoiceAgentIntent } from '../services/voiceService';

interface VoiceAssistantOverlayProps {
  isOpen: boolean;
  isRecording: boolean;
  isAnalyzing: boolean;
  transcript: string;
  aiResponse: string | null;
  error: string | null;
  onClose: () => void;
  onRecordToggle: () => void;
}

export default function VoiceAssistantOverlay({
  isOpen,
  isRecording,
  isAnalyzing,
  transcript,
  aiResponse,
  error,
  onClose,
  onRecordToggle,
}: VoiceAssistantOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all duration-300">
      <div className="relative w-full max-w-md p-6 glass-panel border border-purple-500/30 flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}
          id="btn-close-voice"
        >
          &times;
        </button>

        <h3 className="text-xl font-bold mb-2 text-glow" style={{ color: 'var(--text-white)' }}>
          Pustora Voice Assistant
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Speak in Hindi, English or Hinglish
        </p>

        {/* Animated wave bars and glow circle */}
        <div className="relative w-36 h-36 flex items-center justify-center mb-8">
          <div
            className={`absolute inset-0 rounded-full bg-purple-600/20 blur-xl transition-all duration-1000 ${
              isRecording ? 'scale-125 opacity-80 pulsing-glow' : 'scale-100 opacity-30'
            }`}
          />
          <button
            onClick={onRecordToggle}
            className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              isRecording
                ? 'bg-red-500 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                : 'bg-purple-600 border-purple-400 hover:bg-purple-500 shadow-[0_0_20px_rgba(138,79,255,0.4)]'
            }`}
            style={{ cursor: 'pointer' }}
            id="btn-toggle-mic"
          >
            {isRecording ? (
              // Stop square icon
              <div className="w-8 h-8 bg-white rounded-sm" />
            ) : (
              // Mic icon
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Audio Wave Visualizer while recording */}
        {isRecording && (
          <div className="flex items-center justify-center gap-1 mb-6 h-8">
            <span className="wave-bar" />
            <span className="wave-bar" />
            <span className="wave-bar" />
            <span className="wave-bar" />
            <span className="wave-bar" />
          </div>
        )}

        {/* Status Text */}
        <div className="w-full mb-4 px-2 min-h-[4rem] flex flex-col justify-center">
          {isRecording && (
            <p className="text-purple-400 font-medium pulsing-glow animate-pulse">
              Listening... tap button to finish
            </p>
          )}
          {isAnalyzing && (
            <p className="text-amber-400 font-medium">
              Processing Lucknow catalogs...
            </p>
          )}
          {!isRecording && !isAnalyzing && !transcript && !aiResponse && !error && (
            <p className="text-gray-400">
              Tap the microphone to start asking for textbook recommendations or placing orders.
            </p>
          )}

          {transcript && (
            <div className="text-left bg-black/40 p-3 rounded-lg border border-white/5 mb-2 w-full">
              <span className="text-[11px] uppercase tracking-wider text-purple-400 font-bold block mb-1">
                You Said
              </span>
              <p className="text-sm text-gray-200">{transcript}</p>
            </div>
          )}

          {aiResponse && (
            <div className="text-left bg-purple-950/20 p-3 rounded-lg border border-purple-500/20 w-full">
              <span className="text-[11px] uppercase tracking-wider text-purple-300 font-bold block mb-1">
                Pustora Assistant
              </span>
              <p className="text-sm text-glow-accent font-medium">{aiResponse}</p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 font-semibold bg-red-950/30 p-3 rounded-lg border border-red-500/20">
              Error: {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
