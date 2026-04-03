"use client";
import { useState, useEffect, useCallback, useRef } from "react";

/* ── Supabase ──────────────────────────────────────────── */
const SB = "https://ulyycjtrshpsjpvbztkr.supabase.co";
const SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVseXljanRyc2hwc2pwdmJ6dGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMzg1NzAsImV4cCI6MjA5MDcxNDU3MH0.UYwCdYrdy20xl_hCkO8t4CAB16vBHj-oMdflDv1XlVE";
const H = { apikey:SK, Authorization:`Bearer ${SK}`, "Content-Type":"application/json", Prefer:"return=representation" };
let local = false;
async function db(p, o={}) { const r = await fetch(`${SB}/rest/v1/${p}`, { ...o, headers:{...H,...(o.headers||{})} }); if (!r.ok) throw new Error(`${r.status}`); const t = await r.text(); return t ? JSON.parse(t) : null; }
async function sG(k) { try { if (typeof window!=="undefined"&&window.storage){const r=await window.storage.get(k);return r?JSON.parse(r.value):null;}} catch{} return null; }
async function sS(k,v) { try { if (typeof window!=="undefined"&&window.storage) await window.storage.set(k,JSON.stringify(v)); } catch{} }

/* ── Constants ─────────────────────────────────────────── */
const EQ=["Switchgear","Panelboard","Transformer","Circuit Breaker","Motor Control Center (MCC)","Bus Duct","Disconnect Switch","UPS System","PDU","RPP (Remote Power Panel)","ATS / Transfer Switch","Other"];
const MFR=["Eaton / Cutler-Hammer","Siemens","Square D / Schneider","ABB","GE","Westinghouse","ITE","Federal Pacific","Liebert / Vertiv","APC / Schneider","Other"];
const IT=[{v:"incoming",l:"Incoming"},{v:"pre_refurb",l:"Pre-Refurb"},{v:"post_refurb",l:"Post-Refurb"},{v:"outgoing",l:"Outgoing"}];
const RO=[{v:"pass",l:"PASS",c:"#16a34a",i:"\u2713"},{v:"fail",l:"FAIL",c:"#dc2626",i:"\u2717"},{v:"na",l:"N/A",c:"#94a3b8",i:"\u2014"},{v:"flag",l:"FLAG",c:"#f59e0b",i:"\u26a0"}];
const OR=[{v:"pending",c:"#6b7280"},{v:"pass",c:"#16a34a"},{v:"fail",c:"#dc2626"},{v:"conditional",c:"#f59e0b"}];
const rc={}; OR.forEach(r=>rc[r.v]=r.c);

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

/* ── Styles (mobile-first, 16px inputs prevent iOS zoom) ── */
const inp={width:"100%",padding:"12px 14px",border:"1.5px solid #d1d5db",borderRadius:10,fontSize:16,background:"#fff",color:"#111",boxSizing:"border-box",outline:"none",fontFamily:"inherit",WebkitAppearance:"none"};
const inpE={...inp,borderColor:"#ef4444"};
const inpSm={...inp,fontSize:14,padding:"10px 12px"};
const lbl={display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:4};
const card={background:"#fff",borderRadius:14,padding:16,marginBottom:12,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"};
const err={fontSize:12,color:"#ef4444",marginTop:3};

/* ── Component ─────────────────────────────────────────── */
export default function QCChecklist() {
  const [view,setView]=useState("form");
  const [insp,setInsp]=useState([]);
  const [ld,setLd]=useState(false);
  const [sv,setSv]=useState(false);
  const [scan,setScan]=useState(false);
  const [scanImg,setScanImg]=useState(null);
  const [msg,setMsg]=useState(null);
  const [expId,setExpId]=useState(null);
  const [filt,setFilt]=useState("all");
  const [openSec,setOpenSec]=useState({});
  const [showSticker,setShowSticker]=useState(null);
  const fileRef=useRef(null);

  const toggle=(s)=>setOpenSec(p=>({...p,[s]:!p[s]}));

  const [form,setForm]=useState({
    equipmentType:"",manufacturer:"",modelNumber:"",serialNumber:"",
    voltageRating:"",amperageRating:"",jobSite:"",customerName:"",
    sourceLocation:"",inspectedBy:"",inspectionDate:today(),
    inspectionType:"incoming",notes:"",
  });

  const [checks,setChecks]=useState(()=>
    CL.flatMap((sec,si)=>sec.items.map((item,ii)=>({
      section:sec.s,checkItem:item,result:"not_checked",notes:"",sort:si*100+ii,
    })))
  );

  const [torque,setTorque]=useState([]);
  const [torqueSpecs,setTorqueSpecs]=useState([]);
  const [megger,setMegger]=useState({aToB:"",bToC:"",cToA:"",aToG:"",bToG:"",cToG:"",testV:"1000"});
  const [errs,setErrs]=useState({});

  /* ── Load torque specs from Supabase ── */
  const loadTorqueSpecs=useCallback(async(mfr,eqType)=>{
    try {
      if (local) return;
      let q="torque_specs?select=*&order=connection_point";
      const filters=[];
      if (mfr) filters.push(`or=(manufacturer.eq.${encodeURIComponent(mfr)},manufacturer.is.null)`);
      else filters.push("manufacturer=is.null");
      if (eqType) {
        const simpleType=EQ.find(e=>e===eqType)?.split(" ")[0]||"";
        filters.push(`or=(equipment_type.ilike.%25${encodeURIComponent(simpleType)}%25,equipment_type.is.null)`);
      }
      const data=await db(`torque_specs?select=*&order=connection_point`);
      if (data) {
        // Filter in JS for flexibility
        const filtered=data.filter(s=>{
          const mfrMatch=!s.manufacturer||s.manufacturer===mfr;
          const eqMatch=!s.equipment_type||eqType?.toLowerCase().includes(s.equipment_type?.toLowerCase());
          return mfrMatch&&eqMatch;
        });
        // Prefer manufacturer-specific over generic
        const byPoint={};
        filtered.forEach(s=>{
          const k=s.connection_point;
          if (!byPoint[k]||s.manufacturer) byPoint[k]=s;
        });
        setTorqueSpecs(Object.values(byPoint));
        setTorque(Object.values(byPoint).map(s=>({
          loc:s.connection_point,
          boltSize:s.bolt_size||"",
          spec:String(s.spec_ft_lbs),
          specHigh:s.spec_range_high?String(s.spec_range_high):"",
          actual:"",
          pass:null,
          source:s.source||"",
          notes:s.notes||"",
        })));
      }
    } catch { /* use defaults */ }
  },[]);

  useEffect(()=>{
    if (form.manufacturer||form.equipmentType) loadTorqueSpecs(form.manufacturer,form.equipmentType);
    else setTorque([{loc:"",boltSize:"",spec:"",specHigh:"",actual:"",pass:null,source:"",notes:""}]);
  },[form.manufacturer,form.equipmentType,loadTorqueSpecs]);

  /* ── OCR ── */
  const handleScan=async(file)=>{
    if (!file) return; setScan(true); setMsg(null);
    try {
      const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=()=>rej();r.readAsDataURL(file);});
      setScanImg(`data:${file.type};base64,${b64}`);
      const resp=await fetch(`${SB}/functions/v1/scan-nameplate`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({image_base64:b64,media_type:file.type})});
      if (!resp.ok) throw new Error(`Scan returned ${resp.status}`);
      const p=await resp.json();
      if (p.error) throw new Error(p.error);
      setForm(prev=>({...prev,
        serialNumber:p.serial_number||prev.serialNumber,
        modelNumber:p.model_number||prev.modelNumber,
        voltageRating:p.voltage_rating||prev.voltageRating,
        amperageRating:p.amperage_rating||prev.amperageRating,
        manufacturer:MFR.find(m=>p.manufacturer&&m.toLowerCase().includes(p.manufacturer.toLowerCase().split("/")[0].trim()))||prev.manufacturer,
        equipmentType:EQ.find(t=>p.equipment_type&&t.toLowerCase().includes(p.equipment_type.toLowerCase()))||prev.equipmentType,
      }));
      setMsg({t:"success",m:"Nameplate scanned successfully"});
    } catch(e) { setMsg({t:"error",m:"Scan failed: "+e.message+". Enter manually."}); }
    finally { setScan(false); }
  };

  /* ── Load inspections ── */
  const loadInsp=useCallback(async()=>{
    setLd(true);
    try {
      if (!local) { const d=await db("qc_inspections?select=*,qc_checklist_items(*)&order=created_at.desc"); if(d){setInsp(d.map(r=>({...r,checks:(r.qc_checklist_items||[]).sort((a,b)=>a.sort_order-b.sort_order)}))); setLd(false); return;} }
    } catch { local=true; }
    setInsp(await sG("wes_qc")||[]);
    setLd(false);
  },[]);

  useEffect(()=>{loadInsp();},[loadInsp]);

  /* ── Helpers ── */
  const uf=(k,v)=>{setForm(p=>({...p,[k]:v}));if(errs[k])setErrs(p=>({...p,[k]:undefined}));};
  const uc=(i,f,v)=>setChecks(p=>p.map((c,j)=>j===i?{...c,[f]:v}:c));
  const allSec=(s,r)=>setChecks(p=>p.map(c=>c.section===s?{...c,result:r}:c));

  const uTorque=(i,f,v)=>{
    setTorque(p=>{
      const u=p.map((t,j)=>j===i?{...t,[f]:v}:t);
      if (f==="actual") {
        const row=u[i]; const spec=parseFloat(row.spec); const hi=parseFloat(row.specHigh)||spec*1.1;
        const act=parseFloat(v);
        if (!isNaN(spec)&&!isNaN(act)&&spec>0) u[i]={...u[i],pass:act>=spec*0.9&&act<=hi};
        else u[i]={...u[i],pass:null};
      }
      return u;
    });
  };

  const addTorque=()=>setTorque(p=>[...p,{loc:"",boltSize:"",spec:"",specHigh:"",actual:"",pass:null,source:"",notes:""}]);
  const rmTorque=(i)=>setTorque(p=>p.length>1?p.filter((_,j)=>j!==i):p);

  const validate=()=>{
    const e={};
    if(!form.equipmentType)e.equipmentType="Required";
    if(!form.serialNumber.trim())e.serialNumber="Required";
    if(!form.inspectedBy.trim())e.inspectedBy="Required";
    setErrs(e); return Object.keys(e).length===0;
  };

  const computeRes=(cl,tq)=>{
    const r=cl.map(c=>c.result);
    const tf=(tq||[]).some(t=>t.pass===false);
    if(r.some(x=>x==="fail")||tf) return "fail";
    if(r.some(x=>x==="flag")) return "conditional";
    if(r.every(x=>x==="pass"||x==="na")) return "pass";
    return "pending";
  };

  /* ── Submit ── */
  const handleSubmit=async()=>{
    if(!validate()) return;
    setSv(true); setMsg(null);
    const id=`QC-${Date.now().toString(36).toUpperCase()}`;
    const res=computeRes(checks,torque);
    const row={id,equipment_type:form.equipmentType,manufacturer:form.manufacturer||null,model_number:form.modelNumber||null,serial_number:form.serialNumber,voltage_rating:form.voltageRating||null,amperage_rating:form.amperageRating||null,job_site:form.jobSite||null,customer_name:form.customerName||null,source_location:form.sourceLocation||null,inspected_by:form.inspectedBy,inspection_date:form.inspectionDate,inspection_type:form.inspectionType,overall_result:res,notes:form.notes||null,sticker_number:null,sticker_signed_by:null,sticker_date:null};
    const items=[
      ...checks.map((c,i)=>({inspection_id:id,section:c.section,check_item:c.checkItem,result:c.result,notes:c.notes||null,sort_order:i})),
      ...torque.filter(t=>t.loc).map((t,i)=>({inspection_id:id,section:"Torque Readings",check_item:`${t.loc}${t.boltSize?` (${t.boltSize})`:""}`,result:t.pass===true?"pass":t.pass===false?"fail":"not_checked",notes:`Spec: ${t.spec||"?"}${t.specHigh?`-${t.specHigh}`:""} ft-lbs | Actual: ${t.actual||"?"} ft-lbs`,sort_order:9000+i})),
      ...(megger.aToG||megger.bToG||megger.cToG?[{inspection_id:id,section:"Megger Readings",check_item:`Test voltage: ${megger.testV}V`,result:"pass",notes:`A-B:${megger.aToB||"?"} B-C:${megger.bToC||"?"} C-A:${megger.cToA||"?"} A-G:${megger.aToG||"?"} B-G:${megger.bToG||"?"} C-G:${megger.cToG||"?"} M\u03a9`,sort_order:9100}]:[]),
    ];
    try {
      let ok=false;
      if(!local){try{await db("qc_inspections",{method:"POST",body:JSON.stringify(row)});await db("qc_checklist_items",{method:"POST",body:JSON.stringify(items)});ok=true;}catch{local=true;}}
      const li={...row,checks:items,created_at:new Date().toISOString()};
      if(!ok){const u=[li,...insp];setInsp(u);await sS("wes_qc",u);}else{await loadInsp();}
      setChecks(p=>p.map(c=>({...c,result:"not_checked",notes:""})));
      setTorque([{loc:"",boltSize:"",spec:"",specHigh:"",actual:"",pass:null,source:"",notes:""}]);
      setMegger({aToB:"",bToC:"",cToA:"",aToG:"",bToG:"",cToG:"",testV:"1000"});
      setForm(p=>({...p,serialNumber:"",modelNumber:"",notes:"",voltageRating:"",amperageRating:""}));
      setScanImg(null); setView("done");
    } catch(e){setMsg({t:"error",m:"Submit failed: "+e.message});}
    finally{setSv(false);}
  };

  /* ── Patch ── */
  const patch=async(id,u)=>{
    const ul=insp.map(r=>r.id===id?{...r,...u}:r); setInsp(ul);
    if(!local){try{const d={};for(const[k,v]of Object.entries(u))d[k.replace(/[A-Z]/g,m=>"_"+m.toLowerCase())]=v===""?null:v;await db(`qc_inspections?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify(d)});return;}catch{local=true;}}
    await sS("wes_qc",ul);
  };

  /* ── QC Pass Sticker ── */
  const issueSticker=(inspection)=>{
    const stickerNum=`WES-${inspection.serial_number?.replace(/[^A-Z0-9]/gi,"").slice(0,8)}-${today().replace(/-/g,"")}`;
    patch(inspection.id,{sticker_number:stickerNum,sticker_signed_by:inspection.inspected_by,sticker_date:today()});
    setShowSticker({...inspection,sticker_number:stickerNum,sticker_signed_by:inspection.inspected_by,sticker_date:today()});
  };

  /* ── Export ── */
  const esc=(v)=>{const s=String(v??"");return s.includes(",")||s.includes('"')?`"${s.replace(/"/g,'""')}"`:s;};
  const exportCSV=()=>{
    const fi=filtI; if(!fi.length)return alert("Nothing to export.");
    const h=["QC ID","Date","Inspector","Type","Equipment","Mfr","Model","S/N","Voltage","Amps","Customer","Site","Result","Sticker #","Section","Item","Result","Notes"];
    const l=[h.map(esc).join(",")];
    fi.forEach(i=>{(i.checks||i.qc_checklist_items||[]).forEach(c=>{l.push([esc(i.id),esc(i.inspection_date),esc(i.inspected_by),esc(i.inspection_type),esc(i.equipment_type),esc(i.manufacturer),esc(i.model_number),esc(i.serial_number),esc(i.voltage_rating),esc(i.amperage_rating),esc(i.customer_name),esc(i.job_site),esc(i.overall_result),esc(i.sticker_number),esc(c.section),esc(c.check_item||c.checkItem),esc(c.result),esc(c.notes)].join(","));});});
    const b=new Blob([l.join("\n")],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`WES_QC_${today()}.csv`;a.click();
  };

  const filtI=filt==="all"?insp:insp.filter(r=>r.overall_result===filt);
  const byS={}; checks.forEach((c,i)=>{if(!byS[c.section])byS[c.section]=[];byS[c.section].push({...c,idx:i});});
  const total=checks.length, done=checks.filter(c=>c.result!=="not_checked").length;
  const fails=checks.filter(c=>c.result==="fail").length+torque.filter(t=>t.pass===false).length;
  const flags=checks.filter(c=>c.result==="flag").length;

  return (
    <div style={{fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro",sans-serif',maxWidth:480,margin:"0 auto",padding:"12px 16px",color:"#0f172a",minHeight:"100vh",background:"#f1f5f9"}}>

      {/* ── Header ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,padding:"12px 0",borderBottom:"3px solid #0f172a"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,letterSpacing:-0.5}}>QC Inspection</div>
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>WORLDWIDE ELECTRICAL SERVICES</div>
        </div>
        <div style={{display:"flex",gap:4}}>
          {["form","history"].map(t=>(
            <button key={t} onClick={()=>setView(t)} style={{padding:"8px 14px",borderRadius:8,border:"none",background:view===t||(t==="form"&&view==="done")?"#0f172a":"#e2e8f0",color:view===t||(t==="form"&&view==="done")?"#fff":"#64748b",fontWeight:700,fontSize:12,cursor:"pointer"}}>
              {t==="form"?"New":insp.length}
            </button>
          ))}
        </div>
      </div>

      {msg&&(<div style={{padding:"12px 16px",background:msg.t==="error"?"#fef2f2":"#ecfdf5",border:`1px solid ${msg.t==="error"?"#fecaca":"#a7f3d0"}`,borderRadius:10,color:msg.t==="error"?"#dc2626":"#065f46",fontSize:14,marginBottom:12,display:"flex",justifyContent:"space-between"}}>
        <span>{msg.m}</span>
        <button onClick={()=>setMsg(null)} style={{background:"none",border:"none",fontWeight:700,cursor:"pointer",color:"inherit"}}>&times;</button>
      </div>)}

      {/* ════ FORM ════ */}
      {view==="form"&&(
        <div>
          {/* Scanner */}
          <div style={{...card,textAlign:"center",border:"2px dashed #cbd5e1",background:"#f8fafc"}}>
            <div style={{fontSize:15,fontWeight:800,marginBottom:6}}>{scan?"Scanning...":"\uD83D\uDCF7 Scan Nameplate"}</div>
            <div style={{fontSize:13,color:"#6b7280",marginBottom:12}}>Auto-fills serial, model, manufacturer, voltage, amps</div>
            <label style={{display:"inline-block",padding:"14px 28px",borderRadius:10,background:scan?"#94a3b8":"#2563eb",color:"#fff",fontWeight:700,fontSize:15,cursor:scan?"not-allowed":"pointer"}}>
              {scan?"Processing...":"Take Photo"}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={e=>handleScan(e.target.files?.[0])} style={{display:"none"}} disabled={scan}/>
            </label>
            {scanImg&&<div style={{marginTop:12}}><img src={scanImg} alt="Nameplate" style={{maxHeight:100,borderRadius:8,border:"1px solid #e5e7eb"}}/></div>}
          </div>

          {/* Equipment */}
          <div style={card}>
            <div style={{fontSize:15,fontWeight:800,marginBottom:12}}>Equipment</div>
            <div style={{marginBottom:10}}><label style={lbl}>Type *</label><select style={errs.equipmentType?inpE:inp} value={form.equipmentType} onChange={e=>uf("equipmentType",e.target.value)}><option value="">Select</option>{EQ.map(t=><option key={t}>{t}</option>)}</select>{errs.equipmentType&&<div style={err}>{errs.equipmentType}</div>}</div>
            <div style={{marginBottom:10}}><label style={lbl}>Manufacturer</label><select style={inp} value={form.manufacturer} onChange={e=>uf("manufacturer",e.target.value)}><option value="">Select</option>{MFR.map(m=><option key={m}>{m}</option>)}</select></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div><label style={lbl}>Serial # *</label><input style={errs.serialNumber?inpE:inp} value={form.serialNumber} onChange={e=>uf("serialNumber",e.target.value)} placeholder="Serial"/>{errs.serialNumber&&<div style={err}>{errs.serialNumber}</div>}</div>
              <div><label style={lbl}>Model #</label><input style={inp} value={form.modelNumber} onChange={e=>uf("modelNumber",e.target.value)} placeholder="Model"/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div><label style={lbl}>Voltage</label><input style={inp} value={form.voltageRating} onChange={e=>uf("voltageRating",e.target.value)} placeholder="480V"/></div>
              <div><label style={lbl}>Amperage</label><input style={inp} value={form.amperageRating} onChange={e=>uf("amperageRating",e.target.value)} placeholder="1200A"/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lbl}>Customer</label><input style={inp} value={form.customerName} onChange={e=>uf("customerName",e.target.value)} placeholder="Customer"/></div>
              <div><label style={lbl}>Job Site</label><input style={inp} value={form.jobSite} onChange={e=>uf("jobSite",e.target.value)} placeholder="Site"/></div>
            </div>
          </div>

          {/* Inspector */}
          <div style={card}>
            <div style={{fontSize:15,fontWeight:800,marginBottom:12}}>Inspector</div>
            <div style={{marginBottom:10}}><label style={lbl}>Inspected By *</label><input style={errs.inspectedBy?inpE:inp} value={form.inspectedBy} onChange={e=>uf("inspectedBy",e.target.value)} placeholder="Your name"/>{errs.inspectedBy&&<div style={err}>{errs.inspectedBy}</div>}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lbl}>Date</label><input style={inp} type="date" value={form.inspectionDate} onChange={e=>uf("inspectionDate",e.target.value)}/></div>
              <div><label style={lbl}>Type</label><select style={inp} value={form.inspectionType} onChange={e=>uf("inspectionType",e.target.value)}>{IT.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}</select></div>
            </div>
          </div>

          {/* Progress */}
          <div style={{...card,padding:12}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:700,marginBottom:6}}>
              <span>{done}/{total} checked</span>
              <span>{fails>0&&<span style={{color:"#dc2626"}}>{fails} fail </span>}{flags>0&&<span style={{color:"#f59e0b"}}>{flags} flag</span>}</span>
            </div>
            <div style={{height:8,background:"#e5e7eb",borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${total>0?(done/total)*100:0}%`,background:fails>0?"#dc2626":flags>0?"#f59e0b":"#16a34a",borderRadius:4,transition:"width 0.3s"}}/>
            </div>
          </div>

          {/* Checklist Sections (collapsible) */}
          {CL.map(sec=>{
            const items=byS[sec.s]||[];
            const open=openSec[sec.s]!==false;
            const sf=items.filter(c=>c.result==="fail").length;
            const sp=items.filter(c=>c.result==="pass").length;
            return (
              <div key={sec.s} style={{...card,padding:0,overflow:"hidden"}}>
                <button onClick={()=>toggle(sec.s)} style={{width:"100%",padding:"14px 16px",border:"none",background:sf>0?"#fef2f2":"#f8fafc",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",textAlign:"left"}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>{sec.s}</div>
                    <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{sp}/{items.length} pass{sf>0?` \u2022 ${sf} fail`:""}</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontSize:18,color:"#94a3b8"}}>{open?"\u25B2":"\u25BC"}</span>
                  </div>
                </button>
                {open&&(
                  <div>
                    <div style={{display:"flex",gap:6,padding:"8px 16px",borderBottom:"1px solid #f1f5f9"}}>
                      <button onClick={()=>allSec(sec.s,"pass")} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid #d1d5db",background:"#fff",color:"#16a34a",fontWeight:700,fontSize:12,cursor:"pointer"}}>All Pass</button>
                      <button onClick={()=>allSec(sec.s,"na")} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid #d1d5db",background:"#fff",color:"#94a3b8",fontWeight:700,fontSize:12,cursor:"pointer"}}>All N/A</button>
                    </div>
                    {items.map(c=>(
                      <div key={c.idx} style={{padding:"12px 16px",borderBottom:"1px solid #f1f5f9"}}>
                        <div style={{fontSize:14,color:"#334155",marginBottom:8,lineHeight:1.4}}>{c.checkItem}</div>
                        <div style={{display:"flex",gap:6,marginBottom:6}}>
                          {RO.map(r=>(
                            <button key={r.v} onClick={()=>uc(c.idx,"result",r.v)}
                              style={{flex:1,padding:"10px 0",borderRadius:8,border:`2px solid ${c.result===r.v?r.c:"#e2e8f0"}`,background:c.result===r.v?r.c+"15":"#fff",color:c.result===r.v?r.c:"#cbd5e1",fontWeight:800,fontSize:12,cursor:"pointer",textAlign:"center"}}>
                              {r.i} {r.l}
                            </button>
                          ))}
                        </div>
                        <input style={inpSm} placeholder="Notes..." value={c.notes} onChange={e=>uc(c.idx,"notes",e.target.value)}/>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Torque Readings */}
          <div style={{...card,padding:0,overflow:"hidden"}}>
            <button onClick={()=>toggle("torque")} style={{width:"100%",padding:"14px 16px",border:"none",background:"#fefce8",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
              <div><div style={{fontSize:14,fontWeight:800}}>Torque Readings</div><div style={{fontSize:11,color:"#92400e"}}>Spec auto-loaded from {form.manufacturer||"database"}</div></div>
              <span style={{fontSize:18,color:"#94a3b8"}}>{openSec.torque!==false?"\u25B2":"\u25BC"}</span>
            </button>
            {openSec.torque!==false&&(
              <div style={{padding:16}}>
                {torque.map((t,i)=>(
                  <div key={i} style={{background:"#fafaf9",borderRadius:10,padding:12,marginBottom:8,border:`1.5px solid ${t.pass===false?"#fecaca":t.pass===true?"#bbf7d0":"#e5e7eb"}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#475569"}}>POINT {i+1}</span>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        {t.pass===true&&<span style={{color:"#16a34a",fontWeight:800}}>{"\u2713"} PASS</span>}
                        {t.pass===false&&<span style={{color:"#dc2626",fontWeight:800}}>{"\u2717"} FAIL</span>}
                        {torque.length>1&&<button onClick={()=>rmTorque(i)} style={{background:"none",border:"none",color:"#ef4444",fontSize:18,cursor:"pointer"}}>&times;</button>}
                      </div>
                    </div>
                    <div style={{marginBottom:8}}><input style={inpSm} value={t.loc} onChange={e=>uTorque(i,"loc",e.target.value)} placeholder="Connection point"/></div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                      <div><label style={{fontSize:11,fontWeight:600,color:"#6b7280"}}>Bolt</label><input style={inpSm} value={t.boltSize} onChange={e=>uTorque(i,"boltSize",e.target.value)} placeholder="3/8-16"/></div>
                      <div><label style={{fontSize:11,fontWeight:600,color:"#6b7280"}}>Spec ft-lbs</label><input style={inpSm} type="number" value={t.spec} onChange={e=>uTorque(i,"spec",e.target.value)} placeholder="Spec"/></div>
                      <div><label style={{fontSize:11,fontWeight:600,color:t.pass===false?"#dc2626":"#6b7280"}}>Actual ft-lbs</label><input style={{...inpSm,borderColor:t.pass===false?"#dc2626":t.pass===true?"#16a34a":"#d1d5db"}} type="number" value={t.actual} onChange={e=>uTorque(i,"actual",e.target.value)} placeholder="Actual"/></div>
                    </div>
                    {t.source&&<div style={{fontSize:10,color:"#94a3b8",marginTop:4}}>Source: {t.source}{t.notes?` | ${t.notes}`:""}</div>}
                  </div>
                ))}
                <button onClick={addTorque} style={{width:"100%",padding:12,borderRadius:10,border:"2px dashed #d1d5db",background:"#fff",color:"#2563eb",fontWeight:700,fontSize:14,cursor:"pointer"}}>+ Add Torque Point</button>
              </div>
            )}
          </div>

          {/* Megger */}
          <div style={{...card,padding:0,overflow:"hidden"}}>
            <button onClick={()=>toggle("megger")} style={{width:"100%",padding:"14px 16px",border:"none",background:"#eff6ff",display:"flex",justifyContent:"space-between",cursor:"pointer"}}>
              <div><div style={{fontSize:14,fontWeight:800}}>Megger Readings (M\u03a9)</div></div>
              <span style={{fontSize:18,color:"#94a3b8"}}>{openSec.megger!==false?"\u25B2":"\u25BC"}</span>
            </button>
            {openSec.megger!==false&&(
              <div style={{padding:16}}>
                <div style={{marginBottom:10}}><label style={lbl}>Test Voltage</label><select style={inp} value={megger.testV} onChange={e=>setMegger(p=>({...p,testV:e.target.value}))}><option value="500">500V</option><option value="1000">1000V</option><option value="2500">2500V</option><option value="5000">5000V</option></select></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
                  <div><label style={lbl}>A-B</label><input style={inp} value={megger.aToB} onChange={e=>setMegger(p=>({...p,aToB:e.target.value}))} placeholder="M\u03a9"/></div>
                  <div><label style={lbl}>B-C</label><input style={inp} value={megger.bToC} onChange={e=>setMegger(p=>({...p,bToC:e.target.value}))} placeholder="M\u03a9"/></div>
                  <div><label style={lbl}>C-A</label><input style={inp} value={megger.cToA} onChange={e=>setMegger(p=>({...p,cToA:e.target.value}))} placeholder="M\u03a9"/></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  <div><label style={lbl}>A-Gnd</label><input style={inp} value={megger.aToG} onChange={e=>setMegger(p=>({...p,aToG:e.target.value}))} placeholder="M\u03a9"/></div>
                  <div><label style={lbl}>B-Gnd</label><input style={inp} value={megger.bToG} onChange={e=>setMegger(p=>({...p,bToG:e.target.value}))} placeholder="M\u03a9"/></div>
                  <div><label style={lbl}>C-Gnd</label><input style={inp} value={megger.cToG} onChange={e=>setMegger(p=>({...p,cToG:e.target.value}))} placeholder="M\u03a9"/></div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={card}>
            <label style={lbl}>General Notes</label>
            <textarea style={{...inp,minHeight:80,resize:"vertical"}} value={form.notes} onChange={e=>uf("notes",e.target.value)} placeholder="Repairs needed, parts required, follow-up..."/>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={sv} style={{width:"100%",padding:16,borderRadius:12,border:"none",background:sv?"#94a3b8":fails>0?"linear-gradient(135deg,#dc2626,#b91c1c)":"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",fontSize:17,fontWeight:800,cursor:sv?"not-allowed":"pointer",marginBottom:24,boxShadow:"0 4px 12px rgba(0,0,0,0.15)"}}>
            {sv?"Submitting...":computeRes(checks,torque).toUpperCase()}
          </button>
        </div>
      )}

      {/* ════ DONE ════ */}
      {view==="done"&&insp.length>0&&(()=>{
        const i0=insp[0]; const c0=rc[i0.overall_result]||"#6b7280";
        return (
          <div style={{...card,textAlign:"center",padding:32,borderLeft:`4px solid ${c0}`}}>
            <div style={{fontSize:48,marginBottom:8}}>{i0.overall_result==="pass"?"\u2713":i0.overall_result==="fail"?"\u2717":"\u26a0"}</div>
            <div style={{fontSize:20,fontWeight:800}}>{i0.overall_result==="pass"?"PASSED":"INSPECTION RECORDED"}</div>
            <div style={{color:"#6b7280",fontSize:15,margin:"8px 0"}}><strong>{i0.id}</strong></div>
            <div style={{fontSize:16,fontWeight:700,color:c0,marginBottom:6}}>{i0.overall_result?.toUpperCase()}</div>
            <div style={{fontSize:13,color:"#475569",marginBottom:20}}>{i0.equipment_type} | S/N: {i0.serial_number}</div>
            {i0.overall_result==="pass"&&(
              <button onClick={()=>issueSticker(i0)} style={{width:"100%",padding:16,borderRadius:12,border:"none",background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",fontSize:16,fontWeight:800,cursor:"pointer",marginBottom:12,boxShadow:"0 4px 12px rgba(22,163,106,0.3)"}}>
                Issue QC Pass Sticker
              </button>
            )}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setView("form")} style={{flex:1,padding:14,borderRadius:10,border:"none",background:"#f59e0b",color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer"}}>New</button>
              <button onClick={()=>setView("history")} style={{flex:1,padding:14,borderRadius:10,border:"none",background:"#0f172a",color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer"}}>History</button>
            </div>
          </div>
        );
      })()}

      {/* ════ STICKER ════ */}
      {showSticker&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,zIndex:100}} onClick={()=>setShowSticker(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,padding:24,maxWidth:360,width:"100%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
            <div style={{border:"3px solid #16a34a",borderRadius:12,padding:20}}>
              <div style={{fontSize:11,fontWeight:800,color:"#16a34a",letterSpacing:2,marginBottom:4}}>WORLDWIDE ELECTRICAL SERVICES</div>
              <div style={{fontSize:28,fontWeight:900,color:"#16a34a",margin:"8px 0"}}>{"\u2713"} QC PASS</div>
              <div style={{height:2,background:"#16a34a",margin:"12px 0",opacity:0.3}}/>
              <div style={{fontSize:13,color:"#475569",lineHeight:1.8}}>
                <div><strong>Sticker #:</strong> {showSticker.sticker_number}</div>
                <div><strong>Equipment:</strong> {showSticker.equipment_type}</div>
                <div><strong>S/N:</strong> {showSticker.serial_number}</div>
                <div><strong>Manufacturer:</strong> {showSticker.manufacturer||"N/A"}</div>
                <div><strong>Voltage / Amps:</strong> {showSticker.voltage_rating||"?"} / {showSticker.amperage_rating||"?"}</div>
                <div style={{height:1,background:"#e5e7eb",margin:"8px 0"}}/>
                <div><strong>Inspected by:</strong> {showSticker.sticker_signed_by}</div>
                <div><strong>Date:</strong> {showSticker.sticker_date}</div>
              </div>
            </div>
            <button onClick={()=>setShowSticker(null)} style={{width:"100%",padding:14,borderRadius:10,border:"none",background:"#0f172a",color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",marginTop:16}}>Done</button>
          </div>
        </div>
      )}

      {/* ════ HISTORY ════ */}
      {view==="history"&&(
        <div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
            {["all","pass","fail","conditional","pending"].map(f=>{
              const n=f==="all"?insp.length:insp.filter(r=>r.overall_result===f).length;
              if(f!=="all"&&n===0)return null;
              return <button key={f} onClick={()=>setFilt(f)} style={{padding:"8px 14px",borderRadius:20,border:"none",background:filt===f?"#0f172a":"#e2e8f0",color:filt===f?"#fff":"#64748b",fontWeight:700,fontSize:12,cursor:"pointer",textTransform:"capitalize"}}>{f} ({n})</button>;
            })}
          </div>
          <div style={{display:"flex",gap:6,marginBottom:14}}>
            <button onClick={exportCSV} style={{flex:1,padding:10,borderRadius:8,border:"1px solid #16a34a",background:"#fff",color:"#16a34a",fontWeight:700,fontSize:13,cursor:"pointer"}}>Export CSV</button>
            <button onClick={loadInsp} style={{flex:1,padding:10,borderRadius:8,border:"1px solid #d1d5db",background:"#fff",color:"#475569",fontWeight:700,fontSize:13,cursor:"pointer"}}>{ld?"...":"Refresh"}</button>
          </div>

          {filtI.length===0?<div style={{textAlign:"center",padding:48,color:"#9ca3af"}}>No inspections</div>:
          filtI.map(i=>{
            const isE=expId===i.id; const co=rc[i.overall_result]||"#6b7280"; const ic=i.checks||i.qc_checklist_items||[];
            return (
              <div key={i.id} style={{...card,borderLeft:`4px solid ${co}`,padding:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <div style={{fontWeight:800,fontSize:14}}>{i.id}</div>
                  <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:co+"18",color:co,textTransform:"uppercase"}}>{i.overall_result}</span>
                </div>
                <div style={{fontSize:12,color:"#6b7280"}}>{i.inspected_by} | {i.inspection_date}</div>
                <div style={{fontSize:13,fontWeight:600,marginTop:4}}>{i.equipment_type} | S/N: {i.serial_number}</div>
                {i.manufacturer&&<div style={{fontSize:12,color:"#475569"}}>{i.manufacturer}{i.voltage_rating?` | ${i.voltage_rating}`:""}{i.amperage_rating?` / ${i.amperage_rating}`:""}</div>}
                {i.sticker_number&&<div style={{fontSize:12,color:"#16a34a",fontWeight:700,marginTop:4}}>{"\u2713"} Sticker: {i.sticker_number}</div>}

                <div style={{display:"flex",gap:6,marginTop:10}}>
                  <button onClick={()=>setExpId(isE?null:i.id)} style={{flex:1,padding:10,borderRadius:8,border:"1px solid #d1d5db",background:isE?"#f1f5f9":"#fff",color:"#475569",fontWeight:600,fontSize:12,cursor:"pointer"}}>{isE?"Hide":"Details"}</button>
                  {i.overall_result==="pass"&&!i.sticker_number&&<button onClick={()=>issueSticker(i)} style={{flex:1,padding:10,borderRadius:8,border:"none",background:"#16a34a",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>Issue Sticker</button>}
                  {i.overall_result!=="pass"&&<button onClick={()=>patch(i.id,{overall_result:"pass"})} style={{flex:1,padding:10,borderRadius:8,border:"none",background:"#f59e0b",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>Override Pass</button>}
                </div>

                {isE&&(
                  <div style={{marginTop:12,borderRadius:10,overflow:"hidden",border:"1px solid #e5e7eb"}}>
                    {ic.map((ck,j)=>{
                      const prev=j>0?ic[j-1]:null; const sh=!prev||prev.section!==ck.section;
                      const ro=RO.find(r=>r.v===ck.result);
                      return (
                        <div key={j}>
                          {sh&&<div style={{padding:"8px 12px",background:"#f1f5f9",fontSize:12,fontWeight:800,color:"#475569"}}>{ck.section}</div>}
                          <div style={{padding:"8px 12px",borderBottom:"1px solid #f8fafc",display:"flex",justifyContent:"space-between",fontSize:12,background:ck.result==="fail"?"#fef2f2":ck.result==="flag"?"#fffbeb":"#fff"}}>
                            <span style={{flex:1,paddingRight:8}}>{ck.check_item||ck.checkItem}</span>
                            <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                              {ck.notes&&<span style={{color:"#94a3b8",fontSize:10,maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ck.notes}</span>}
                              <span style={{fontWeight:800,color:ro?.c||"#94a3b8",fontSize:16}}>{ro?.i||"\u2014"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
