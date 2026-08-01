from __future__ import annotations
import re

def tokens(value):
    return {x for x in re.findall(r"[a-z0-9+#.-]{3,}",(value or "").lower())}

def match_job(job, profile, resume_text=""):
    hay=f"{job.title} {job.description}".lower()
    title_tokens=tokens(job.title)
    target_scores=[]
    for target in profile.target_titles or []:
        target_tokens=tokens(target)
        if not target_tokens: continue
        overlap=len(title_tokens & target_tokens)/len(target_tokens)
        exact=1 if target.lower() in job.title.lower() or job.title.lower() in target.lower() else 0
        target_scores.append(min(100,round(overlap*70+exact*35)))
    title_score=max(target_scores or [0])

    matched=[k for k in profile.priority_keywords or [] if k.lower() in hay]
    missing=[k for k in profile.priority_keywords or [] if k.lower() not in hay]
    keyword_score=min(100,round(len(matched)/max(1,len(profile.priority_keywords or []))*100))

    location_text=(job.location or "").lower()
    city=(profile.home_location or "").split(",")[0].lower()
    if job.remote and profile.remote_preferred:
        location_score=100
    elif city and city in location_text:
        location_score=100
    elif profile.hybrid_preferred and any(x in location_text for x in ["hybrid",city]):
        location_score=80
    else:
        location_score=25

    resume_tokens=tokens(resume_text)
    job_tokens=tokens(job.description)
    overlap=len(resume_tokens & job_tokens)
    resume_score=min(100,round(overlap/max(1,min(len(job_tokens),120))*100))

    concerns=[]
    for word in profile.exclusion_keywords or []:
        if word.lower() in hay: concerns.append(word)
    if location_score<50: concerns.append("Location fit needs review")
    if not job.salary: concerns.append("Compensation not listed")

    score=round(title_score*.35+keyword_score*.30+location_score*.20+resume_score*.15-len(concerns)*4)
    score=max(0,min(100,score))
    explanation=(
        f"Title alignment {title_score}%, priority-keyword coverage {keyword_score}%, "
        f"location fit {location_score}%, and résumé-language overlap {resume_score}%."
    )
    return {
        "score":score,"title_score":title_score,"keyword_score":keyword_score,
        "location_score":location_score,"resume_score":resume_score,
        "matched_keywords":matched[:15],"missing_keywords":missing[:10],
        "concerns":concerns[:6],"explanation":explanation
    }
