import os
import json
import spacy
import pdfplumber
from typing import List, Dict, Any
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import uuid

# Import the new parse_resume function
from Resume_parser import parse_resume

app = FastAPI(title="Resume Parser Microservice")

# Update CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://pac-talent-track.web.app", "http://localhost:3000"],  # Frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """
    Root endpoint providing API information and status
    """
    return {
        "status": "ok",
        "service": "Resume Parser API",
        "version": "1.0",
        "endpoints": {
            "parse_resume": "/parse-resume/",
            "docs": "/docs"
        }
    }

@app.post("/parse-resume/")
async def parse_resume_endpoint(file: UploadFile = File(...)):
    """
    Parse resume and extract skills
    Temporarily stores file and deletes after processing
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Create a temporary file
    temp_dir = tempfile.gettempdir()
    temp_filename = f"{uuid.uuid4()}_{file.filename}"
    temp_filepath = os.path.join(temp_dir, temp_filename)

    try:
        # Save uploaded file
        with open(temp_filepath, "wb") as buffer:
            buffer.write(await file.read())

        # Parse resume using the new function
        result = parse_resume(temp_filepath)

        # Remove temporary file
        os.unlink(temp_filepath)

        return result
    except Exception as e:
        # Ensure temp file is deleted even if an error occurs
        if os.path.exists(temp_filepath):
            os.unlink(temp_filepath)
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
