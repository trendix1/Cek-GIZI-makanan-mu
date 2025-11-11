/*
GiziLearn — App.jsx (Futuristic theme)
All features run client-side (Tesseract.js OCR + rule-based evaluator). Ready for public deploy on Vercel.
*/
import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Tesseract from 'tesseract.js';

function evaluateNutrition(nutri) {
  const parse = (k) => (nutri && nutri[k] !== undefined && nutri[k] !== '' ? Number(String(nutri[k]).replace(/[^0-9.\-]/g, '')) : null);
  const val = { calories: parse('calories'), protein: parse('protein'), fat: parse('fat'), carbs: parse('carbs'), sugar: parse('sugar'), fiber: parse('fiber'), sodium: parse('sodium'), transFat: parse('transFat'), saturatedFat: parse('saturatedFat'), cholesterol: parse('cholesterol') };
  let score = 50;
  if (val.sugar != null) { if (val.sugar <= 2) score += 15; else if (val.sugar <= 6) score += 8; else if (val.sugar <= 12) score -= 5; else score -= 15; }
  if (val.fiber != null) { if (val.fiber >= 6) score += 12; else if (val.fiber >= 3) score += 6; else score -= 2; }
  if (val.protein != null) { if (val.protein >= 8) score += 8; else if (val.protein >= 4) score += 4; }
  if (val.saturatedFat != null) { if (val.saturatedFat <= 1) score += 6; else if (val.saturatedFat <= 3) score -= 2; else score -= 8; }
  if (val.transFat != null && val.transFat > 0) score -= 15;
  if (val.sodium != null) { if (val.sodium <= 120) score += 6; else if (val.sodium <= 300) score -= 2; else score -= 10; }
  if (val.calories != null) { if (val.calories <= 50) score += 4; else if (val.calories <= 200) score += 2; else if (val.calories <= 400) score -= 2; else score -= 6; }
  if (score < 0) score = 0; if (score > 100) score = 100;
  let label = 'Tidak Baik'; let level = 'bad';
  if (score >= 85) { label = 'Sangat Baik'; level = 'excellent'; } else if (score >= 70) { label = 'Baik'; level = 'good'; } else if (score >= 50) { label = 'Lumayan'; level = 'ok'; }
  const messages = []; if (val.sugar != null && val.sugar > 12) messages.push('Gula tinggi — kurangi jika sering dikonsumsi.'); if (val.sodium != null && val.sodium > 300) messages.push('Sodium cukup tinggi — perhatikan asupan garam.'); if (val.fiber != null && val.fiber >= 6) messages.push('Serat tinggi — baik untuk pencernaan.'); if (val.transFat != null && val.transFat > 0) messages.push('Mengandung lemak trans — hindari bila mungkin.');
  return { score, label, level, messages };
}

function parseNutritionText(text) {
  const lower = text.toLowerCase();
  const out = {};
  const findNumAfter = (keywords) => {
    for (const kw of keywords) {
      const idx = lower.indexOf(kw);
      if (idx >= 0) {
        const after = lower.slice(idx + kw.length, idx + kw.length + 40);
        const m = after.match(/([0-9]+\.?[0-9]*)/);
        if (m) return m[1];
      }
    }
    return null;
  };
  const map = { calories: ['kalori','calorie','energi','kkal'], protein:['protein'], fat:['lemak','fat'], carbs:['karbo','karbohidrat','carb'], sugar:['gula','sugar'], fiber:['serat','fiber'], sodium:['natrium','sodium','salt'], transFat:['trans'], saturatedFat:['jenuh','saturated'], cholesterol:['kolesterol','cholesterol'] };
  for (const key in map) {
    const val = findNumAfter(map[key]);
    if (val) out[key] = val;
  }
  return out;
}

const IconBadge = ({ level }) => {
  if (level === 'excellent') return (<div className="inline-flex items-center gap-2 text-yellow-400 font-semibold">🏆🏆🏆 <span>Sangat Baik</span></div>);
  if (level === 'good') return (<div className="inline-flex items-center gap-2 text-green-400 font-semibold">✅ Baik</div>);
  if (level === 'ok') return (<div className="inline-flex items-center gap-2 text-yellow-300 font-semibold">= Lumayan</div>);
  return (<div className="inline-flex items-center gap-2 text-red-400 font-semibold">❌ Tidak Baik</div>);
};

function Home() {
  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold neon">GiziLearn</h1>
      <p className="text-gray-300 mt-2">Pembelajaran gizi bergaya futuristik — scanner label, perbandingan makanan, daftar makanan tinggi gizi. Gratis & client-side.</p>
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Link to="/comparison" className="p-4 border glass rounded hover:shadow">Perbandingan Gizi</Link>
        <Link to="/high-nutrition" className="p-4 border glass rounded hover:shadow">Makanan Tinggi Gizi</Link>
        <Link to="/scanner" className="p-4 border glass rounded hover:shadow">Scanner Label</Link>
        <Link to="/manual" className="p-4 border glass rounded hover:shadow">Input Manual</Link>
      </div>
    </div>
  );
}

function HighNutrition() {
  const items = [{ name:'Bayam', desc:'Tinggi zat besi, vitamin A, K, serat.' }, { name:'Kacang Almond', desc:'Lemak sehat, vitamin E, protein.' }, { name:'Ikan Salmon', desc:'Omega-3, protein, vitamin D.' }, { name:'Blueberry', desc:'Antioksidan, vitamin C.' }, { name:'Ubi Jalar', desc:'Beta-karoten, serat.' }];
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold neon">Makanan & Buah Tinggi Gizi</h2>
      <div className="grid gap-3 mt-4">
        {items.map(it => (<div key={it.name} className="p-4 border glass rounded flex justify-between items-center"><div><div className="font-semibold">{it.name}</div><div className="text-sm text-gray-300">{it.desc}</div></div><div className="text-sm text-gray-400">Saran: seimbang</div></div>))}
      </div>
    </div>
  );
}

function Comparison() {
  const [a, setA] = useState({ name:'', calories:'', protein:'', sugar:'' });
  const [b, setB] = useState({ name:'', calories:'', protein:'', sugar:'' });
  const resA = evaluateNutrition(a); const resB = evaluateNutrition(b);
  return (
    <div className="p-6">
      <h2 className="text-2xl neon">Perbandingan Gizi</h2>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="p-4 border glass rounded">
          <div className="font-semibold mb-2">Makanan A</div>
          <input className="w-full mb-2 p-2 bg-[#071032] border rounded" placeholder="Nama" value={a.name} onChange={e=>setA({...a,name:e.target.value})} />
          <input className="w-full mb-2 p-2 bg-[#071032] border rounded" placeholder="Kalori (kcal)" value={a.calories} onChange={e=>setA({...a,calories:e.target.value})} />
          <input className="w-full mb-2 p-2 bg-[#071032] border rounded" placeholder="Protein (g)" value={a.protein} onChange={e=>setA({...a,protein:e.target.value})} />
          <input className="w-full mb-2 p-2 bg-[#071032] border rounded" placeholder="Gula (g)" value={a.sugar} onChange={e=>setA({...a,sugar:e.target.value})} />
          <div className="mt-3"><IconBadge level={resA.level} /></div>
        </div>
        <div className="p-4 border glass rounded">
          <div className="font-semibold mb-2">Makanan B</div>
          <input className="w-full mb-2 p-2 bg-[#071032] border rounded" placeholder="Nama" value={b.name} onChange={e=>setB({...b,name:e.target.value})} />
          <input className="w-full mb-2 p-2 bg-[#071032] border rounded" placeholder="Kalori (kcal)" value={b.calories} onChange={e=>setB({...b,calories:e.target.value})} />
          <input className="w-full mb-2 p-2 bg-[#071032] border rounded" placeholder="Protein (g)" value={b.protein} onChange={e=>setB({...b,protein:e.target.value})} />
          <input className="w-full mb-2 p-2 bg-[#071032] border rounded" placeholder="Gula (g)" value={b.sugar} onChange={e=>setB({...b,sugar:e.target.value})} />
          <div className="mt-3"><IconBadge level={resB.level} /></div>
        </div>
      </div>
      <div className="mt-6 p-4 border glass rounded bg-opacity-10">
        <div className="font-semibold">Ringkasan:</div>
        <div className="mt-2">A: {a.name || '-'} — {resA.label} (skor {Math.round(resA.score)})</div>
        <div>B: {b.name || '-'} — {resB.label} (skor {Math.round(resB.score)})</div>
      </div>
    </div>
  );
}

function ManualInput() {
  const [form,setForm] = useState({ name:'', calories:'', protein:'', fat:'', carbs:'', sugar:'', fiber:'', sodium:'' });
  const [result,setResult] = useState(null);
  const [history,setHistory] = useState(()=>{ try { return JSON.parse(localStorage.getItem('gizi_history')||'[]') } catch(e){ return [] } });
  const save=(item)=>{ const next=[item,...history].slice(0,50); setHistory(next); localStorage.setItem('gizi_history', JSON.stringify(next)); };
  const handleEvaluate=()=>{ const r=evaluateNutrition(form); setResult(r); save({...form,evaluated:r,date:new Date().toISOString()}); };
  return (
    <div className="p-6">
      <h2 className="text-2xl neon">Masukan Nilai Gizi Manual</h2>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div>
          {['name','calories','protein','fat','carbs','sugar','fiber','sodium'].map(k=>(<input key={k} className="w-full mb-2 p-2 bg-[#071032] border rounded" placeholder={k} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} />))}
          <button className="mt-2 px-4 py-2 bg-[#7c3aed] rounded" onClick={handleEvaluate}>Evaluasi</button>
        </div>
        <div>
          <div className="p-4 border glass rounded min-h-[150px]">
            <div className="font-semibold">Hasil:</div>
            {result ? (<div><div className="mt-2"><IconBadge level={result.level} /></div><div className="mt-2">Skor: {Math.round(result.score)}</div>{result.messages&&result.messages.map((m,i)=>(<div key={i} className="text-sm text-gray-300">- {m}</div>))}</div>) : <div className="text-sm text-gray-400 mt-2">Masukkan data lalu tekan Evaluasi.</div>}
          </div>
          <div className="mt-4"><div className="font-semibold">Riwayat (disimpan lokal):</div><div className="mt-2 max-h-56 overflow-auto">{history.length===0&&<div className="text-sm text-gray-400">Belum ada riwayat.</div>}{history.map((it,idx)=>(<div key={idx} className="p-2 border-b"><div className="font-semibold">{it.name||'(tanpa nama)'} — {it.evaluated?it.evaluated.label:'—'}</div><div className="text-sm text-gray-400">Skor: {it.evaluated?Math.round(it.evaluated.score):'-'} • {new Date(it.date).toLocaleString()}</div></div>))}</div></div>
        </div>
      </div>
    </div>
  );
}

function Scanner() {
  const [image,setImage]=useState(null); const [ocrText,setOcrText]=useState(''); const [parsing,setParsing]=useState(false); const [parsed,setParsed]=useState(null); const [evaluated,setEvaluated]=useState(null); const [progress,setProgress]=useState(0); const inputRef=useRef();
  useEffect(()=>{ if(image) runOCR(image); },[image]);
  const runOCR=async(fileUrl)=>{ setParsing(true); setProgress(0); setOcrText(''); setParsed(null); setEvaluated(null); try{ const worker=Tesseract.createWorker({ logger: m => { if(m.status==='recognizing text' && m.progress) setProgress(Math.round(m.progress*100)); } }); await worker.load(); await worker.loadLanguage('eng+ind'); await worker.initialize('eng+ind'); const res=await fetch(fileUrl); const blob=await res.blob(); const { data } = await worker.recognize(blob); await worker.terminate(); const text=data.text; setOcrText(text); const parsedObj=parseNutritionText(text); setParsed(parsedObj); const evalRes=evaluateNutrition(parsedObj); setEvaluated(evalRes); try{ const hist=JSON.parse(localStorage.getItem('gizi_history')||'[]'); const item={ name: parsedObj.name || 'Hasil Scan', parsed: parsedObj, evaluated: evalRes, date: new Date().toISOString() }; localStorage.setItem('gizi_history', JSON.stringify([item, ...hist].slice(0,50))); }catch(e){} }catch(e){ console.error(e); setOcrText('Gagal melakukan OCR. Coba foto yang lebih jelas dan tegak.'); } finally{ setParsing(false); setProgress(0);} };
  const onFileChange=(e)=>{ const file=e.target.files[0]; if(!file) return; setImage(URL.createObjectURL(file)); };
  const onUseCamera=async()=>{ inputRef.current.setAttribute('capture','environment'); inputRef.current.click(); setTimeout(()=>inputRef.current.removeAttribute('capture'),500); };
  return (
    <div className="p-6">
      <h2 className="text-2xl neon">Scanner Label</h2>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div>
          <div className="mb-2 text-gray-300">Ambil foto jelas (tegak, kontras) atau unggah gambar label nutrisi.</div>
          <div className="flex gap-2">
            <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} style={{display:'none'}} />
            <button className="px-3 py-2 border glass rounded" onClick={()=>inputRef.current.click()}>Unggah Gambar</button>
            <button className="px-3 py-2 border glass rounded" onClick={onUseCamera}>Gunakan Kamera</button>
          </div>
          <div className="mt-4">{image&&<img src={image} alt="label" className="max-w-full border rounded" />}</div>
          <div className="mt-4">{parsing?(<div className="p-3 border glass rounded">Membaca... {progress}%</div>): evaluated?(<div className="p-3 border glass rounded"><div className="font-semibold">Hasil Evaluasi</div><div className="mt-2"><IconBadge level={evaluated.level} /></div><div className="mt-2">Skor: {Math.round(evaluated.score)}</div>{evaluated.messages&&evaluated.messages.map((m,i)=>(<div key={i} className="text-sm text-gray-300">- {m}</div>))}</div>):(<div className="p-3 border glass rounded text-sm text-gray-400">Belum ada hasil. Unggah foto label untuk memulai.</div>)}</div>
        </div>
        <div>
          <div className="p-3 border glass rounded min-h-[200px]"><div className="font-semibold mb-2">Teks hasil OCR</div><pre className="whitespace-pre-wrap text-sm text-gray-300">{ocrText||<span className="text-gray-500">Teks OCR akan muncul di sini.</span>}</pre></div>
          <div className="mt-3 p-3 border glass rounded"><div className="font-semibold">Parsing otomatis</div><div className="mt-2 text-sm text-gray-400">Parser mencari angka untuk kata kunci (kalori, protein, gula, serat, natrium).</div><div className="mt-2"><div className="font-semibold">Hasil parsing singkat:</div><pre className="whitespace-pre-wrap text-sm text-gray-300">{parsed?JSON.stringify(parsed,null,2):'(belum ada parsing)'}</pre></div></div>
        </div>
      </div>
    </div>
  );
}

function Privacy() {
  return (
    <div className="p-6">
      <h2 className="text-2xl neon">Kebijakan Privasi</h2>
      <div className="mt-4 text-gray-300">GiziLearn berjalan 100% di browser; tidak mengirimkan data gizi atau gambar ke server manapun kecuali jika pengguna memilih mengunduh/menyimpan sendiri. Riwayat disimpan di localStorage perangkat pengguna.</div>
      <div className="mt-3 text-gray-300">Jika ingin menambahkan sinkronisasi server, developer harus menyediakan kebijakan tambahan dan persetujuan pengguna.</div>
    </div>
  );
}

function Contact() {
  return (
    <div className="p-6">
      <h2 className="text-2xl neon">Kontak</h2>
      <div className="mt-4 text-gray-300">Jika ada pertanyaan, silakan kirim email ke: admin@yourdomain.example (ganti dengan alamatmu sendiri sebelum publikasi).</div>
    </div>
  );
}

function Nav() {
  return (
    <nav className="bg-[#071032] border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-bold text-lg neon">GiziLearn</Link>
          <Link to="/comparison" className="text-sm text-gray-300">Perbandingan</Link>
          <Link to="/high-nutrition" className="text-sm text-gray-300">Tinggi Gizi</Link>
          <Link to="/scanner" className="text-sm text-gray-300">Scanner</Link>
          <Link to="/manual" className="text-sm text-gray-300">Manual</Link>
        </div>
        <div className="flex items-center gap-4"><Link to="/contact" className="text-sm text-gray-400">Kontak</Link><Link to="/privacy" className="text-sm text-gray-400">Kebijakan Privasi</Link></div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-[#071032] to-[#041227] text-gray-100">
        <Nav />
        <main className="max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/comparison" element={<Comparison />} />
            <Route path="/high-nutrition" element={<HighNutrition />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/manual" element={<ManualInput />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <footer className="text-center text-sm text-gray-400 p-4">GiziLearn • Gratis • Data disimpan lokal • Siap deploy</footer>
      </div>
    </Router>
  );
}