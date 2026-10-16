const client=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_PUBLISHABLE_KEY);
const form=document.getElementById('login-form'),message=document.getElementById('login-message'),button=document.getElementById('submit-button');
const isAdmin=user=>user?.app_metadata?.role==='admin';
(async()=>{const {data,error}=await client.auth.getUser();if(!error&&isAdmin(data.user))location.replace('index.html');})();
form.addEventListener('submit',async event=>{
 event.preventDefault();message.textContent='';button.disabled=true;button.textContent='Signing in…';
 try{
  const {data,error}=await client.auth.signInWithPassword({email:document.getElementById('email').value.trim(),password:document.getElementById('password').value});
  if(error)throw error;
  if(!isAdmin(data.user)){await client.auth.signOut();throw new Error('This account is not authorized as a system administrator.');}
  location.replace('index.html');
 }catch(error){message.textContent=error.message||'Sign-in failed. Check your credentials and try again.';button.disabled=false;button.textContent='Sign in';}
});