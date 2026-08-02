from collections import Counter
from datetime import datetime
from app.models.application import Application
from app.models.automation import Notification
from app.models.job import Job, JobMatch
from app.models.profile import CareerProfile
from app.models.recruiting import InterviewEvent, RecruiterContact
from app.models.tailoring import TailoredResume
ACTIVE={"wishlist","applied","recruiter","interview","final","offer"}
def build_command_center(db,user_id:int):
    profiles=db.query(CareerProfile).filter(CareerProfile.user_id==user_id).all(); ids=[p.id for p in profiles]
    apps=db.query(Application).filter(Application.user_id==user_id).all(); active=[a for a in apps if a.status in ACTIVE]
    matches=(db.query(JobMatch,Job).join(Job,Job.id==JobMatch.job_id).filter(JobMatch.profile_id.in_(ids)).all() if ids else [])
    interviews=db.query(InterviewEvent).filter(InterviewEvent.user_id==user_id,InterviewEvent.completed.is_(False)).all(); interviews=[e for e in interviews if e.starts_at>=datetime.utcnow()]; interviews.sort(key=lambda e:e.starts_at)
    recruiters=db.query(RecruiterContact).filter(RecruiterContact.user_id==user_id).count(); tailored=db.query(TailoredResume).filter(TailoredResume.user_id==user_id).count(); unread=db.query(Notification).filter(Notification.user_id==user_id,Notification.read.is_(False)).count()
    high=sorted([(m,j) for m,j in matches if m.score>=75],key=lambda x:x[0].score,reverse=True); stages=Counter(a.status for a in apps)
    priorities=[]
    for a in [x for x in active if x.follow_up_at and x.follow_up_at<=datetime.utcnow()][:5]: priorities.append({"kind":"follow_up","title":"Application follow-up due","detail":a.next_action or "Follow up with the employer.","link":f"/applications/{a.id}"})
    for e in interviews[:5]: priorities.append({"kind":"interview","title":e.title,"detail":e.starts_at.isoformat(),"link":f"/applications/{e.application_id}"})
    for m,j in high[:5]: priorities.append({"kind":"high_match","title":f"{m.score}% match: {j.title}","detail":f"{j.company} · {j.location}","link":f"/jobs/{j.id}?profile_id={m.profile_id}"})
    return {"metrics":{"profiles":len(profiles),"total_matches":len(matches),"high_matches":len(high),"applications":len(apps),"active_applications":len(active),"interviews":len(interviews),"offers":stages.get("offer",0)+stages.get("accepted",0),"recruiters":recruiters,"tailored_resumes":tailored,"unread_notifications":unread,"average_match":round(sum(m.score for m,_ in matches)/len(matches)) if matches else 0,"stage_counts":dict(stages)},"priorities":priorities[:12],"upcoming_interviews":[{"id":e.id,"application_id":e.application_id,"title":e.title,"starts_at":e.starts_at.isoformat(),"location":e.location,"meeting_url":e.meeting_url} for e in interviews[:8]],"high_match_jobs":[{"job_id":j.id,"profile_id":m.profile_id,"title":j.title,"company":j.company,"location":j.location,"score":m.score} for m,j in high[:10]]}
def build_strategy_insights(db,user_id:int):
    apps=db.query(Application).filter(Application.user_id==user_id).all(); c=Counter(a.status for a in apps); total=len(apps); interviews=c.get("interview",0)+c.get("final",0)+c.get("offer",0)+c.get("accepted",0); offers=c.get("offer",0)+c.get("accepted",0); insights=[]
    if not total: insights.append("Begin by saving high-match roles to the application pipeline.")
    elif interviews/total<.1: insights.append("Interview conversion is below 10%; prioritize stronger title alignment and more tailored packages.")
    if c.get("wishlist",0)>max(5,total//2): insights.append("Many jobs remain in Wishlist; move only the strongest roles into active application workflows.")
    return {"application_count":total,"interview_conversion":round(interviews/total*100) if total else 0,"offer_conversion":round(offers/total*100) if total else 0,"insights":insights}
