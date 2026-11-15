import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibility, validateApproval, validateSubmission } from '../src/services/admissions.js';
const app={class_x_percentage:80,class_xii_percentage:75,studied_physics:true,studied_mathematics:true,studied_computer_science:false};
const docs=['PHOTO','CLASS_X','CLASS_XII','IDENTITY'].map(document_type=>({document_type}));
const profile={full_name:'Sample Student',phone:'9876543210',address:'Demo Address',date_of_birth:'2007-01-01'};
test('CSE requires marks and both Physics and Math',()=>{
  const c={min_xii_percentage:60,subject_policy:'PHYSICS_MATH'};
  assert.equal(eligibility(c,app),true);
  assert.equal(eligibility(c,{...app,studied_physics:false}),false);
  assert.equal(eligibility(c,{...app,class_xii_percentage:59.99}),false);
});
test('BCA accepts Math OR Computer Science',()=>{
  const c={min_xii_percentage:50,subject_policy:'MATH_OR_CS'};
  assert.equal(eligibility(c,{...app,studied_physics:false,studied_mathematics:false,studied_computer_science:true}),true);
  assert.equal(eligibility(c,{...app,studied_physics:true,studied_mathematics:false,studied_computer_science:false}),false);
});
test('BBA uses marks threshold',()=>{
  assert.equal(eligibility({min_xii_percentage:45,subject_policy:'NONE'},{...app,class_xii_percentage:45,studied_mathematics:false}),true);
});
test('required documents and profile are validated',()=>{
  assert.doesNotThrow(()=>validateSubmission(app,profile,{min_xii_percentage:60,subject_policy:'PHYSICS_MATH'},docs));
  assert.throws(()=>validateSubmission(app,profile,{min_xii_percentage:60,subject_policy:'PHYSICS_MATH'},docs.slice(0,3)),/complete the profile/);
});
test('approval requires review, verification and a remaining seat',()=>{
  assert.equal(validateApproval({status:'Under Review',verified:true,eligible:true,seats:1}),true);
  assert.throws(()=>validateApproval({status:'Under Review',verified:true,eligible:true,seats:0}),/No seats/);
  assert.throws(()=>validateApproval({status:'Submitted',verified:true,eligible:true,seats:1}),/not Under Review/);
});
