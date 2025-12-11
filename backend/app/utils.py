import base64
import io
from PIL import Image, ImageFile
import numpy as np
from typing import Any, Dict, List

# Allow truncated images to load in some cases
ImageFile.LOAD_TRUNCATED_IMAGES = True


def b64_to_pil(b64_str: str) -> Image.Image:
    """
    Accept both "data:image/jpeg;base64,..." or raw base64 strings.
    Returns a PIL.Image in RGB mode.
    """
    if not isinstance(b64_str, str):
        raise TypeError("b64_to_pil expects a base64-encoded string")

    # Accept data URI form
    if ',' in b64_str:
        _, b64_str = b64_str.split(',', 1)

    try:
        img_bytes = base64.b64decode(b64_str)
    except Exception as e:
        raise ValueError("invalid base64 data") from e

    try:
        return Image.open(io.BytesIO(img_bytes)).convert('RGB')
    except Exception as e:
        # Try a fallback by forcing bytes -> numpy -> PIL
        try:
            arr = np.frombuffer(img_bytes, dtype=np.uint8)
            return Image.fromarray(arr).convert('RGB')
        except Exception:
            raise e


def _to_numpy(x: Any) -> np.ndarray:
    """
    Convert tensor/array/scalar-like objects to a numpy array.
    Handles torch tensors if torch is available.
    """
    try:
        import torch
        if isinstance(x, torch.Tensor):
            return x.detach().cpu().numpy()
    except Exception:
        pass

    if isinstance(x, np.ndarray):
        return x
    try:
        return np.array(x)
    except Exception:
        # Last-resort: wrap as array of one element
        return np.asarray([x])


def format_results(results) -> Dict[str, List[Dict[str, Any]]]:
    """
    Accepts ultralytics Results object (or iterable of Results).
    Returns: {'detections': [ {xyxy: [...], conf: float, class: int, label: str}, ... ]}
    """
    # If single Results object with .boxes (not iterable), wrap it
    if not isinstance(results, (list, tuple)) and hasattr(results, "boxes"):
        results = [results]

    try:
        out = []
        for r in results:
            boxes = getattr(r, "boxes", None)
            names = getattr(r, "names", {})  # Class name mapping
            
            if boxes is None:
                continue

            for box in boxes:
                # Read xyxy, conf, cls from box attributes
                xyxy_attr = getattr(box, "xyxy", None)
                conf_attr = getattr(box, "conf", None)
                cls_attr = getattr(box, "cls", None)

                # Convert xyxy
                try:
                    xyxy_np = _to_numpy(xyxy_attr)
                    if xyxy_np is None:
                        raise ValueError
                    if xyxy_np.ndim > 1:
                        xyxy = xyxy_np.reshape(-1, 4)[0].tolist()
                    else:
                        xyxy = xyxy_np.flatten().tolist()
                except Exception:
                    try:
                        xyxy = [float(x) for x in xyxy_attr]
                    except Exception:
                        xyxy = [0.0, 0.0, 0.0, 0.0]

                # Convert confidence
                try:
                    conf_np = _to_numpy(conf_attr)
                    conf = float(conf_np.item()) if hasattr(conf_np, "item") else float(conf_np)
                except Exception:
                    try:
                        conf = float(conf_attr)
                    except Exception:
                        conf = 0.0

                # Convert class
                try:
                    cls_np = _to_numpy(cls_attr)
                    cls = int(cls_np.item()) if hasattr(cls_np, "item") else int(cls_np)
                except Exception:
                    try:
                        cls = int(cls_attr)
                    except Exception:
                        cls = 0

                # Get class label name
                label = names.get(cls, f"class_{cls}")

                out.append({
                    "xyxy": [float(x) for x in xyxy],
                    "conf": float(conf),
                    "class": int(cls),
                    "label": str(label)
                })
        return {"detections": out}
    except Exception:
        # Fallback: return empty
        return {"detections": []}