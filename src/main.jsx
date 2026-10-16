import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TrendingUp, CreditCard, CalendarDays, LayoutDashboard, Coffee, Package, BookOpen, BarChart3, Users, Settings, LogOut, ChevronDown, Store, Search, Pencil, X, Menu, ShieldCheck, CircleAlert, CheckCircle2, RefreshCw, LockKeyhole, ShoppingCart, Wallet, ReceiptText } from 'lucide-react';
import { configReady, supabase } from './supabase';
import './style.css';
import {Inventory,ShiftModule,Reports,Cashier,Finance,Team,AppSettings} from './modules';
const rupiah = amount => amount === null || amount === undefined ? 'Belum diatur' : new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(amount));
const NAV = [
  {label:'Dashboard',icon:LayoutDashboard,enabled:true},
  {label:'Menu Produk',icon:Coffee,enabled:true},
  {label:'Kasir Booth',icon:ShoppingCart,enabled:true},
  {label:'Kasir Online',icon:Store,enabled:true},
  {label:'Inventory',icon:Package,enabled:true},
  {label:'Pembukuan',icon:BookOpen,enabled:true},
  {label:'Laporan',icon:BarChart3,enabled:true},
  {label:'Manajemen Tim',icon:Users,enabled:true},
  {label:'Pengaturan',icon:Settings,enabled:true},
];

const localISO = d=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;};
const formatShort = v=>new Date(v+'T12:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short'});
const addDays = (ymd, days)=>{const d=new Date(ymd+'T12:00:00');d.setDate(d.getDate()+days);return localISO(d);};
function TrendChart({points}){
 const W=860,H=248, left=42,right=12,top=18,bottom=35;
 const max=Math.max(1,...points.map(p=>p.total));const maxTick=Math.ceil(max/10000)*10000||10000;
 const x=i=>left+(points.length<=1?(W-left-right)/2:i*(W-left-right)/(points.length-1));
 const y=n=>top+(H-top-bottom)*(1-n/maxTick);
 const poly=points.map((p,i)=>`${x(i)},${y(p.total)}`).join(' ');
 const labels=points.length>14?points.filter((_,i)=>i%Math.ceil(points.length/7)===0||i===points.length-1):points;
 return <div className="trend-wrap">{points.length===0?<div className="empty-graph">Belum ada transaksi pada periode ini.</div>:<svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Grafik omzet harian" preserveAspectRatio="xMidYMid meet">
 {[0,.25,.5,.75,1].map(t=><g key={t}><line x1={left} x2={W-right} y1={y(maxTick*t)} y2={y(maxTick*t)} stroke="#e7edf4" strokeDasharray="4 5"/><text x={left-7} y={y(maxTick*t)+4} textAnchor="end" fontSize="11" fill="#8a9aaa">{maxTick*t>=1000?(maxTick*t/1000).toFixed(0)+'k':maxTick*t}</text></g>)}
 <polyline points={poly} fill="none" stroke="#2674ce" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
 {points.map((p,i)=><circle key={p.date} cx={x(i)} cy={y(p.total)} r="3.1" fill="#fff" stroke="#2674ce" strokeWidth="2"><title>{p.date}: {rupiah(p.total)}</title></circle>)}
 {labels.map(p=><text key={p.date} x={x(points.findIndex(q=>q.date===p.date))} y={H-9} textAnchor="middle" fontSize="10" fill="#8094aa">{formatShort(p.date)}</text>)}
 </svg>}</div>;
}
function Dashboard({outletId,outlet,membership,profile,memberships,setOutletId}){
 const today=localISO(new Date());
 const [preset,setPreset]=useState('month'),[from,setFrom]=useState(today.slice(0,7)+'-01'),[to,setTo]=useState(today);
 const [data,setData]=useState([]),[payments,setPayments]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[partial,setPartial]=useState(false);
 const start=preset==='month'?today.slice(0,7)+'-01':preset==='week'?addDays(today,-6):preset==='year'?today.slice(0,4)+'-01-01':from;
 const finish=preset==='custom'?to:today;
 const load=useCallback(async()=>{
  if(!outletId){setData([]);setPayments([]);return;}
  if(!start||!finish||start>finish){setError('Rentang tanggal tidak valid.');return;}
  setLoading(true);setError('');setPartial(false);
  const sales=[];let failed=false,limited=false;
  // Baca secara berhalaman agar tidak kehilangan transaksi karena batas default API.
  for(let offset=0;offset<10000;offset+=500){
   const r=await supabase.from('sales').select('id,sold_at,total_amount,total_hpp,channel,status,source').eq('outlet_id',outletId).eq('status','completed').gte('sold_at',start+'T00:00:00+07:00').lt('sold_at',addDays(finish,1)+'T00:00:00+07:00').order('sold_at',{ascending:true}).range(offset,offset+499);
   if(r.error){setError('Gagal membaca transaksi: '+r.error.message);failed=true;break;}
   sales.push(...(r.data||[]));if((r.data||[]).length<500)break;if(offset===9500)limited=true;
  }
  if(!failed){
   const paymentRows=[];
   // Filter pembayaran berdasarkan ID sale yang berada dalam periode agar QRIS / Cash akurat.
   for(let i=0;i<sales.length;i+=100){const batch=sales.slice(i,i+100).filter(s=>s.channel==='BOOTH').map(s=>s.id);if(!batch.length)continue;
    const r=await supabase.from('sale_payments').select('sale_id,method,amount,payment_status').in('sale_id',batch).eq('payment_status','confirmed');
    if(r.error){setError('Gagal membaca pembayaran: '+r.error.message);failed=true;break;}
    paymentRows.push(...(r.data||[]));
   }
   if(!failed){setData(sales);setPayments(paymentRows);setPartial(limited);}
  }
  setLoading(false);
 },[outletId,start,finish]);
 useEffect(()=>{load();},[load]);
 const summary=useMemo(()=>{
  const total=data.reduce((n,s)=>n+Number(s.total_amount||0),0),hpp=data.reduce((n,s)=>n+Number(s.total_hpp||0),0);
  const cash=payments.filter(p=>p.method==='CASH').reduce((n,p)=>n+Number(p.amount||0),0);
  const qris=payments.filter(p=>p.method==='QRIS_STATIC').reduce((n,p)=>n+Number(p.amount||0),0);
  const days=new Map();for(const s of data){const key=new Date(s.sold_at).toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'});days.set(key,(days.get(key)||0)+Number(s.total_amount||0));}
  const values=[];for(let d=start;d<=finish&&values.length<366;d=addDays(d,1))values.push({date:d,total:days.get(d)||0});
  return {total,hpp,cash,qris,count:data.length,profit:total-hpp,values};
 },[data,payments,start,finish]);
 const metrics=[{title:'Total Omzet',value:rupiah(summary.total),hint:'Penjualan completed',icon:TrendingUp},{title:'Total Transaksi',value:summary.count.toLocaleString('id-ID'),hint:'Status completed',icon:ReceiptText},{title:'Cash Booth',value:rupiah(summary.cash),hint:'Pembayaran dikonfirmasi',icon:Wallet},{title:'QRIS Booth',value:rupiah(summary.qris),hint:'QRIS dikonfirmasi',icon:CreditCard},{title:'Total HPP',value:rupiah(summary.hpp),hint:'Snapshot biaya penjualan',icon:Package},{title:'Laba Kotor',value:rupiah(summary.profit),hint:'Omzet dikurangi HPP',icon:TrendingUp},{title:'Pengeluaran',value:'Belum tersedia',hint:'Menunggu modul Pembukuan',icon:BookOpen},{title:'Estimasi Laba Operasional',value:'Belum tersedia',hint:'Menunggu pencatatan biaya lengkap',icon:BarChart3}];
 return <><div className="heading"><div><div className="eyebrow">RINGKASAN KOPI NUSA</div><h1>Dashboard</h1><p>Data penjualan aktual dari Supabase, bukan angka simulasi.</p></div><button className="secondary" onClick={load} disabled={loading||!outletId}><RefreshCw size={17}/> Segarkan</button></div>
 {error&&<div className="alert error"><CircleAlert size={17}/>{error}</div>}
 {partial&&<div className="alert error">Data lebih dari 10.000 transaksi. Pilih periode lebih singkat agar laporan lengkap.</div>}
 <section className="context-card"><div><div className="label">OUTLET AKTIF</div><div className="select-wrap"><Store size={17}/><select value={outletId} onChange={e=>setOutletId(e.target.value)}>{memberships.map(m=><option key={m.outlet_id} value={m.outlet_id}>{m.outlets?.name} · {m.outlets?.code}</option>)}</select><ChevronDown size={16}/></div></div><div className="right-note"><ShieldCheck size={17}/>Akses: {membership?.role||'-'}</div></section>
 <section className="dash-filters"><div className="filter-label"><CalendarDays size={17}/> Periode Laporan</div><div className="period-buttons">{[{value:'week',label:'7 Hari'},{value:'month',label:'Bulan Ini'},{value:'year',label:'Tahun Ini'},{value:'custom',label:'Custom'}].map(p=><button key={p.value} onClick={()=>setPreset(p.value)} className={preset===p.value?'selected':''}>{p.label}</button>)}</div>{preset==='custom'&&<div className="date-range"><label>Mulai <input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>Sampai <input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></div>}</section>
 {!profile?.is_active&&<div className="alert error">Profil tidak aktif. Hubungi Owner untuk mengaktifkan akses.</div>}
 <div className="dashboard-stats">{metrics.map(({title,value,hint,icon:Icon})=><div className="dashboard-metric" key={title}><div className="metric-top"><span>{title}</span><Icon size={18}/></div><strong className={value==='Belum tersedia'?'unavailable':''}>{loading?'Memuat…':value}</strong><small>{hint}</small></div>)}</div>
 <section className="chart-card"><div className="chart-top"><div><h2>Grafik Omzet Harian</h2><p>Periode {formatShort(start)} – {formatShort(finish)} · Asia/Jakarta</p></div><span className="chart-legend"><i/> Omzet</span></div><TrendChart points={summary.values}/></section>
 <div className="disclaimer"><CircleAlert size={17}/><span>Transaksi historis POSe belum dimigrasikan. Nominal hanya berasal dari tabel sales NUSA POS. HPP dapat belum representatif sampai seluruh resep dan stok diaktifkan. Pengeluaran dan laba operasional belum dihitung sampai modul Pembukuan siap.</span></div>
 </>;
}

function App(){
 const [session,setSession]=useState(null),[booting,setBooting]=useState(true),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[loginBusy,setLoginBusy]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [memberships,setMemberships]=useState([]),[outletId,setOutletId]=useState(''),[profile,setProfile]=useState(null),[products,setProducts]=useState([]),[prices,setPrices]=useState([]),[catalogBusy,setCatalogBusy]=useState(false);
 const [page,setPage]=useState('Dashboard');
 const [query,setQuery]=useState(''),[category,setCategory]=useState('SEMUA'),[editing,setEditing]=useState(null),[booth,setBooth]=useState(''),[online,setOnline]=useState(''),[saving,setSaving]=useState(false),[sidebarOpen,setSidebarOpen]=useState(false);
 useEffect(()=>{if(!supabase){setBooting(false);return;}let active=true;supabase.auth.getSession().then(({data,error})=>{if(active){setSession(data?.session||null);if(error)setError(error.message);setBooting(false);}});const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>setSession(s));return()=>{active=false;subscription.unsubscribe();};},[]);
 useEffect(()=>{if(!session){setMemberships([]);setOutletId('');setProducts([]);setProfile(null);return;}let active=true;(async()=>{
  setError('');const uid=session.user.id;
  const [m,p]=await Promise.all([
    supabase.from('outlet_memberships').select('outlet_id,role,is_active,outlets(id,code,name,business_id,is_active)').eq('user_id',uid).eq('is_active',true),
    supabase.from('profiles').select('id,full_name,is_active').eq('id',uid).maybeSingle()
  ]);
  if(!active)return;
  if(m.error)setError('Gagal membaca akses outlet: '+m.error.message);
  if(p.error)setError('Gagal membaca profil: '+p.error.message);
  const result=(m.data||[]).filter(x=>x.outlets?.is_active);setMemberships(result);setProfile(p.data||null);setOutletId(current=>result.some(r=>r.outlet_id===current)?current:(result[0]?.outlet_id||''));
 })();return()=>{active=false;};},[session?.user?.id]);
 const membership=memberships.find(m=>m.outlet_id===outletId);const outlet=membership?.outlets;const canEdit=['owner','admin','manager'].includes(membership?.role)&&profile?.is_active;
 const loadCatalog=useCallback(async()=>{if(!outlet?.business_id)return;setCatalogBusy(true);setError('');
  const [p,price]=await Promise.all([
   supabase.from('products').select('id,sku,name,product_type,is_active,category_id,product_categories(name)').eq('business_id',outlet.business_id).order('sort_order').order('name'),
   supabase.from('product_prices').select('product_id,channel,price,is_active').eq('outlet_id',outletId).in('channel',['BOOTH','ONLINE'])
  ]);
  if(p.error)setError('Gagal membaca produk: '+p.error.message);if(price.error)setError('Gagal membaca harga: '+price.error.message);
  setProducts(p.data||[]);setPrices(price.data||[]);setCatalogBusy(false);
 },[outlet?.business_id,outletId]);
 useEffect(()=>{if(outletId&&outlet?.business_id)loadCatalog();},[loadCatalog,outletId,outlet?.business_id]);
 const display=useMemo(()=>products.filter(p=>{
  const matches=(p.name+' '+p.sku).toLowerCase().includes(query.toLowerCase());
  return matches&&(category==='SEMUA'||(category==='ADDON'?p.product_type==='addon':p.product_type!=='addon'));
 }),[products,query,category]);
 const priceFor=(id,channel)=>prices.find(p=>p.product_id===id&&p.channel===channel&&p.is_active)?.price??null;
 async function login(e){e.preventDefault();setLoginBusy(true);setError('');const {error:e2}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(e2)setError(e2.message);setLoginBusy(false);setPassword('');}
 async function logout(){await supabase.auth.signOut();setNotice('');setError('');}
 function editProduct(p){setEditing(p);setBooth(priceFor(p.id,'BOOTH')?.toString()??'');setOnline(priceFor(p.id,'ONLINE')?.toString()??'');setError('');setNotice('');}
 async function savePrice(){if(!editing||!canEdit)return;const valid=n=>n.trim()!==''&&Number.isFinite(Number(n))&&Number(n)>=0&&Number(n)<=999999999&&Math.round(Number(n)*100)===Number(n)*100;
  if(!valid(booth)||!valid(online)){setError('Isi kedua harga dengan angka tidak negatif.');return;}
  setSaving(true);setError('');setNotice('');
  // Dua harga diproses berurutan. Jika harga kedua gagal, perubahan pertama tetap tersimpan.
  for(const [channel,value] of [['BOOTH',booth],['ONLINE',online]]){
   const {error:e2}=await supabase.rpc('set_product_price',{p_outlet_id:outletId,p_product_sku:editing.sku,p_channel:channel,p_new_price:Number(value)});
   if(e2){setError('Penyimpanan '+channel+' gagal: '+e2.message+'. Periksa kembali kedua harga.');setSaving(false);await loadCatalog();return;}
  }
  setNotice('Harga '+editing.name+' berhasil diperbarui.');setEditing(null);setSaving(false);await loadCatalog();
 }
 if(!configReady)return <div className="center"><div className="login-card"><div className="brand-mark">N</div><h1>Konfigurasi belum lengkap</h1><p>Atur <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> terlebih dahulu. Lihat README.md.</p></div></div>;
 if(booting)return <div className="center"><span className="spinner"/> Memeriksa sesi login…</div>;
 if(!session)return <div className="center login-bg"><form className="login-card" onSubmit={login}><div className="brand-mark">N</div><h1>NUSA POS <span>2.0</span></h1><p>Masuk ke sistem manajemen Kopi Nusa</p><label>Email Admin / Kasir</label><input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@contoh.com"/><label>Password</label><input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Masukkan password"/>{error&&<div className="alert error">{error}</div>}<button type="submit" className="primary wide" disabled={loginBusy}>{loginBusy?'Masuk…':'Masuk ke NUSA POS'}</button><small>Login menggunakan Supabase Authentication project Kopi Nusa.</small></form></div>;
 return <div className="shell">
  <aside className={'sidebar '+(sidebarOpen?'show':'')}><div className="logo"><div className="brand-mark small">N</div><div><strong>NUSA POS</strong><span>MANAGEMENT 2.0</span></div></div><div className="side-label">MENU UTAMA</div><nav>{NAV.map(({label,icon:Icon,enabled})=><button key={label} className={'nav-item '+(enabled&&page===label?'active':'')} disabled={!enabled} onClick={()=>{setPage(label);setSidebarOpen(false);setError('');setNotice('');}}><Icon size={19}/><span>{label}</span>{!enabled&&<span className="soon">Segera</span>}</button>)}</nav><div className="sidebar-bottom"><span>Versi pengembangan · 0.4.0</span><button className="nav-item" onClick={logout}><LogOut size={18}/> Keluar</button></div></aside>
  {sidebarOpen&&<button className="overlay" onClick={()=>setSidebarOpen(false)} aria-label="Tutup menu"/>}
  <main className="main"><header className="topbar"><button className="icon-btn mobile" onClick={()=>setSidebarOpen(true)}><Menu/></button><div className="breadcrumb">Admin <span>/</span> <strong>{page}</strong></div><div className="topright"><span className="user-avatar">{(profile?.full_name||session.user.email||'A')[0].toUpperCase()}</span><div className="user-text"><b>{profile?.full_name||session.user.email}</b><span>{membership?.role||'Belum ada role'}</span></div></div></header>
  <div className="content">{page==='Dashboard' ? <Dashboard outletId={outletId} outlet={outlet} membership={membership} profile={profile} memberships={memberships} setOutletId={setOutletId}/> : page==='Inventory' ? <Inventory outletId={outletId} businessId={outlet?.business_id} role={membership?.role}/> : page==='Kasir Booth' ? <Cashier outletId={outletId} businessId={outlet?.business_id}/> : page==='Kasir Online' ? <Cashier outletId={outletId} businessId={outlet?.business_id} online/> : page==='Pembukuan' ? <Finance/> : page==='Laporan' ? <Reports outletId={outletId}/> : page==='Manajemen Tim' ? <Team outletId={outletId}/> : page==='Pengaturan' ? <AppSettings outlet={outlet} membership={membership}/> : <><div className="heading"><div><div className="eyebrow">KATALOG KOPI NUSA</div><h1>Menu Produk</h1><p>Kelola harga Booth dan Online dari satu dashboard.</p></div><button className="secondary" onClick={loadCatalog} disabled={!outletId||catalogBusy}><RefreshCw size={17}/> Segarkan</button></div>
  {error&&<div className="alert error"><CircleAlert size={18}/>{error}</div>}{notice&&<div className="alert success"><CheckCircle2 size={18}/>{notice}</div>}
  {!profile?.is_active&&<div className="alert error"><LockKeyhole size={18}/>Profil belum aktif atau belum dibuat pada tabel profiles. Minta Owner menautkan akun.</div>}
  <section className="context-card"><div><div className="label">OUTLET AKTIF</div><div className="select-wrap"><Store size={17}/><select value={outletId} onChange={e=>setOutletId(e.target.value)}>{memberships.map(x=><option key={x.outlet_id} value={x.outlet_id}>{x.outlets?.name} · {x.outlets?.code}</option>)}</select><ChevronDown size={16}/></div></div><div className="right-note"><ShieldCheck size={17}/>{membership?.role?'Akses: '+membership.role:'Tidak ada akses'}</div></section>
  {!memberships.length?<div className="empty"><LockKeyhole size={38}/><h2>Akses outlet belum tersedia</h2><p>Pastikan akun ada di <code>profiles</code> dan <code>outlet_memberships</code>. Cek kembali SQL Tahap 01C.</p></div>:<><div className="stats"><div className="stat"><span>Produk aktif</span><b>{products.filter(p=>p.is_active).length}</b></div><div className="stat"><span>Menu utama</span><b>{products.filter(p=>p.product_type!=='addon').length}</b></div><div className="stat"><span>Addon</span><b>{products.filter(p=>p.product_type==='addon').length}</b></div><div className="stat"><span>Harga belum lengkap</span><b>{products.filter(p=>priceFor(p.id,'BOOTH')===null||priceFor(p.id,'ONLINE')===null).length}</b></div></div>
  <section className="table-card"><div className="table-head"><div><h2>Daftar Produk</h2><p>Harga mengikuti outlet terpilih. Perubahan hanya berlaku untuk transaksi baru.</p></div><div className="filters"><div className="search"><Search size={17}/><input placeholder="Cari produk atau SKU" value={query} onChange={e=>setQuery(e.target.value)}/></div><select value={category} onChange={e=>setCategory(e.target.value)}><option value="SEMUA">Semua</option><option value="MENU">Menu utama</option><option value="ADDON">Addon</option></select></div></div>
  <div className="table-scroll"><table><thead><tr><th>PRODUK</th><th>JENIS</th><th>HARGA BOOTH</th><th>HARGA ONLINE</th><th>STATUS</th><th/></tr></thead><tbody>{display.map(p=><tr key={p.id}><td><div className="product-name"><div className="product-pic"><Coffee size={20}/></div><div><strong>{p.name}</strong><small>{p.sku}</small></div></div></td><td>{p.product_categories?.name||p.product_type}</td><td className="num">{rupiah(priceFor(p.id,'BOOTH'))}</td><td className="num">{rupiah(priceFor(p.id,'ONLINE'))}</td><td><span className={'pill '+(p.is_active?'enabled':'disabled')}>{p.is_active?'Aktif':'Nonaktif'}</span></td><td>{canEdit&&<button className="edit-btn" title="Edit harga" onClick={()=>editProduct(p)}><Pencil size={15}/> Edit</button>}</td></tr>)}{!display.length&&<tr><td colSpan="6" className="no-results">{catalogBusy?'Memuat katalog…':'Tidak ada produk ditemukan.'}</td></tr>}</tbody></table></div><div className="table-footer">Menampilkan {display.length} dari {products.length} produk · Harga dalam rupiah</div></section>
  <div className="disclaimer"><CircleAlert size={17}/><span>Starter ini hanya mengaktifkan login, pemilihan outlet, katalog, dan edit harga. Checkout belum diaktifkan sampai resep, stok, dan fungsi checkout terpadu aman diuji.</span></div></>}
  </>}</div></main>
  {editing&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!saving)setEditing(null)}}><div className="modal" role="dialog" aria-modal="true" aria-label="Ubah harga"><div className="modal-title"><div><div className="eyebrow">HARGA PRODUK · {outlet?.code}</div><h2>{editing.name}</h2><small>{editing.sku}</small></div><button className="icon-btn" onClick={()=>setEditing(null)} disabled={saving}><X/></button></div><div className="modal-fields"><label>Harga Booth (Rp)<input type="number" min="0" step="1" value={booth} onChange={e=>setBooth(e.target.value)}/></label><label>Harga Online (Rp)<input type="number" min="0" step="1" value={online} onChange={e=>setOnline(e.target.value)}/></label></div><p className="muted">Simpan akan memanggil fungsi Supabase <code>set_product_price</code> untuk setiap channel.</p><div className="modal-actions"><button className="secondary" disabled={saving} onClick={()=>setEditing(null)}>Batal</button><button className="primary" disabled={saving} onClick={savePrice}>{saving?'Menyimpan…':'Simpan Harga'}</button></div></div></div>}
 </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
