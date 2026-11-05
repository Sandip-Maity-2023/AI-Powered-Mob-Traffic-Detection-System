import uvicorn
import os
import sys

# Ensure backend package is in python search path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"Starting SentraCity FastAPI Backend on http://127.0.0.1:{port} ...")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=False)

