import React,{useState} from 'react';
import {Link,NavLink,useNavigate} from 'react-router-dom';
import { GraduationCap,LogOut,Menu,BookOpen,ShieldCheck,BarChart3,ChevronRight } from 'lucide-react';
import {useAuth,homeFor} from '../auth';

export function SiteHeader(){
 const {user,logout}=useAuth(),navigate=useNavigate(),[show,setShow]=useState(false);
 return <header className="site-header"><div className="header-inner">
   <Link className="brand" to="/"><span className="brand-icon"><GraduationCap size={23}/></span><span><strong>STHA</strong><small>ADMISSIONS PORTAL</small></span></Link>
   <button className="mobile-toggle" onClick={()=>setShow(!show)} aria-label="Toggle menu"><Menu size={22}/></button>
   <nav className={'top-nav '+(show?'visible':'')}>
     <NavLink onClick={()=>setShow(false)} to="/courses">Explore courses</NavLink>
     {user?<><Link onClick={()=>setShow(false)} to={homeFor(user.role)}>My workspace</Link><span className="identity">{user.email}</span><button className="text-button" onClick={async()=>{await logout();navigate('/');}}><LogOut size={16}/> Sign out</button></>:
     <><NavLink onClick={()=>setShow(false)} to="/login">Sign in</NavLink><Link className="header-cta" onClick={()=>setShow(false)} to="/register">Apply now <ChevronRight size={17}/></Link></>}
   </nav>
 </div></header>;
}
export function Footer(){return <footer className="footer"><div className="container"><strong>STHA • CAMS</strong><span>Built by Rookies · Academic demonstration only</span></div></footer>}
export function Page({title,eyebrow,description,children,actions}){return <section className="page"><div className="page-title"><div><span className="eyebrow">{eyebrow||'STHA / ADMISSIONS'}</span><h1>{title}</h1>{description&&<p>{description}</p>}</div>{actions&&<div className="page-actions">{actions}</div>}</div>{children}</section>}
export function StatusBadge({status}) {const key=(status||'').toLowerCase().replace(/\s+/g,'-');return <span className={`status-badge status-${key}`}>{status||'Not started'}</span>}
export function Alert({error,success}){if(!error&&!success)return null;return <div role="alert" className={'alert '+(error?'error':'success')}>{error?.message||error||success}</div>}
export function Field({label,required,children,hint}){return <label className="field"><span>{label}{required&&<i> *</i>}</span>{children}{hint&&<small>{hint}</small>}</label>}
export function Empty({title,description,children}){return <div className="empty"><BookOpen size={31}/><h3>{title}</h3><p>{description}</p>{children}</div>}
export const policyName=code=>({PHYSICS_MATH:'Physics and Mathematics',MATH_OR_CS:'Mathematics or Computer Science',NONE:'No subject restriction'}[code]||code);
export const fmt=(date)=>date?String(date).replace('T',' ').slice(0,16):'—';
export function Sidebar({items}) {return <aside className="side-panel"><div className="side-label">WORKSPACE</div>{items.map(item=><NavLink key={item.to} to={item.to} end={item.end} className={({isActive})=>'side-link '+(isActive?'active':'')}>{item.icon}{item.text}</NavLink>)}</aside>}
export function RoleLayout({items,children}){return <div className="container workspace"><Sidebar items={items}/><main className="workspace-main">{children}</main></div>}
export function Stat({label,value,small}){return <div className="stat-card"><span>{label}</span><strong>{value}</strong>{small&&<small>{small}</small>}</div>}
export function Spinner(){return <div className="loading">Loading CAMS records…</div>}
export function ErrorPanel({error,onRetry}){return <div className="card"><Alert error={error}/>{onRetry&&<button className="button ghost" onClick={onRetry}>Retry</button>}</div>}
export const roles=[{value:'STUDENT',label:'Student'},{value:'ADMIN',label:'Admission Administrator'},{value:'MANAGEMENT',label:'College Management'}];
export const roleName=role=>roles.find(x=>x.value===role)?.label||role;
