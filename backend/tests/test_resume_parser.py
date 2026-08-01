from app.services.resume_parser import extract_text, ResumeValidationError

def test_extract_txt():
    assert extract_text("resume.txt", b"Leadership and lending operations") == "Leadership and lending operations"

def test_reject_extension():
    try: extract_text("resume.exe", b"x")
    except ResumeValidationError: return
    assert False, "Expected validation error"
