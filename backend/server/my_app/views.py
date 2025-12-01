from rest_framework.decorators import api_view
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from .models import Question, Report
from .videoProcessing import extract_text_from_video

import google.generativeai as genai
import os
import tempfile
import time
import json
from concurrent.futures import ThreadPoolExecutor

# -----------------------------
# GEMINI SETUP
# -----------------------------
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.0-flash")

def ask_gemini(prompt):
    try:
        resp = model.generate_content(prompt)
        return resp.text
    except Exception as e:
        return f"Error generating: {str(e)}"


# -----------------------------------------------------
# 1. GET RANDOM QUESTION
# -----------------------------------------------------
@api_view(["GET"])
def get_random_question(request, card_name):
    topic_map = {
        "dbms": "Database Management Systems",
        "os": "Operating Systems",
        "cn": "Computer Networks",
        "dsa": "Data Structures",
        "oops": "Object Oriented Programming",
        "web": "Web Development"
    }

    full_topic = topic_map.get(card_name, card_name)
    prompt = f"Generate exactly one technical interview question about {full_topic}. Output only the question."

    question_text = ask_gemini(prompt).strip()
    q = Question.objects.create(question=question_text, genre=card_name)

    return JsonResponse({"question": q.question, "id": q.id}, status=200)


# -----------------------------------------------------
# 2. VIDEO UPLOAD + AI EVALUATION
# -----------------------------------------------------
@csrf_exempt
@api_view(["POST"])
def index_view(request):

    if "video" not in request.FILES:
        return JsonResponse({"message": "No video received"}, status=400)

    video_file = request.FILES["video"]
    question_id = request.data.get("question_id")

    try:
        question_obj = Question.objects.get(id=question_id)
    except Question.DoesNotExist:
        return JsonResponse({"message": "Invalid question ID"}, status=404)

    # ---- Save temp video ----
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
        for chunk in video_file.chunks():
            f.write(chunk)
        video_path = f.name

    # ---- Extract transcript ----
    try:
        user_answer = extract_text_from_video(video_path)
    except Exception as e:
        print("Video extraction failed:", e)
        user_answer = "Unable to extract speech from video."

    # ---- Safe delete video (Windows fix) ----
    for _ in range(5):
        try:
            if os.path.exists(video_path):
                os.remove(video_path)
            break
        except PermissionError:
            time.sleep(0.3)
        except Exception as e:
            print("File delete error:", e)
            break

    # ---- AI evaluation ----
    question_text = question_obj.question

    prompts = {
        "rating": f"Rate this answer out of 10. ONLY return the number. Q: {question_text} A: {user_answer}",
        "feedback": f"Give a 100-word feedback for Q: {question_text}. A: {user_answer}",
        "strengths": f"List strengths of this answer. Q: {question_text} A: {user_answer}",
        "model_answer": f"Give the ideal short answer for: {question_text}"
    }

    results = {}

    try:
        with ThreadPoolExecutor() as executor:
            future_map = {executor.submit(ask_gemini, p): key for key, p in prompts.items()}
            for future in future_map:
                key = future_map[future]
                results[key] = future.result()
    except Exception as e:
        return JsonResponse({"message": f"AI Error: {str(e)}"}, status=500)

    return JsonResponse({
        "rating": results["rating"].strip(),
        "feedback": results["feedback"],
        "strengths": results["strengths"],
        "model_answer": results["model_answer"],
        "user_answer": user_answer
    }, status=200)



# -----------------------------------------------------
# 3. SAVE FULL INTERVIEW REPORT (multiple questions)
# -----------------------------------------------------
@api_view(["POST"])
def save_report(request):
    """
    Expected JSON:
    {
        "email": "x@gmail.com",
        "reports": [
            {
                "question_id": 3,
                "rating": "8",
                "user_answer": "...",
                "feedback": "...",
                "strengths": "...",
                "model_answer": "..."
            }
        ]
    }
    """

    try:
        data = request.data
        email = data.get("email")
        reports = data.get("reports", [])

        if not email:
            return JsonResponse({"message": "Email missing"}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({"message": "User not found"}, status=404)

        created_ids = []

        for r in reports:
            try:
                qid = r.get("question_id")
                q = Question.objects.get(id=qid)

                rep = Report.objects.create(
                    user=user,
                    question=q,
                    rating=float(r.get("rating") or 0),
                    user_answer=r.get("user_answer", ""),
                    feedback=r.get("feedback", "")
                )
                created_ids.append(rep.id)

            except Exception as e:
                print("Failed saving item:", e)
                continue

        return JsonResponse({"message": "Saved", "created_ids": created_ids}, status=201)

    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)



# -----------------------------------------------------
# 4. USER PROFILE REPORT HISTORY
# -----------------------------------------------------
@api_view(["GET"])
def profile(request, email):
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse([], safe=False)

    reports = Report.objects.filter(user=user).order_by("-submit_time")

    result = [{
        "id": r.id,
        "email": user.email,
        "username": user.username,
        "genre_name": r.question.genre,
        "question": r.question.question,
        "rating": r.rating,
        "user_answer": r.user_answer,
        "feedback": r.feedback,
        "submit_time": r.submit_time
    } for r in reports]

    return JsonResponse(result, safe=False)



# -----------------------------------------------------
# 5. AUTH — SIGNUP / LOGIN
# -----------------------------------------------------
@api_view(["POST"])
def signup(request):
    email = request.data.get("email")
    password = request.data.get("password")
    username = request.data.get("username")

    if User.objects.filter(email=email).exists():
        return JsonResponse({"message": "Email already registered"}, status=400)

    User.objects.create_user(username=username, email=email, password=password)
    return JsonResponse({"message": "Success"}, status=201)


@api_view(["POST"])
def login(request):
    email = request.data.get("email")
    password = request.data.get("password")

    try:
        user = User.objects.get(email=email)
        if user.check_password(password):
            return JsonResponse({
                "message": "Login successful",
                "email": user.email,
                "username": user.username
            }, status=200)
    except:
        pass

    return JsonResponse({"message": "Invalid credentials"}, status=401)



# -----------------------------------------------------
# 6. DELETE REPORT
# -----------------------------------------------------
@api_view(["DELETE"])
def delete_report(request, report_id):
    try:
        Report.objects.get(id=report_id).delete()
        return JsonResponse({"message": "Deleted"}, status=200)
    except:
        return JsonResponse({"error": "Not found"}, status=404)



# -----------------------------------------------------
# 7. PROCTORING — EVENT LOGGER
# -----------------------------------------------------
@csrf_exempt
@api_view(["POST"])
def log_event(request):
    try:
        evt = request.POST.get("event")
        snapshot = request.FILES.get("snapshot")

        print("\nEvent:", evt)
        if snapshot:
            print("Snapshot:", snapshot.name)

        return JsonResponse({"status": "ok"}, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)



# -----------------------------------------------------
# 8. PROCTORING — HEARTBEAT
# -----------------------------------------------------
@csrf_exempt
@api_view(["POST"])
def heartbeat(request):
    try:
        print("Heartbeat:", request.data)
        return JsonResponse({"alive": True})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
