import tempfile
from moviepy import VideoFileClip 
import speech_recognition as sr
import os

def extract_text_from_video(video_path):
    temp_audio_path = None
    video = None
    audio = None
    
    try:
        # 1. Load Video safely
        try:
            video = VideoFileClip(video_path)
        except Exception as e:
            return f"Error: Could not open video file. {str(e)}"

        # 2. Extract Audio Track
        audio = video.audio
        if audio is None:
            return "Error: No audio track found in video. Please check your microphone settings."

        # 3. Save Audio to Temp WAV
        # delete=False ensures the file exists for SpeechRecognition to read
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            temp_audio_path = f.name
        
        # Convert to standard PCM WAV (Essential for SpeechRecognition)
        # logger=None silences the progress bar in terminal
        audio.write_audiofile(temp_audio_path, codec='pcm_s16le', logger=None)
        
        # 4. Process Audio
        recognizer = sr.Recognizer()
        with sr.AudioFile(temp_audio_path) as source:
            audio_data = recognizer.record(source)

        # 5. Cleanup Resources (Important for Windows file locks)
        if video: video.close()
        if audio: audio.close()
        
        # 6. Convert Speech to Text
        try:
            text = recognizer.recognize_google(audio_data)
            return text
        except sr.UnknownValueError:
            # This means audio exists, but no words were understood
            return "Audio was recorded, but no speech was detected."
        except sr.RequestError:
            return "Error connecting to Google Speech Recognition service."

    except Exception as e:
        print(f"Processing Error: {e}")
        return f"Error processing video: {str(e)}"
        
    finally:
        # FINAL CLEANUP: Always try to delete the temp audio file
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except Exception:
                pass
        # Ensure video is closed if it wasn't earlier
        try:
            if video: video.close()
        except:
            pass