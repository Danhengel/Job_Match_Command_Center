from types import SimpleNamespace
from app.services.job_matcher import match_job

def test_strong_title_keyword_and_remote_match():
    profile=SimpleNamespace(
        target_titles=["Director, Construction Loan Administration"],
        priority_keywords=["construction lending","loan servicing","risk management"],
        exclusion_keywords=["entry level"],
        home_location="Riverview, Florida",
        remote_preferred=True,
        hybrid_preferred=True,
    )
    job=SimpleNamespace(
        title="Director, Construction Loan Administration",
        description="Lead construction lending, loan servicing, and risk management operations.",
        location="Remote - United States",
        remote=True,
        salary="$170,000-$210,000"
    )
    result=match_job(job,profile,"construction lending loan servicing operations leadership")
    assert result["score"]>=70
    assert result["title_score"]>=90
    assert len(result["matched_keywords"])==3
