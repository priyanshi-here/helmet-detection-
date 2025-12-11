# 🪖 Helmet Detection System

Real-time helmet detection system using YOLOv8 AI for workplace safety monitoring. The system uses a webcam to detect whether workers are wearing safety helmets, providing instant visual feedback and safety statistics.

![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.10+-blue)
![Node](https://img.shields.io/badge/node-18+-green)

## ✨ Features

- **Real-time Detection** - Live webcam feed with instant helmet detection
- **YOLOv8 Powered** - State-of-the-art object detection model
- **WebSocket Streaming** - Low-latency communication between frontend and backend
- **Safety Dashboard** - Visual stats showing helmet compliance and safety score
- **Modern UI** - Glassmorphism design with dark theme
- **PM2 Ready** - Production-ready process management

## 📸 Preview

The interface shows:
- Live video feed with detection boxes
- Color-coded status (🟢 Helmet, 🔴 No Helmet)
- Real-time safety statistics
- Connection status indicators

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** - For the backend
- **Node.js 18+** - For the frontend
- **PM2** (optional) - For process management

```bash
# Install PM2 globally (optional but recommended)
npm install -g pm2
```

### Installation

1. **Clone or navigate to the project**
   ```bash
   cd "helmet detection"
   ```

2. **Set up the backend**
   ```bash
   cd backend
   
   # Create virtual environment
   python3 -m venv venv
   
   # Activate it
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   cd ..
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Running the Application

#### Option 1: Using PM2 (Recommended)

```bash
# Start both services
npm start

# Check status
npm run status

# View logs
npm run logs

# Stop services
npm stop
```

#### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000

---

## 📁 Project Structure

```
helmet detection/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI WebSocket server
│   │   ├── model.py         # YOLO model loader
│   │   └── utils.py         # Image processing utilities
│   ├── models/
│   │   └── best.pt          # Trained YOLO weights
│   ├── venv/                # Python virtual environment
│   ├── requirements.txt     # Python dependencies
│   └── start.sh             # Backend start script
│
├── frontend/
│   ├── public/
│   │   └── helmet.svg       # Favicon
│   ├── src/
│   │   ├── App.jsx          # Main React component
│   │   ├── main.jsx         # React entry point
│   │   └── index.css        # Tailwind styles
│   ├── index.html           # HTML entry
│   ├── package.json         # NPM dependencies
│   ├── vite.config.js       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS config
│   └── postcss.config.js    # PostCSS config
│
├── ecosystem.config.js      # PM2 configuration
├── package.json             # Root package with PM2 scripts
└── README.md                # This file
```

---

## 🔧 Configuration

### Backend Configuration

Edit `backend/app/main.py` to change:
- WebSocket endpoint path
- CORS settings
- Model parameters

### Frontend Configuration

Edit `frontend/src/App.jsx` to change:

```javascript
const BACKEND_WS_URL = 'ws://localhost:8000/ws/detect';  // Backend URL
const SEND_INTERVAL_MS = 150;  // Frame send rate (ms)
const RENDER_FPS = 30;         // Video render rate
```

### PM2 Configuration

Edit `ecosystem.config.js` to change ports, environment variables, etc.

---

## 🛠️ API Reference

### WebSocket Endpoint

**URL**: `ws://localhost:8000/ws/detect`

**Request Format:**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```

**Response Format:**
```json
{
  "detections": [
    {
      "xyxy": [x1, y1, x2, y2],
      "conf": 0.95,
      "class": 0,
      "label": "helmet"
    }
  ]
}
```

### REST Endpoint

**GET** `/` - Health check
```json
{
  "status": "ok",
  "note": "WebSocket endpoint at /ws/detect"
}
```

---

## 📦 Dependencies

### Backend (Python)
| Package | Purpose |
|---------|---------|
| fastapi | Web framework |
| uvicorn | ASGI server |
| ultralytics | YOLOv8 model |
| pillow | Image processing |
| numpy | Array operations |

### Frontend (Node.js)
| Package | Purpose |
|---------|---------|
| react | UI framework |
| vite | Build tool |
| tailwindcss | CSS framework |
| lucide-react | Icons |

---

## 🐛 Troubleshooting

### Backend won't start

**Port already in use:**
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9
pm2 restart helmet-backend
```

**Module not found:**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend won't start

**Dependencies missing:**
```bash
cd frontend
rm -rf node_modules
npm install
```

### Camera not working

- Ensure browser has camera permissions
- Check if another app is using the camera
- Try a different browser (Chrome recommended)

### WebSocket connection failed

- Verify backend is running: `curl http://localhost:8000/`
- Check backend logs: `pm2 logs helmet-backend`
- Ensure no firewall blocking port 8000

---

## 🎯 Model Training

The included `best.pt` is a pre-trained helmet detection model. To train your own:

1. Prepare dataset in YOLO format
2. Use Ultralytics training:
   ```bash
   yolo detect train data=your_dataset.yaml model=yolov8n.pt epochs=100
   ```
3. Replace `models/best.pt` with your trained weights

---

## 📝 PM2 Commands Reference

| Command | Description |
|---------|-------------|
| `npm start` | Start all services |
| `npm stop` | Stop all services |
| `npm restart` | Restart all services |
| `npm run logs` | View live logs |
| `npm run status` | Check service status |
| `npm run monit` | Open monitoring dashboard |
| `npm run delete` | Remove from PM2 |

Or use PM2 directly:
```bash
pm2 start ecosystem.config.js
pm2 stop all
pm2 restart all
pm2 logs
pm2 monit
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

MIT License - feel free to use this project for any purpose.

---

## 🙏 Acknowledgments

- [Ultralytics](https://ultralytics.com/) for YOLOv8
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [Vite](https://vitejs.dev/) for the frontend build tool
- [Tailwind CSS](https://tailwindcss.com/) for styling
