const configs = {
 sales:{title:"تقرير المبيعات",fields:[["إجمالي المبيعات","رقم","sales_total"],["عدد الطلبات","رقم","orders"],["طريقة الدفع / ملاحظات","نص","notes"]]},
 expenses:{title:"تقرير المصروفات",fields:[["نوع المصروف","نص","expense_type"],["المبلغ","رقم","amount"],["وصف المصروف","نص","description"]]},
 waste:{title:"تقرير التالف والهدر",fields:[["اسم الصنف","نص","item"],["الكمية","نص","quantity"],["سبب التلف","نص","reason"],["التكلفة التقديرية","رقم","cost"]]},
 maintenance:{title:"تقرير الصيانة",fields:[["نوع العطل","نص","issue"],["الأولوية","قائمة","priority",["عادي","متوسط","عاجل"]],["وصف المشكلة","نص طويل","description"]]},
 staff:{title:"تقييم الموظفين",fields:[["اسم الموظف","نص","employee"],["التقييم من 5","رقم","rating"],["ملاحظات","نص طويل","notes"]]}
};
let current="sales";
const $=s=>document.querySelector(s);
function renderForm(){
 const c=configs[current];$("#formTitle").textContent=c.title;
 $("#dynamicFields").innerHTML=c.fields.map(([label,type,name,opts])=>{
  let control=type==="نص طويل"?`<textarea name="${name}" placeholder="${label}"></textarea>`:
   type==="قائمة"?`<select name="${name}">${opts.map(o=>`<option>${o}</option>`).join("")}</select>`:
   `<input name="${name}" type="${type==="رقم"?"number":"text"}" ${type==="رقم"?'step="0.01" min="0"':''} placeholder="${label}" required>`;
  return `<label class="${type==="نص طويل"?"full":""}">${label}${control}</label>`;
 }).join("");
}
$("#tabs").addEventListener("click",e=>{const b=e.target.closest("button[data-type]");if(!b)return;current=b.dataset.type;document.querySelectorAll(".tabs button").forEach(x=>x.classList.toggle("active",x===b));renderForm();$("#formMessage").textContent="";});
$("#reportForm").addEventListener("submit",async e=>{
 e.preventDefault();const btn=$(".submit"),msg=$("#formMessage");btn.disabled=true;msg.textContent="جارٍ الحفظ والإرسال...";
 const fd=new FormData(e.target);fd.set("type",current);
 try{const r=await fetch("/api/reports",{method:"POST",body:fd});const d=await r.json();if(!r.ok)throw Error(d.error||"تعذر الحفظ");
 msg.textContent=d.telegram_status==="sent"?"تم حفظ التقرير وإرساله إلى Telegram ✓":`تم حفظ التقرير، لكن تعذر إرساله: ${d.telegram_error||"تحقق من الإعدادات"}`;
 e.target.reset();e.target.elements.report_date.value=new Date().toISOString().slice(0,10);await loadReports();
 }catch(err){msg.textContent=err.message;}finally{btn.disabled=false;}
});
async function loadReports(){
 const box=$("#reports");box.innerHTML='<p class="empty">جارٍ تحميل التقارير...</p>';
 try{const r=await fetch("/api/reports");const rows=await r.json();if(!rows.length){box.innerHTML='<p class="empty">لا توجد تقارير محفوظة بعد.</p>';return;}
 box.innerHTML=rows.map(x=>`<article class="report"><div><strong>${configs[x.type]?.title||x.type}</strong><small>${x.report_date} · ${x.branch||"بدون تحديد فرع"}</small><div class="status ${x.telegram_status==="failed"?"failed":""}">${x.telegram_status==="sent"?"تم الإرسال": "لم يتم الإرسال"}</div></div><button data-resend="${x.id}">إعادة الإرسال</button></article>`).join("");
 }catch{box.innerHTML='<p class="empty">تعذر تحميل التقارير.</p>';}
}
$("#reports").addEventListener("click",async e=>{const b=e.target.closest("[data-resend]");if(!b)return;b.disabled=true;b.textContent="جارٍ الإرسال";try{const r=await fetch(`/api/reports/${b.dataset.resend}/resend`,{method:"POST"});const d=await r.json();if(!r.ok)throw Error(d.error);await loadReports();}catch(err){alert(err.message);b.disabled=false;b.textContent="إعادة الإرسال";}});
$("#refresh").onclick=loadReports;
$("#testTelegram").onclick=async()=>{const b=$("#testTelegram");b.disabled=true;b.textContent="جارٍ الاختبار";try{const r=await fetch("/api/telegram-test");const d=await r.json();if(!r.ok)throw Error(d.error);alert("تم إرسال رسالة الاختبار بنجاح.");}catch(e){alert(e.message);}finally{b.disabled=false;b.textContent="اختبار Telegram";}};
$("input[name=report_date]").value=new Date().toISOString().slice(0,10);
renderForm();loadReports();
