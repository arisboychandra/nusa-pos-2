import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'content-type':'application/json'}});
serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return response({error:'Method not allowed'},405);
 try{
 const authHeader=req.headers.get('authorization')||'';
 if(!authHeader.startsWith('Bearer '))return response({error:'Login diperlukan'},401);
 const url=Deno.env.get('SUPABASE_URL')!;
 const anon=Deno.env.get('SUPABASE_ANON_KEY')!;
 const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const userClient=createClient(url,anon,{global:{headers:{Authorization:authHeader}}});
 const {data:{user},error:userError}=await userClient.auth.getUser();
 if(userError||!user)return response({error:'Sesi login tidak valid'},401);
 const admin=createClient(url,service);
 const body=await req.json();
 const email=String(body.email||'').trim().toLowerCase();const name=String(body.name||'').trim();const outlet_id=String(body.outlet_id||'');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||name.length<2||name.length>100||!/^\w{8}-/.test(outlet_id))return response({error:'Nama, email atau outlet tidak valid'},400);
 const {data:membership,error:roleError}=await admin.from('outlet_memberships').select('role,is_active').eq('outlet_id',outlet_id).eq('user_id',user.id).eq('is_active',true).maybeSingle();
 const {data:profile}=await admin.from('profiles').select('is_active').eq('id',user.id).maybeSingle();
 if(roleError||!membership||!['owner','admin'].includes(membership.role)||!profile?.is_active)return response({error:'Hanya Owner/Admin aktif yang boleh mengundang kasir'},403);
 const {data:invited,error:inviteError}=await admin.auth.admin.inviteUserByEmail(email,{data:{full_name:name}});
 if(inviteError)return response({error:'Undangan gagal: '+inviteError.message},400);
 const invitedId=invited.user?.id;if(!invitedId)return response({error:'Undangan tidak menghasilkan pengguna'},500);
 const {error:pError}=await admin.from('profiles').upsert({id:invitedId,full_name:name,is_active:true},{onConflict:'id'});
 if(pError)return response({error:'Undangan terkirim tetapi profil gagal dibuat: '+pError.message},500);
 const {error:mError}=await admin.from('outlet_memberships').upsert({user_id:invitedId,outlet_id,role:'cashier',is_active:true},{onConflict:'user_id,outlet_id'});
 if(mError)return response({error:'Undangan terkirim tetapi akses outlet gagal dibuat: '+mError.message},500);
 return response({ok:true});
 }catch(e){return response({error:e instanceof Error?e.message:'Kesalahan server'},500);}
});
