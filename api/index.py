"""
Vercel Serverless Function entrypoint for AdaptiveAI FastAPI backend.
"""
import os
import sys

# 1. Add 'backend' directory to sys.path so 'app' modules can be imported
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# 2. Set environment flag to indicate deployment on Vercel
os.environ["VERCEL"] = "1"

# 3. Import the FastAPI application instance
from app.main import app

# 4. Vercel automatically invokes 'handler' or 'app' as the ASGI callable
handler = app
