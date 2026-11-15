import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool, one, transaction } from '../src/lib/db.js';
const courses=[
  ['B.Tech CSE',60,60,'PHYSICS_MATH'],
  ['BCA',60,50,'MATH_OR_CS'],
  ['BBA',40,45,'NONE']
];
async function ensureStaff(email,password,role) {
  if(!email||!password||password.length<12) throw new Error(`Set a strong SEED_${role}_PASSWORD (12+ chars) and SEED_${role}_EMAIL in api/.env.`);
  const current=await one('SELECT id,role FROM users WHERE email=?',[email]);
  if(current){if(current.role!==role) throw new Error(`Existing ${email} has an incorrect role; seed will not change roles.`);console.log(`${role}: already exists (${email}); unchanged`);return;}
  const hash=await bcrypt.hash(password,12);
  await pool.execute('INSERT INTO users(id,email,password_hash,role) VALUES(?,?,?,?)',[randomUUID(),email.toLowerCase(),hash,role]);
  console.log(`${role} created: ${email}`);
}
try{
  await transaction(async conn=>{
    let cycle=await one('SELECT * FROM admission_cycles WHERE display_name=?',['DEMO-2027-28'],conn);
    if(!cycle){cycle={id:randomUUID()};await conn.execute('INSERT INTO admission_cycles(id,display_name,is_active) VALUES(?,?,1)',[cycle.id,'DEMO-2027-28']);}
    for(const [name,capacity,percentage,policy] of courses){
      const current=await one('SELECT id FROM courses WHERE cycle_id=? AND name=?',[cycle.id,name],conn);
      if(!current) await conn.execute('INSERT INTO courses(id,cycle_id,name,seat_capacity,min_xii_percentage,subject_policy) VALUES(?,?,?,?,?,?)',[randomUUID(),cycle.id,name,capacity,percentage,policy]);
    }
  });
  await ensureStaff(process.env.SEED_ADMIN_EMAIL,process.env.SEED_ADMIN_PASSWORD,'ADMIN');
  await ensureStaff(process.env.SEED_MANAGEMENT_EMAIL,process.env.SEED_MANAGEMENT_PASSWORD,'MANAGEMENT');
  console.log('CAMS seed complete. Course data and staff accounts are ready.');
}catch(err){console.error(err.message);process.exitCode=1;}finally{await pool.end();}
