import React,{useEffect,useState} from 'react';
import {BarChart3,Home} from 'lucide-react';
import {api,msg} from '../api';
import {Page,RoleLayout,Stat,Spinner,Alert} from '../components/UI';
const nav=[{to:'/management',text:'Admissions overview',icon:<Home size={18}/>,end:true},{to:'/management/reports',text:'Course-wise reports',icon:<BarChart3 size={18}/>}];
export function ManagementLayout({children}){return <RoleLayout items={nav}>{children}</RoleLayout>}
export function Management(){
 const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(true);
 useEffect(()=>{api('/api/management/reports').then(setData).catch(e=>setError(msg(e))).finally(()=>setBusy(false));},[]);
 const count=(status)=>data?.by_status?.find(x=>x.status===status)?.count||0;
 return <Page eyebrow="COLLEGE MANAGEMENT" title="Admissions overview" description="Read-only visibility into admission activity and course-level decisions.">{busy?<Spinner/>:<><Alert error={error}/>{data&&<><div className="stat-grid"><Stat label="Total applications" value={data.total}/><Stat label="Approved admissions" value={count('Approved')}/><Stat label="Under review" value={count('Under Review')}/></div><div className="card"><h2>Course-wise admission summary</h2><div className="table-wrap"><table><thead><tr><th>Course</th><th>Capacity</th><th>Applications</th><th>Approved</th><th>Rejected</th><th>In review</th></tr></thead><tbody>{data.by_course.map(c=><tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.seat_capacity}</td><td>{c.applications}</td><td>{c.approved}</td><td>{c.rejected}</td><td>{c.under_review}</td></tr>)}</tbody></table></div></div><div className="card"><h2>Status distribution</h2><div className="status-rows">{['Draft','Submitted','Under Review','Correction Required','Approved','Rejected'].map(s=><div key={s} className="distribution"><span>{s}</span><div className="bar"><div style={{width:data.total?`${Math.max(0,100*count(s)/data.total)}%`:'0%'}}/></div><strong>{count(s)}</strong></div>)}</div></div><p className="fine-print">Academic demonstration based on fictional admission records. Management access is read-only.</p></>}</>}</Page>;
}
