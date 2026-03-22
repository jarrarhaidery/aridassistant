import { useState, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onTranscription, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone error:", error);
      alert("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch(`${API_URL}/voice/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onTranscription(data.text);
      } else {
        alert("Transcription failed");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      alert("Failed to transcribe");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled || isProcessing}
      className={`p-3.5 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
        isRecording
          ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
          : "bg-blue-100 hover:bg-blue-200 text-blue-600"
      }`}
      title={isRecording ? "Stop recording" : "Voice input"}
    >
      {isProcessing ? (
        <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )}
    </button>
  );
}