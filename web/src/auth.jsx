import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import { Navigate,useLocation } from 'react-router-dom';
import {api,setCsrf} from './api';
const Context=createContext(null);
export function AuthProvider({children}){
 const [user,setUser]=useState(null),[loading,setLoading]=useState(true);
 useEffect(()=>{
   let live=true;
   api('/api/me').then(r=>{if(live){setCsrf(r?.csrfToken);setUser(r?.user||null);}}).catch(()=>{if(live){setUser(null);setCsrf(null);}}).finally(()=>{if(live)setLoading(false);});
   return ()=>{live=false;};
 },[]);
 const value=useMemo(()=>({user,loading,async login(email,password){const result=await api('/api/auth/login',{method:'POST',body:{email,password}});setCsrf(result.csrfToken);setUser(result.user);return result.user;},async logout(){try{await api('/api/auth/logout',{method:'POST'});}finally{setCsrf(null);setUser(null);}}}),[user,loading]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useAuth=()=>useContext(Context);
export const homeFor=role=>role==='ADMIN'?'/admin':role==='MANAGEMENT'?'/management':'/student';
export function Protected({role,children}){
 const {user,loading}=useAuth();const location=useLocation();
 if(loading)return <div className="loading">Checking your session…</div>;
 if(!user)return <Navigate to="/login" state={{from:location.pathname}} replace/>;
 if(user.role!==role)return <Navigate to={homeFor(user.role)} replace/>;
 return children;
}
