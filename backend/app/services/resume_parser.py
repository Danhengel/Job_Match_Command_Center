from io import BytesIO
from pathlib import Path
from pypdf import PdfReader
from docx import Document

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024

class ResumeValidationError(ValueError):
    pass

def validate_file(filename: str, content: bytes) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise ResumeValidationError("Only PDF, DOCX, and TXT files are allowed")
    if not content:
        raise ResumeValidationError("The uploaded file is empty")
    if len(content) > MAX_FILE_SIZE:
        raise ResumeValidationError("File exceeds the 10 MB limit")
    return suffix

def extract_text(filename: str, content: bytes) -> str:
    suffix = validate_file(filename, content)
    if suffix == ".txt":
        return content.decode("utf-8", errors="replace").strip()
    if suffix == ".pdf":
        reader = PdfReader(BytesIO(content))
        return "\n".join((page.extract_text() or "") for page in reader.pages).strip()
    doc = Document(BytesIO(content))
    return "\n".join(p.text for p in doc.paragraphs).strip()
