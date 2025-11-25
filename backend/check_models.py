import google.generativeai as genai
import os

# Paste your API Key here directly for this test
os.environ["GEMINI_API_KEY"] = "AIzaSyCIcWTpwh1aApFy9C2NcpM5FxbWEgNx874"
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

print("Listing available models...")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)