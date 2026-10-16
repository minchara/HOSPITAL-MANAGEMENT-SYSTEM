// Use a separate client with no persisted admin session so public submissions
// always use the Supabase anon role and its insert-only policy.
const bookingClient=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_PUBLISHABLE_KEY,{
 auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}
});
const bookingForm=document.getElementById('booking-form');
const bookingMessage=document.getElementById('booking-message');
const submitButton=document.getElementById('submit-button');
const dateField=document.getElementById('date');
const localToday=new Date();
dateField.min=new Date(localToday.getTime()-localToday.getTimezoneOffset()*60000).toISOString().slice(0,10);
bookingForm.addEventListener('submit',async event=>{
 event.preventDefault();bookingMessage.textContent='';bookingMessage.classList.remove('success');
 submitButton.disabled=true;submitButton.textContent='Sending…';
 const guestName=document.getElementById('guest-name').value.trim();
 const guestPhone=document.getElementById('guest-phone').value.trim();
 const phonePattern=/^[+0-9() .-]{7,32}$/;
 if(document.getElementById('website').value||guestName.length<2||!phonePattern.test(guestPhone)){
   bookingMessage.textContent='Please check your name and phone number.';submitButton.disabled=false;submitButton.textContent='Send appointment request';return;
 }
 try{
   const {error}=await bookingClient.from('appointments').insert({
     guest_name:guestName,
     guest_phone:guestPhone,
     doctor:document.getElementById('doctor').value.trim(),
     dept:document.getElementById('department').value.trim(),
     appointment_date:dateField.value,
     appointment_time:document.getElementById('time').value
   });
   if(error)throw error;
   bookingMessage.textContent='Your request was sent. The clinic will contact you to confirm.';
   bookingMessage.classList.add('success');
   bookingForm.reset();dateField.min=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
 }catch(error){
   console.error('Appointment request failed:',error);
   bookingMessage.textContent='We could not send your request. Please check the details and try again.';
 }finally{submitButton.disabled=false;submitButton.textContent='Send appointment request';}
});