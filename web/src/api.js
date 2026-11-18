let csrfToken = null;
export function setCsrf(token){csrfToken=token||null;}
export class ApiError extends Error {
  constructor(message,code,fields,status){super(message);this.code=code;this.fields=fields;this.status=status;}
}
export async function api(path, options={}) {
  const { method='GET', body, blob=false }=options;
  const form=body instanceof FormData;
  const headers={'ngrok-skip-browser-warning':'1'};
  if(body!==undefined && !form) headers['Content-Type']='application/json';
  if(!['GET','HEAD'].includes(method) && csrfToken) headers['X-CSRF-Token']=csrfToken;
  const response=await fetch(path,{method,body:body===undefined?undefined:(form?body:JSON.stringify(body)),headers,credentials:'include',cache:'no-store'});
  if(blob && response.ok) return response.blob();
  const data=await response.json().catch(()=>null);
  if(!response.ok){
    const err=data?.error||{};
    throw new ApiError(err.message||`Request failed (${response.status})`,err.code,err.fields,response.status);
  }
  return data?.data;
}
export function msg(error){return error?.message||'Something went wrong. Please retry.';}
export async function openPrivateDocument(url) {
  const data=await api(url,{blob:true});
  const href=URL.createObjectURL(data);
  window.open(href,'_blank','noopener,noreferrer');
  window.setTimeout(()=>URL.revokeObjectURL(href),60000);
}
export async function downloadConfirmation(url){
  const data=await api(url,{blob:true});
  const href=URL.createObjectURL(data);
  const a=document.createElement('a');a.href=href;a.download='STHA-demo-admission-confirmation.pdf';a.click();
  window.setTimeout(()=>URL.revokeObjectURL(href),60000);
}
