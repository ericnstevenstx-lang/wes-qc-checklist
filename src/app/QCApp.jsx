"use client";
import { useState, useEffect, useCallback } from "react";

/* ── Supabase ──────────────────────────────────────────── */
const SB="https://ulyycjtrshpsjpvbztkr.supabase.co";
const SK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVseXljanRyc2hwc2pwdmJ6dGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMzg1NzAsImV4cCI6MjA5MDcxNDU3MH0.UYwCdYrdy20xl_hCkO8t4CAB16vBHj-oMdflDv1XlVE";
const H={apikey:SK,Authorization:`Bearer ${SK}`,"Content-Type":"application/json",Prefer:"return=representation"};
let loc=false;
async function db(p,o={}){const r=await fetch(`${SB}/rest/v1/${p}`,{...o,headers:{...H,...(o.headers||{})}});if(!r.ok)throw new Error(`${r.status}`);const t=await r.text();return t?JSON.parse(t):null;}

/* ── Constants ─────────────────────────────────────────── */
const STAT=[
  {v:"received",l:"Received",c:"#6b7280"},{v:"in_qc",l:"In QC",c:"#f59e0b"},
  {v:"qc_pass",l:"QC Pass",c:"#16a34a"},{v:"qc_fail",l:"QC Fail",c:"#dc2626"},
  {v:"conditional",l:"Conditional",c:"#f59e0b"},{v:"refurb",l:"In Refurb",c:"#8b5cf6"},
  {v:"ready",l:"Ready",c:"#16a34a"},{v:"listed",l:"Listed",c:"#0369a1"},
  {v:"staged_for_ship",l:"Staged",c:"#0891b2"},{v:"shipped",l:"Shipped",c:"#475569"},
  {v:"sold",l:"Sold",c:"#065f46"},{v:"scrapped",l:"Scrapped",c:"#dc2626"},
];
const sc={};STAT.forEach(s=>sc[s.v]=s.c);
const sl={};STAT.forEach(s=>sl[s.v]=s.l);
const LOC=[{v:"main_warehouse",l:"Main WH"},{v:"satellite_1",l:"Sat 1"},{v:"satellite_2",l:"Sat 2"}];
const RO=[{v:"pass",l:"PASS",c:"#16a34a",i:"\u2713"},{v:"fail",l:"FAIL",c:"#dc2626",i:"\u2717"},{v:"na",l:"N/A",c:"#94a3b8",i:"\u2014"},{v:"flag",l:"FLAG",c:"#f59e0b",i:"\u26a0"}];
const IT=[{v:"incoming",l:"Incoming"},{v:"pre_refurb",l:"Pre-Refurb"},{v:"post_refurb",l:"Post-Refurb"},{v:"outgoing",l:"Outgoing"}];

const CL=[
  {s:"Visual / Physical",items:["Enclosure condition (dents, rust, corrosion)","Door latches, hinges, hardware functional","Gaskets and seals intact","Mounting hardware present and secure","No water damage or moisture","No overheating, arcing, or burn marks","Interior clean, free of debris","All covers and barriers in place","Nameplates and labels legible","Cable entry points sealed"]},
  {s:"Bus Bars",items:["Bus bars good condition (no pitting, warping)","Bus bar insulation / coating intact","Phase ID correct (A/B/C)","Ground bus present and bonded","Neutral bus properly terminated","Bus bar hardware corrosion-free"]},
  {s:"Lugs & Terminations",items:["Lug type and size correct","Lug crimps secure (no loose barrels)","No heat damage / discoloration on lugs","Anti-oxidant on aluminum connections","Wire gauge matched to lug rating","Set screw lugs to spec","Mechanical lugs no cracks","Landing pads clean, no oxidation"]},
  {s:"Electrical Testing",items:["Megger test performed","Megger readings acceptable","Contact resistance (micro-ohm) tested","Hi-pot test (if applicable)","Continuity all circuits","Ground fault path verified","Voltage verified vs nameplate","Amperage verified vs nameplate"]},
  {s:"Breakers / Switching",items:["Breakers operate freely","Trip unit functional","Arc chutes present, good condition","Breaker contacts good (no pitting)","Mounting / stabs secure","Correct frame size and trip rating","Phasing correct","Shunt trip OK (if equipped)","Aux contacts OK (if equipped)"]},
  {s:"Mechanical",items:["Operating mechanism functional","Interlocks operational","Key interlocks verified","Draw-out mechanism OK","Spring charging OK","Racking mechanism smooth","Fan / ventilation OK","Handles, latching hardware tight"]},
  {s:"Safety & Compliance",items:["Arc flash labels current","Warning labels in place","NFPA 70B compliance","UL / CSA listing verified","PPE requirements posted","LOTO provisions functional","Equipment grounding verified"]},
  {s:"Final / Cosmetic",items:["Cleaned inside and out","Touch-up paint applied","WES inventory label applied","Serial number tag verified","Photos taken and filed","Shipping prep (if outgoing)"]},
];

const today=()=>new Date().toISOString().slice(0,10);

/* ── Styles ─────────────────────────────────────────────── */
const inp={width:"100%",padding:"12px 14px",border:"1.5px solid #d1d5db",borderRadius:10,fontSize:16,background:"#fff",color:"#111",boxSizing:"border-box",outline:"none",fontFamily:"inherit",WebkitAppearance:"none"};
const inpSm={...inp,fontSize:14,padding:"10px 12px"};
const card={background:"#fff",borderRadius:14,padding:16,marginBottom:12,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"};

/* ── Collapsible Section ────────────────────────────────── */
function Section({title,children,badge,defaultOpen=false,color="#475569",count,countColor}){
  const [open,setOpen]=useState(defaultOpen);
  return(<div style={{marginBottom:8}}>
    <button onClick={()=>setOpen(!open)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #e5e7eb",background:open?"#f8fafc":"#fff",cursor:"pointer",fontFamily:"inherit"}}>
      <span style={{fontSize:12,fontWeight:700,color}}>{open?"\u25BE":"\u25B8"} {title}{badge?` (${badge})`:""}</span>
      {count!=null&&count>0&&<span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10,background:(countColor||color)+"18",color:countColor||color}}>{count}</span>}
    </button>
    {open&&<div style={{padding:"10px 0 0"}}>{children}</div>}
  </div>);
}

/* ── Photo compression ─────────────────────────────────── */
function compressImage(file,maxW=1200,q=0.7){return new Promise(r=>{const rd=new FileReader();rd.onload=e=>{const img=new Image();img.onload=()=>{const c=document.createElement("canvas");const ratio=Math.min(maxW/img.width,maxW/img.height,1);c.width=img.width*ratio;c.height=img.height*ratio;c.getContext("2d").drawImage(img,0,0,c.width,c.height);r(c.toDataURL("image/jpeg",q));};img.src=e.target.result;};rd.readAsDataURL(file);});}

/* ════════════════════════════════════════════════════════ */
export default function QCApp() {
  const [view,setView]=useState("inventory");
  const [msg,setMsg]=useState(null);
  const [saving,setSaving]=useState(false);

  /* ── Inventory ── */
  const [inv,setInv]=useState([]);
  const [invLoading,setInvLoading]=useState(false);
  const [invSearch,setInvSearch]=useState("");
  const [invFilterStatus,setInvFilterStatus]=useState("");

  const loadInventory=useCallback(async()=>{
    setInvLoading(true);
    try{const data=await db("inventory_items?select=*&order=created_at.desc&limit=200");if(data)setInv(data);}catch{loc=true;}
    setInvLoading(false);
  },[]);
  useEffect(()=>{loadInventory();},[loadInventory]);

  /* ── Inspection state ── */
  const [selItem,setSelItem]=useState(null);
  const [inspForm,setInspForm]=useState({inspectedBy:"",inspectionDate:today(),inspectionType:"incoming",notes:""});
  const [checks,setChecks]=useState([]);
  const [megger,setMegger]=useState({aToB:"",bToC:"",cToA:"",aToG:"",bToG:"",cToG:"",testV:"1000"});
  const [torque,setTorque]=useState([]);
  const [deficiencies,setDeficiencies]=useState([]);
  const [photos,setPhotos]=useState([]);
  const [stickerNum,setStickerNum]=useState("");

  /* ── History ── */
  const [history,setHistory]=useState([]);
  const [histLoading,setHistLoading]=useState(false);
  const loadHistory=useCallback(async()=>{setHistLoading(true);try{const d=await db("qc_inspections?select=*&order=created_at.desc&limit=100");if(d)setHistory(d);}catch{}setHistLoading(false);},[]);

  const initChecks=()=>CL.flatMap((sec,si)=>sec.items.map((item,ii)=>({section:sec.s,checkItem:item,result:"not_checked",notes:"",sort:si*100+ii})));

  const loadTorqueSpecs=useCallback(async(mfr,eqType)=>{
    try{const data=await db("torque_specs?select=*&order=connection_point");
      if(data){const filtered=data.filter(s=>{const mm=!s.manufacturer||s.manufacturer===mfr;const em=!s.equipment_type||(eqType||"").toLowerCase().includes((s.equipment_type||"").toLowerCase());return mm&&em;});
        const bp={};filtered.forEach(s=>{const k=s.connection_point;if(!bp[k]||s.manufacturer)bp[k]=s;});
        setTorque(Object.values(bp).map(s=>({loc:s.connection_point,boltSize:s.bolt_size||"",spec:String(s.spec_ft_lbs),specHigh:s.spec_range_high?String(s.spec_range_high):"",actual:"",pass:null})));
      }}catch{}
  },[]);

  const startInspection=async(item)=>{
    setSelItem(item);setChecks(initChecks());setMegger({aToB:"",bToC:"",cToA:"",aToG:"",bToG:"",cToG:"",testV:"1000"});
    setDeficiencies([]);setPhotos([]);setStickerNum("");setInspForm({inspectedBy:"",inspectionDate:today(),inspectionType:"incoming",notes:""});
    loadTorqueSpecs(item.manufacturer,item.equipment_type);
    try{await db(`inventory_items?id=eq.${item.id}`,{method:"PATCH",body:JSON.stringify({status:"in_qc"})});setInv(p=>p.map(i=>i.id===item.id?{...i,status:"in_qc"}:i));}catch{}
    setView("inspect");
  };

  const updateInvStatus=async(id,status,extra={})=>{
    try{await db(`inventory_items?id=eq.${id}`,{method:"PATCH",body:JSON.stringify({status,...extra})});setInv(p=>p.map(i=>i.id===id?{...i,status,...extra}:i));setMsg({t:"success",m:`${sl[status]||status}`});}catch(e){setMsg({t:"error",m:e.message});}
  };

  const addPhoto=async(file)=>{if(!file)return;const c=await compressImage(file);let url=c;try{const b=await(await fetch(c)).blob();const fn=`qc_${Date.now()}_${Math.random().toString(36).slice(2,8)}.jpg`;const u=await fetch(`${SB}/storage/v1/object/item-photos/${fn}`,{method:"POST",headers:{apikey:SK,Authorization:`Bearer ${SK}`,"Content-Type":"image/jpeg"},body:b});if(u.ok)url=`${SB}/storage/v1/object/public/item-photos/${fn}`;}catch{}setPhotos(p=>[...p,url]);};

  const saveInspection=async(result)=>{
    if(!inspForm.inspectedBy){setMsg({t:"error",m:"Inspector name required"});return;}
    setSaving(true);const id=`QC-${Date.now().toString(36).toUpperCase()}`;
    const statusMap={pass:"qc_pass",fail:"qc_fail",conditional:"conditional"};
    try{
      await db("qc_inspections",{method:"POST",body:JSON.stringify({id,equipment_type:selItem.equipment_type,manufacturer:selItem.manufacturer,model_number:selItem.model_number,serial_number:selItem.serial_number,voltage_rating:selItem.voltage_rating,amperage_rating:selItem.amperage_rating,inspected_by:inspForm.inspectedBy,inspection_date:inspForm.inspectionDate,inspection_type:inspForm.inspectionType,overall_result:result,notes:inspForm.notes,photos_count:photos.length,sticker_number:stickerNum||null,sticker_signed_by:inspForm.inspectedBy,sticker_date:stickerNum?inspForm.inspectionDate:null})});
      const checkRows=checks.filter(c=>c.result!=="not_checked").map(c=>({inspection_id:id,section:c.section,check_item:c.checkItem,result:c.result,notes:c.notes||null,sort_order:c.sort}));
      if(checkRows.length)await db("qc_checklist_items",{method:"POST",body:JSON.stringify(checkRows)});
      const defRows=deficiencies.filter(d=>d.description).map(d=>({inventory_id:selItem.id,category:d.category||"General",description:d.description,severity:d.severity||"moderate",repair_needed:d.repairNeeded||false,repair_estimate:d.repairEstimate?parseFloat(d.repairEstimate):null}));
      if(defRows.length)await db("inventory_deficiencies",{method:"POST",body:JSON.stringify(defRows)});
      if(photos.length){const pr=photos.map(p=>({reference_id:id,reference_type:"qc_inspection",photo_url:p,taken_by:inspForm.inspectedBy}));await db("item_photos",{method:"POST",body:JSON.stringify(pr)});}
      await db(`inventory_items?id=eq.${selItem.id}`,{method:"PATCH",body:JSON.stringify({status:statusMap[result]||"qc_pass",qc_inspection_id:id,qc_result:result,qc_date:inspForm.inspectionDate,qc_by:inspForm.inspectedBy,qc_sticker:stickerNum||null})});
      setInv(p=>p.map(i=>i.id===selItem.id?{...i,status:statusMap[result],qc_result:result}:i));
      setMsg({t:"success",m:`QC ${result.toUpperCase()} saved`});setView("inventory");loadInventory();
    }catch(e){setMsg({t:"error",m:"Save failed: "+e.message});}
    setSaving(false);
  };

  const setCheck=(idx,f,v)=>setChecks(p=>p.map((c,i)=>i===idx?{...c,[f]:v}:c));
  const secChecks=(s)=>checks.filter(c=>c.section===s);
  const secProg=(s)=>{const it=secChecks(s);return`${it.filter(c=>c.result!=="not_checked").length}/${it.length}`;};
  const secColor=(s)=>{const it=secChecks(s);if(it.some(c=>c.result==="fail"))return"#dc2626";if(it.some(c=>c.result==="flag"))return"#f59e0b";if(it.every(c=>c.result==="pass"||c.result==="na"))return"#16a34a";return"#475569";};

  const filtInv=inv.filter(item=>{const q=invSearch.toLowerCase();const ms=!q||[item.serial_number,item.model_number,item.manufacturer,item.equipment_type,item.catalog_number,item.barcode_sku,item.id].some(f=>f&&String(f).toLowerCase().includes(q));const mst=!invFilterStatus||item.status===invFilterStatus;return ms&&mst;});

  return(
    <div style={{maxWidth:480,margin:"0 auto",padding:16,fontFamily:"-apple-system,system-ui,sans-serif",background:"#f1f5f9",minHeight:"100vh"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,padding:"12px 0",borderBottom:"3px solid #0f172a"}}>
        <div><div style={{fontSize:20,fontWeight:800}}>WES QC</div><div style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>QUALITY CONTROL</div></div>
        <div style={{display:"flex",gap:4}}>
          {[{k:"inventory",l:"\uD83D\uDCE6 Items"},{k:"history",l:"\uD83D\uDCCB History"}].map(t=><button key={t.k} onClick={()=>{setView(t.k);if(t.k==="history")loadHistory();if(t.k==="inventory")loadInventory();}} style={{padding:"8px 12px",borderRadius:8,border:"none",background:view===t.k?"#0f172a":"#e2e8f0",color:view===t.k?"#fff":"#64748b",fontWeight:700,fontSize:11,cursor:"pointer"}}>{t.l}</button>)}
        </div>
      </div>

      {msg&&<div style={{padding:"12px",background:msg.t==="error"?"#fef2f2":"#ecfdf5",border:`1px solid ${msg.t==="error"?"#fecaca":"#a7f3d0"}`,borderRadius:10,color:msg.t==="error"?"#dc2626":"#065f46",fontSize:13,marginBottom:12,display:"flex",justifyContent:"space-between"}}><span>{msg.m}</span><button onClick={()=>setMsg(null)} style={{background:"none",border:"none",fontWeight:700,cursor:"pointer",color:"inherit"}}>&times;</button></div>}

      {/* ════ INVENTORY ════ */}
      {view==="inventory"&&<div>
        <input style={{...inp,marginBottom:8}} value={invSearch} onChange={e=>setInvSearch(e.target.value)} placeholder="Search S/N, model, SKU..."/>
        <div style={{display:"flex",gap:4,marginBottom:10,overflowX:"auto",paddingBottom:4}}>
          {[{v:"",l:"All"},{v:"received",l:"Received"},{v:"in_qc",l:"In QC"},{v:"qc_pass",l:"Passed"},{v:"qc_fail",l:"Failed"},{v:"ready",l:"Ready"},{v:"staged_for_ship",l:"Staged"},{v:"refurb",l:"Refurb"}].map(f=>
            <button key={f.v} onClick={()=>setInvFilterStatus(f.v)} style={{padding:"6px 10px",borderRadius:8,border:`1.5px solid ${invFilterStatus===f.v?(sc[f.v]||"#0f172a"):"#e2e8f0"}`,background:invFilterStatus===f.v?(sc[f.v]||"#0f172a")+"15":"#fff",color:invFilterStatus===f.v?(sc[f.v]||"#0f172a"):"#94a3b8",fontWeight:700,fontSize:10,cursor:"pointer",whiteSpace:"nowrap"}}>{f.l}</button>
          )}
        </div>
        <div style={{fontSize:11,color:"#64748b",marginBottom:8}}>{filtInv.length} items</div>
        {invLoading&&<div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Loading...</div>}
        {!invLoading&&filtInv.length===0&&<div style={{textAlign:"center",padding:40}}><div style={{fontSize:40,marginBottom:8}}>📦</div><div style={{fontSize:14,fontWeight:700,color:"#475569"}}>No items</div></div>}
        {filtInv.map(item=>{const stc=sc[item.status]||"#6b7280";return(
          <div key={item.id} style={{...card,borderLeft:`4px solid ${stc}`,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  <span style={{fontSize:13,fontWeight:800}}>{item.equipment_type||"?"}</span>
                  {item.manufacturer&&<span style={{fontSize:11,color:"#64748b"}}>{item.manufacturer}</span>}
                  <span style={{padding:"2px 8px",borderRadius:6,background:stc+"18",color:stc,fontSize:9,fontWeight:800}}>{sl[item.status]||item.status}</span>
                  {item.qc_sticker&&<span style={{padding:"2px 6px",borderRadius:6,background:"#16a34a18",color:"#16a34a",fontSize:9,fontWeight:700}}>QC: {item.qc_sticker}</span>}
                </div>
                <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{item.serial_number?`S/N: ${item.serial_number}`:""}{item.amperage_rating?` ${item.amperage_rating}A`:""}{item.kva_rating?` ${item.kva_rating}KVA`:""}{item.voltage_rating?` ${item.voltage_rating}V`:""}</div>
                {(item.putaway_location||item.barcode_sku)&&<div style={{display:"flex",gap:4,marginTop:3}}>{item.putaway_location&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"#8b5cf618",color:"#8b5cf6",fontWeight:600}}>📍 {item.putaway_location}</span>}{item.barcode_sku&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"#f59e0b18",color:"#f59e0b",fontWeight:600}}>SKU: {item.barcode_sku}</span>}</div>}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {(item.status==="received"||item.status==="in_qc")&&<button onClick={()=>startInspection(item)} style={{padding:"8px 14px",borderRadius:8,border:"none",background:"#0f172a",color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer"}}>Start QC</button>}
                {item.status==="qc_pass"&&<button onClick={()=>updateInvStatus(item.id,"ready")} style={{padding:"6px 10px",borderRadius:6,border:"1px solid #16a34a",background:"#fff",color:"#16a34a",fontWeight:700,fontSize:10,cursor:"pointer"}}>\u2192 Ready</button>}
                {item.status==="ready"&&<button onClick={()=>updateInvStatus(item.id,"staged_for_ship")} style={{padding:"6px 10px",borderRadius:6,border:"1px solid #0891b2",background:"#fff",color:"#0891b2",fontWeight:700,fontSize:10,cursor:"pointer"}}>\u2192 Stage</button>}
                {item.status==="staged_for_ship"&&<button onClick={()=>updateInvStatus(item.id,"shipped")} style={{padding:"6px 10px",borderRadius:6,border:"1px solid #475569",background:"#fff",color:"#475569",fontWeight:700,fontSize:10,cursor:"pointer"}}>\u2192 Ship</button>}
                {item.status==="qc_fail"&&<button onClick={()=>updateInvStatus(item.id,"refurb")} style={{padding:"6px 10px",borderRadius:6,border:"1px solid #8b5cf6",background:"#fff",color:"#8b5cf6",fontWeight:700,fontSize:10,cursor:"pointer"}}>\u2192 Refurb</button>}
              </div>
            </div>
            {/* Quick status row */}
            {!["received","in_qc"].includes(item.status)&&<div style={{display:"flex",gap:3,marginTop:6,flexWrap:"wrap"}}>
              {STAT.filter(s=>s.v!==item.status&&["received","ready","staged_for_ship","refurb","listed","scrapped"].includes(s.v)).map(s=>
                <button key={s.v} onClick={()=>updateInvStatus(item.id,s.v)} style={{padding:"3px 8px",borderRadius:4,border:`1px solid ${s.c}22`,background:"#fff",color:s.c,fontWeight:600,fontSize:9,cursor:"pointer"}}>{s.l}</button>
              )}
            </div>}
          </div>);})}
        <div style={{textAlign:"center",padding:12}}><button onClick={loadInventory} style={{padding:"10px 24px",borderRadius:8,border:"1px solid #d1d5db",background:"#fff",color:"#475569",fontWeight:600,fontSize:12,cursor:"pointer"}}>Refresh</button></div>
      </div>}

      {/* ════ INSPECTION ════ */}
      {view==="inspect"&&selItem&&<div>
        <div style={{...card,background:"#0f172a",color:"#fff"}}><div style={{fontSize:16,fontWeight:800}}>{selItem.equipment_type}</div><div style={{fontSize:12,color:"#94a3b8"}}>{selItem.manufacturer||""} {selItem.serial_number?`| S/N: ${selItem.serial_number}`:""}</div><div style={{fontSize:11,color:"#64748b",marginTop:4}}>{selItem.amperage_rating?`${selItem.amperage_rating}A `:""}{selItem.kva_rating?`${selItem.kva_rating}KVA `:""}{selItem.voltage_rating?`${selItem.voltage_rating}V `:""}{selItem.phase?`${selItem.phase}PH`:""}</div></div>

        <Section title="Inspector Info" defaultOpen={true} color="#0f172a">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            <div><label style={{fontSize:10,fontWeight:600,color:"#6b7280"}}>Inspector</label><input style={inpSm} value={inspForm.inspectedBy} onChange={e=>setInspForm(p=>({...p,inspectedBy:e.target.value}))} placeholder="Name"/></div>
            <div><label style={{fontSize:10,fontWeight:600,color:"#6b7280"}}>Date</label><input style={inpSm} type="date" value={inspForm.inspectionDate} onChange={e=>setInspForm(p=>({...p,inspectionDate:e.target.value}))}/></div>
          </div>
          <div style={{display:"flex",gap:4}}>{IT.map(t=><button key={t.v} onClick={()=>setInspForm(p=>({...p,inspectionType:t.v}))} style={{flex:1,padding:"8px 0",borderRadius:8,border:`2px solid ${inspForm.inspectionType===t.v?"#0f172a":"#e2e8f0"}`,background:inspForm.inspectionType===t.v?"#0f172a":"#fff",color:inspForm.inspectionType===t.v?"#fff":"#94a3b8",fontWeight:700,fontSize:11,cursor:"pointer"}}>{t.l}</button>)}</div>
        </Section>

        {CL.map(sec=>{const si=secChecks(sec.s);const col=secColor(sec.s);return(
          <Section key={sec.s} title={sec.s} badge={secProg(sec.s)} color={col} count={si.filter(c=>c.result==="fail").length} countColor="#dc2626">
            {si.map((c,ci)=>{const gi=checks.findIndex(ch=>ch.section===c.section&&ch.checkItem===c.checkItem);return(
              <div key={ci} style={{marginBottom:8,padding:10,borderRadius:8,background:c.result==="fail"?"#fef2f215":c.result==="flag"?"#fef3c715":"#fff",border:`1px solid ${c.result==="fail"?"#fecaca":c.result==="flag"?"#fde68a":"#f1f5f9"}`}}>
                <div style={{fontSize:12,fontWeight:600,color:"#1e293b",marginBottom:6}}>{c.checkItem}</div>
                <div style={{display:"flex",gap:4}}>{RO.map(r=><button key={r.v} onClick={()=>setCheck(gi,"result",r.v)} style={{flex:1,padding:"8px 0",borderRadius:6,border:`2px solid ${c.result===r.v?r.c:"#e5e7eb"}`,background:c.result===r.v?r.c+"15":"#fff",color:c.result===r.v?r.c:"#cbd5e1",fontWeight:800,fontSize:12,cursor:"pointer"}}>{r.i} {r.l}</button>)}</div>
                {(c.result==="fail"||c.result==="flag")&&<input style={{...inpSm,marginTop:6,borderColor:c.result==="fail"?"#fecaca":"#fde68a"}} value={c.notes} onChange={e=>setCheck(gi,"notes",e.target.value)} placeholder="Notes..."/>}
              </div>);})}
          </Section>);})}

        <Section title="Megger / Insulation Resistance" badge={Object.values(megger).filter(v=>v&&v!=="1000").length>0?"recorded":""} color="#7c3aed">
          <div style={{marginBottom:6}}><label style={{fontSize:10,fontWeight:600,color:"#6b7280"}}>Test Voltage</label><div style={{display:"flex",gap:4}}>{["500","1000","2500","5000"].map(v=><button key={v} onClick={()=>setMegger(p=>({...p,testV:v}))} style={{flex:1,padding:"8px 0",borderRadius:6,border:`2px solid ${megger.testV===v?"#7c3aed":"#e5e7eb"}`,background:megger.testV===v?"#7c3aed15":"#fff",color:megger.testV===v?"#7c3aed":"#94a3b8",fontWeight:700,fontSize:11,cursor:"pointer"}}>{v}V</button>)}</div></div>
          <div style={{fontSize:10,fontWeight:700,color:"#6b7280",marginTop:8,marginBottom:4}}>Phase-to-Phase (M\u03A9)</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:8}}>
            {[["A-B","aToB"],["B-C","bToC"],["C-A","cToA"]].map(([l,k])=><div key={k}><label style={{fontSize:9,color:"#94a3b8"}}>{l}</label><input style={inpSm} value={megger[k]} onChange={e=>setMegger(p=>({...p,[k]:e.target.value}))} placeholder="M\u03A9"/></div>)}
          </div>
          <div style={{fontSize:10,fontWeight:700,color:"#6b7280",marginBottom:4}}>Phase-to-Ground (M\u03A9)</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
            {[["A-G","aToG"],["B-G","bToG"],["C-G","cToG"]].map(([l,k])=><div key={k}><label style={{fontSize:9,color:"#94a3b8"}}>{l}</label><input style={inpSm} value={megger[k]} onChange={e=>setMegger(p=>({...p,[k]:e.target.value}))} placeholder="M\u03A9"/></div>)}
          </div>
        </Section>

        <Section title="Torque Verification" badge={torque.length>0?`${torque.filter(t=>t.actual).length}/${torque.length}`:""} color="#0369a1">
          {torque.length===0&&<div style={{fontSize:12,color:"#94a3b8",textAlign:"center",padding:8}}>No torque specs for this equipment.</div>}
          {torque.map((t,ti)=><div key={ti} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:6,marginBottom:6,alignItems:"end"}}><div><div style={{fontSize:10,fontWeight:600,color:"#475569"}}>{t.loc||"Custom"}</div><div style={{fontSize:9,color:"#94a3b8"}}>{t.boltSize?`${t.boltSize} `:""}{t.spec}{t.specHigh?`-${t.specHigh}`:""} ft-lbs</div></div><div><input style={{...inpSm,padding:"8px"}} value={t.actual} onChange={e=>{const v=[...torque];v[ti].actual=e.target.value;v[ti].pass=parseFloat(e.target.value)>=parseFloat(t.spec)&&(!t.specHigh||parseFloat(e.target.value)<=parseFloat(t.specHigh));setTorque(v);}} placeholder="Actual"/></div><div style={{textAlign:"center"}}>{t.actual&&<span style={{fontSize:18,color:t.pass?"#16a34a":"#dc2626"}}>{t.pass?"\u2713":"\u2717"}</span>}</div></div>)}
          <button onClick={()=>setTorque(p=>[...p,{loc:"",boltSize:"",spec:"",specHigh:"",actual:"",pass:null}])} style={{padding:"6px 12px",borderRadius:6,border:"1px dashed #94a3b8",background:"#fff",color:"#64748b",fontWeight:600,fontSize:10,cursor:"pointer",width:"100%"}}>+ Add Point</button>
        </Section>

        <Section title="Deficiencies" badge={deficiencies.length||""} color="#dc2626">
          {deficiencies.map((d,di)=><div key={di} style={{padding:10,borderRadius:8,border:"1px solid #fecaca",marginBottom:6,background:"#fef2f2"}}><div style={{display:"flex",gap:6,marginBottom:6}}><select style={{...inpSm,flex:1,padding:"8px"}} value={d.category} onChange={e=>{const v=[...deficiencies];v[di].category=e.target.value;setDeficiencies(v);}}><option value="">Category</option>{["Cosmetic","Structural","Electrical","Mechanical","Safety","Missing Part","Other"].map(c=><option key={c}>{c}</option>)}</select><select style={{...inpSm,flex:1,padding:"8px"}} value={d.severity} onChange={e=>{const v=[...deficiencies];v[di].severity=e.target.value;setDeficiencies(v);}}>{["minor","moderate","major","critical"].map(s=><option key={s}>{s}</option>)}</select><button onClick={()=>setDeficiencies(p=>p.filter((_,i)=>i!==di))} style={{background:"none",border:"none",color:"#ef4444",fontSize:18,cursor:"pointer"}}>&times;</button></div><input style={{...inpSm,marginBottom:4}} value={d.description} onChange={e=>{const v=[...deficiencies];v[di].description=e.target.value;setDeficiencies(v);}} placeholder="Describe..."/><div style={{display:"flex",gap:8,alignItems:"center"}}><label style={{fontSize:10,display:"flex",alignItems:"center",gap:4}}><input type="checkbox" checked={d.repairNeeded} onChange={e=>{const v=[...deficiencies];v[di].repairNeeded=e.target.checked;setDeficiencies(v);}}/> Repair</label>{d.repairNeeded&&<input style={{...inpSm,width:80,padding:"6px"}} type="number" value={d.repairEstimate||""} onChange={e=>{const v=[...deficiencies];v[di].repairEstimate=e.target.value;setDeficiencies(v);}} placeholder="$"/>}</div></div>)}
          <button onClick={()=>setDeficiencies(p=>[...p,{category:"",description:"",severity:"moderate",repairNeeded:false,repairEstimate:""}])} style={{padding:"8px",borderRadius:6,border:"1px dashed #dc2626",background:"#fff",color:"#dc2626",fontWeight:600,fontSize:11,cursor:"pointer",width:"100%"}}>+ Deficiency</button>
        </Section>

        <Section title="Photos" badge={photos.length||""} color="#475569">
          {photos.length>0&&<div style={{display:"flex",gap:6,marginBottom:8,overflowX:"auto",paddingBottom:4}}>{photos.map((p,pi)=><img key={pi} src={p} alt="" style={{width:70,height:70,borderRadius:8,objectFit:"cover",border:"2px solid #e5e7eb",flexShrink:0}}/>)}</div>}
          <label style={{display:"block",padding:"12px",borderRadius:8,border:"1px dashed #94a3b8",background:"#fff",color:"#64748b",fontWeight:600,fontSize:12,textAlign:"center",cursor:"pointer"}}>📸 Add Photo<input type="file" accept="image/*" capture="environment" onChange={e=>addPhoto(e.target.files?.[0])} style={{display:"none"}}/></label>
        </Section>

        <Section title="Notes & Sticker" defaultOpen={true} color="#475569">
          <textarea style={{...inpSm,minHeight:60,resize:"vertical",marginBottom:8}} value={inspForm.notes} onChange={e=>setInspForm(p=>({...p,notes:e.target.value}))} placeholder="Notes..."/>
          <div><label style={{fontSize:10,fontWeight:600,color:"#6b7280"}}>QC Sticker #</label><input style={inpSm} value={stickerNum} onChange={e=>setStickerNum(e.target.value)} placeholder="WES-QC-0001"/></div>
        </Section>

        <div style={{...card,background:"#f8fafc",border:"2px solid #e2e8f0"}}>
          <div style={{fontSize:13,fontWeight:800,marginBottom:8}}>Summary</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:12}}>
            {[{l:"Pass",c:"#16a34a",n:checks.filter(c=>c.result==="pass").length},{l:"Fail",c:"#dc2626",n:checks.filter(c=>c.result==="fail").length},{l:"Flag",c:"#f59e0b",n:checks.filter(c=>c.result==="flag").length},{l:"N/A",c:"#94a3b8",n:checks.filter(c=>c.result==="na").length}].map(r=><div key={r.l} style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:r.c}}>{r.n}</div><div style={{fontSize:10,color:"#64748b"}}>{r.l}</div></div>)}
          </div>
          {deficiencies.length>0&&<div style={{fontSize:11,color:"#dc2626",marginBottom:8,fontWeight:600}}>{deficiencies.length} deficiencies</div>}
          <div style={{display:"flex",gap:6}}>
            <button disabled={saving} onClick={()=>saveInspection("pass")} style={{flex:1,padding:"14px 0",borderRadius:10,border:"none",background:"#16a34a",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",opacity:saving?0.6:1}}>{"\u2713"} PASS</button>
            <button disabled={saving} onClick={()=>saveInspection("conditional")} style={{flex:1,padding:"14px 0",borderRadius:10,border:"none",background:"#f59e0b",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",opacity:saving?0.6:1}}>{"\u26a0"} COND</button>
            <button disabled={saving} onClick={()=>saveInspection("fail")} style={{flex:1,padding:"14px 0",borderRadius:10,border:"none",background:"#dc2626",color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",opacity:saving?0.6:1}}>{"\u2717"} FAIL</button>
          </div>
          <button onClick={()=>{setView("inventory");updateInvStatus(selItem.id,"received");}} style={{width:"100%",marginTop:8,padding:"10px 0",borderRadius:8,border:"1px solid #d1d5db",background:"#fff",color:"#64748b",fontWeight:600,fontSize:12,cursor:"pointer"}}>Cancel</button>
        </div>
      </div>}

      {/* ════ HISTORY ════ */}
      {view==="history"&&<div>
        <div style={{fontSize:14,fontWeight:800,marginBottom:12}}>Inspection History</div>
        {histLoading&&<div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Loading...</div>}
        {!histLoading&&history.length===0&&<div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>No inspections yet.</div>}
        {history.map(h=>{const rc2=h.overall_result==="pass"?"#16a34a":h.overall_result==="fail"?"#dc2626":"#f59e0b";return(
          <div key={h.id} style={{...card,borderLeft:`4px solid ${rc2}`,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:13,fontWeight:800}}>{h.equipment_type} {h.manufacturer||""}</div><div style={{fontSize:11,color:"#64748b"}}>{h.serial_number?`S/N: ${h.serial_number}`:""} {h.amperage_rating?`${h.amperage_rating}A`:""}</div></div><span style={{padding:"4px 12px",borderRadius:8,background:rc2+"18",color:rc2,fontWeight:800,fontSize:12}}>{(h.overall_result||"").toUpperCase()}</span></div>
            <div style={{fontSize:10,color:"#94a3b8",marginTop:4}}>{h.inspection_date} | {h.inspected_by} | {h.inspection_type}{h.sticker_number?` | Sticker: ${h.sticker_number}`:""}</div>
            {h.notes&&<div style={{fontSize:11,color:"#475569",marginTop:4,fontStyle:"italic"}}>{h.notes}</div>}
          </div>);})}
        <div style={{textAlign:"center",padding:12}}><button onClick={loadHistory} style={{padding:"10px 24px",borderRadius:8,border:"1px solid #d1d5db",background:"#fff",color:"#475569",fontWeight:600,fontSize:12,cursor:"pointer"}}>Refresh</button></div>
      </div>}
    </div>
  );
}
