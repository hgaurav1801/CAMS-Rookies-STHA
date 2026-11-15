import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'node:url';
import { pool, one, rows, transaction } from '../lib/db.js';
import { asyncRoute, fail, send } from '../lib/errors.js';
import { needRole, createSession, destroySession } from '../lib/auth.js';
import { parse, email, password, profileSchema, applicationSchema, courseSchema, reasonSchema, documentTypes } from '../lib/validation.js';
import { eligibility, requireEditable, validateSubmission, validateApproval, REQUIRED_DOCUMENTS } from '../services/admissions.js';
import { z } from 'zod';

const router = Router();
const STUDENT = 'STUDENT', ADMIN = 'ADMIN', MANAGEMENT = 'MANAGEMENT';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storageDir = path.resolve(__dirname, '../../storage/private');
await fs.mkdir(storageDir, {recursive:true,mode:0o700});
const UUID = z.string().uuid();
const paramId = req => parse(UUID,req.params.id);
const fileId = req => parse(UUID,req.params.documentId);
const activeCycle = async (conn=pool) => {
  const c = await one('SELECT * FROM admission_cycles WHERE is_active=1 ORDER BY display_name LIMIT 1',[],conn);
  if (!c) fail(503,'NO_ACTIVE_CYCLE','No demonstration admission cycle has been configured. Run the seed command.');
  return c;
};
async function studentProfile(userId,conn=pool) {return one('SELECT * FROM student_profiles WHERE user_id=?',[userId],conn);}
async function ownedApplication(userId,id,conn=pool) {
  const app=await one('SELECT a.* FROM applications a JOIN student_profiles p ON p.id=a.student_id WHERE a.id=? AND p.user_id=?',[id,userId],conn);
  if(!app) fail(404,'NOT_FOUND','Application not found.');
  return app;
}
async function currentApplication(userId) {
  return one('SELECT a.* FROM applications a JOIN student_profiles p ON p.id=a.student_id WHERE p.user_id=? ORDER BY a.created_at DESC LIMIT 1',[userId]);
}
async function publishedCourse(courseId,conn=pool){
  const course=await one('SELECT c.* FROM courses c JOIN admission_cycles y ON y.id=c.cycle_id WHERE c.id=? AND y.is_active=1',[courseId],conn);
  if(!course) fail(400,'INVALID_COURSE','Selected course is unavailable.');
  return course;
}
const credentialsSchema=z.object({email,password}).strict();

router.post('/auth/register',asyncRoute(async(req,res)=>{
  const {email:userEmail,password:pass}=parse(credentialsSchema,req.body);
  const exists=await one('SELECT id FROM users WHERE email=?',[userEmail]);
  if(exists) fail(409,'EMAIL_EXISTS','This email address is already registered.');
  const userId=randomUUID(),profileId=randomUUID();
  const hash=await bcrypt.hash(pass,12);
  await transaction(async conn=>{
    await conn.execute('INSERT INTO users(id,email,password_hash,role) VALUES (?,?,?,?)',[userId,userEmail,hash,STUDENT]);
    await conn.execute('INSERT INTO student_profiles(id,user_id) VALUES (?,?)',[profileId,userId]);
  });
  send(res,{id:userId,email:userEmail,role:STUDENT},'Student account created. Please sign in.',201);
}));
router.post('/auth/login',asyncRoute(async(req,res)=>{
  const {email:userEmail,password:pass}=parse(credentialsSchema,req.body);
  const user=await one('SELECT id,email,role,password_hash FROM users WHERE email=?',[userEmail]);
  // Equal-cost verification on missing accounts reduces account-existence leakage.
  const fallback='$2a$12$8N4IBf5SwvTIBDbxp/0aW.c/GOFMvV3v4Ad7u92hhYrKOOEqFgxVC';
  const ok=await bcrypt.compare(pass,user?.password_hash||fallback);
  if(!user||!ok) fail(401,'INVALID_CREDENTIALS','Invalid email or password.');
  const csrf=await createSession(req,res,user);
  send(res,{user:{id:user.id,email:user.email,role:user.role},csrfToken:csrf},'Signed in.');
}));
router.get('/me',asyncRoute(async(req,res)=>{
  if(!req.user) return send(res,{user:null,csrfToken:null});
  send(res,{user:req.user,csrfToken:req.session.csrf_token});
}));
router.post('/auth/logout',needRole(STUDENT,ADMIN,MANAGEMENT),asyncRoute(async(req,res)=>{
  await destroySession(req,res); send(res,null,'Signed out.');
}));

router.get('/courses',asyncRoute(async(_req,res)=>{
  const c=await activeCycle();
  const courses=await rows(`SELECT c.*, (SELECT COUNT(*) FROM applications a WHERE a.course_id=c.id AND a.status='Approved') AS approved_count FROM courses c WHERE c.cycle_id=? ORDER BY c.name`,[c.id]);
  send(res,{cycle:c,courses:courses.map(course=>({...course,available_seats:Math.max(0,course.seat_capacity-course.approved_count)}))});
}));
router.post('/admin/courses',needRole(ADMIN),asyncRoute(async(req,res)=>{
  const d=parse(courseSchema,req.body),c=await activeCycle(),id=randomUUID();
  await pool.execute('INSERT INTO courses(id,cycle_id,name,seat_capacity,min_xii_percentage,subject_policy) VALUES (?,?,?,?,?,?)',[id,c.id,d.name,d.seat_capacity,d.min_xii_percentage,d.subject_policy]);
  send(res,{id,...d,cycle_id:c.id},'Course created.',201);
}));
router.patch('/admin/courses/:id',needRole(ADMIN),asyncRoute(async(req,res)=>{
  const id=paramId(req),d=parse(courseSchema,req.body);
  const course=await transaction(async conn=>{
    const old=await one('SELECT * FROM courses WHERE id=? FOR UPDATE',[id],conn);
    if(!old) fail(404,'NOT_FOUND','Course not found.');
    const approved=await rows("SELECT id FROM applications WHERE course_id=? AND status='Approved' FOR UPDATE",[id],conn);
    if(d.seat_capacity<approved.length) fail(409,'SEAT_CAPACITY','Capacity cannot fall below the number of approved admissions.');
    await conn.execute('UPDATE courses SET name=?,seat_capacity=?,min_xii_percentage=?,subject_policy=? WHERE id=?',[d.name,d.seat_capacity,d.min_xii_percentage,d.subject_policy,id]);
    return {...old,...d};
  });
  send(res,course,'Course updated.');
}));

router.get('/student/profile',needRole(STUDENT),asyncRoute(async(req,res)=>send(res,await studentProfile(req.user.id))));
router.patch('/student/profile',needRole(STUDENT),asyncRoute(async(req,res)=>{
  const d=parse(profileSchema,req.body);
  if (d.date_of_birth) { const parsed=new Date(d.date_of_birth+'T00:00:00Z'); if(!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10)!==d.date_of_birth) fail(400,'INVALID_DATE','Invalid date of birth.'); }
  await pool.execute('UPDATE student_profiles SET full_name=?,date_of_birth=?,phone=?,address=? WHERE user_id=?',[d.full_name,d.date_of_birth||null,d.phone,d.address,req.user.id]);
  send(res,await studentProfile(req.user.id),'Profile saved.');
}));
router.get('/student/application',needRole(STUDENT),asyncRoute(async(req,res)=>send(res,await currentApplication(req.user.id))));
router.post('/student/application',needRole(STUDENT),asyncRoute(async(req,res)=>{
  const d=parse(applicationSchema,req.body),profile=await studentProfile(req.user.id);
  if(!profile) fail(409,'NO_PROFILE','Student profile missing.');
  const cycle=await activeCycle(),course=await publishedCourse(d.course_id);
  if(course.cycle_id!==cycle.id) fail(400,'INVALID_COURSE','Course belongs to another admission cycle.');
  const existing=await one('SELECT id FROM applications WHERE student_id=? AND cycle_id=?',[profile.id,cycle.id]);
  if(existing) fail(409,'APPLICATION_EXISTS','One application per student per cycle is permitted.');
  const id=randomUUID();
  await pool.execute(`INSERT INTO applications(id,student_id,cycle_id,course_id,class_x_percentage,class_xii_percentage,studied_physics,studied_mathematics,studied_computer_science) VALUES (?,?,?,?,?,?,?,?,?)`,
    [id,profile.id,cycle.id,d.course_id,d.class_x_percentage??null,d.class_xii_percentage??null,d.studied_physics,d.studied_mathematics,d.studied_computer_science]);
  send(res,await ownedApplication(req.user.id,id),'Draft application created.',201);
}));
router.patch('/student/application/:id',needRole(STUDENT),asyncRoute(async(req,res)=>{
  const id=paramId(req),d=parse(applicationSchema,req.body);
  const updated=await transaction(async conn=>{
    await ownedApplication(req.user.id,id,conn);
    const app=await one('SELECT * FROM applications WHERE id=? FOR UPDATE',[id],conn);
    requireEditable(app.status);
    const course=await publishedCourse(d.course_id,conn);
    if(course.cycle_id!==app.cycle_id) fail(400,'INVALID_COURSE','Course belongs to another cycle.');
    await conn.execute(`UPDATE applications SET course_id=?,class_x_percentage=?,class_xii_percentage=?,studied_physics=?,studied_mathematics=?,studied_computer_science=? WHERE id=?`,
      [d.course_id,d.class_x_percentage??null,d.class_xii_percentage??null,d.studied_physics,d.studied_mathematics,d.studied_computer_science,id]);
    return {...app,...d};
  });
  send(res,updated,'Application draft saved.');
}));
router.post('/student/application/:id/submit',needRole(STUDENT),asyncRoute(async(req,res)=>{
  const id=paramId(req);
  const status=await transaction(async conn=>{
    await ownedApplication(req.user.id,id,conn);
    const app=await one('SELECT * FROM applications WHERE id=? FOR UPDATE',[id],conn);
    requireEditable(app.status);
    const profile=await one('SELECT * FROM student_profiles WHERE id=?',[app.student_id],conn);
    const course=await publishedCourse(app.course_id,conn);
    const docs=await rows('SELECT * FROM documents WHERE application_id=?',[id],conn);
    validateSubmission(app,profile,course,docs);
    await conn.execute("UPDATE applications SET status='Submitted',submitted_at=NOW() WHERE id=?",[id]);
    await conn.execute('INSERT INTO review_history(id,application_id,actor_id,old_status,new_status,reason) VALUES (?,?,?,?,?,?)',
      [randomUUID(),id,req.user.id,app.status,'Submitted',app.status==='Correction Required'?'Resubmitted after requested correction':null]);
    return 'Submitted';
  });
  send(res,{id,status},'Application submitted.');
}));
router.get('/student/application/:id/status',needRole(STUDENT),asyncRoute(async(req,res)=>{
  const app=await ownedApplication(req.user.id,paramId(req));
  const last=await one(`SELECT reason,new_status,created_at FROM review_history WHERE application_id=? AND new_status IN ('Correction Required','Rejected') ORDER BY created_at DESC LIMIT 1`,[app.id]);
  send(res,{id:app.id,status:app.status,reason:['Correction Required','Rejected'].includes(app.status)?(last?.reason||null):null,submitted_at:app.submitted_at,decision_at:app.decision_at});
}));

const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1}}).single('file');
router.post('/student/application/:id/documents',needRole(STUDENT),upload,asyncRoute(async(req,res)=>{
  const id=paramId(req),type=parse(z.enum(documentTypes),req.body.document_type);
  if(!req.file) fail(400,'MISSING_FILE','Select a file.');
  const signature=await fileTypeFromBuffer(req.file.buffer);
  const mime=signature?.mime;
  if(!['application/pdf','image/jpeg','image/png'].includes(mime) || (type==='PHOTO' && !['image/jpeg','image/png'].includes(mime))) fail(400,'INVALID_FILE','Use JPG/PNG for photos and PDF/JPG/PNG for other documents.');
  const ext={'application/pdf':'.pdf','image/jpeg':'.jpg','image/png':'.png'}[mime];
  const storageKey=randomUUID()+ext,fp=path.join(storageDir,storageKey);
  let oldFile=null;
  await fs.writeFile(fp,req.file.buffer,{flag:'wx',mode:0o600});
  try {
    await transaction(async conn=>{
      await ownedApplication(req.user.id,id,conn);
      const app=await one('SELECT * FROM applications WHERE id=? FOR UPDATE',[id],conn);
      requireEditable(app.status);
      const old=await one('SELECT storage_key FROM documents WHERE application_id=? AND document_type=? FOR UPDATE',[id,type],conn);
      oldFile=old?.storage_key;
      if(old){
        await conn.execute(`UPDATE documents SET storage_key=?,mime_type=?,size_bytes=?,verification_state='PENDING',verified_by=NULL WHERE application_id=? AND document_type=?`,[storageKey,mime,req.file.size,id,type]);
      }else{
        await conn.execute('INSERT INTO documents(id,application_id,document_type,storage_key,mime_type,size_bytes) VALUES (?,?,?,?,?,?)',[randomUUID(),id,type,storageKey,mime,req.file.size]);
      }
    });
  } catch(e) { await fs.unlink(fp).catch(()=>{}); throw e; }
  if(oldFile) await fs.unlink(path.join(storageDir,path.basename(oldFile))).catch(()=>{});
  send(res,{document_type:type,mime_type:mime,size_bytes:req.file.size},'Document uploaded.');
}));
router.get('/student/application/:id/documents',needRole(STUDENT),asyncRoute(async(req,res)=>{
  const id=paramId(req);await ownedApplication(req.user.id,id);
  const docs=await rows('SELECT id,document_type,mime_type,size_bytes,verification_state,updated_at FROM documents WHERE application_id=?',[id]);
  send(res,docs);
}));
router.get('/applications/:id/documents/:documentId',needRole(STUDENT,ADMIN),asyncRoute(async(req,res)=>{
  const id=paramId(req),docId=fileId(req);
  if(req.user.role===STUDENT) await ownedApplication(req.user.id,id);
  const doc=await one('SELECT * FROM documents WHERE id=? AND application_id=?',[docId,id]);
  if(!doc) fail(404,'NOT_FOUND','Document not found.');
  const safe=path.join(storageDir,path.basename(doc.storage_key));
  if(!fsSync.existsSync(safe)) fail(404,'FILE_MISSING','Stored file was not found.');
  res.setHeader('Content-Type',doc.mime_type);
  res.setHeader('Content-Disposition',`inline; filename="${doc.document_type.toLowerCase()}${path.extname(safe)}"`);
  res.setHeader('Cache-Control','no-store');
  fsSync.createReadStream(safe).pipe(res);
}));

router.get('/admin/applications',needRole(ADMIN),asyncRoute(async(req,res)=>{
  const status = req.query.status ? parse(z.enum(['Draft','Submitted','Under Review','Correction Required','Approved','Rejected']),req.query.status) : null;
  const courseId = req.query.course_id ? parse(UUID,req.query.course_id) : null;
  let sql=`SELECT a.*,p.full_name,u.email,c.name AS course_name FROM applications a JOIN student_profiles p ON a.student_id=p.id JOIN users u ON p.user_id=u.id JOIN courses c ON a.course_id=c.id WHERE 1=1`;
  const params=[];
  if(status){sql+=' AND a.status=?';params.push(status);}
  if(courseId){sql+=' AND a.course_id=?';params.push(courseId);}
  sql+=' ORDER BY a.updated_at DESC LIMIT 500';
  send(res,await rows(sql,params));
}));
router.get('/admin/applications/:id',needRole(ADMIN),asyncRoute(async(req,res)=>{
  const id=paramId(req);
  const app=await one(`SELECT a.*,p.full_name,p.date_of_birth,p.phone,p.address,u.email,c.name AS course_name,c.min_xii_percentage,c.subject_policy,c.seat_capacity FROM applications a JOIN student_profiles p ON p.id=a.student_id JOIN users u ON u.id=p.user_id JOIN courses c ON c.id=a.course_id WHERE a.id=?`,[id]);
  if(!app) fail(404,'NOT_FOUND','Application not found.');
  const docs=await rows('SELECT id,document_type,mime_type,size_bytes,verification_state,updated_at FROM documents WHERE application_id=?',[id]);
  const history=await rows('SELECT h.old_status,h.new_status,h.reason,h.created_at,u.email AS actor_email FROM review_history h JOIN users u ON u.id=h.actor_id WHERE h.application_id=? ORDER BY h.created_at DESC',[id]);
  const approved=await one("SELECT COUNT(*) AS count FROM applications WHERE course_id=? AND status='Approved'",[app.course_id]);
  send(res,{application:app,documents:docs,history,eligible:eligibility(app,app),available_seats:Math.max(0,app.seat_capacity-approved.count)});
}));
router.post('/admin/applications/:id/start-review',needRole(ADMIN),asyncRoute(async(req,res)=>{
  const id=paramId(req);
  await transaction(async conn=>{
    const app=await one('SELECT * FROM applications WHERE id=? FOR UPDATE',[id],conn);
    if(!app) fail(404,'NOT_FOUND','Application not found.');
    if(app.status!=='Submitted') fail(409,'INVALID_STATE','Only Submitted applications may enter review.');
    await conn.execute("UPDATE applications SET status='Under Review' WHERE id=?",[id]);
    await conn.execute('INSERT INTO review_history(id,application_id,actor_id,old_status,new_status,reason) VALUES (?,?,?,?,?,NULL)',[randomUUID(),id,req.user.id,'Submitted','Under Review']);
  });
  send(res,{id,status:'Under Review'},'Review started.');
}));
router.patch('/admin/applications/:id/documents/:documentId/verification',needRole(ADMIN),asyncRoute(async(req,res)=>{
  const id=paramId(req),docId=fileId(req);
  const {verification_state}=parse(z.object({verification_state:z.enum(['VERIFIED','NOT_VERIFIED'])}).strict(),req.body);
  await transaction(async conn=>{
    const app=await one('SELECT * FROM applications WHERE id=? FOR UPDATE',[id],conn);
    if(!app) fail(404,'NOT_FOUND','Application not found.');
    if(app.status!=='Under Review') fail(409,'INVALID_STATE','Document verification is allowed only Under Review.');
    const [r]=await conn.execute('UPDATE documents SET verification_state=?,verified_by=? WHERE id=? AND application_id=?',[verification_state,req.user.id,docId,id]);
    if(r.affectedRows===0) fail(404,'NOT_FOUND','Document not found.');
  });
  send(res,{id:docId,verification_state},'Verification recorded.');
}));
async function reviewTransition(req,status){
  const id=paramId(req),{reason}=parse(reasonSchema,req.body);
  await transaction(async conn=>{
    const app=await one('SELECT * FROM applications WHERE id=? FOR UPDATE',[id],conn);
    if(!app) fail(404,'NOT_FOUND','Application not found.');
    if(app.status!=='Under Review') fail(409,'INVALID_STATE','Application must be Under Review.');
    await conn.execute('UPDATE applications SET status=?,decision_at=? WHERE id=?',[status,status==='Rejected'?new Date():null,id]);
    await conn.execute('INSERT INTO review_history(id,application_id,actor_id,old_status,new_status,reason) VALUES (?,?,?,?,?,?)',[randomUUID(),id,req.user.id,app.status,status,reason]);
  });
  return {id,status,reason};
}
router.post('/admin/applications/:id/request-correction',needRole(ADMIN),asyncRoute(async(req,res)=>send(res,await reviewTransition(req,'Correction Required'),'Correction requested.')));
router.post('/admin/applications/:id/reject',needRole(ADMIN),asyncRoute(async(req,res)=>send(res,await reviewTransition(req,'Rejected'),'Application rejected.')));
router.post('/admin/applications/:id/approve',needRole(ADMIN),asyncRoute(async(req,res)=>{
  const id=paramId(req);
  const result=await transaction(async conn=>{
    // Course lock serialises all approval attempts for the same capacity.
    const pointer=await one('SELECT course_id FROM applications WHERE id=?',[id],conn);
    if(!pointer) fail(404,'NOT_FOUND','Application not found.');
    const course=await one('SELECT * FROM courses WHERE id=? FOR UPDATE',[pointer.course_id],conn);
    if(!course) fail(404,'NOT_FOUND','Course not found.');
    const app=await one('SELECT * FROM applications WHERE id=? FOR UPDATE',[id],conn);
    if(app.course_id!==course.id) fail(409,'RETRY_APPROVAL','Course changed. Retry the approval.');
    const docs=await rows('SELECT document_type,verification_state FROM documents WHERE application_id=? FOR UPDATE',[id],conn);
    const verified=REQUIRED_DOCUMENTS.every(type=>docs.some(x=>x.document_type===type&&x.verification_state==='VERIFIED'));
    const approved=await rows("SELECT id FROM applications WHERE course_id=? AND status='Approved' FOR UPDATE",[course.id],conn);
    const seats=Number(course.seat_capacity)-approved.length;
    validateApproval({status:app.status,verified,eligible:eligibility(course,app),seats});
    const ref=`STHA-DEMO-${new Date().getFullYear()}-${randomUUID().slice(0,8).toUpperCase()}`;
    await conn.execute("UPDATE applications SET status='Approved',decision_at=NOW() WHERE id=?",[id]);
    await conn.execute('INSERT INTO confirmations(id,application_id,reference_code) VALUES (?,?,?)',[randomUUID(),id,ref]);
    await conn.execute('INSERT INTO review_history(id,application_id,actor_id,old_status,new_status,reason) VALUES (?,?,?,?,?,NULL)',[randomUUID(),id,req.user.id,app.status,'Approved']);
    return {id,status:'Approved',reference_code:ref};
  });
  send(res,result,'Admission approved.');
}));
router.get('/student/application/:id/confirmation',needRole(STUDENT),asyncRoute(async(req,res)=>{
  const id=paramId(req);
  const app=await ownedApplication(req.user.id,id);
  if(app.status!=='Approved') fail(403,'NOT_APPROVED','Confirmation is available only after approval.');
  const data=await one(`SELECT a.id,a.decision_at,c.name AS course_name,y.display_name,p.full_name,f.reference_code,f.issued_at FROM applications a JOIN courses c ON c.id=a.course_id JOIN admission_cycles y ON y.id=a.cycle_id JOIN student_profiles p ON p.id=a.student_id JOIN confirmations f ON f.application_id=a.id WHERE a.id=?`,[id]);
  if(!data) fail(404,'NOT_FOUND','Confirmation record is missing.');
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition',`attachment; filename="STHA-${data.reference_code}.pdf"`);
  res.setHeader('Cache-Control','no-store');
  const pdf=new PDFDocument({size:'A4',margin:62});pdf.pipe(res);
  pdf.rect(0,0,595,112).fill('#0B1F3A');
  pdf.fillColor('white').font('Helvetica-Bold').fontSize(23).text('STHA | Admission Confirmation',62,42);
  pdf.moveDown(4).fillColor('#0B1F3A').font('Helvetica-Bold').fontSize(18).text('College Admission Management System');
  pdf.moveDown().font('Helvetica').fontSize(12).fillColor('#39495C');
  pdf.text(`Reference: ${data.reference_code}`,{lineGap:10});
  pdf.text(`Applicant: ${data.full_name}`,{lineGap:10});
  pdf.text(`Course: ${data.course_name}`,{lineGap:10});
  pdf.text(`Admission Cycle: ${data.display_name}`,{lineGap:10});
  pdf.text(`Application ID: ${data.id}`,{lineGap:10});
  pdf.text(`Approval Date: ${String(data.decision_at).slice(0,10)}`,{lineGap:10});
  pdf.moveDown(3).font('Helvetica-Bold').fillColor('#A47E27').text('DEMONSTRATION DOCUMENT — NOT A REAL ADMISSION OFFER');
  pdf.moveDown().font('Helvetica').fillColor('#4B5563').fontSize(10).text('This confirmation was generated by the Rookies academic CAMS prototype for the simulated client STHA. It has no institutional validity.');
  pdf.end();
}));
router.get('/management/reports',needRole(MANAGEMENT),asyncRoute(async(_req,res)=>{
  const courseCounts=await rows(`SELECT c.id,c.name,c.seat_capacity, COUNT(a.id) AS applications, COALESCE(SUM(CASE WHEN a.status='Approved' THEN 1 ELSE 0 END),0) AS approved, COALESCE(SUM(CASE WHEN a.status='Rejected' THEN 1 ELSE 0 END),0) AS rejected, COALESCE(SUM(CASE WHEN a.status='Under Review' THEN 1 ELSE 0 END),0) AS under_review FROM courses c LEFT JOIN applications a ON a.course_id=c.id GROUP BY c.id,c.name,c.seat_capacity ORDER BY c.name`);
  const statuses=await rows('SELECT status,COUNT(*) AS count FROM applications GROUP BY status');
  const overall=await one('SELECT COUNT(*) AS total FROM applications');
  send(res,{total:overall.total,by_status:statuses,by_course:courseCounts});
}));
export default router;
