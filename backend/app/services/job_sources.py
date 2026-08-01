from __future__ import annotations
import hashlib, re, requests
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential
from app.services.cache_service import get_json, set_json
from app.core.config import settings

TIMEOUT=30
HEADERS={"User-Agent":"JobMatchCommandCenter/1.0","Accept":"application/json"}

def clean_html(value):
    return BeautifulSoup(value or "","html.parser").get_text(" ",strip=True)

def stable_key(source, company, title, url):
    return hashlib.sha256(f"{source}|{company}|{title}|{url}".lower().encode()).hexdigest()

@retry(stop=stop_after_attempt(3),wait=wait_exponential(multiplier=.5,min=.5,max=4))
def get_json_url(url,params=None,headers=None):
    merged=dict(HEADERS)
    if headers: merged.update(headers)
    r=requests.get(url,params=params,headers=merged,timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()

def cached(key, loader, ttl=21600):
    hit=get_json(key)
    if hit is not None: return hit
    data=loader()
    set_json(key,data,ttl)
    return data

def remotive(query):
    def load():
        data=get_json_url("https://remotive.com/api/remote-jobs",params={"search":query,"limit":100})
        rows=[]
        for x in data.get("jobs",[]):
            title=x.get("title","");company=x.get("company_name","");url=x.get("url","")
            rows.append({
                "provider_key":stable_key("Remotive",company,title,url),"title":title,"company":company,
                "location":x.get("candidate_required_location") or "Remote","description":clean_html(x.get("description")),
                "url":url,"source":"Remotive","posted_at":x.get("publication_date",""),
                "salary":x.get("salary","") or "","employment_type":x.get("job_type","") or "","remote":True
            })
        return rows
    return cached(f"jobs:remotive:{query.lower()}",load,21600)

def greenhouse(board):
    token=re.sub(r"^.*boards\.greenhouse\.io/","",board.strip()).split("/")[0]
    def load():
        data=get_json_url(f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs",params={"content":"true"})
        company=token.replace("-"," ").title()
        rows=[]
        for x in data.get("jobs",[]):
            title=x.get("title","");url=x.get("absolute_url","");loc=(x.get("location") or {}).get("name","")
            rows.append({
                "provider_key":stable_key("Greenhouse",company,title,url),"title":title,"company":company,
                "location":loc,"description":clean_html(x.get("content")),"url":url,"source":"Greenhouse",
                "posted_at":x.get("updated_at",""),"salary":"","employment_type":"","remote":"remote" in loc.lower()
            })
        return rows
    return cached(f"jobs:greenhouse:{token.lower()}",load,43200)

def lever(site):
    m=re.search(r"jobs\.lever\.co/([A-Za-z0-9_-]+)",site)
    site=m.group(1) if m else site.strip()
    def load():
        data=get_json_url(f"https://api.lever.co/v0/postings/{site}",params={"mode":"json"})
        company=site.replace("-"," ").title();rows=[]
        for x in data:
            cats=x.get("categories") or {};title=x.get("text","");url=x.get("hostedUrl") or x.get("applyUrl") or "";loc=cats.get("location","")
            rows.append({
                "provider_key":stable_key("Lever",company,title,url),"title":title,"company":company,
                "location":loc,"description":x.get("descriptionPlain",""),"url":url,"source":"Lever",
                "posted_at":"","salary":"","employment_type":cats.get("commitment",""),"remote":"remote" in loc.lower()
            })
        return rows
    return cached(f"jobs:lever:{site.lower()}",load,43200)

def ashby(board):
    m=re.search(r"jobs\.ashbyhq\.com/([A-Za-z0-9_-]+)",board)
    board=m.group(1) if m else board.strip()
    def load():
        data=get_json_url(f"https://api.ashbyhq.com/posting-api/job-board/{board}",params={"includeCompensation":"true"})
        company=board.replace("-"," ").title();rows=[]
        for x in data.get("jobs",[]):
            if x.get("isListed") is False: continue
            title=x.get("title","");url=x.get("jobUrl") or x.get("applyUrl") or "";loc=x.get("location","") or ""
            comp=x.get("compensation") or {}
            salary=comp.get("compensationTierSummary") or comp.get("scrapeableCompensationSalarySummary") or ""
            rows.append({
                "provider_key":stable_key("Ashby",company,title,url),"title":title,"company":company,
                "location":loc,"description":clean_html(x.get("descriptionHtml") or x.get("descriptionPlain")),
                "url":url,"source":"Ashby","posted_at":x.get("publishedAt","") or "","salary":salary,
                "employment_type":x.get("employmentType","") or "","remote":bool(x.get("isRemote")) or "remote" in loc.lower()
            })
        return rows
    return cached(f"jobs:ashby:{board.lower()}",load,43200)

def dedupe(rows):
    best={}
    priority={"Greenhouse":9,"Lever":9,"Ashby":9,"Remotive":4}
    for row in rows:
        key=re.sub(r"\W+"," ",f"{row['company']}|{row['title']}|{row['location']}".lower()).strip()
        quality=len(row.get("description",""))+priority.get(row["source"],0)*300
        if key not in best or quality>best[key][0]:
            best[key]=(quality,row)
    return [x[1] for x in best.values()]


def jsearch(query):
    if not settings.rapidapi_key:
        return []

    def load():
        data = get_json_url(
            "https://jsearch.p.rapidapi.com/search-v2",
            params={
                "query": query,
                "num_pages": 3,
                "country": "us",
                "date_posted": "month",
            },
            headers={
                "X-RapidAPI-Key": settings.rapidapi_key,
                "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
            },
        )

        rows = []
        jobs = (data.get("data") or {}).get("jobs", [])

        for x in jobs:
            title = x.get("job_title", "")
            company = x.get("employer_name", "")
            url = x.get("job_apply_link") or x.get("job_google_link") or ""

            location = ", ".join(
                filter(
                    None,
                    [
                        x.get("job_city"),
                        x.get("job_state"),
                        x.get("job_country"),
                    ],
                )
            )

            salary = ""
            if x.get("job_min_salary") or x.get("job_max_salary"):
                salary = (
                    f"{x.get('job_min_salary') or ''} - "
                    f"{x.get('job_max_salary') or ''} "
                    f"{x.get('job_salary_period') or ''}"
                ).strip()

            employment_type = (
                x.get("job_employment_type")
                or ", ".join(x.get("job_employment_types") or [])
                or ""
            )

            rows.append({
                "provider_key": stable_key("JSearch", company, title, url),
                "title": title,
                "company": company,
                "location": location,
                "description": x.get("job_description", ""),
                "url": url,
                "source": "JSearch",
                "posted_at": (
                    x.get("job_posted_at_datetime_utc")
                    or x.get("job_posted_at")
                    or ""
                ),
                "salary": salary,
                "employment_type": employment_type,
                "remote": bool(x.get("job_is_remote")),
            })

        return rows

    return cached(
        f"jobs:jsearch:v5:pages3:month:{query.lower()}",
        load,
        21600,
    )
