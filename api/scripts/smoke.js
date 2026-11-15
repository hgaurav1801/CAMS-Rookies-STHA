// Runs an actual end-to-end demonstration against a running local CAMS API and MySQL.
// This is NOT run automatically; it creates one fictional student and one approved application.
import 'dotenv/config';
const BASE=process.env.SMOKE_API_URL||'http://127.0.0.1:4000';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64');
async function request(path,{method='GET',data,cookie,csrf,form,raw=false}={}){
  const h={}; if(data!==undefined)h['Content-Type']='application/json';if(csrf)h['X-CSRF-Token']=csrf;if(cookie)h['Cookie']=cookie;
  const res=await fetch(BASE+path,{method,headers:h,body:form||(data!==undefined?JSON.stringify(data):undefined)});
  const payload=raw?await res.arrayBuffer():await res.json().catch(()=>null);
  if(!res.ok)throw new Error(`${method} ${path} → HTTP ${res.status}: ${JSON.stringify(payload)}`);
  return {data:raw?payload:payload?.data,cookie:res.headers.get('set-cookie')?.split(';')[0]};
}
async function login(email,password){const r=await request('/api/auth/login',{method:'POST',data:{email,password}});return {cookie:r.cookie,csrf:r.data.csrfToken,user:r.data.user};}
const auth=(s,method='GET',data)=>({method,data,cookie:s.cookie,csrf:s.csrf});
try{
  console.log('Running CAMS smoke workflow against',BASE);
  const email=`smoke-${Date.now()}@example.test`, password='DemoStudent#2027';
  await request('/api/auth/register',{method:'POST',data:{email,password}});
  const student=await login(email,password);
  await request('/api/student/profile',{...auth(student,'PATCH',{full_name:'Fictional Applicant',date_of_birth:'2007-03-20',phone:'9000000000',address:'Demonstration Address, Kolkata'})});
  const {data:catalog}=await request('/api/courses');const course=catalog.courses.find(c=>c.name==='B.Tech CSE');if(!course)throw new Error('Seeded demo CSE course missing.');
  const {data:app}=await request('/api/student/application',{...auth(student,'POST',{course_id:course.id,class_x_percentage:82,class_xii_percentage:79,studied_physics:true,studied_mathematics:true,studied_computer_science:false})});
  for(const type of ['PHOTO','CLASS_X','CLASS_XII','IDENTITY']){
    const form=new FormData();form.append('document_type',type);form.append('file',new Blob([png],{type:'image/png'}),`${type}.png`);
    await request(`/api/student/application/${app.id}/documents`,{...auth(student,'POST'),form});
  }
  const submit=await request(`/api/student/application/${app.id}/submit`,{...auth(student,'POST')});
  if(submit.data.status!=='Submitted')throw new Error('Submission state mismatch');
  const admin=await login(process.env.SEED_ADMIN_EMAIL,process.env.SEED_ADMIN_PASSWORD);
  await request(`/api/admin/applications/${app.id}/start-review`,{...auth(admin,'POST')});
  const review=await request(`/api/admin/applications/${app.id}`,{...auth(admin)});
  for(const doc of review.data.documents){await request(`/api/admin/applications/${app.id}/documents/${doc.id}/verification`,{...auth(admin,'PATCH',{verification_state:'VERIFIED'})});}
  const approved=await request(`/api/admin/applications/${app.id}/approve`,{...auth(admin,'POST')});
  if(approved.data.status!=='Approved')throw new Error('Approval state mismatch');
  const status=await request(`/api/student/application/${app.id}/status`,{...auth(student)});
  if(status.data.status!=='Approved')throw new Error('Student status mismatch');
  const confirmation=await request(`/api/student/application/${app.id}/confirmation`,{...auth(student),raw:true});
  if(confirmation.data.byteLength<100)throw new Error('PDF unexpectedly short');
  const management=await login(process.env.SEED_MANAGEMENT_EMAIL,process.env.SEED_MANAGEMENT_PASSWORD);
  const report=await request('/api/management/reports',{...auth(management)});
  if(!report.data.by_course.some(c=>c.id===course.id&&Number(c.approved)>0))throw new Error('Management report does not reflect approval.');
  console.log('PASS — Registration → Profile → Application → Four uploads → Submission → Review → Verification → Atomic approval → Student status → PDF → Management report.');
  console.log('Test application:',app.id,'confirmation:',approved.data.reference_code);
}catch(err){console.error('FAIL —',err.message);process.exitCode=1;}
