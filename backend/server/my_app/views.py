from rest_framework.decorators import api_view
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from .models import Question, Report
from .videoProcessing import extract_text_from_video
import google.generativeai as genai
import os
import tempfile
import time  # Needed for retry logic
from concurrent.futures import ThreadPoolExecutor

# Setup Gemini
# Note: Using 'gemini-2.0-flash' because 1.5 isn't available for your key
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-2.0-flash')

def ask_gemini(prompt):
    try:
        resp = model.generate_content(prompt)
        return resp.text
    except Exception as e:
        return f"Error generating: {str(e)}"

# --- 1. GET QUESTION (AI GENERATED) ---
@api_view(['GET'])
def get_random_question(request, card_name):
    # Map 'dsa', 'cn' to real names for better prompts
    topic_map = {
        'dbms': 'Database Management Systems',
        'os': 'Operating Systems',
        'cn': 'Computer Networks',
        'dsa': 'Data Structures',
        'oops': 'Object Oriented Programming',
        'web': 'Web Development'
    }
    full_topic = topic_map.get(card_name, card_name)

    # 1. Ask Gemini for a question
    prompt = f"Generate exactly one technical interview question about {full_topic}. Just the question text, nothing else."
    question_text = ask_gemini(prompt).strip()

    # 2. Save to DB (So frontend has an ID)
    q = Question.objects.create(question=question_text, genre=card_name)
    
    return JsonResponse({
        'question': q.question,
        'id': q.id
    }, status=200)


# --- 2. VIDEO SUBMISSION & GRADING ---
@csrf_exempt
@api_view(['POST'])
def index_view(request):
    if 'video' not in request.FILES:
        return JsonResponse({"message": "No video"}, status=400)

    video_file = request.FILES['video']
    question_id = request.data.get('question_id')
    
    try:
        question_obj = Question.objects.get(id=question_id)
        question_text = question_obj.question
    except Question.DoesNotExist:
        return JsonResponse({"message": "Question not found"}, status=404)

    # 1. Save Video Temp (delete=False is critical for Windows)
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
        for chunk in video_file.chunks(): 
            f.write(chunk)
        video_path = f.name

    try:
        # 2. Extract Text
        user_answer = extract_text_from_video(video_path)
    except Exception as e:
        print(f"Video extraction failed: {e}")
        user_answer = "Error extracting audio from video."

    # 3. Clean up Video File SAFELY (Fix for WinError 32)
    # We try 5 times with a small delay to let Windows release the lock
    for _ in range(5):
        try:
            if os.path.exists(video_path):
                os.remove(video_path)
            break
        except PermissionError:
            time.sleep(0.5)  # Wait 0.5s and retry
        except Exception as e:
            print(f"Error deleting temp file: {e}")
            break

    # 4. Parallel Gemini Calls
    prompts = {
        'rating': f"Rate this answer out of 10. Return ONLY the number. Q: {question_text} A: {user_answer}",
        'feedback': f"Give 100 words feedback on this answer for '{question_text}'. Answer: {user_answer}",
        'strengths': f"What were the strengths of this answer? Q: {question_text} A: {user_answer}",
        'model_answer': f"What is the perfect short answer for: {question_text}?",
    }

    results = {}
    # Wrap Gemini call in try/except to catch API quota errors
    try:
        with ThreadPoolExecutor() as executor:
            future_map = {executor.submit(ask_gemini, p): k for k, p in prompts.items()}
            for future in future_map:
                key = future_map[future]
                results[key] = future.result()
    except Exception as e:
        return JsonResponse({"message": f"AI Error: {str(e)}"}, status=500)

    return JsonResponse({
        "rating": results.get('rating', '0').strip(),
        "feedback": results.get('feedback', 'No feedback'),
        "strengths": results.get('strengths', 'No strengths'),
        "model_answer": results.get('model_answer', 'No model answer'),
        "user_answer": user_answer
    })


# --- 3. SAVE REPORT ---
@api_view(['POST'])
def save_report(request):
    data = request.data
    try:
        user = User.objects.get(email=data.get('email'))
        question = Question.objects.get(id=data.get('question_id'))
        
        Report.objects.create(
            user=user,
            question=question,
            rating=float(data.get('rating') or 0),
            user_answer=data.get('user_answer', ''),
            feedback=data.get('feedback', '')
        )
        return JsonResponse({'message': 'Saved'}, status=201)
    except Exception as e:
        print(e)
        return JsonResponse({'message': str(e)}, status=500)


# --- 4. PROFILE ---
@api_view(['GET'])
def profile(request, email):
    try:
        user = User.objects.get(email=email)
        reports = Report.objects.filter(user=user).order_by('-submit_time')
        
        data = []
        for r in reports:
            data.append({
                "id": r.id,
                "email": user.email,
                "username": user.username,
                "genre_name": r.question.genre, 
                "question": r.question.question,
                "rating": r.rating,
                "user_answer": r.user_answer,
                "feedback": r.feedback,
                "submit_time": r.submit_time
            })
        return JsonResponse(data, safe=False)
    except User.DoesNotExist:
        return JsonResponse([], safe=False)


# --- 5. AUTH ---
@api_view(['POST'])
def signup(request):
    email = request.data.get('email')
    password = request.data.get('password')
    username = request.data.get('username')

    if User.objects.filter(email=email).exists():
        return JsonResponse({'message': 'Email taken'}, status=400)
    
    User.objects.create_user(username=username, email=email, password=password)
    return JsonResponse({'message': 'Success'}, status=201)

@api_view(['POST'])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    try:
        user = User.objects.get(email=email)
        if user.check_password(password):
             return JsonResponse({
                'message': 'Login successful',
                'email': user.email,
                'username': user.username
            }, status=200)
    except User.DoesNotExist:
        pass
        
    return JsonResponse({'message': 'Invalid credentials'}, status=401)

@api_view(['DELETE'])
def delete_report(request, report_id):
    try:
        Report.objects.get(id=report_id).delete()
        return JsonResponse({'message': 'Deleted'}, status=200)
    except:
        return JsonResponse({'error': 'Not found'}, status=404)