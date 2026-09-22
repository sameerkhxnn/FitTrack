import sys
import os

# Add current workspace root to sys.path so backend is discoverable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.main import app

__all__ = ["app"]
