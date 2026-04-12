'use client'

import { useState } from "react"

// ─── Constants ───────────────────────────────────────────────────────────────
const B = '#E85D26'
const BG = '#FAFAF9'
const fmt = n => '$' + (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const COUNTRY_CONFIG = {
  US: {
    label: 'United States', flag: '🇺🇸', currency: 'USD', symbol: '$',
    fmt: n => '$' + (n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
    stripe: { rate: 0.029, fixed: 0.30, label: '2.9% + $0.30' },
    tax: { rate: 0, label: 'Tax', enabled: false },
    bank: { label: 'ACH Bank Transfer', detail: 'Routing: 021000021 · Acct: ••••4521' },
    phone: '+1 555 000 0000',
  },
  PT: {
    label: 'Portugal', flag: '🇵🇹', currency: 'EUR', symbol: '€',
    fmt: n => '€' + (n||0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
    stripe: { rate: 0.015, fixed: 0.25, label: '1.5% + €0.25' },
    tax: { rate: 0.23, label: 'IVA', enabled: true },
    bank: { label: 'IBAN Bank Transfer', detail: 'PT50 0010 0000 0000 1234 5' },
    phone: '+351 910 000 000',
  },
  UK: {
    label: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£',
    fmt: n => '£' + (n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
    stripe: { rate: 0.015, fixed: 0.20, label: '1.5% + £0.20' },
    tax: { rate: 0.20, label: 'VAT', enabled: true },
    bank: { label: 'Bank Transfer (Sort Code)', detail: 'Sort: 20-00-00 · Acct: ••••4521' },
    phone: '+44 7700 000000',
  },
}

const STATUS = {
  new:    { label: 'New',    bg: '#EFF6FF', c: '#2563EB', dot: '#3B82F6' },
  quoted: { label: 'Quoted', bg: '#FFFBEB', c: '#B45309', dot: '#F59E0B' },
  won:    { label: 'Won',    bg: '#F0FDF4', c: '#15803D', dot: '#22C55E' },
  lost:   { label: 'Lost',   bg: '#F4F4F5', c: '#A1A1AA', dot: '#D4D4D8' },
}

const INIT_LEADS = [
  { id:'1', name:'James Carter',    phone:'+1 917 555 0182', job_type:'Boiler service',    status:'new',    time:'2h ago',  total: null },
  { id:'2', name:'Sarah Mitchell',  phone:'+1 646 555 0341', job_type:'Bathroom tiling',   status:'quoted', time:'1d ago',  total: 2400 },
  { id:'3', name:'Tom Rivera',      phone:'+1 718 555 0093', job_type:'Drain unblocking',  status:'won',    time:'2d ago',  total: 420  },
  { id:'4', name:'Linda Park',      phone:'+1 212 555 0774', job_type:'Pipe repair',       status:'new',    time:'3h ago',  total: null },
  { id:'5', name:'Kevin Walsh',     phone:'+1 347 555 0556', job_type:'Emergency callout', status:'lost',   time:'4d ago',  total: 580  },
]

const INIT_SECTIONS = [{
  id:'s1', tradeName:'Plumbing',
  items:[
    { id:'i1', name:'Labour (hourly)',    qty:2, unit_price:95,  total:190 },
    { id:'i2', name:'Call-out fee',       qty:1, unit_price:75,  total:75  },
    { id:'i3', name:'Parts & materials',  qty:1, unit_price:120, total:120 },
  ]
}]

// ─── Shared UI pieces ─────────────────────────────────────────────────────────
function Pill({ status }) {
  const s = STATUS[status] || STATUS.new
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4,
      background:s.bg, color:s.c, fontSize:11, fontWeight:600,
      padding:'3px 8px', borderRadius:20, whiteSpace:'nowrap' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:s.dot }} />
      {s.label}
    </span>
  )
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background:'none', border:'none', cursor:'pointer',
      padding:'4px 2px', color:'#6B7280', display:'flex', alignItems:'center' }}>
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
        <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

function BrandBtn({ children, onClick, disabled, small }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? '#ccc' : B,
      color:'white', border:'none', cursor: disabled ? 'default' : 'pointer',
      borderRadius: small ? 10 : 14, padding: small ? '8px 14px' : '14px 0',
      fontSize: small ? 13 : 15, fontWeight:600, width: small ? 'auto' : '100%',
      fontFamily:"'DM Sans',sans-serif", opacity: disabled ? 0.6 : 1,
      transition:'opacity 0.15s', whiteSpace:'nowrap',
    }}>
      {children}
    </button>
  )
}

function Card({ children, style }) {
  return (
    <div style={{ background:'white', borderRadius:20, border:'1px solid #F3F4F6',
      boxShadow:'0 1px 3px rgba(0,0,0,0.05)', ...style }}>
      {children}
    </div>
  )
}

function Input({ label, value, onChange, type='text', placeholder }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={{ display:'block', fontSize:13, fontWeight:500,
        color:'#374151', marginBottom:6 }}>{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ width:'100%', border:'1.5px solid #E5E7EB', borderRadius:12,
          padding:'11px 14px', fontSize:14, color:'#111', outline:'none',
          fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box',
          background:'white' }}
      />
    </div>
  )
}

// ─── Phone Frame ──────────────────────────────────────────────────────────────
function Frame({ children, bg }) {
  return (
    <div style={{ minHeight:'100vh', background:'#111', display:'flex',
      alignItems:'center', justifyContent:'center', padding:'20px',
      fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing:border-box; }
        .syne { font-family:'Syne',sans-serif !important; }
        input,select,textarea,button { font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:#ddd; border-radius:2px; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
      `}</style>
      <div style={{
        width:390, height:844, background: bg || BG,
        borderRadius:52, overflow:'hidden', position:'relative',
        boxShadow:'0 48px 96px rgba(0,0,0,0.7), inset 0 0 0 1.5px rgba(255,255,255,0.12)',
        display:'flex', flexDirection:'column',
      }}>
        {/* Status bar */}
        <div style={{ height:48, background:'white', flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 28px', borderBottom:'1px solid #F9FAFB' }}>
          <span style={{ fontSize:13, fontWeight:700, fontFamily:"'Syne',sans-serif" }}>9:41</span>
          <div style={{ width:24, height:10, border:'1.5px solid #111', borderRadius:3, padding:'1.5px 2px', display:'flex', alignItems:'center' }}>
            <div style={{ width:'70%', height:'100%', background:'#111', borderRadius:1.5 }} />
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ go }) {
  return (
    <Frame>
      <div style={{ flex:1, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', padding:'0 24px 48px' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:68, height:68, background:B, borderRadius:22,
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 14px', boxShadow:`0 12px 28px ${B}50` }}>
            <span className="syne" style={{ color:'white', fontSize:16, fontWeight:800, letterSpacing:'-0.5px' }}>L2Q</span>
          </div>
          <h1 className="syne" style={{ fontSize:26, fontWeight:800, color:'#111', margin:0 }}>Lead-to-Quote</h1>
          <p style={{ fontSize:13, color:'#9CA3AF', margin:'6px 0 0' }}>Quote faster. Win more jobs.</p>
        </div>
        <Card style={{ padding:24, width:'100%' }}>
          <h2 className="syne" style={{ fontSize:18, fontWeight:700, color:'#111', margin:'0 0 20px' }}>
            Welcome back
          </h2>
          <Input label="Email" value="mike@plumbing.com" onChange={() => {}} />
          <Input label="Password" type="password" value="••••••••" onChange={() => {}} />
          <BrandBtn onClick={() => go('dashboard')}>Sign in →</BrandBtn>
          <p style={{ textAlign:'center', fontSize:13, color:'#9CA3AF', margin:'14px 0 0' }}>
            No account?{' '}
            <span style={{ color:B, fontWeight:600, cursor:'pointer' }}
              onClick={() => go('onboarding')}>Sign up free</span>
          </p>
        </Card>
        <p style={{ fontSize:11, color:'#555', marginTop:14 }}>14 days free · No card required</p>
      </div>
    </Frame>
  )
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function OnboardingScreen({ go, setCountry }) {
  const [step, setStep] = useState(0)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [name, setName] = useState('')
  const [biz, setBiz] = useState('')
  const [phone, setPhone] = useState('')
  const [bankField1, setBankField1] = useState('')
  const [bankField2, setBankField2] = useState('')
  const [stripeConnected, setStripeConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const STEPS = ['Account', 'Country', 'Business', 'Payments']

  const cfg = selectedCountry ? COUNTRY_CONFIG[selectedCountry] : null

  // Bank field labels per country
  const bankFields = {
    US: [{ label: 'Routing number', placeholder: '021000021' }, { label: 'Account number', placeholder: '••••••4521' }],
    PT: [{ label: 'IBAN', placeholder: 'PT50 0010 0000 0000 1234 5' }, null],
    UK: [{ label: 'Sort code', placeholder: '20-00-00' }, { label: 'Account number', placeholder: '••••4521' }],
  }

  function simulateStripeConnect() {
    setConnecting(true)
    setTimeout(() => { setConnecting(false); setStripeConnected(true) }, 1800)
  }

  return (
    <Frame>
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>

        {/* Progress bar */}
        <div style={{ background:'white', borderBottom:'1px solid #F3F4F6', padding:'16px 20px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ width:32, height:32, background:B, borderRadius:10,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="syne" style={{ color:'white', fontSize:11, fontWeight:800 }}>L2Q</span>
            </div>
            <span className="syne" style={{ fontSize:14, fontWeight:700, color:'#111' }}>
              Create your account
            </span>
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ flex:1 }}>
                <div style={{ height:3, borderRadius:2, marginBottom:4,
                  background: i <= step ? B : '#E5E7EB' }} />
                <span style={{ fontSize:10, fontWeight: i===step ? 600 : 400,
                  color: i===step ? B : '#9CA3AF' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'24px 20px' }}>

          {/* ── Step 0: Account ── */}
          {step === 0 && (
            <div>
              <h2 className="syne" style={{ fontSize:22, fontWeight:700, color:'#111', margin:'0 0 6px' }}>
                Create your account
              </h2>
              <p style={{ fontSize:13, color:'#9CA3AF', margin:'0 0 24px' }}>
                14 days free. No card needed.
              </p>
              <Input label="Email address" value="" onChange={()=>{}} placeholder="you@example.com" />
              <Input label="Password" type="password" value="" onChange={()=>{}} placeholder="Min. 8 characters" />
              <BrandBtn onClick={() => setStep(1)}>Continue →</BrandBtn>
            </div>
          )}

          {/* ── Step 1: Country ── */}
          {step === 1 && (
            <div>
              <h2 className="syne" style={{ fontSize:22, fontWeight:700, color:'#111', margin:'0 0 6px' }}>
                Where do you work?
              </h2>
              <p style={{ fontSize:13, color:'#9CA3AF', margin:'0 0 20px' }}>
                Sets your currency, tax, bank format, and Stripe fees automatically.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
                {Object.entries(COUNTRY_CONFIG).map(([key, c]) => (
                  <button key={key} onClick={() => setSelectedCountry(key)}
                    style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'14px 16px',
                      borderRadius:18, border:`2px solid ${selectedCountry===key ? B : '#E5E7EB'}`,
                      background: selectedCountry===key ? `${B}08` : 'white',
                      cursor:'pointer', textAlign:'left', transition:'all 0.15s',
                      boxShadow: selectedCountry===key ? `0 2px 12px ${B}20` : 'none' }}>
                    <span style={{ fontSize:28, flexShrink:0 }}>{c.flag}</span>
                    <div style={{ flex:1 }}>
                      <p className="syne" style={{ fontSize:15, fontWeight:700,
                        color: selectedCountry===key ? B : '#111', margin:'0 0 8px' }}>
                        {c.label}
                      </p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 6px' }}>
                        {[
                          `${c.symbol} ${c.currency}`,
                          `Stripe ${c.stripe.label}`,
                          c.tax.enabled ? `${c.tax.label} ${(c.tax.rate*100).toFixed(0)}%` : 'No VAT',
                          c.bank.label,
                        ].map((tag, i) => (
                          <span key={i} style={{ fontSize:10, fontWeight:500,
                            background: selectedCountry===key ? `${B}15` : '#F3F4F6',
                            color: selectedCountry===key ? B : '#6B7280',
                            padding:'2px 7px', borderRadius:6 }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedCountry===key && (
                      <div style={{ width:22, height:22, borderRadius:'50%', background:B,
                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ color:'white', fontSize:11, fontWeight:700 }}>✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <BrandBtn onClick={() => { if(selectedCountry) setStep(2) }} disabled={!selectedCountry}>
                Continue →
              </BrandBtn>
            </div>
          )}

          {/* ── Step 2: Business ── */}
          {step === 2 && (
            <div>
              <h2 className="syne" style={{ fontSize:22, fontWeight:700, color:'#111', margin:'0 0 6px' }}>
                Your business
              </h2>
              <p style={{ fontSize:13, color:'#9CA3AF', margin:'0 0 24px' }}>
                Appears on every quote you send.
              </p>
              <Input label="Your name" value={name} onChange={e=>setName(e.target.value)}
                placeholder="Mike Johnson" />
              <Input label="Business name" value={biz} onChange={e=>setBiz(e.target.value)}
                placeholder="Mike's Plumbing" />
              <Input label="Phone number" value={phone} onChange={e=>setPhone(e.target.value)}
                placeholder={cfg?.phone || '+1 555 000 0000'} type="tel" />
              <p style={{ fontSize:11, color:'#9CA3AF', marginTop:-10, marginBottom:16 }}>
                Shown on quotes so clients can call you directly.
              </p>
              <BrandBtn onClick={() => setStep(3)}>Continue →</BrandBtn>
            </div>
          )}

          {/* ── Step 3: Payments ── */}
          {step === 3 && cfg && (
            <div>
              <h2 className="syne" style={{ fontSize:22, fontWeight:700, color:'#111', margin:'0 0 6px' }}>
                Payment setup
              </h2>
              <p style={{ fontSize:13, color:'#9CA3AF', margin:'0 0 20px' }}>
                How your clients pay you. Shown on every quote.
              </p>

              {/* Bank account */}
              <div style={{ marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <span style={{ fontSize:18 }}>🏦</span>
                  <p className="syne" style={{ fontSize:14, fontWeight:700, color:'#111', margin:0 }}>
                    {cfg.bank.label}
                  </p>
                  <span style={{ fontSize:11, fontWeight:600, color:'#16A34A',
                    background:'#F0FDF4', padding:'2px 7px', borderRadius:6 }}>
                    No fee
                  </span>
                </div>
                {(bankFields[selectedCountry] || []).filter(Boolean).map((field, i) => (
                  <Input key={i} label={field.label}
                    value={i===0 ? bankField1 : bankField2}
                    onChange={e => i===0 ? setBankField1(e.target.value) : setBankField2(e.target.value)}
                    placeholder={field.placeholder}
                  />
                ))}
                <p style={{ fontSize:11, color:'#9CA3AF', marginTop:-10, marginBottom:8 }}>
                  Clients who choose bank transfer will see these details on the quote.
                </p>
              </div>

              {/* Divider */}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                <div style={{ flex:1, height:1, background:'#E5E7EB' }} />
                <span style={{ fontSize:12, color:'#9CA3AF' }}>and / or</span>
                <div style={{ flex:1, height:1, background:'#E5E7EB' }} />
              </div>

              {/* Stripe connect */}
              <div style={{ marginBottom:24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <span style={{ fontSize:18 }}>💳</span>
                  <p className="syne" style={{ fontSize:14, fontWeight:700, color:'#111', margin:0 }}>
                    Card payments via Stripe
                  </p>
                </div>

                {!stripeConnected ? (
                  <div style={{ border:'2px dashed #E5E7EB', borderRadius:16,
                    padding:'18px 16px', textAlign:'center' }}>
                    <div style={{ width:44, height:44, background:'#F9FAFB', borderRadius:12,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      margin:'0 auto 10px' }}>
                      <span style={{ fontSize:22 }}>💳</span>
                    </div>
                    <p style={{ fontSize:13, fontWeight:600, color:'#111', margin:'0 0 4px' }}>
                      Connect your Stripe account
                    </p>
                    <p style={{ fontSize:11, color:'#9CA3AF', margin:'0 0 14px', lineHeight:1.5 }}>
                      Clients pay deposits and invoices by card.{'\n'}
                      Fee: {cfg.stripe.label} — charged to the client, not you.
                    </p>
                    <button onClick={simulateStripeConnect} disabled={connecting}
                      style={{ background: connecting ? '#9CA3AF' : '#635BFF',
                        color:'white', border:'none', borderRadius:12,
                        padding:'11px 20px', fontSize:13, fontWeight:700,
                        cursor: connecting ? 'default' : 'pointer',
                        display:'inline-flex', alignItems:'center', gap:8 }}>
                      {connecting ? (
                        <><span style={{ display:'inline-block', width:14, height:14,
                          border:'2px solid white', borderTopColor:'transparent',
                          borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                          Connecting...</>
                      ) : (
                        <><span style={{ fontWeight:800, letterSpacing:'-0.5px' }}>S</span>
                          Connect with Stripe</>
                      )}
                    </button>
                    <p style={{ fontSize:10, color:'#D1D5DB', margin:'10px 0 0' }}>
                      You'll be redirected to Stripe to create or link your account.
                    </p>
                  </div>
                ) : (
                  <div style={{ background:'#F0FDF4', border:'1.5px solid #86EFAC',
                    borderRadius:16, padding:'14px 16px',
                    display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:40, height:40, background:'#635BFF', borderRadius:10,
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ color:'white', fontWeight:900, fontSize:16,
                        letterSpacing:'-1px' }}>S</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:'#15803D', margin:0 }}>
                        ✓ Stripe connected
                      </p>
                      <p style={{ fontSize:11, color:'#16A34A', margin:'2px 0 0' }}>
                        mike@plumbing.com · {cfg.stripe.label} fee to client
                      </p>
                    </div>
                    <button onClick={() => setStripeConnected(false)}
                      style={{ background:'none', border:'none', cursor:'pointer',
                        fontSize:11, color:'#9CA3AF' }}>Change</button>
                  </div>
                )}
              </div>

              {/* Skip note */}
              <p style={{ fontSize:11, color:'#9CA3AF', textAlign:'center', margin:'0 0 16px' }}>
                You can skip payments for now and set them up later in Settings.
              </p>

              <BrandBtn onClick={() => { setCountry(selectedCountry || 'US'); go('dashboard') }}>
                Start using Lead-to-Quote →
              </BrandBtn>
            </div>
          )}
        </div>

        {step > 0 && (
          <div style={{ padding:'0 20px 24px' }}>
            <button onClick={() => setStep(s => s-1)}
              style={{ background:'none', border:'none', cursor:'pointer',
                fontSize:13, color:'#9CA3AF' }}>← Back</button>
          </div>
        )}
      </div>
    </Frame>
  )
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ go, leads, setLeads }) {
  const [tab, setTab] = useState('new')
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [copied, setCopied] = useState(false)

  const tabs = [
    { k:'new',    label:'New',    n: leads.filter(l=>l.status==='new').length },
    { k:'quoted', label:'Quoted', n: leads.filter(l=>l.status==='quoted').length },
    { k:'closed', label:'Closed', n: leads.filter(l=>['won','lost'].includes(l.status)).length },
  ]

  const filtered = leads.filter(l =>
    tab==='new' ? l.status==='new' :
    tab==='quoted' ? l.status==='quoted' :
    ['won','lost'].includes(l.status)
  )

  const wonVal  = leads.filter(l=>l.status==='won').reduce((s,l)=>s+(l.total||0),0)
  const quotVal = leads.filter(l=>['quoted','won'].includes(l.status)).reduce((s,l)=>s+(l.total||0),0)

  function addLead(e) {
    e.preventDefault()
    if (!newName) return
    const nl = { id: String(Date.now()), name:newName, phone:newPhone,
      job_type:'', status:'new', time:'just now', total:null }
    setLeads(p => [nl, ...p])
    setNewName(''); setNewPhone('')
    setAddOpen(false)
    go('lead', nl)
  }

  return (
    <Frame>
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:BG }}>

        {/* Header */}
        <div style={{ background:'white', padding:'16px 20px 12px',
          borderBottom:'1px solid #F3F4F6', position:'sticky', top:0, zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div>
              <h1 className="syne" style={{ fontSize:20, fontWeight:700, color:'#111', margin:0 }}>
                Mike's Plumbing
              </h1>
              <p style={{ fontSize:12, color:'#9CA3AF', margin:'2px 0 0' }}>Leads & Quotes</p>
            </div>
            <button onClick={() => setAddOpen(true)} style={{ background:B, color:'white',
              border:'none', borderRadius:12, padding:'8px 14px', fontSize:13,
              fontWeight:600, cursor:'pointer' }}>
              + New Lead
            </button>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            <div style={{ background:BG, borderRadius:14, padding:'10px 14px' }}>
              <p style={{ fontSize:11, color:'#9CA3AF', margin:'0 0 2px' }}>Quoted (month)</p>
              <p className="syne" style={{ fontSize:20, fontWeight:700, color:'#111', margin:0 }}>
                {fmt(quotVal)}
              </p>
            </div>
            <div style={{ background:'#F0FDF4', borderRadius:14, padding:'10px 14px' }}>
              <p style={{ fontSize:11, color:'#16A34A', margin:'0 0 2px' }}>Won (month)</p>
              <p className="syne" style={{ fontSize:20, fontWeight:700, color:'#15803D', margin:0 }}>
                {fmt(wonVal)}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', background:'#F3F4F6', borderRadius:14, padding:4, gap:3 }}>
            {tabs.map(t => (
              <button key={t.k} onClick={() => setTab(t.k)} style={{
                flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                padding:'8px 0', borderRadius:11, border:'none', cursor:'pointer',
                fontSize:13, fontWeight:600, transition:'all 0.15s',
                background: tab===t.k ? 'white' : 'transparent',
                color: tab===t.k ? '#111' : '#9CA3AF',
                boxShadow: tab===t.k ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
                {t.label}
                {t.n > 0 && (
                  <span style={{ fontSize:10, fontWeight:700, borderRadius:10,
                    padding:'1px 5px', lineHeight:'16px',
                    background: tab===t.k ? B : '#E5E7EB',
                    color: tab===t.k ? 'white' : '#6B7280' }}>
                    {t.n}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Lead list */}
        <div style={{ flex:1, padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', paddingTop:60 }}>
              <div style={{ fontSize:40, marginBottom:10 }}>
                {tab==='new' ? '📋' : tab==='quoted' ? '📨' : '🏆'}
              </div>
              <p style={{ color:'#9CA3AF', fontSize:14 }}>
                {tab==='new' ? 'No new leads' : tab==='quoted' ? 'No quotes sent yet' : 'No closed deals'}
              </p>
              {tab==='new' && (
                <button onClick={() => setAddOpen(true)}
                  style={{ color:B, fontWeight:600, fontSize:13, background:'none',
                    border:'none', cursor:'pointer', marginTop:8 }}>
                  + Add first lead
                </button>
              )}
            </div>
          ) : filtered.map(lead => (
            <button key={lead.id} onClick={() => go('lead', lead)} style={{
              background:'white', border:'1px solid #F3F4F6', borderRadius:18,
              padding:'14px 16px', textAlign:'left', cursor:'pointer', width:'100%',
              boxShadow:'0 1px 3px rgba(0,0,0,0.04)', transition:'transform 0.1s',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                    <span className="syne" style={{ fontSize:15, fontWeight:600, color:'#111' }}>
                      {lead.name}
                    </span>
                    <Pill status={lead.status} />
                  </div>
                  <p style={{ fontSize:13, color:'#6B7280', margin:0 }}>{lead.job_type || 'No job type'}</p>
                  {lead.phone && <p style={{ fontSize:12, color:'#9CA3AF', margin:'2px 0 0' }}>{lead.phone}</p>}
                  {lead.viewed && (
                    <p style={{ fontSize:11, color:'#2563EB', margin:'3px 0 0',
                      display:'flex', alignItems:'center', gap:3, fontWeight:500 }}>
                      <span>👁</span> Seen 2 min ago
                    </p>
                  )}
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  {lead.total ? (
                    <p className="syne" style={{ fontSize:15, fontWeight:700, color:'#111', margin:0 }}>
                      {fmt(lead.total)}
                    </p>
                  ) : (
                    <p style={{ fontSize:12, color:B, fontWeight:600, margin:0 }}>Quote needed</p>
                  )}
                  <p style={{ fontSize:11, color:'#D1D5DB', margin:'4px 0 0' }}>{lead.time}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ background:'white', borderTop:'1px solid #F3F4F6',
          padding:'12px 16px 20px', display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ flex:1, background:BG, borderRadius:12, padding:'8px 12px', minWidth:0 }}>
            <p style={{ fontSize:10, color:'#9CA3AF', margin:'0 0 1px' }}>Your intake form</p>
            <p style={{ fontSize:12, fontWeight:500, color:'#4B5563', margin:0,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              l2q.app/form/mikes-plumbing
            </p>
          </div>
          <button onClick={() => { setCopied(true); setTimeout(()=>setCopied(false),2000) }}
            style={{ background: copied ? '#16A34A' : B, color:'white', border:'none',
              borderRadius:12, padding:'10px 12px', fontSize:12, fontWeight:600,
              cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, transition:'background 0.2s' }}>
            {copied ? '✓ Copied!' : 'Copy link'}
          </button>
          <button onClick={() => go('rates')}
            style={{ background:'#F3F4F6', color:'#374151', border:'none',
              borderRadius:12, padding:'10px 12px', fontSize:12, fontWeight:600,
              cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
            ⚙ My Rates
          </button>
          <button onClick={() => go('billing')}
            style={{ background:'#F3F4F6', color:'#374151', border:'none',
              borderRadius:12, padding:'10px 12px', fontSize:12, fontWeight:600,
              cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
            💳 Plan
          </button>
        </div>
      </div>

      {/* Add lead modal */}
      {addOpen && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)',
          display:'flex', alignItems:'flex-end', zIndex:50 }}
          onClick={() => setAddOpen(false)}>
          <form onSubmit={addLead} style={{ background:'white', width:'100%',
            borderRadius:'28px 28px 0 0', padding:'20px 20px 32px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width:40, height:4, background:'#E5E7EB',
              borderRadius:2, margin:'0 auto 20px' }} />
            <h3 className="syne" style={{ fontSize:18, fontWeight:700, margin:'0 0 18px' }}>New lead</h3>
            <Input label="Customer name *" value={newName}
              onChange={e=>setNewName(e.target.value)} placeholder="e.g. João Silva" />
            <Input label="Phone number" value={newPhone}
              onChange={e=>setNewPhone(e.target.value)} placeholder="+351 910 000 000" type="tel" />
            <BrandBtn onClick={addLead}>Create & build quote →</BrandBtn>
          </form>
        </div>
      )}
    </Frame>
  )
}

// ─── LEAD / QUOTE BUILDER ─────────────────────────────────────────────────────
function LeadScreen({ go, lead, leads, setLeads }) {
  const [sections, setSections] = useState(INIT_SECTIONS)
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [sending, setSending] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [sent, setSent] = useState(null) // 'wa' | 'email' | null
  const [leadStatus, setLeadStatus] = useState(lead?.status || 'new')
  const [ratesLoaded, setRatesLoaded] = useState(false)
  const [depositPct, setDepositPct] = useState(30)
  const [payMethod, setPayMethod] = useState(['bank','card'])
  const [addSecOpen, setAddSecOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailInput, setEmailInput] = useState('')

  const subtotal = sections.reduce((s,sec)=>s+sec.items.reduce((ss,i)=>ss+i.total,0),0)
  const tax = subtotal * 0.23
  const total = subtotal + tax

  const EXTRA_TRADES = ['Electrical','Painting','Plastering','Tiling','Carpentry']

  function updItem(sid, iid, field, val) {
    setSaved(false)
    setSections(p => p.map(s => {
      if(s.id!==sid) return s
      return { ...s, items: s.items.map(i => {
        if(i.id!==iid) return i
        const u = { ...i, [field]: field==='name' ? val : (parseFloat(val)||0) }
        u.total = u.qty * u.unit_price
        return u
      })}
    }))
  }

  function addItem(sid) {
    setSections(p => p.map(s => s.id!==sid ? s : {
      ...s, items:[...s.items,{id:`i${Date.now()}`,name:'',qty:1,unit_price:0,total:0}]
    }))
  }

  function removeItem(sid, iid) {
    setSaved(false)
    setSections(p => p.map(s => s.id!==sid ? s : {
      ...s, items: s.items.filter(i=>i.id!==iid)
    }))
  }

  function addSection(name) {
    setSections(p => [...p, {
      id:`s${Date.now()}`, tradeName:name,
      items:[{id:`i${Date.now()}`,name:'Labour',qty:1,unit_price:0,total:0}]
    }])
    setAddSecOpen(false)
  }

  function handleSend() {
    setSending(true)
    setTimeout(() => {
      setSending(false); setSent('wa'); setSaved(true)
      setLeadStatus('quoted')
      setLeads(p => p.map(l => l.id===lead?.id ? {...l, status:'quoted', total} : l))
    }, 1200)
  }

  function handleEmail() {
    // No email on file — prompt first
    if (!lead?.email && !emailInput) {
      setEmailModalOpen(true)
      return
    }
    doSendEmail()
  }

  function doSendEmail() {
    setEmailSending(true)
    setTimeout(() => {
      setEmailSending(false); setSent('email'); setSaved(true)
      setLeadStatus('quoted')
      setEmailModalOpen(false)
      setLeads(p => p.map(l => l.id===lead?.id
        ? {...l, status:'quoted', total, email: emailInput || l.email}
        : l))
    }, 1200)
  }

  return (
    <Frame>
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:BG }}>

        {/* Header */}
        <div style={{ background:'white', padding:'12px 16px',
          borderBottom:'1px solid #F3F4F6', position:'sticky', top:0, zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <BackBtn onClick={() => go('dashboard')} />
            <div style={{ flex:1 }}>
              <h2 className="syne" style={{ fontSize:17, fontWeight:700, color:'#111', margin:0 }}>
                {lead?.name || 'Lead'}
              </h2>
              <p style={{ fontSize:12, color:'#9CA3AF', margin:'1px 0 0' }}>
                {lead?.job_type || 'No job type'} · {lead?.phone || '—'}
              </p>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={() => { setLeadStatus('won'); setLeads(p=>p.map(l=>l.id===lead?.id?{...l,status:'won',total}:l)) }}
                style={{ background: leadStatus==='won' ? '#F0FDF4' : '#F9FAFB',
                  color: leadStatus==='won' ? '#15803D' : '#6B7280',
                  border:`1.5px solid ${leadStatus==='won'?'#86EFAC':'#E5E7EB'}`,
                  borderRadius:9, padding:'5px 10px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                ✓ Won
              </button>
              <button onClick={() => { setLeadStatus('lost'); setLeads(p=>p.map(l=>l.id===lead?.id?{...l,status:'lost'}:l)) }}
                style={{ background: leadStatus==='lost' ? '#F4F4F5' : '#F9FAFB',
                  color: leadStatus==='lost' ? '#71717A' : '#6B7280',
                  border:'1.5px solid #E5E7EB',
                  borderRadius:9, padding:'5px 10px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                ✕ Lost
              </button>
            </div>
          </div>
          {leadStatus==='won' && (
            <div style={{ background:'#F0FDF4', borderRadius:10, padding:'7px 12px',
              marginTop:10, fontSize:13, color:'#15803D', fontWeight:500,
              display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span>🏆 Job won! Well done.</span>
              <button onClick={() => go('invoice')}
                style={{ background:'#15803D', color:'white', border:'none',
                  borderRadius:8, padding:'5px 10px', fontSize:12, fontWeight:600,
                  cursor:'pointer', whiteSpace:'nowrap' }}>
                📄 Convert to Invoice
              </button>
            </div>
          )}
          {lead?.viewed && (
            <div style={{ background:'#EFF6FF', borderRadius:10, padding:'7px 12px',
              marginTop: leadStatus==='won' ? 6 : 10,
              display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:14 }}>👁</span>
              <p style={{ fontSize:12, color:'#2563EB', fontWeight:500, margin:0 }}>
                Customer opened the quote <strong>2 minutes ago</strong> — good time to call!
              </p>
            </div>
          )}
        </div>

        {/* Sections */}
        <div style={{ flex:1, padding:'14px 16px', display:'flex', flexDirection:'column', gap:12 }}>

          {/* Load my rates shortcut */}
          <button onClick={() => {
            const saved = [
              { id:`i${Date.now()}a`, name:'Labour (hourly)', qty:2, unit_price:70, total:140 },
              { id:`i${Date.now()}b`, name:'Call-out fee',    qty:1, unit_price:50, total:50  },
            ]
            setSections(p => p.map((s,i) => i===0 ? { ...s, items:[...s.items, ...saved.filter(r=>!s.items.find(it=>it.name===r.name))] } : s))
            setRatesLoaded(true)
          }} style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            background: ratesLoaded ? '#F0FDF4' : '#FFFBEB',
            border: `1.5px dashed ${ratesLoaded ? '#86EFAC' : '#FCD34D'}`,
            borderRadius:14, padding:'10px 14px', cursor:'pointer', width:'100%',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:16 }}>{ratesLoaded ? '✓' : '⚡'}</span>
              <div style={{ textAlign:'left' }}>
                <p style={{ fontSize:13, fontWeight:600, color: ratesLoaded ? '#15803D' : '#92400E', margin:0 }}>
                  {ratesLoaded ? 'My rates loaded!' : 'Load my saved rates'}
                </p>
                <p style={{ fontSize:11, color: ratesLoaded ? '#16A34A' : '#B45309', margin:'1px 0 0' }}>
                  {ratesLoaded ? 'Edit freely below' : 'Labour €70/hr · Call-out €50 · Parts'}
                </p>
              </div>
            </div>
            {!ratesLoaded && (
              <span style={{ fontSize:12, color:'#D97706', fontWeight:600 }}>Tap to load</span>
            )}
          </button>

          {sections.map(sec => (
            <Card key={sec.id} style={{ overflow:'hidden' }}>
              {/* Section header */}
              <div style={{ background:'#F9FAFB', padding:'10px 16px',
                borderBottom:'1px solid #F3F4F6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span className="syne" style={{ fontSize:13, fontWeight:600, color:'#374151' }}>
                  {sec.tradeName}
                </span>
                {sections.length > 1 && (
                  <button onClick={() => setSections(p=>p.filter(s=>s.id!==sec.id))}
                    style={{ background:'none', border:'none', cursor:'pointer',
                      fontSize:11, color:'#9CA3AF' }}>Remove</button>
                )}
              </div>

              {/* Items */}
              {sec.items.map(item => (
                <div key={item.id} style={{ padding:'10px 14px',
                  borderBottom:'1px solid #FAFAFA' }}>
                  <div style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
                    <input value={item.name}
                      onChange={e=>updItem(sec.id,item.id,'name',e.target.value)}
                      placeholder="Item description"
                      style={{ flex:1, border:'none', fontSize:13, color:'#111',
                        outline:'none', background:'transparent', padding:0 }}
                    />
                    <button onClick={()=>removeItem(sec.id,item.id)}
                      style={{ background:'none', border:'none', cursor:'pointer',
                        color:'#D1D5DB', fontSize:16, padding:0, lineHeight:1 }}>×</button>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6,
                      background:'#F9FAFB', borderRadius:8, padding:'5px 10px' }}>
                      <span style={{ fontSize:11, color:'#9CA3AF' }}>Qty</span>
                      <input type="number" value={item.qty}
                        onChange={e=>updItem(sec.id,item.id,'qty',e.target.value)}
                        style={{ width:30, border:'none', fontSize:13, fontWeight:500,
                          color:'#111', outline:'none', background:'transparent',
                          textAlign:'center', padding:0 }}
                      />
                    </div>
                    <span style={{ color:'#D1D5DB', fontSize:13 }}>×</span>
                    <div style={{ display:'flex', alignItems:'center', gap:4,
                      background:'#F9FAFB', borderRadius:8, padding:'5px 10px', flex:1 }}>
                      <span style={{ fontSize:11, color:'#9CA3AF' }}>€</span>
                      <input type="number" value={item.unit_price}
                        onChange={e=>updItem(sec.id,item.id,'unit_price',e.target.value)}
                        placeholder="0"
                        style={{ flex:1, border:'none', fontSize:13, fontWeight:500,
                          color:'#111', outline:'none', background:'transparent', padding:0 }}
                      />
                    </div>
                    <span className="syne" style={{ fontSize:14, fontWeight:600,
                      color:'#111', minWidth:60, textAlign:'right' }}>
                      {fmt(item.total)}
                    </span>
                  </div>
                </div>
              ))}

              <button onClick={()=>addItem(sec.id)} style={{
                width:'100%', padding:'10px 14px', background:'none', border:'none',
                cursor:'pointer', fontSize:13, color:B, fontWeight:500, textAlign:'left' }}>
                + Add line item
              </button>
            </Card>
          ))}

          {/* Add section */}
          <button onClick={()=>setAddSecOpen(true)} style={{
            background:'white', border:'2px dashed #E5E7EB', borderRadius:18,
            padding:'14px', fontSize:13, color:'#9CA3AF', fontWeight:500,
            cursor:'pointer', textAlign:'center', width:'100%',
            transition:'all 0.15s' }}>
            + Add another trade section
          </button>

          {/* Notes */}
          <Card style={{ padding:'14px 16px' }}>
            <p className="syne" style={{ fontSize:12, fontWeight:600, color:'#6B7280',
              textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 8px' }}>Notes</p>
            <textarea value={notes} onChange={e=>{setNotes(e.target.value);setSaved(false)}}
              placeholder="Any extra info for the customer..."
              rows={2} style={{ width:'100%', border:'none', fontSize:13, color:'#374151',
                outline:'none', resize:'none', fontFamily:"'DM Sans',sans-serif",
                padding:0, background:'transparent' }}
            />
          </Card>

          {/* Payment settings */}
          <Card style={{ padding:'14px 16px' }}>
            <p className="syne" style={{ fontSize:12, fontWeight:600, color:'#6B7280',
              textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 12px' }}>
              Payment Settings
            </p>
            {/* Deposit % */}
            <div style={{ marginBottom:12 }}>
              <p style={{ fontSize:12, color:'#374151', fontWeight:500, margin:'0 0 8px' }}>
                Deposit required upfront
              </p>
              <div style={{ display:'flex', gap:6 }}>
                {[0, 25, 30, 50].map(pct => (
                  <button key={pct} onClick={() => setDepositPct(pct)}
                    style={{ flex:1, padding:'7px 0', borderRadius:10, border:'1.5px solid',
                      fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                      borderColor: depositPct===pct ? B : '#E5E7EB',
                      background: depositPct===pct ? `${B}15` : 'white',
                      color: depositPct===pct ? B : '#6B7280' }}>
                    {pct===0 ? 'None' : `${pct}%`}
                  </button>
                ))}
              </div>
              {depositPct > 0 && (
                <p style={{ fontSize:12, color:B, fontWeight:500, margin:'6px 0 0' }}>
                  Deposit: {fmt(total * depositPct / 100)} · Remaining: {fmt(total * (1 - depositPct/100))}
                </p>
              )}
            </div>
            {/* Payment method */}
            <div>
              <p style={{ fontSize:12, color:'#374151', fontWeight:500, margin:'0 0 8px' }}>
                Accepted payment methods
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[
                  { key:'bank',  label:'Bank Transfer', icon:'🏦', sub:'IBAN details on quote' },
                  { key:'card',  label:'Card (Stripe)',  icon:'💳', sub:'Customer pays online' },
                  { key:'cash',  label:'Cash on the day', icon:'💵', sub:'' },
                  { key:'other', label:'To be agreed',   icon:'🤝', sub:'' },
                ].map(m => (
                  <button key={m.key}
                    onClick={() => setPayMethod(p => p.includes(m.key) ? p.filter(x=>x!==m.key) : [...p, m.key])}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                      borderRadius:12, border:'1.5px solid',
                      borderColor: payMethod.includes(m.key) ? B : '#E5E7EB',
                      background: payMethod.includes(m.key) ? `${B}08` : 'white',
                      cursor:'pointer', textAlign:'left' }}>
                    <span style={{ fontSize:18 }}>{m.icon}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:13, fontWeight:600, margin:0,
                        color: payMethod.includes(m.key) ? B : '#374151' }}>{m.label}</p>
                      {m.sub && <p style={{ fontSize:11, color:'#9CA3AF', margin:0 }}>{m.sub}</p>}
                    </div>
                    <div style={{ width:18, height:18, borderRadius:5, border:'2px solid',
                      borderColor: payMethod.includes(m.key) ? B : '#D1D5DB',
                      background: payMethod.includes(m.key) ? B : 'white',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {payMethod.includes(m.key) && (
                        <span style={{ color:'white', fontSize:10, fontWeight:700 }}>✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Totals */}
          <Card style={{ padding:'14px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:13, color:'#6B7280' }}>Subtotal</span>
              <span style={{ fontSize:13, fontWeight:500 }}>{fmt(subtotal)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:13, color:'#6B7280' }}>Tax (0%)</span>
              <span style={{ fontSize:13, color:'#9CA3AF' }}>—</span>
            </div>
            {payMethod.includes('card') && (() => {
              const stripeFee = total * 0.029 + 0.30
              return (
                <div style={{ display:'flex', justifyContent:'space-between',
                  marginBottom:6, padding:'6px 8px', background:'#F0F9FF',
                  borderRadius:8, border:'1px solid #BAE6FD' }}>
                  <div>
                    <span style={{ fontSize:13, color:'#0369A1', fontWeight:500 }}>
                      💳 Card processing fee
                    </span>
                    <span style={{ fontSize:10, color:'#7DD3FC', marginLeft:5 }}>
                      paid by client
                    </span>
                  </div>
                  <span style={{ fontSize:13, fontWeight:600, color:'#0369A1' }}>
                    {fmt(stripeFee)}
                  </span>
                </div>
              )
            })()}
            <div style={{ display:'flex', justifyContent:'space-between',
              borderTop:'1px solid #F3F4F6', paddingTop:10,
              marginBottom: depositPct > 0 ? 10 : 0, marginTop:4 }}>
              <div>
                <span className="syne" style={{ fontSize:18, fontWeight:700 }}>Total</span>
                {payMethod.includes('card') && (
                  <p style={{ fontSize:10, color:'#9CA3AF', margin:'1px 0 0' }}>
                    incl. Stripe fee if paying by card
                  </p>
                )}
              </div>
              <span className="syne" style={{ fontSize:20, fontWeight:800, color:B }}>
                {payMethod.includes('card') ? fmt(total + total * 0.029 + 0.30) : fmt(total)}
              </span>
            </div>
            {depositPct > 0 && (() => {
              const grandTotal = payMethod.includes('card') ? total + total * 0.029 + 0.30 : total
              return (
                <>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    background:'#FFFBEB', borderRadius:10, padding:'8px 10px', marginBottom:6 }}>
                    <span style={{ fontSize:13, color:'#B45309', fontWeight:600 }}>
                      Deposit due now ({depositPct}%)
                    </span>
                    <span style={{ fontSize:13, fontWeight:700, color:'#B45309' }}>
                      {fmt(grandTotal * depositPct / 100)}
                    </span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 10px' }}>
                    <span style={{ fontSize:12, color:'#9CA3AF' }}>Remaining on completion</span>
                    <span style={{ fontSize:12, color:'#9CA3AF' }}>
                      {fmt(grandTotal * (1 - depositPct/100))}
                    </span>
                  </div>
                </>
              )
            })()}
          </Card>

          <div style={{ height:20 }} />
        </div>

        {/* Action bar */}
        <div style={{ background:'white', borderTop:'1px solid #F3F4F6',
          padding:'12px 16px 24px', display:'flex', flexDirection:'column', gap:8 }}>
          {/* Row 1: Save + Preview */}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setSaved(true)}
              style={{ flex:1, border:'1.5px solid #E5E7EB', background:'white',
                borderRadius:12, padding:'10px 0', fontSize:13, fontWeight:600,
                cursor:'pointer', color:'#374151' }}>
              {saved ? '✓ Saved' : 'Save draft'}
            </button>
            <button onClick={()=>go('quote')}
              style={{ flex:1, border:'1.5px solid #E5E7EB', background:'white',
                borderRadius:12, padding:'10px 0', fontSize:13, fontWeight:600,
                cursor:'pointer', color:'#374151' }}>
              Preview
            </button>
          </div>
          {/* Row 2: Send buttons */}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleSend} disabled={sending || total===0}
              style={{ flex:1, background: sent==='wa' ? '#16A34A' : '#25D366',
                color:'white', border:'none', borderRadius:12, padding:'12px 0',
                fontSize:13, fontWeight:600, cursor: total===0 ? 'default':'pointer',
                opacity: total===0 ? 0.5 : 1, transition:'all 0.2s',
                display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
              {sending==='wa' ? '...' : sent==='wa' ? '✓ Sent!' : <><span>📱</span> WhatsApp</>}
            </button>
            <button onClick={handleEmail} disabled={emailSending || total===0}
              style={{ flex:1, background: sent==='email' ? '#16A34A' : '#2563EB',
                color:'white', border:'none', borderRadius:12, padding:'12px 0',
                fontSize:13, fontWeight:600, cursor: total===0 ? 'default':'pointer',
                opacity: total===0 ? 0.5 : 1, transition:'all 0.2s',
                display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
              {emailSending ? '...' : sent==='email' ? '✓ Sent!' : <><span>✉️</span> Email</>}
            </button>
          </div>
        </div>
      </div>

      {/* Add section modal */}
      {addSecOpen && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)',
          display:'flex', alignItems:'flex-end', zIndex:50 }}
          onClick={()=>setAddSecOpen(false)}>
          <div style={{ background:'white', width:'100%',
            borderRadius:'28px 28px 0 0', padding:'20px 16px 32px' }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ width:40, height:4, background:'#E5E7EB',
              borderRadius:2, margin:'0 auto 20px' }} />
            <h3 className="syne" style={{ fontSize:17, fontWeight:700, margin:'0 0 16px' }}>
              Add trade section
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {EXTRA_TRADES.map(t => (
                <button key={t} onClick={()=>addSection(t)} style={{
                  padding:'12px 14px', background:'#F9FAFB', border:'1.5px solid #E5E7EB',
                  borderRadius:12, fontSize:13, fontWeight:500, cursor:'pointer',
                  textAlign:'left', color:'#374151' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Email modal — only shows when no email on file */}
      {emailModalOpen && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)',
          display:'flex', alignItems:'flex-end', zIndex:50 }}
          onClick={() => setEmailModalOpen(false)}>
          <div style={{ background:'white', width:'100%',
            borderRadius:'28px 28px 0 0', padding:'20px 20px 32px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width:40, height:4, background:'#E5E7EB',
              borderRadius:2, margin:'0 auto 18px' }} />
            <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:16 }}>
              <div style={{ width:40, height:40, background:'#EFF6FF', borderRadius:12,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:18 }}>✉️</span>
              </div>
              <div>
                <h3 className="syne" style={{ fontSize:16, fontWeight:700,
                  color:'#111', margin:'0 0 3px' }}>
                  No email on file
                </h3>
                <p style={{ fontSize:13, color:'#6B7280', margin:0 }}>
                  Add {lead?.name?.split(' ')[0]}'s email to send the quote.
                </p>
              </div>
            </div>
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="client@example.com"
              autoFocus
              style={{ width:'100%', border:'1.5px solid #E5E7EB', borderRadius:12,
                padding:'12px 14px', fontSize:14, outline:'none', marginBottom:12,
                boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif" }}
            />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setEmailModalOpen(false)}
                style={{ flex:1, border:'1.5px solid #E5E7EB', background:'white',
                  borderRadius:12, padding:'12px 0', fontSize:13, fontWeight:600,
                  cursor:'pointer', color:'#6B7280' }}>
                Cancel
              </button>
              <button
                onClick={() => { if(emailInput) doSendEmail() }}
                disabled={!emailInput || emailSending}
                style={{ flex:2, background: emailInput ? '#2563EB' : '#E5E7EB',
                  color: emailInput ? 'white' : '#9CA3AF', border:'none',
                  borderRadius:12, padding:'12px 0', fontSize:13, fontWeight:700,
                  cursor: emailInput ? 'pointer' : 'default', transition:'all 0.2s' }}>
                {emailSending ? 'Sending...' : 'Save & send quote ✉️'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Frame>
  )
}

// ─── QUOTE VIEW (customer) ─────────────────────────────────────────────────────
function QuoteScreen({ go, lead, isInvoice, onViewed }) {
  const [step, setStep] = useState('view') // 'view' | 'sign' | 'done'
  const [drawing, setDrawing] = useState(false)
  const [hasSig, setHasSig] = useState(false)
  const canvasRef = useState(null)
  const subtotal = 385, tax = 0, total = 385

  // Simulate "opened" tracking — fires once on mount
  useState(() => { if(onViewed) onViewed() }, [])

  function startDraw(e) {
    setDrawing(true)
    setHasSig(true)
  }

  const label = isInvoice ? 'Invoice' : 'Quotation'
  const refNum = isInvoice ? 'INV-0001' : 'Q-0001'

  return (
    <Frame bg="white">
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>

        {/* Business header */}
        <div style={{ background:'white', borderBottom:'1px solid #F3F4F6', padding:'16px 20px' }}>
          <div style={{ display:'flex', gap:14, alignItems:'center' }}>
            <div style={{ width:48, height:48, background:B, borderRadius:16,
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span className="syne" style={{ color:'white', fontSize:20, fontWeight:700 }}>M</span>
            </div>
            <div>
              <h1 className="syne" style={{ fontSize:16, fontWeight:700, color:'#111', margin:0 }}>
                Mike's Plumbing
              </h1>
              <p style={{ fontSize:12, color:'#9CA3AF', margin:'2px 0 0' }}>Available 24/7</p>
              <p style={{ fontSize:12, color:'#6B7280', margin:'1px 0 0' }}>+351 910 123 456</p>
            </div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px',
          display:'flex', flexDirection:'column', gap:14 }}>

          {/* Quote / Invoice header */}
          <Card style={{ padding:'16px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <p style={{ fontSize:11, color:'#9CA3AF', textTransform:'uppercase',
                  letterSpacing:'0.06em', margin:'0 0 4px' }}>{label}</p>
                <h2 className="syne" style={{ fontSize:24, fontWeight:800, color:B, margin:0 }}>
                  {refNum}
                </h2>
                {isInvoice && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4,
                    background:'#EFF6FF', color:'#2563EB', fontSize:11, fontWeight:600,
                    padding:'3px 8px', borderRadius:20, marginTop:6 }}>
                    📄 Invoice
                  </span>
                )}
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:11, color:'#9CA3AF', margin:'0 0 3px' }}>
                  {isInvoice ? 'Invoiced to' : 'Prepared for'}
                </p>
                <p className="syne" style={{ fontSize:14, fontWeight:600, color:'#111', margin:0 }}>
                  {lead?.name || 'João Silva'}
                </p>
                <p style={{ fontSize:12, color:'#9CA3AF', margin:'2px 0 0' }}>
                  {lead?.phone || '+1 917 555 0182'}
                </p>
              </div>
            </div>
            <div style={{ borderTop:'1px solid #F3F4F6', marginTop:12, paddingTop:10,
              display:'flex', gap:16, fontSize:12, color:'#9CA3AF' }}>
              <span>Date: {new Date().toLocaleDateString('pt-PT')}</span>
              {!isInvoice && <span>Valid 30 days</span>}
              {isInvoice && <span style={{ color:'#DC2626', fontWeight:500 }}>Due: {new Date(Date.now()+30*86400000).toLocaleDateString('pt-PT')}</span>}
            </div>
          </Card>

          {/* Items */}
          <Card style={{ overflow:'hidden' }}>
            <div style={{ background:`${B}12`, padding:'10px 16px',
              borderBottom:'1px solid #F3F4F6' }}>
              <span className="syne" style={{ fontSize:13, fontWeight:600, color:B }}>Plumbing</span>
            </div>
            {[
              { name:'Labour (hourly)', qty:2, up:70, total:140 },
              { name:'Call-out fee',    qty:1, up:50, total:50  },
              { name:'Parts & materials', qty:1, up:80, total:80 },
            ].map((item,i) => (
              <div key={i} style={{ padding:'12px 16px',
                borderBottom: i<2 ? '1px solid #FAFAFA' : 'none',
                display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:500, color:'#111', margin:0 }}>{item.name}</p>
                  {item.qty !== 1 && (
                    <p style={{ fontSize:11, color:'#9CA3AF', margin:'2px 0 0' }}>
                      {item.qty} × {fmt(item.up)}
                    </p>
                  )}
                </div>
                <span className="syne" style={{ fontSize:14, fontWeight:600, color:'#111', flexShrink:0 }}>
                  {fmt(item.total)}
                </span>
              </div>
            ))}
          </Card>

          {/* Totals */}
          <Card style={{ padding:'14px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:13, color:'#6B7280' }}>Subtotal</span>
              <span style={{ fontSize:13 }}>{fmt(subtotal)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:13, color:'#6B7280' }}>Tax</span>
              <span style={{ fontSize:13, color:'#9CA3AF' }}>—</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between',
              borderTop:'1px solid #F3F4F6', paddingTop:10, marginTop:4 }}>
              <span className="syne" style={{ fontSize:18, fontWeight:700 }}>Total</span>
              <span className="syne" style={{ fontSize:22, fontWeight:800, color:B }}>{fmt(total)}</span>
            </div>
          </Card>

          {/* Deposit section */}
          <Card style={{ padding:'14px 18px', background:'#FFFBEB', border:'1px solid #FDE68A' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div>
                <p className="syne" style={{ fontSize:14, fontWeight:700, color:'#92400E', margin:0 }}>
                  Deposit required
                </p>
                <p style={{ fontSize:12, color:'#B45309', margin:'2px 0 0' }}>
                  30% upfront to confirm the job
                </p>
              </div>
              <span className="syne" style={{ fontSize:22, fontWeight:800, color:'#92400E' }}>
                {fmt(total * 0.30)}
              </span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between',
              fontSize:12, color:'#9CA3AF', paddingTop:8, borderTop:'1px solid #FDE68A' }}>
              <span>Remaining on completion</span>
              <span>{fmt(total * 0.70)}</span>
            </div>
          </Card>

          {/* Payment methods */}
          <Card style={{ padding:'14px 18px' }}>
            <p className="syne" style={{ fontSize:12, fontWeight:600, color:'#6B7280',
              textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 10px' }}>
              How to pay
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {/* Bank transfer - ACH */}
              <div style={{ background:'#F9FAFB', borderRadius:12, padding:'10px 12px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:18 }}>🏦</span>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:'#111', margin:0 }}>ACH Bank Transfer</p>
                    <p style={{ fontSize:11, color:'#9CA3AF', margin:'1px 0 0' }}>
                      Routing: 021000021 · Acct: ••••4521
                    </p>
                  </div>
                  <span style={{ fontSize:11, color:'#16A34A', fontWeight:600,
                    background:'#F0FDF4', padding:'3px 7px', borderRadius:6 }}>
                    No fee
                  </span>
                </div>
              </div>
              {/* Card via Stripe */}
              <div style={{ background:'#F0F9FF', border:'1px solid #BAE6FD', borderRadius:12, padding:'10px 12px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:18 }}>💳</span>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:'#0369A1', margin:0 }}>
                      Pay by Card (Stripe)
                    </p>
                    <p style={{ fontSize:11, color:'#7DD3FC', margin:'1px 0 0' }}>
                      Processing fee: 2.9% + $0.30 — added to your total
                    </p>
                  </div>
                </div>
                {/* Fee breakdown */}
                <div style={{ background:'white', borderRadius:8, padding:'8px 10px',
                  border:'1px solid #E0F2FE', marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, color:'#6B7280' }}>Quote total</span>
                    <span style={{ fontSize:12 }}>{fmt(total)}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:12, color:'#6B7280' }}>Stripe fee (2.9% + $0.30)</span>
                    <span style={{ fontSize:12, color:'#0369A1' }}>{fmt(total * 0.029 + 0.30)}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    borderTop:'1px solid #E0F2FE', paddingTop:6 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#111' }}>You pay by card</span>
                    <span className="syne" style={{ fontSize:14, fontWeight:800, color:'#0369A1' }}>
                      {fmt(total + total * 0.029 + 0.30)}
                    </span>
                  </div>
                </div>
                <button style={{ width:'100%', background:'#0369A1', color:'white', border:'none',
                  borderRadius:10, padding:'11px 0', fontSize:13, fontWeight:700,
                  cursor:'pointer', display:'flex', alignItems:'center',
                  justifyContent:'center', gap:6 }}>
                  <span>🔒</span> Pay deposit {fmt((total * 0.30) * 1.029 + 0.30)} by card
                </button>
              </div>
            </div>
          </Card>

          {/* Legal disclaimer */}
          <div style={{ background:'#F8FAFC', border:'1px solid #E2E8F0',
            borderRadius:14, padding:'12px 14px' }}>
            <p style={{ fontSize:11, fontWeight:600, color:'#64748B',
              textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 6px' }}>
              Important Notice
            </p>
            <p style={{ fontSize:11, color:'#94A3B8', margin:0, lineHeight:1.6 }}>
              This quotation is based on information available at the time of assessment.
              Final costs may vary due to unforeseen site conditions, material price changes,
              or variations in scope requested by the client. Any changes to the agreed
              scope of work will be communicated and approved in writing before proceeding.
              This quote does not constitute a binding contract until a deposit is received
              or a written acceptance is confirmed by both parties.
            </p>
          </div>

          {/* Signature block — shown after signing */}
          {step === 'done' && (
            <Card style={{ padding:'14px 18px' }}>
              <p style={{ fontSize:11, color:'#9CA3AF', textTransform:'uppercase',
                letterSpacing:'0.05em', margin:'0 0 8px' }}>Signed by customer</p>
              <div style={{ background:'#F9FAFB', borderRadius:10, padding:'10px 14px',
                display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:20 }}>✍️</span>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:'#111', margin:0 }}>
                    {lead?.name || 'João Silva'}
                  </p>
                  <p style={{ fontSize:11, color:'#9CA3AF', margin:'2px 0 0' }}>
                    Signed {new Date().toLocaleString('pt-PT')}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <p style={{ textAlign:'center', fontSize:11, color:'#D1D5DB' }}>
            Powered by <span style={{ color:B }}>Lead-to-Quote</span>
          </p>
          <div style={{ height: step==='done' ? 20 : 100 }} />
        </div>

        {/* ── STEP: View — Accept button ── */}
        {step === 'view' && !isInvoice && (
          <div style={{ background:'white', borderTop:'1px solid #F3F4F6',
            padding:'12px 20px 28px' }}>
            <button onClick={() => setStep('sign')} style={{
              width:'100%', background:B, color:'white', border:'none',
              borderRadius:16, padding:'16px 0', fontSize:15, fontWeight:700,
              cursor:'pointer', boxShadow:`0 4px 16px ${B}40` }}>
              ✓ Accept this quote
            </button>
            <p style={{ textAlign:'center', fontSize:11, color:'#9CA3AF', margin:'8px 0 0' }}>
              You'll be asked to sign digitally
            </p>
          </div>
        )}

        {/* ── STEP: Sign — signature canvas ── */}
        {step === 'sign' && (
          <div style={{ background:'white', borderTop:'1px solid #F3F4F6',
            padding:'16px 20px 28px' }}>
            <p className="syne" style={{ fontSize:14, fontWeight:700, color:'#111',
              margin:'0 0 10px', textAlign:'center' }}>
              Sign below to confirm
            </p>
            {/* Canvas area */}
            <div
              onMouseDown={startDraw} onTouchStart={startDraw}
              onMouseUp={()=>setDrawing(false)} onTouchEnd={()=>setDrawing(false)}
              style={{ width:'100%', height:100, background:'#FAFAFA',
                border:'2px dashed #E5E7EB', borderRadius:14, marginBottom:12,
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'crosshair', position:'relative', overflow:'hidden',
                userSelect:'none' }}>
              {!hasSig ? (
                <p style={{ fontSize:13, color:'#D1D5DB', pointerEvents:'none' }}>
                  ✍️ Draw your signature here
                </p>
              ) : (
                <p style={{ fontSize:22, color:'#374151', fontFamily:'cursive',
                  pointerEvents:'none' }}>
                  {lead?.name?.split(' ')[0] || 'João'}
                </p>
              )}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => { setHasSig(false); setStep('view') }}
                style={{ flex:1, border:'1.5px solid #E5E7EB', background:'white',
                  borderRadius:12, padding:'12px 0', fontSize:13, fontWeight:600,
                  cursor:'pointer', color:'#6B7280' }}>
                Cancel
              </button>
              <button onClick={() => { if(hasSig) setStep('done') }}
                disabled={!hasSig}
                style={{ flex:2, background: hasSig ? B : '#E5E7EB',
                  color: hasSig ? 'white' : '#9CA3AF', border:'none',
                  borderRadius:12, padding:'12px 0', fontSize:13, fontWeight:700,
                  cursor: hasSig ? 'pointer' : 'default', transition:'all 0.2s' }}>
                Confirm & Sign →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: Done ── */}
        {step === 'done' && (
          <div style={{ background:'#F0FDF4', borderTop:'1px solid #BBF7D0',
            padding:'16px 20px 28px', textAlign:'center' }}>
            <p style={{ fontSize:16, fontWeight:700, color:'#15803D',
              margin:'0 0 4px', fontFamily:"'Syne',sans-serif" }}>
              🎉 Quote accepted & signed!
            </p>
            <p style={{ fontSize:13, color:'#16A34A', margin:0 }}>
              Mike's Plumbing has been notified.
            </p>
          </div>
        )}

        {/* Invoice — no accept button */}
        {isInvoice && (
          <div style={{ background:'#EFF6FF', borderTop:'1px solid #BFDBFE',
            padding:'14px 20px 28px', textAlign:'center' }}>
            <p style={{ fontSize:13, color:'#1D4ED8', fontWeight:500, margin:0 }}>
              💳 Please arrange payment with Mike's Plumbing directly.
            </p>
          </div>
        )}

        {/* Back btn (prototype only) */}
        <div style={{ background:'#F9FAFB', borderTop:'1px solid #F3F4F6',
          padding:'10px 20px', display:'flex', justifyContent:'center' }}>
          <button onClick={()=>go('lead')}
            style={{ background:'none', border:'none', cursor:'pointer',
              fontSize:12, color:'#9CA3AF' }}>
            ← Back to quote builder
          </button>
        </div>
      </div>
    </Frame>
  )
}

// ─── INTAKE FORM ──────────────────────────────────────────────────────────────
function FormScreen({ go }) {
  const [form, setForm] = useState({ name:'', phone:'', email:'', job_type:'', description:'' })
  const [done, setDone] = useState(false)
  const set = (f,v) => setForm(p=>({...p,[f]:v}))

  if (done) return (
    <Frame>
      <div style={{ flex:1, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', padding:'0 24px' }}>
        <div style={{ width:72, height:72, background:'#F0FDF4', borderRadius:24,
          display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
          <span style={{ fontSize:32 }}>✅</span>
        </div>
        <h2 className="syne" style={{ fontSize:22, fontWeight:700, textAlign:'center',
          color:'#111', margin:'0 0 10px' }}>Request sent!</h2>
        <p style={{ fontSize:14, color:'#6B7280', textAlign:'center', margin:'0 0 32px' }}>
          Mike's Plumbing will get back to you shortly.
        </p>
        <button onClick={()=>go('dashboard')}
          style={{ background:'none', border:'none', cursor:'pointer',
            fontSize:13, color:B, fontWeight:600 }}>
          ← Back to app
        </button>
      </div>
    </Frame>
  )

  return (
    <Frame>
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
        {/* Business header */}
        <div style={{ background:'white', borderBottom:'1px solid #F3F4F6', padding:'16px 20px' }}>
          <div style={{ display:'flex', gap:14, alignItems:'center' }}>
            <div style={{ width:44, height:44, background:B, borderRadius:14,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="syne" style={{ color:'white', fontSize:18, fontWeight:700 }}>M</span>
            </div>
            <div>
              <h1 className="syne" style={{ fontSize:16, fontWeight:700, color:'#111', margin:0 }}>
                Mike's Plumbing
              </h1>
              <p style={{ fontSize:12, color:'#9CA3AF', margin:'2px 0 0' }}>Available 24/7 · +351 910 123 456</p>
            </div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'20px 20px 24px' }}>
          <h2 className="syne" style={{ fontSize:22, fontWeight:700, color:'#111', margin:'0 0 6px' }}>
            Request a Quote
          </h2>
          <p style={{ fontSize:13, color:'#9CA3AF', margin:'0 0 22px' }}>
            Fill in the form and we'll get back to you quickly.
          </p>

            <Input label="Your name *" value={form.name}
              onChange={e=>set('name',e.target.value)} placeholder="John Smith" />
            <Input label="Phone number *" value={form.phone}
              onChange={e=>set('phone',e.target.value)} placeholder="+1 555 000 0000" type="tel" />
            <Input label="Email (optional)" value={form.email}
              onChange={e=>set('email',e.target.value)} placeholder="you@example.com" type="email" />

          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#374151', marginBottom:6 }}>
              Type of work
            </label>
            <select value={form.job_type} onChange={e=>set('job_type',e.target.value)}
              style={{ width:'100%', border:'1.5px solid #E5E7EB', borderRadius:12,
                padding:'11px 14px', fontSize:14, color: form.job_type?'#111':'#9CA3AF',
                outline:'none', background:'white', appearance:'none' }}>
              <option value="">Select...</option>
              {['Emergency callout','Boiler service','Pipe repair','Bathroom installation',
                'Drain unblocking','Leak detection','Water heater'].map(jt=>(
                <option key={jt} value={jt}>{jt}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom:22 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#374151', marginBottom:6 }}>
              Describe the job
            </label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)}
              placeholder="Give us more details about what you need..."
              rows={3} style={{ width:'100%', border:'1.5px solid #E5E7EB', borderRadius:12,
                padding:'11px 14px', fontSize:14, color:'#111', outline:'none',
                resize:'none', fontFamily:"'DM Sans',sans-serif" }}
            />
          </div>

          <button onClick={()=>{if(form.name&&form.phone)setDone(true)}}
            disabled={!form.name||!form.phone}
            style={{ width:'100%', background:B, color:'white', border:'none',
              borderRadius:16, padding:'15px 0', fontSize:15, fontWeight:700,
              cursor: form.name&&form.phone ? 'pointer' : 'default',
              opacity: form.name&&form.phone ? 1 : 0.5 }}>
            Send request →
          </button>
        </div>
      </div>
    </Frame>
  )
}

// ─── BILLING SCREEN ───────────────────────────────────────────────────────────
function BillingScreen({ go, cfg }) {
  const price = cfg?.currency === 'EUR' ? '€24' : '$29'
  const features = [
    'Unlimited quotes',
    'WhatsApp & Email send',
    'Deposit & card payments',
    'E-signature',
    'Invoice conversion',
    'Quote opened tracking',
    'Public intake form',
    'My saved rates',
  ]

  return (
    <Frame>
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:BG }}>
        <div style={{ background:'white', padding:'14px 16px',
          borderBottom:'1px solid #F3F4F6', position:'sticky', top:0, zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <BackBtn onClick={() => go('dashboard')} />
            <div>
              <h2 className="syne" style={{ fontSize:18, fontWeight:700, color:'#111', margin:0 }}>
                Your Plan
              </h2>
              <p style={{ fontSize:12, color:'#9CA3AF', margin:'2px 0 0' }}>
                Billing & subscription
              </p>
            </div>
          </div>
        </div>

        <div style={{ flex:1, padding:'20px 16px', display:'flex', flexDirection:'column', gap:14 }}>

          {/* Active badge */}
          <div style={{ background:`${B}12`, border:`1.5px solid ${B}30`,
            borderRadius:16, padding:'14px 16px',
            display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ fontSize:11, color:B, fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 2px' }}>
                Active
              </p>
              <p className="syne" style={{ fontSize:18, fontWeight:700, color:'#111', margin:0 }}>
                Lead-to-Quote
              </p>
              <p style={{ fontSize:12, color:'#6B7280', margin:'2px 0 0' }}>
                Next billing: May 12, 2026 · {price}/mo
              </p>
            </div>
            <div style={{ width:44, height:44, background:B, borderRadius:14,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:20 }}>⚡</span>
            </div>
          </div>

          {/* Single plan card */}
          <div style={{ background:'white', border:`2px solid ${B}`,
            borderRadius:20, padding:'20px 18px',
            boxShadow:`0 4px 20px ${B}15` }}>

            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'flex-start', marginBottom:16 }}>
              <div>
                <p className="syne" style={{ fontSize:20, fontWeight:800,
                  color:'#111', margin:'0 0 4px' }}>
                  Everything included
                </p>
                <p style={{ fontSize:13, color:'#9CA3AF', margin:0 }}>
                  One plan. No limits. No surprises.
                </p>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <p className="syne" style={{ fontSize:32, fontWeight:800,
                  color:B, margin:0, lineHeight:1 }}>
                  {price}
                </p>
                <p style={{ fontSize:12, color:'#9CA3AF', margin:'3px 0 0' }}>/month</p>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {features.map(f => (
                <div key={f} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:20, height:20, borderRadius:6, background:`${B}15`,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:11, color:B, fontWeight:700 }}>✓</span>
                  </div>
                  <span style={{ fontSize:13, color:'#374151' }}>{f}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop:'1px solid #F3F4F6', marginTop:16, paddingTop:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:16 }}>✓</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#15803D' }}>
                  You're on this plan
                </span>
              </div>
            </div>
          </div>

          {/* Cancel / manage */}
          <div style={{ textAlign:'center' }}>
            <button style={{ background:'none', border:'none', cursor:'pointer',
              fontSize:12, color:'#9CA3AF', textDecoration:'underline' }}>
              Cancel subscription
            </button>
          </div>

          <p style={{ fontSize:11, color:'#9CA3AF', textAlign:'center', margin:0 }}>
            Powered by Stripe · Cancel anytime · No lock-in
          </p>
        </div>
      </div>
    </Frame>
  )
}

// ─── MY RATES SCREEN ──────────────────────────────────────────────────────────
const DEFAULT_RATES = [
  { id:'r1', name:'Labour (hourly)',   unit_price:95 },
  { id:'r2', name:'Call-out fee',      unit_price:75 },
  { id:'r3', name:'Parts & materials', unit_price:0  },
]

function RatesScreen({ go, savedRates, setSavedRates }) {
  const [rates, setRates] = useState(savedRates)
  const [saved, setSaved] = useState(false)

  function updRate(id, field, val) {
    setSaved(false)
    setRates(p => p.map(r => r.id!==id ? r : {
      ...r, [field]: field==='name' ? val : (parseFloat(val)||0)
    }))
  }

  function addRate() {
    setRates(p => [...p, { id:`r${Date.now()}`, name:'', unit_price:0 }])
    setSaved(false)
  }

  function removeRate(id) {
    setRates(p => p.filter(r=>r.id!==id))
    setSaved(false)
  }

  function save() {
    setSavedRates(rates)
    setSaved(true)
    setTimeout(() => go('dashboard'), 800)
  }

  return (
    <Frame>
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:BG }}>

        {/* Header */}
        <div style={{ background:'white', padding:'14px 16px',
          borderBottom:'1px solid #F3F4F6', position:'sticky', top:0, zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <BackBtn onClick={() => go('dashboard')} />
            <div>
              <h2 className="syne" style={{ fontSize:18, fontWeight:700, color:'#111', margin:0 }}>
                My Saved Rates
              </h2>
              <p style={{ fontSize:12, color:'#9CA3AF', margin:'2px 0 0' }}>
                Load these into any quote with one tap
              </p>
            </div>
          </div>
        </div>

        {/* Rates list */}
        <div style={{ flex:1, padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>

          {/* Explanation */}
          <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:14,
            padding:'12px 14px', display:'flex', gap:10, alignItems:'flex-start' }}>
            <span style={{ fontSize:18, flexShrink:0 }}>⚡</span>
            <p style={{ fontSize:13, color:'#92400E', margin:0, lineHeight:1.5 }}>
              Save your most common items here. When building a quote, tap <strong>"Load my rates"</strong> to drop them in instantly — then edit freely.
            </p>
          </div>

          <Card style={{ overflow:'hidden' }}>
            {/* Column headers */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 32px',
              gap:8, padding:'8px 14px', borderBottom:'1px solid #F3F4F6',
              background:'#F9FAFB' }}>
              <span style={{ fontSize:11, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.04em' }}>Item</span>
              <span style={{ fontSize:11, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.04em' }}>Default €</span>
              <span />
            </div>

            {rates.map((rate, i) => (
              <div key={rate.id} style={{
                display:'grid', gridTemplateColumns:'1fr 90px 32px',
                gap:8, padding:'11px 14px', alignItems:'center',
                borderBottom: i < rates.length-1 ? '1px solid #F9FAFB' : 'none',
              }}>
                <input value={rate.name} placeholder="Item name"
                  onChange={e=>updRate(rate.id,'name',e.target.value)}
                  style={{ border:'none', fontSize:13, color:'#111', outline:'none',
                    background:'transparent', padding:0, width:'100%' }}
                />
                <div style={{ display:'flex', alignItems:'center', gap:4,
                  background:'#F9FAFB', borderRadius:8, padding:'5px 8px' }}>
                  <span style={{ fontSize:11, color:'#9CA3AF' }}>€</span>
                  <input type="number" value={rate.unit_price} placeholder="0"
                    onChange={e=>updRate(rate.id,'unit_price',e.target.value)}
                    style={{ border:'none', fontSize:13, fontWeight:500, color:'#111',
                      outline:'none', background:'transparent', padding:0, width:'100%' }}
                  />
                </div>
                <button onClick={()=>removeRate(rate.id)}
                  style={{ background:'none', border:'none', cursor:'pointer',
                    color:'#D1D5DB', fontSize:18, padding:0, lineHeight:1,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
              </div>
            ))}

            <button onClick={addRate} style={{
              width:'100%', padding:'11px 14px', background:'none', border:'none',
              cursor:'pointer', fontSize:13, color:B, fontWeight:500, textAlign:'left',
              borderTop:'1px solid #F3F4F6' }}>
              + Add item
            </button>
          </Card>

          <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center', margin:'4px 0' }}>
            Set price to 0 for items you always adjust per job
          </p>
        </div>

        {/* Save button */}
        <div style={{ background:'white', borderTop:'1px solid #F3F4F6',
          padding:'12px 16px 28px' }}>
          <BrandBtn onClick={save}>
            {saved ? '✓ Saved! Going back...' : 'Save my rates'}
          </BrandBtn>
        </div>
      </div>
    </Frame>
  )
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('login')
  const [selectedLead, setSelectedLead] = useState(INIT_LEADS[0])
  const [leads, setLeads] = useState(INIT_LEADS)
  const [savedRates, setSavedRates] = useState(DEFAULT_RATES)
  const [country, setCountry] = useState('US')

  const cfg = COUNTRY_CONFIG[country] || COUNTRY_CONFIG.US

  function go(sc, lead) {
    if(lead) setSelectedLead(lead)
    setScreen(sc)
  }

  function markViewed() {
    setLeads(p => p.map(l => l.id===selectedLead?.id ? {...l, viewed:true} : l))
  }

  if (screen === 'login')      return <LoginScreen go={go} />
  if (screen === 'onboarding') return <OnboardingScreen go={go} setCountry={setCountry} />
  if (screen === 'form')       return <FormScreen go={go} cfg={cfg} />
  if (screen === 'billing')    return <BillingScreen go={go} cfg={cfg} />
  if (screen === 'rates')      return <RatesScreen go={go} savedRates={savedRates} setSavedRates={setSavedRates} cfg={cfg} />
  if (screen === 'quote')      return <QuoteScreen go={go} lead={selectedLead} onViewed={markViewed} cfg={cfg} />
  if (screen === 'invoice')    return <QuoteScreen go={go} lead={selectedLead} isInvoice={true} cfg={cfg} />
  if (screen === 'lead')       return <LeadScreen go={go} lead={leads.find(l=>l.id===selectedLead?.id)||selectedLead} leads={leads} setLeads={setLeads} savedRates={savedRates} cfg={cfg} />
  return <Dashboard go={go} leads={leads} setLeads={setLeads} cfg={cfg} />
}
