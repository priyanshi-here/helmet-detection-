# app/model.py — YOLOv8 model loader with singleton pattern

import threading
import os
from pathlib import Path

class YoloModel:
    """Thread-safe singleton wrapper for YOLO model."""
    _instance = None
    _lock = threading.Lock()

    def __init__(self, weights_path: str = "models/best.pt", device: str = None):
        from ultralytics import YOLO
        
        # Resolve weights path relative to backend directory
        if not os.path.isabs(weights_path):
            backend_dir = Path(__file__).parent.parent
            weights_path = backend_dir / weights_path
        
        print(f"Loading YOLO model from: {weights_path}")
        self._model = YOLO(str(weights_path))
        self._device = device
        print("YOLO model loaded successfully!")

    @classmethod
    def get(cls, weights_path: str = "models/best.pt", device: str = None):
        """Get or create the singleton model instance."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls(weights_path, device)
        return cls._instance

    @property
    def model(self):
        """Return the underlying YOLO model's inference method."""
        return self._model
