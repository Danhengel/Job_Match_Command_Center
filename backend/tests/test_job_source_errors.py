import requests
from tenacity import Future, RetryError

from app.services import job_sources


def _http_error(status_code: int) -> requests.HTTPError:
    response = requests.Response()
    response.status_code = status_code
    response.url = "https://source.example/jobs"
    return requests.HTTPError(response=response)


def test_source_error_message_hides_internal_retry_details():
    last_attempt = Future(3)
    last_attempt.set_exception(_http_error(404))

    message = job_sources.source_error_message(RetryError(last_attempt))

    assert message == "board is unavailable or no longer public"
    assert "HTTPError" not in message
    assert "0x" not in message


def test_client_errors_are_not_retried():
    assert job_sources._retryable_source_error(_http_error(404)) is False
    assert job_sources._retryable_source_error(_http_error(403)) is False


def test_transient_source_errors_are_retried_and_summarized():
    error = _http_error(503)

    assert job_sources._retryable_source_error(error) is True
    assert job_sources.source_error_message(error) == "source is temporarily unavailable"


def test_configuration_guidance_is_preserved():
    error = RuntimeError("JSearch is enabled but RAPIDAPI_KEY is not configured.")

    assert job_sources.source_error_message(error) == str(error)
