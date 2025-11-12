
import React, {useState, useRef, useEffect} from 'react';
import Tesseract from 'tesseract.js';

// thresholds (same as earlier)
const THRESHOLDS = { sugar_per_100g:{good:5, moderate:12}, sodium_per_100g:{good:120, moderate:300}, fiber_per_100g:{good:6, moderate:3}, protein_per_100g:{good:8, moderate:4}, satfat_per_100g:{low:1, moderate:3} };

// evaluator
function evaluate(nutri, profile='dewasa'){
  const parse=(k)=> (nutri && nutri[k] !== undefined && nutri[k] !== '' ? Number(String(nutri[k]).replace(/[^0-9.\-]/g,'')) : null);
  const sugar=parse('sugar'), protein=parse('protein'), sodium=parse('sodium'), fiber=parse('fiber'), satfat=parse('saturatedFat'), calories=parse('calories');
  let score=50;
  if(sugar!=null){ if(sugar<=THRESHOLDS.sugar_per_100g.good) score+=12; else if(sugar<=THRESHOLDS.sugar_per_100g.moderate) score+=2; else score-=12; }
  if(fiber!=null){ if(fiber>=THRESHOLDS.fiber_per_100g.good) score+=10; else if(fiber>=THRESHOLDS.fiber_per_100g.moderate) score+=4; }
  if(protein!=null){ if(protein>=THRESHOLDS.protein_per_100g.good) score+=8; else if(protein>=THRESHOLDS.protein_per_100g.moderate) score+=3; }
  if(satfat!=null){ if(satfat<=THRESHOLDS.satfat_per_100g.low) score+=6; else if(satfat<=THRESHOLDS.satfat_per_100g.moderate) score-=2; else score-=8; }
  if(sodium!=null){ if(sodium<=THRESHOLDS.sodium_per_100g.good) score+=6; else if(sodium<=THRESHOLDS.sodium_per_100g.moderate) score-=2; else score-=10; }
  if(calories!=null){ if(calories<=50) score+=3; else if(calories<=200) score+=1; else if(calories<=400) score-=1; else score-=4; }
  if(profile==='lansia' && sodium!=null && sodium>THRESHOLDS.sodium_per_100g.good) score-=5;
  if(profile==='atlet' && protein!=null && protein>=THRESHOLDS.protein_per_100g.good) score+=4;
  score=Math.max(0,Math.min(100,score));
  let label='Tidak Baik', level='bad';
  if(score>=85){ label='Sangat Baik'; level='excellent'; } else if(score>=70){ label='Baik'; level='good'; } else if(score>=50){ label='Lumayan'; level='ok'; }
  return {score,label,level};
}

// preprocessing & OCR functions (concise, similar to previous)
function applyPreprocess(blob, angle=0){
  return new Promise((res, rej)=>{
    const img=new Image();
    img.onload = ()=>{
      const cw = Math.min(900, img.width);
      const ch = Math.round(img.height * (cw/img.width));
      const canvas=document.createElement('canvas');
      canvas.width = cw; canvas.height = ch;
      const ctx=canvas.getContext('2d');
      if(angle!==0){ ctx.translate(cw/2,ch/2); ctx.rotate(angle*Math.PI/180); ctx.drawImage(img,-cw/2,-ch/2,cw,ch); ctx.setTransform(1,0,0,1,0,0); }
      else ctx.drawImage(img,0,0,cw,ch);
      try{
        const id=ctx.getImageData(0,0,cw,ch); const d=id.data;
        for(let i=0;i<d.length;i+=4){ const lum=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]; d[i]=d[i+1]=d[i+2]=lum; }
        ctx.putImageData(id,0,0);
      }catch(e){}
      canvas.toBlob(b=>{ if(!b) rej('no blob'); res(b); },'image/jpeg',0.85);
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(blob);
  });
}

async function ocrWithAutoRotation(blob, setProgress){
  const angles=[0,-6,6,-12,12,-3,3];
  let best={text:'', parsed:null};
  for(let i=0;i<angles.length;i++){
    setProgress && setProgress(Math.round((i/angles.length)*70));
    try{
      const b = await applyPreprocess(blob, angles[i]);
      setProgress && setProgress(70+Math.round((i/angles.length)*20));
      const worker = Tesseract.createWorker({logger: m=>{}});
      await worker.load(); await worker.loadLanguage('eng+ind'); await worker.initialize('eng+ind');
      const { data } = await worker.recognize(b);
      await worker.terminate();
      const text = data.text || '';
      if(text.length > best.text.length){ best.text = text; best.parsed = parseNutritionText(text); }
    }catch(e){ console.warn(e); }
  }
  setProgress && setProgress(100);
  return best;
}

function parseNutritionText(text){
  const lower = (text||'').toLowerCase();
  const out={};
  const get=(keys)=>{ for(const k of keys){ const idx=lower.indexOf(k); if(idx>=0){ const s=lower.slice(idx+k.length, idx+k.length+60); const m=s.match(/([0-9]+\.?[0-9]*)/); if(m) return m[1]; } } return null; };
  out.calories = get(['kalori','kkal','energi']); out.protein = get(['protein']); out.sugar = get(['gula','sugar']); out.fiber = get(['serat','fiber']); out.sodium = get(['natrium','sodium','mg']); return out;
}

// translations (id,en,es,ar,ja,fr)
const TRANSLATIONS = {
  id:{ upload:'Unggah / Foto', status:'Status', progress:'Progress', ocr_result:'Hasil OCR', parsing:'Parsing', evaluation:'Evaluasi', settings:'Pengaturan', theme:'Tema', language:'Bahasa', contact:'Kontak / Laporkan Masalah', send_report:'Kirim Laporan', thanks_report:'Terima kasih, laporanmu telah direkam (simulasi).' },
  en:{ upload:'Upload / Photo', status:'Status', progress:'Progress', ocr_result:'OCR Result', parsing:'Parsing', evaluation:'Evaluation', settings:'Settings', theme:'Theme', language:'Language', contact:'Contact / Report Issue', send_report:'Send Report', thanks_report:'Thanks — your report was recorded (simulated).' },
  es:{ upload:'Subir / Foto', status:'Estado', progress:'Progreso', ocr_result:'Resultado OCR', parsing:'Analizando', evaluation:'Evaluación', settings:'Ajustes', theme:'Tema', language:'Idioma', contact:'Contacto / Reportar', send_report:'Enviar reporte', thanks_report:'Gracias — tu reporte fue registrado (simulado).' },
  ar:{ upload:'تحميل / صورة', status:'الحالة', progress:'التقدم', ocr_result:'نتيجة OCR', parsing:'التحليل', evaluation:'التقييم', settings:'الإعدادات', theme:'المظهر', language:'اللغة', contact:'اتصل / أبلغ', send_report:'إرسال البلاغ', thanks_report:'شكرًا — تم تسجيل بلاغك (محاكاة).' },
  ja:{ upload:'アップロード / 写真', status:'ステータス', progress:'進捗', ocr_result:'OCR結果', parsing:'解析', evaluation:'評価', settings:'設定', theme:'テーマ', language:'言語', contact:'連絡 / 問題報告', send_report:'送信', thanks_report:'ありがとう — レポートが記録されました（シミュレーション）。' },
  fr:{ upload:'Télécharger / Photo', status:'Statut', progress:'Progression', ocr_result:'Résultat OCR', parsing:'Analyse', evaluation:'Évaluation', settings:'Paramètres', theme:'Thème', language:'Langue', contact:'Contact / Signaler', send_report:'Envoyer', thanks_report:'Merci — votre rapport a été enregistré (simulé).' }
};

export default function App(){
  const [imgUrl,setImgUrl]=useState(null);
  const [status,setStatus]=useState('');
  const [ocrText,setOcrText]=useState('');
  const [parsed,setParsed]=useState(null);
  const [evaluated,setEvaluated]=useState(null);
  const [progress,setProgress]=useState(0);
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [theme,setTheme]=useState(()=> localStorage.getItem('gizi_theme') || 'dark');
  const [lang,setLang]=useState(()=> localStorage.getItem('gizi_lang') || 'id');
  const [reportMsg,setReportMsg]=useState('');
  const inputRef=useRef();

  useEffect(()=>{ document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('gizi_theme', theme); },[theme]);
  useEffect(()=>{ localStorage.setItem('gizi_lang', lang); },[lang]);

  useEffect(()=>{ if(!imgUrl) return; (async ()=>{ setStatus('Memproses gambar...'); setProgress(5); try{ const resp = await fetch(imgUrl); const blob = await resp.blob(); const best = await ocrWithAutoRotation(blob, setProgress); setOcrText(best.text||''); setParsed(best.parsed); setEvaluated(best.parsed?evaluate(best.parsed):null); setStatus('Selesai'); }catch(e){ setStatus('Gagal memproses'); } })(); },[imgUrl]);

  const onFile = e=>{ const f = e.target.files[0]; if(!f) return; setImgUrl(URL.createObjectURL(f)); setOcrText(''); setParsed(null); setEvaluated(null); setStatus('File diterima'); setProgress(0); };
  const useCamera = ()=>{ inputRef.current.setAttribute('capture','environment'); inputRef.current.click(); setTimeout(()=>inputRef.current.removeAttribute('capture'),500); };

  const sendReport = ()=>{ const reports = JSON.parse(localStorage.getItem('gizi_reports')||'[]'); reports.unshift({ date:new Date().toISOString(), message: reportMsg }); localStorage.setItem('gizi_reports', JSON.stringify(reports.slice(0,50))); setReportMsg(''); alert(TRANSLATIONS[lang].thanks_report); };

  const t = TRANSLATIONS[lang] || TRANSLATIONS['id'];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button className="toggle-gear" onClick={()=>setSettingsOpen(true)} aria-label="Open settings">⚙️</button>
      <div className={"settings-backdrop " + (settingsOpen? 'show':'')} onClick={()=>setSettingsOpen(false)} style={{display: settingsOpen? 'block':'none'}}></div>
      <aside className={"settings-panel glass " + (settingsOpen? 'open':'')} aria-hidden={!settingsOpen}>
        <h3 className="text-xl font-semibold neon">{t.settings}</h3>
        <div className="mt-4">
          <label className="small-muted">{t.theme}</label>
          <select className="select" value={theme} onChange={e=>setTheme(e.target.value)}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div className="mt-4">
          <label className="small-muted">{t.language}</label>
          <select className="select" value={lang} onChange={e=>setLang(e.target.value)}>
            <option value="id">Indonesia</option>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="ar">العربية</option>
            <option value="ja">日本語</option>
            <option value="fr">Français</option>
          </select>
        </div>
        <div className="mt-4">
          <label className="small-muted">{t.contact}</label>
          <textarea className="textarea" rows="4" placeholder="Jelaskan masalah..." value={reportMsg} onChange={e=>setReportMsg(e.target.value)}></textarea>
          <button className="btn mt-3" onClick={sendReport}>{t.send_report}</button>
        </div>
        <div className="mt-6 small-muted">Theme and language saved locally.</div>
      </aside>

      <h1 className="text-3xl neon">GiziLearn</h1>
      <p className="mt-2 text-gray-300">Pembelajaran gizi futuristik — scanner label, perbandingan makanan, dan daftar makanan tinggi gizi.</p>

      <div className="mt-4 flex gap-2">
        <input ref={inputRef} type="file" accept="image/*" onChange={onFile} style={{display:'none'}}/>
        <button className="btn" onClick={()=>inputRef.current.click()}>{t.upload}</button>
        <button className="btn" onClick={useCamera}>{t.upload} (Camera)</button>
      </div>

      <div className="mt-4">{ imgUrl && <img src={imgUrl} alt="label" className="max-w-full rounded" /> }</div>

      <div className="mt-4 p-3 glass rounded"><div><strong>{t.status}:</strong> {status}</div><div className="mt-2"><strong>{t.progress}:</strong> {progress}%</div></div>

      <div className="mt-4 p-3 glass rounded"><h3 className="font-semibold">{t.ocr_result}</h3><pre>{ocrText||'(belum)'}</pre></div>

      <div className="mt-4 p-3 glass rounded"><h3 className="font-semibold">{t.parsing}</h3><pre>{parsed?JSON.stringify(parsed,null,2):'(belum)'}</pre></div>

      <div className="mt-4 p-3 glass rounded"><h3 className="font-semibold">{t.evaluation}</h3><div>{evaluated?`${evaluated.label} (skor ${Math.round(evaluated.score)})`:'(belum)'}</div></div>

      <div className="ad-placeholder" data-ads>AdSense Placeholder — replace with your ad code when ready</div>

      <footer className="mt-6 text-sm text-gray-400">Catatan: Sistem ini estimasi, bukan pengganti saran medis.</footer>
    </div>
  );
}
