// Supabase-backed application state. Database RLS restricts this data to admins.
const supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY);
let patients=[], appointments=[], bills=[], activity=[];
let currentView='dashboard';
let formOpen={patients:false,appointments:false,billing:false};
let search={patients:'',appointments:'',billing:''};
let sortState={patients:{key:'id',dir:1},appointments:{key:'id',dir:1},billing:{key:'id',dir:1}};
let pendingDelete=null;
function mapPatient(r){return{id:Number(r.id),name:r.name,age:r.age??'',gender:r.gender??'',phone:r.phone??'',disease:r.disease??''};}
function mapAppointment(r){return{id:Number(r.id),pid:r.patient_id==null?null:Number(r.patient_id),guestName:r.guest_name??'',guestPhone:r.guest_phone??'',doctor:r.doctor??'',date:r.appointment_date??'',time:(r.appointment_time??'').slice(0,5),dept:r.dept??'',status:r.status};}
function mapBill(r){return{id:Number(r.id),pid:r.patient_id==null?null:Number(r.patient_id),amt:Number(r.amount),status:r.status};}
async function loadData(){
  const [p,a,b]=await Promise.all([
    supabaseClient.from('patients').select('*').order('id'),
    supabaseClient.from('appointments').select('*').order('id'),
    supabaseClient.from('bills').select('*').order('id')
  ]);
  if(p.error)throw p.error;if(a.error)throw a.error;if(b.error)throw b.error;
  patients=(p.data||[]).map(mapPatient);appointments=(a.data||[]).map(mapAppointment);bills=(b.data||[]).map(mapBill);render();
}
async function startApplication(){
  try{
    const {data,error}=await supabaseClient.auth.getUser();
    if(error||!data.user||data.user.app_metadata?.role!=='admin'){
      if(data.user)await supabaseClient.auth.signOut();
      window.location.replace('login.html');return;
    }
    const email=document.getElementById('admin-email');if(email)email.textContent=data.user.email||'Administrator';
    await loadData();
  }catch(error){console.error(error);toast('Could not connect to the database. Please try again.','error');}
}
async function signOut(){const {error}=await supabaseClient.auth.signOut();if(error)throw error;window.location.replace('login.html');}
function runAction(action){Promise.resolve().then(action).catch(error=>{console.error(error);toast(error.message||'Could not complete that action.','error');});}

function escapeHtml(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, char => entities[char]);
}
function el(html){ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstChild; }
function fmtMoney(n){ const num=parseFloat(n); return isNaN(num) ? n : '$'+num.toFixed(2); }
function nowLabel(){ const d=new Date(); return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
function logActivity(type, text){ activity.unshift({type,text,time:nowLabel()}); activity=activity.slice(0,8); }

function toast(msg, type){
  const stack = document.getElementById('toast-stack');
  const node = el(`<div class="toast ${type==='error'?'error':''}" role="status">
    <svg class="ic" viewBox="0 0 20 20" fill="none"><path d="M4 10.5l3.5 3.5L16 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span>${escapeHtml(msg)}</span>
  </div>`);
  stack.appendChild(node);
  setTimeout(()=>{ node.classList.add('leaving'); setTimeout(()=>node.remove(), 200); }, 2600);
}

function switchView(view){
  currentView = view;
  pendingDelete = null;
  document.querySelectorAll('.navlink').forEach(n=>n.classList.toggle('active', n.dataset.view===view));
  ['dashboard','patients','appointments','billing'].forEach(v=>{
    document.getElementById('view-'+v).style.display = (v===view)?'block':'none';
  });
  render();
}
document.getElementById('nav').addEventListener('click', e=>{
  const t = e.target.closest('.navlink');
  if(t) switchView(t.dataset.view);
});

document.addEventListener('click', event => {
  const control = event.target.closest('[data-action], [data-sort-view]');
  if (!control) return;

  if (control.dataset.sortView) {
    toggleSort(control.dataset.sortView, control.dataset.sortKey);
    return;
  }

  const id = Number(control.dataset.id);
  switch (control.dataset.action) {
    case 'sign-out': runAction(signOut); break;
    case 'jump-open': openWorkflow(control.dataset.section); break;
    case 'toggle-form': toggleForm(control.dataset.section); break;
    case 'add-patient': runAction(addPatient); break;
    case 'add-bill': runAction(addBill); break;
    case 'request-delete': requestDelete(control.dataset.view, id); break;
    case 'confirm-delete': runAction(() => confirmDelete(control.dataset.view, id)); break;
    case 'cancel-delete': cancelDelete(); break;
  }
});

document.addEventListener('input', event => {
  const control = event.target.closest('[data-search]');
  if (!control) return;
  const section = control.dataset.search;
  search[section] = control.value;
  if (section === 'patients') renderPatients();
  else if (section === 'appointments') renderAppointments();
  else if (section === 'billing') renderBilling();
});

document.addEventListener('change', event => {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const id = Number(control.dataset.id);
  if (control.dataset.action === 'update-appt-status') runAction(() => updateApptStatus(id, control.value));
  else if (control.dataset.action === 'update-bill-status') runAction(() => updateBillStatus(id, control.value));
});

function setFieldError(id, msg){
  const input = document.getElementById(id);
  const msgEl = document.getElementById(id+'-msg');
  if(input) input.classList.toggle('err', !!msg);
  if(msgEl) msgEl.textContent = msg || '';
}
function clearFieldErrors(ids){ ids.forEach(id=>setFieldError(id, '')); }

function renderDashboard(){
  const view = document.getElementById('view-dashboard');
  const totalRevenue = bills.filter(b=>b.status==='Paid').reduce((s,b)=>s+parseFloat(b.amt||0),0);
  const dueCount = bills.filter(b=>b.status==='Due').length;
  const scheduledCount = appointments.filter(a=>a.status==='Scheduled').length;

  const vitalsHtml = `
    <div class="vitals">
      ${[
        ['Patients on record', patients.length],
        ['Appointments scheduled', scheduledCount],
        ['Bills outstanding', dueCount],
        ['Revenue collected', '$'+totalRevenue.toFixed(2)]
      ].map(([label,value])=>`
        <div class="vital">
          <span class="vital-pulse"></span>
          <div class="vital-label">${label}</div>
          <div class="vital-value">${value}</div>
        </div>
      `).join('')}
    </div>`;

  const quickActions = `
    <div class="quick-actions">
      <button class="qa-btn" data-action="jump-open" data-section="patients"><span class="plus">+</span> Add patient</button>
      <button class="qa-btn" data-action="jump-open" data-section="billing"><span class="plus">+</span> Generate bill</button>
    </div>`;

  const activityHtml = activity.length ? activity.map(a=>`
    <div class="activity-item">
      <span class="activity-dot ${escapeHtml(a.type)}"></span>
      <span>${escapeHtml(a.text)}</span>
      <span class="activity-time">${escapeHtml(a.time)}</span>
    </div>
  `).join('') : `<div class="empty"><div class="empty-mark">Nothing yet</div><div class="empty-title">Activity will appear here as you add records.</div></div>`;

  const dueBills = bills.filter(b=>b.status==='Due').slice(0,5).map(b=>{
    const p = patients.find(p=>p.id===b.pid);
    return `<div class="activity-item">
      <span class="activity-dot bill"></span>
      <span>${escapeHtml(p?p.name:'—')} · <span class="mono">${escapeHtml(fmtMoney(b.amt))}</span></span>
      <span class="activity-time"><span class="status Due">Due</span></span>
    </div>`;
  }).join('') || `<div class="empty"><div class="empty-mark">All clear</div><div class="empty-title">No outstanding bills right now.</div></div>`;

  view.innerHTML = `
    <h1 class="page-title">Overview</h1>
    <p class="page-sub">A snapshot of today's chart activity.</p>
    ${vitalsHtml}
    ${quickActions}
    <div class="dash-grid">
      <div class="panel">
        <div class="panel-head"><div><div class="panel-title">Recent activity</div><div class="panel-sub">Latest changes logged in memory</div></div></div>
        ${activityHtml}
      </div>
      <div class="panel">
        <div class="panel-head"><div><div class="panel-title">Outstanding bills</div><div class="panel-sub">Needs follow-up</div></div></div>
        ${dueBills}
      </div>
    </div>
  `;
}
function openWorkflow(section){ jumpAndOpen(section); }
function jumpAndOpen(section){
  switchView(section);
  formOpen[section] = true;
  render();
  setTimeout(()=>{
    const firstInput = document.querySelector('.form-wrap.open input, .form-wrap.open select');
    if(firstInput) firstInput.focus();
  }, 50);
}

function applySort(list, view){
  const {key, dir} = sortState[view];
  return [...list].sort((a,b)=>{
    let av=a[key], bv=b[key];
    if(typeof av==='string') av=av.toLowerCase();
    if(typeof bv==='string') bv=bv.toLowerCase();
    if(av<bv) return -1*dir;
    if(av>bv) return 1*dir;
    return 0;
  });
}
function toggleSort(view, key){
  if(sortState[view].key===key){ sortState[view].dir *= -1; }
  else{ sortState[view] = {key, dir:1}; }
  render();
}
function sortArrow(view, key){
  const s = sortState[view];
  if(s.key!==key) return '';
  return s.dir===1 ? '▲' : '▼';
}

function renderPatients(){
  const view = document.getElementById('view-patients');
  let list = patients.filter(p => (p.name+p.phone+p.disease).toLowerCase().includes(search.patients.toLowerCase()));
  list = applySort(list, 'patients');

  const rows = list.map(p=>`
    <tr id="prow-${p.id}">
      <td><span class="id-chip">P-${String(p.id).padStart(3,'0')}</span></td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.age)}</td>
      <td>${escapeHtml(p.gender)}</td>
      <td class="mono">${escapeHtml(p.phone)}</td>
      <td>${escapeHtml(p.disease)}</td>
      <td>${rowActionsHtml('patients', p.id)}</td>
    </tr>
  `).join('');

  view.innerHTML = `
    <h1 class="page-title">Patients</h1>
    <p class="page-sub">Registered patients and their intake details.</p>
    <div class="panel">
      <div class="panel-head">
        <div>
          <div class="panel-title">Patient records</div>
          <div class="panel-sub">${patients.length} on file</div>
        </div>
        <div class="head-actions">
          ${patients.length ? `<input class="search-input" maxlength="100" placeholder="Search patients" value="${escapeHtml(search.patients)}" data-search="patients" aria-label="Search patients">` : ''}
          <button class="btn" data-action="toggle-form" data-section="patients">${formOpen.patients?'Close':'+ Add patient'}</button>
        </div>
      </div>
      <div class="form-wrap ${formOpen.patients?'open':''}">
        <div class="form-grid">
          <div class="field"><label for="f-p-name">Name</label><input id="f-p-name" maxlength="120" autocomplete="off" placeholder="Jane Doe"><div class="field-msg" id="f-p-name-msg"></div></div>
          <div class="field"><label for="f-p-age">Age</label><input id="f-p-age" type="number" min="1" max="130" step="1" placeholder="34"><div class="field-msg" id="f-p-age-msg"></div></div>
          <div class="field"><label for="f-p-gender">Gender</label>
            <select id="f-p-gender"><option>Female</option><option>Male</option><option>Other</option></select>
          </div>
          <div class="field"><label for="f-p-phone">Phone</label><input id="f-p-phone" type="tel" maxlength="32" autocomplete="off" placeholder="+91 98765 43210"><div class="field-msg" id="f-p-phone-msg"></div></div>
          <div class="field"><label for="f-p-disease">Disease / reason</label><input id="f-p-disease" maxlength="250" autocomplete="off" placeholder="Hypertension"></div>
        </div>
        <div class="form-actions">
          <button class="btn" data-action="add-patient">Save patient</button>
          <button class="btn ghost" data-action="toggle-form" data-section="patients">Cancel</button>
        </div>
      </div>
      ${patients.length ? (list.length ? `
        <div class="table-scroll">
        <table>
          <thead><tr>
            <th class="sortable ${sortState.patients.key==='id'?'active':''}" data-sort-view="patients" data-sort-key="id">ID <span class="arrow">${sortArrow('patients','id')||'▲'}</span></th>
            <th class="sortable ${sortState.patients.key==='name'?'active':''}" data-sort-view="patients" data-sort-key="name">Name <span class="arrow">${sortArrow('patients','name')}</span></th>
            <th>Age</th><th>Gender</th><th>Phone</th><th>Disease</th><th></th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        </div>
      ` : `<div class="no-results">No patients match "${escapeHtml(search.patients)}".</div>`) : `
        <div class="empty">
          <div class="empty-mark">No patients yet</div>
          <div class="empty-title">Add the first patient to start a chart.</div>
          <button class="btn" data-action="toggle-form" data-section="patients">+ Add patient</button>
        </div>
      `}
    </div>
  `;
}
function toggleForm(section){
  formOpen[section] = !formOpen[section];
  render();
  if(formOpen[section]){
    setTimeout(()=>{ const f=document.querySelector('.form-wrap.open input, .form-wrap.open select'); if(f) f.focus(); }, 50);
  }
}
async function addPatient(){
  const name=document.getElementById('f-p-name').value.trim(),age=document.getElementById('f-p-age').value.trim();
  const gender=document.getElementById('f-p-gender').value,phone=document.getElementById('f-p-phone').value.trim();
  const disease=document.getElementById('f-p-disease').value.trim();
  clearFieldErrors(['f-p-name','f-p-age','f-p-phone']);let ok=true;
  if(!name){setFieldError('f-p-name','Name is required.');ok=false;}
  if(!age||!Number.isInteger(Number(age))||Number(age)<1||Number(age)>130){setFieldError('f-p-age','Enter a valid age.');ok=false;}
  if(!phone){setFieldError('f-p-phone','Phone is required.');ok=false;}if(!ok)return;
  const {data,error}=await supabaseClient.from('patients').insert({name,age:Number(age),gender,phone,disease:disease||'—'}).select().single();
  if(error)throw error;const patient=mapPatient(data);patients.push(patient);logActivity('patient',`${name} added as a new patient`);
  formOpen.patients=false;render();toast(`${name} added to patient records`);
  setTimeout(()=>{const row=document.getElementById('prow-'+patient.id);if(row)row.classList.add('flash');},60);
}
async function removePatient(id){
  const patient=patients.find(p=>p.id===id),{error}=await supabaseClient.from('patients').delete().eq('id',id);
  if(error)throw error;patients=patients.filter(p=>p.id!==id);
  appointments=appointments.map(a=>a.pid===id?{...a,pid:null}:a);bills=bills.map(b=>b.pid===id?{...b,pid:null}:b);
  logActivity('patient',`${patient?patient.name:'Patient'} removed from records`);render();toast(`${patient?patient.name:'Patient'} removed`,'error');
}
function renderAppointments(){
  const view=document.getElementById('view-appointments');
  let list=appointments.filter(a=>{
    const patient=patients.find(p=>p.id===a.pid);
    const hay=(a.guestName+a.guestPhone+a.doctor+a.dept+(patient?patient.name:'')).toLowerCase();
    return hay.includes(search.appointments.toLowerCase());
  });
  list=applySort(list,'appointments');
  const rows=list.map(a=>{
    const patient=patients.find(p=>p.id===a.pid);
    const displayName=patient?patient.name:(a.guestName||'No patient linked');
    return `
      <tr id="arow-${a.id}">
        <td><span class="id-chip">A-${String(a.id).padStart(3,'0')}</span></td>
        <td><div>${escapeHtml(displayName)}</div>${a.guestPhone?`<div class="panel-sub">${escapeHtml(a.guestPhone)}</div>`:''}</td>
        <td>${escapeHtml(a.doctor)}</td>
        <td class="mono">${escapeHtml(a.date)}</td>
        <td class="mono">${escapeHtml(a.time)}</td>
        <td>${escapeHtml(a.dept)}</td>
        <td>
          <select class="status-select" data-action="update-appt-status" data-id="${a.id}" aria-label="Appointment status">
            <option ${a.status==='Scheduled'?'selected':''}>Scheduled</option>
            <option ${a.status==='Completed'?'selected':''}>Completed</option>
            <option ${a.status==='Cancelled'?'selected':''}>Cancelled</option>
          </select>
        </td>
        <td>${rowActionsHtml('appointments',a.id)}</td>
      </tr>`;
  }).join('');
  view.innerHTML=`
    <h1 class="page-title">Appointments</h1>
    <p class="page-sub">Public appointment requests and scheduled visits.</p>
    <div class="panel">
      <div class="panel-head">
        <div><div class="panel-title">Appointments</div><div class="panel-sub">${appointments.length} booked</div></div>
        <div class="head-actions">
          ${appointments.length?`<input class="search-input" maxlength="100" placeholder="Search appointments" value="${escapeHtml(search.appointments)}" data-search="appointments" aria-label="Search appointments">`:''}
        </div>
      </div>
      ${appointments.length?(list.length?`
        <div class="table-scroll"><table>
          <thead><tr>
            <th>ID</th><th>Patient / Guest</th><th>Doctor</th><th>Date</th><th>Time</th><th>Dept</th><th>Status</th><th></th>
          </tr></thead><tbody>${rows}</tbody>
        </table></div>
      `:`<div class="no-results">No appointments match "${escapeHtml(search.appointments)}".</div>`):`
        <div class="empty"><div class="empty-mark">No appointments yet</div><div class="empty-title">Public booking requests will appear here.</div></div>
      `}
    </div>`;
}

async function updateApptStatus(id,status){
  const {error}=await supabaseClient.from('appointments').update({status}).eq('id',id);if(error)throw error;
  const a=appointments.find(a=>a.id===id);if(a)a.status=status;render();toast(`Appointment A-${String(id).padStart(3,'0')} marked ${status}`);
}
async function removeAppt(id){
  const {error}=await supabaseClient.from('appointments').delete().eq('id',id);if(error)throw error;
  appointments=appointments.filter(a=>a.id!==id);render();toast('Appointment removed','error');
}
function renderBilling(){
  const view = document.getElementById('view-billing');
  let list = bills.filter(b=>{
    const p = patients.find(p=>p.id===b.pid);
    return ((p?p.name:'')+b.status).toLowerCase().includes(search.billing.toLowerCase());
  });
  list = applySort(list, 'billing');

  const rows = list.map(b=>{
    const patient = patients.find(p=>p.id===b.pid);
    return `
    <tr id="brow-${b.id}">
      <td><span class="id-chip">B-${String(b.id).padStart(3,'0')}</span></td>
      <td>${escapeHtml(patient ? patient.name : 'No patient linked')}</td>
      <td class="mono">${escapeHtml(fmtMoney(b.amt))}</td>
      <td>
        <select class="status-select" data-action="update-bill-status" data-id="${b.id}" aria-label="Bill status">
          <option ${b.status==='Paid'?'selected':''}>Paid</option>
          <option ${b.status==='Due'?'selected':''}>Due</option>
        </select>
      </td>
      <td>${rowActionsHtml('billing', b.id)}</td>
    </tr>
  `;}).join('');

  const patientOptions = patients.map(p=>`<option value="${escapeHtml(p.id)}">P-${escapeHtml(String(p.id).padStart(3,'0'))} — ${escapeHtml(p.name)}</option>`).join('');

  view.innerHTML = `
    <h1 class="page-title">Billing</h1>
    <p class="page-sub">Charges generated per patient visit.</p>
    <div class="panel">
      <div class="panel-head">
        <div>
          <div class="panel-title">Bills</div>
          <div class="panel-sub">${bills.length} generated</div>
        </div>
        <div class="head-actions">
          ${bills.length ? `<input class="search-input" maxlength="100" placeholder="Search bills" value="${escapeHtml(search.billing)}" data-search="billing" aria-label="Search bills">` : ''}
          <button class="btn" data-action="toggle-form" data-section="billing">${formOpen.billing?'Close':'+ Generate bill'}</button>
        </div>
      </div>
      <div class="form-wrap ${formOpen.billing?'open':''}">
        <div class="form-grid">
          <div class="field"><label for="f-b-pid">Patient (optional)</label><select id="f-b-pid">${patientOptions}</select></div>
          <div class="field"><label for="f-b-amt">Amount ($)</label><input id="f-b-amt" type="number" step="0.01" min="0" placeholder="150.00"><div class="field-msg" id="f-b-amt-msg"></div></div>
          <div class="field"><label for="f-b-status">Status</label><select id="f-b-status"><option>Due</option><option>Paid</option></select></div>
        </div>
        <div class="form-actions">
          <button class="btn" data-action="add-bill">Save bill</button>
          <button class="btn ghost" data-action="toggle-form" data-section="billing">Cancel</button>
        </div>
      </div>
      ${bills.length ? (list.length ? `
        <div class="table-scroll">
        <table>
          <thead><tr>
            <th class="sortable ${sortState.billing.key==='id'?'active':''}" data-sort-view="billing" data-sort-key="id">ID <span class="arrow">${sortArrow('billing','id')||'▲'}</span></th>
            <th>Patient</th>
            <th class="sortable ${sortState.billing.key==='amt'?'active':''}" data-sort-view="billing" data-sort-key="amt">Amount <span class="arrow">${sortArrow('billing','amt')}</span></th>
            <th>Status</th><th></th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        </div>
      ` : `<div class="no-results">No bills match "${escapeHtml(search.billing)}".</div>`) : `
        <div class="empty">
          <div class="empty-mark">No bills yet</div>
          <div class="empty-title">Generate a bill for a registered patient.</div>
          ${patients.length ? `<button class="btn" data-action="toggle-form" data-section="billing">+ Generate bill</button>` : ''}
        </div>
      `}
    </div>
  `;
}
async function addBill(){
  const patientValue=document.getElementById('f-b-pid').value,pid=patientValue?Number(patientValue):null;
  const amt=document.getElementById('f-b-amt').value.trim(),status=document.getElementById('f-b-status').value;
  clearFieldErrors(['f-b-amt']);if(!amt||!Number.isFinite(Number(amt))||Number(amt)<=0){setFieldError('f-b-amt','Enter a valid amount.');return;}
  const {data,error}=await supabaseClient.from('bills').insert({patient_id:pid,amount:Number(amt),status}).select().single();
  if(error)throw error;const bill=mapBill(data);bills.push(bill);const patient=patients.find(p=>p.id===pid);
  logActivity('bill',`Bill B-${String(bill.id).padStart(3,'0')} generated for ${patient?patient.name:'an unlinked visit'}`);
  formOpen.billing=false;render();toast('Bill generated');
  setTimeout(()=>{const row=document.getElementById('brow-'+bill.id);if(row)row.classList.add('flash');},60);
}
async function updateBillStatus(id,status){
  const {error}=await supabaseClient.from('bills').update({status}).eq('id',id);if(error)throw error;
  const b=bills.find(b=>b.id===id);if(b)b.status=status;render();toast(`Bill B-${String(id).padStart(3,'0')} marked ${status}`);
}
async function removeBill(id){
  const {error}=await supabaseClient.from('bills').delete().eq('id',id);if(error)throw error;
  bills=bills.filter(b=>b.id!==id);render();toast('Bill removed','error');
}
function rowActionsHtml(view, id){
  if(pendingDelete && pendingDelete.view===view && pendingDelete.id===id){
    return `
      <div class="confirm-row">
        <span class="confirm-text">Delete?</span>
        <button class="btn danger small" data-action="confirm-delete" data-view="${view}" data-id="${id}">Yes</button>
        <button class="btn ghost small" data-action="cancel-delete">No</button>
      </div>
    `;
  }
  return `
    <div class="row-actions">
      <button class="btn ghost small" data-action="request-delete" data-view="${view}" data-id="${id}">Delete</button>
    </div>
  `;
}
function requestDelete(view, id){
  pendingDelete = { view, id };
  render();
}
function cancelDelete(){
  pendingDelete = null;
  render();
}
async function confirmDelete(view, id){
  pendingDelete = null;
  if(view==='patients') await removePatient(id);
  else if(view==='appointments') await removeAppt(id);
  else if(view==='billing') await removeBill(id);
}

function updateNavCounts(){
  document.getElementById('nav-patients-count').textContent = patients.length;
  document.getElementById('nav-appts-count').textContent = appointments.length;
  document.getElementById('nav-bills-count').textContent = bills.length;
}

function render(){
  updateNavCounts();
  if(currentView==='dashboard') renderDashboard();
  else if(currentView==='patients') renderPatients();
  else if(currentView==='appointments') renderAppointments();
  else if(currentView==='billing') renderBilling();
}

// Authenticate, then load the admin's records from Supabase.
startApplication();
