import pytest

from app.services.job_freshness import classify_job_response, verify_job_url


@pytest.mark.parametrize(
    ("status_code", "text", "expected"),
    [
        (404, "", "closed"),
        (410, "", "closed"),
        (403, "", "inaccessible"),
        (429, "", "inaccessible"),
        (503, "", "unknown"),
        (200, "This job is no longer available.", "closed"),
        (200, "The position has been filled with another applicant.", "closed"),
        (200, "Applications are closed for this requisition.", "closed"),
        (200, "This posting is no longer active.", "closed"),
        (200, "Apply now for this open role.", "open"),
    ],
)
def test_classify_job_response(status_code, text, expected):
    status, _reason = classify_job_response(status_code, text)
    assert status == expected


def test_verify_job_url_rejects_private_network_targets():
    result = verify_job_url("http://127.0.0.1/jobs/123")
    assert result["status"] == "invalid_url"
