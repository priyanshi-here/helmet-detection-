# app/main.py — safe lazy-loading FastAPI app (uses stub model if present)

import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.model import YoloModel     # our stub model (or real later)
from app.utils import b64_to_pil, format_results

app = FastAPI(title="Helmet Detection API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL = None
def get_model():
    global MODEL
    if MODEL is None:
        MODEL = YoloModel.get(weights_path='models/best.pt')  # stub will ignore weights path
    return MODEL

@app.get("/")
async def index():
    return {"status": "ok", "note": "WebSocket endpoint at /ws/detect"}

@app.websocket("/ws/detect")
async def websocket_detect(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            text = await websocket.receive_text()
            try:
                obj = json.loads(text)
            except Exception:
                await websocket.send_text(json.dumps({"error":"invalid json"}))
                continue

            b64img = obj.get("image")
            if not b64img:
                await websocket.send_text(json.dumps({"error":"no image provided"}))
                continue

            try:
                pil_img = b64_to_pil(b64img)
            except Exception as e:
                await websocket.send_text(json.dumps({"error":f"image decode error: {e}"}))
                continue

            model = get_model()
            try:
                results = model.model(pil_img, imgsz=640, conf=0.25, device=None)
                resp = format_results(results)
                await websocket.send_text(json.dumps(resp))
            except Exception as e:
                # Keep server alive — return error to client
                print("Inference error:", repr(e))
                await websocket.send_text(json.dumps({"error": f"inference error: {str(e)}"}))

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print("Unexpected error in websocket handler:", repr(e))
        await websocket.close()
