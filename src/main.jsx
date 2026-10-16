import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutDashboard, Coffee, Package, BookOpen, BarChart3, Users, Settings, LogOut, ChevronDown, Store, Search, Pencil, X, Menu, ShieldCheck, CircleAlert, CheckCircle2, RefreshCw, LockKeyhole, ShoppingCart, Wallet, ReceiptText } from 'lucide-react';
import { configReady, supabase } from './supabase';
import './style.css';
const rupiah = amount => amount === null || amount === undefined ? 'Belum diatur' : new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(amount));
const NAV = [
  {label:'Dashboard',icon:LayoutDashboard,enabled:false},
  {label:'Menu Produk',icon:Coffee,enabled:true},
  {label:'Kasir Booth',icon:ShoppingCart,enabled:false},
  {label:'Kasir Online',icon:Store,enabled:false},
  {label:'Inventory',icon:Package,enabled:false},
  {label:'Pembukuan',icon:BookOpen,enabled:false},
  {label:'Laporan',icon:BarChart3,enabled:false},
  {label:'Manajemen Tim',icon:Users,enabled:false},
  {label:'Pengaturan',icon:Settings,enabled:false},
];
function App(){
 const [session,setSession]=useState(null),[booting,setBooting]=useState(true),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[loginBusy,setLoginBusy]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [memberships,setMemberships]=useState([]),[outletId,setOutletId]=useState(''),[profile,setProfile]=useState(null),[products,setProducts]=useState([]),[prices,setPrices]=useState([]),[catalogBusy,setCatalogBusy]=useState(false);
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
  <aside className={'sidebar '+(sidebarOpen?'show':'')}><div className="logo"><div className="brand-mark small">N</div><div><strong>NUSA POS</strong><span>MANAGEMENT 2.0</span></div></div><div className="side-label">MENU UTAMA</div><nav>{NAV.map(({label,icon:Icon,enabled})=><button key={label} className={'nav-item '+(enabled?'active':'')} disabled={!enabled} onClick={()=>setSidebarOpen(false)}><Icon size={19}/><span>{label}</span>{!enabled&&<span className="soon">Segera</span>}</button>)}</nav><div className="sidebar-bottom"><span>Versi pengembangan · 0.1.0</span><button className="nav-item" onClick={logout}><LogOut size={18}/> Keluar</button></div></aside>
  {sidebarOpen&&<button className="overlay" onClick={()=>setSidebarOpen(false)} aria-label="Tutup menu"/>}
  <main className="main"><header className="topbar"><button className="icon-btn mobile" onClick={()=>setSidebarOpen(true)}><Menu/></button><div className="breadcrumb">Admin <span>/</span> <strong>Menu Produk</strong></div><div className="topright"><span className="user-avatar">{(profile?.full_name||session.user.email||'A')[0].toUpperCase()}</span><div className="user-text"><b>{profile?.full_name||session.user.email}</b><span>{membership?.role||'Belum ada role'}</span></div></div></header>
  <div className="content"><div className="heading"><div><div className="eyebrow">KATALOG KOPI NUSA</div><h1>Menu Produk</h1><p>Kelola harga Booth dan Online dari satu dashboard.</p></div><button className="secondary" onClick={loadCatalog} disabled={!outletId||catalogBusy}><RefreshCw size={17}/> Segarkan</button></div>
  {error&&<div className="alert error"><CircleAlert size={18}/>{error}</div>}{notice&&<div className="alert success"><CheckCircle2 size={18}/>{notice}</div>}
  {!profile?.is_active&&<div className="alert error"><LockKeyhole size={18}/>Profil belum aktif atau belum dibuat pada tabel profiles. Minta Owner menautkan akun.</div>}
  <section className="context-card"><div><div className="label">OUTLET AKTIF</div><div className="select-wrap"><Store size={17}/><select value={outletId} onChange={e=>setOutletId(e.target.value)}>{memberships.map(x=><option key={x.outlet_id} value={x.outlet_id}>{x.outlets?.name} · {x.outlets?.code}</option>)}</select><ChevronDown size={16}/></div></div><div className="right-note"><ShieldCheck size={17}/>{membership?.role?'Akses: '+membership.role:'Tidak ada akses'}</div></section>
  {!memberships.length?<div className="empty"><LockKeyhole size={38}/><h2>Akses outlet belum tersedia</h2><p>Pastikan akun ada di <code>profiles</code> dan <code>outlet_memberships</code>. Cek kembali SQL Tahap 01C.</p></div>:<><div className="stats"><div className="stat"><span>Produk aktif</span><b>{products.filter(p=>p.is_active).length}</b></div><div className="stat"><span>Menu utama</span><b>{products.filter(p=>p.product_type!=='addon').length}</b></div><div className="stat"><span>Addon</span><b>{products.filter(p=>p.product_type==='addon').length}</b></div><div className="stat"><span>Harga belum lengkap</span><b>{products.filter(p=>priceFor(p.id,'BOOTH')===null||priceFor(p.id,'ONLINE')===null).length}</b></div></div>
  <section className="table-card"><div className="table-head"><div><h2>Daftar Produk</h2><p>Harga mengikuti outlet terpilih. Perubahan hanya berlaku untuk transaksi baru.</p></div><div className="filters"><div className="search"><Search size={17}/><input placeholder="Cari produk atau SKU" value={query} onChange={e=>setQuery(e.target.value)}/></div><select value={category} onChange={e=>setCategory(e.target.value)}><option value="SEMUA">Semua</option><option value="MENU">Menu utama</option><option value="ADDON">Addon</option></select></div></div>
  <div className="table-scroll"><table><thead><tr><th>PRODUK</th><th>JENIS</th><th>HARGA BOOTH</th><th>HARGA ONLINE</th><th>STATUS</th><th/></tr></thead><tbody>{display.map(p=><tr key={p.id}><td><div className="product-name"><div className="product-pic"><Coffee size={20}/></div><div><strong>{p.name}</strong><small>{p.sku}</small></div></div></td><td>{p.product_categories?.name||p.product_type}</td><td className="num">{rupiah(priceFor(p.id,'BOOTH'))}</td><td className="num">{rupiah(priceFor(p.id,'ONLINE'))}</td><td><span className={'pill '+(p.is_active?'enabled':'disabled')}>{p.is_active?'Aktif':'Nonaktif'}</span></td><td>{canEdit&&<button className="edit-btn" title="Edit harga" onClick={()=>editProduct(p)}><Pencil size={15}/> Edit</button>}</td></tr>)}{!display.length&&<tr><td colSpan="6" className="no-results">{catalogBusy?'Memuat katalog…':'Tidak ada produk ditemukan.'}</td></tr>}</tbody></table></div><div className="table-footer">Menampilkan {display.length} dari {products.length} produk · Harga dalam rupiah</div></section>
  <div className="disclaimer"><CircleAlert size={17}/><span>Starter ini hanya mengaktifkan login, pemilihan outlet, katalog, dan edit harga. Checkout belum diaktifkan sampai resep, stok, dan fungsi checkout terpadu aman diuji.</span></div></>}
  </div></main>
  {editing&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!saving)setEditing(null)}}><div className="modal" role="dialog" aria-modal="true" aria-label="Ubah harga"><div className="modal-title"><div><div className="eyebrow">HARGA PRODUK · {outlet?.code}</div><h2>{editing.name}</h2><small>{editing.sku}</small></div><button className="icon-btn" onClick={()=>setEditing(null)} disabled={saving}><X/></button></div><div className="modal-fields"><label>Harga Booth (Rp)<input type="number" min="0" step="1" value={booth} onChange={e=>setBooth(e.target.value)}/></label><label>Harga Online (Rp)<input type="number" min="0" step="1" value={online} onChange={e=>setOnline(e.target.value)}/></label></div><p className="muted">Simpan akan memanggil fungsi Supabase <code>set_product_price</code> untuk setiap channel.</p><div className="modal-actions"><button className="secondary" disabled={saving} onClick={()=>setEditing(null)}>Batal</button><button className="primary" disabled={saving} onClick={savePrice}>{saving?'Menyimpan…':'Simpan Harga'}</button></div></div></div>}
 </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
