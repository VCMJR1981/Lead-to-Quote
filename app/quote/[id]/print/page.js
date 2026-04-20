'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatCurrency } from '@/lib/trades'

export default function QuotePrintPage({ params }) {
  const [quote, setQuote] = useState(null)
  const [business, setBusiness] = useState(null)
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: q } = await supabase.from('quotes').select('*').eq('id', params.id).single()
      if (!q) { setLoading(false); return }
      setQuote(q)
      const { data: biz } = await supabase.from('businesses').select('*').eq('id', q.business_id).single()
      setBusiness(biz)
      const { data: ld } = await supabase.from('leads').select('*').eq('id', q.lead_id).single()
      setLead(ld)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => { if (!loading && quote) setTimeout(() => window.print(), 600) }, [loading, quote])

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'sans-serif' }}><p>Preparing PDF...</p></div>
  if (!quote) return <div style={{ padding:40, fontFamily:'sans-serif' }}><p>Quote not found.</p></div>

  const fmt = n => formatCurrency(n, business?.currency || 'USD')
  const accent = '#E85D26'
  const depositAmt = (quote.total || 0) * (quote.deposit_pct || 0) / 100

  return (
    <>
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; font-size:13px; color:#111; background:white; }
        .page { max-width:700px; margin:0 auto; padding:40px; }
        .header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:32px; padding-bottom:24px; border-bottom:2px solid #f0f0f0; }
        .logo { width:56px; height:56px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:700; overflow:hidden; flex-shrink:0; }
        .logo-img { background:white; border:1px solid #e8e8e8; }
        .logo-fallback { background:${accent}; color:white; }
        .logo img { width:100%; height:100%; object-fit:contain; }
        .biz-info { margin-left:16px; }
        .biz-name { font-size:18px; font-weight:700; }
        .biz-detail { font-size:12px; color:#666; margin-top:2px; }
        .quote-meta { text-align:right; }
        .quote-number { font-size:22px; font-weight:700; color:${accent}; }
        .quote-label { font-size:11px; color:#999; text-transform:uppercase; letter-spacing:0.5px; }
        .client { background:#f9f9f9; border-radius:10px; padding:16px 20px; margin-bottom:24px; }
        .section-header { background:#f5f5f5; padding:8px 14px; border-radius:6px 6px 0 0; font-weight:600; font-size:12px; color:#444; margin-top:20px; border:1px solid #e8e8e8; border-bottom:none; }
        table { width:100%; border-collapse:collapse; border:1px solid #e8e8e8; border-radius:0 0 6px 6px; }
        th { background:white; padding:8px 14px; text-align:left; font-size:11px; color:#999; text-transform:uppercase; border-bottom:1px solid #e8e8e8; }
        th:last-child { text-align:right; }
        td { padding:10px 14px; border-bottom:1px solid #f5f5f5; }
        td:last-child { text-align:right; font-weight:600; }
        tr:last-child td { border-bottom:none; }
        .totals { margin-top:20px; display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
        .total-row { display:flex; justify-content:flex-end; gap:80px; font-size:13px; }
        .total-main { font-size:16px; font-weight:700; border-top:2px solid #f0f0f0; padding-top:10px; margin-top:4px; }
        .total-main .amt { color:${accent}; }
        .deposit { margin-top:20px; background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:16px 20px; }
        .notes { margin-top:20px; padding:16px 20px; background:#f9f9f9; border-radius:10px; }
        .photo { margin-top:20px; border-radius:10px; overflow:hidden; border:1px solid #e8e8e8; }
        .photo img { width:100%; max-height:280px; object-fit:cover; display:block; }
        .photo-caption { padding:8px 14px; font-size:11px; color:#666; background:#f9f9f9; }
        .legal { margin-top:24px; padding:16px 20px; border:1px solid #e8e8e8; border-radius:10px; }
        .legal-label { font-size:11px; color:#999; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; }
        .legal-text { font-size:11px; color:#888; line-height:1.6; }
        .footer { margin-top:32px; padding-top:16px; border-top:1px solid #f0f0f0; display:flex; justify-content:space-between; font-size:11px; color:#aaa; }
        .no-print { background:#f5f5f5; padding:12px 40px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e8e8e8; }
        @media print { .no-print { display:none !important; } body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } @page { margin:20mm; } }
      `}</style>

      <div className="no-print">
        <span style={{ fontSize:13, color:'#666' }}>Quote {quote.quote_number} — ready to save as PDF</span>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => window.history.back()} style={{ padding:'8px 16px', border:'1px solid #ddd', borderRadius:8, background:'white', cursor:'pointer', fontSize:13 }}>← Back</button>
          <button onClick={() => window.print()} style={{ padding:'8px 16px', background:accent, color:'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>💾 Save as PDF</button>
        </div>
      </div>

      <div className="page">
        <div className="header">
          <div style={{ display:'flex', alignItems:'center' }}>
            <div className={`logo ${business?.logo_url ? 'logo-img' : 'logo-fallback'}`}>
              {business?.logo_url ? <img src={business.logo_url} alt={business.name} /> : (business?.name?.[0]?.toUpperCase() || '?')}
            </div>
            <div className="biz-info">
              <div className="biz-name">{business?.name}</div>
              {business?.phone && <div className="biz-detail">{business.phone}</div>}
              {business?.email && <div className="biz-detail">{business.email}</div>}
              {business?.address && <div className="biz-detail">{business.address}</div>}
              {business?.vat_number && <div className="biz-detail">{business.country === 'PT' ? 'NIF' : 'Tax ID'}: {business.vat_number}</div>}
            </div>
          </div>
          <div className="quote-meta">
            <div className="quote-label">Quotation</div>
            <div className="quote-number">{quote.quote_number || 'Q-0001'}</div>
            <div style={{ fontSize:12, color:'#666', marginTop:4 }}>Date: {new Date(quote.created_at).toLocaleDateString()}</div>
            <div style={{ fontSize:12, color:'#f59e0b', marginTop:2 }}>Valid 30 days</div>
          </div>
        </div>

        <div className="client">
          <div style={{ fontSize:11, color:'#999', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Prepared for</div>
          <div style={{ fontSize:16, fontWeight:700 }}>{lead?.name}</div>
          {lead?.phone && <div style={{ fontSize:12, color:'#666', marginTop:2 }}>{lead.phone}</div>}
          {lead?.email && <div style={{ fontSize:12, color:'#666' }}>{lead.email}</div>}
          {lead?.job_type && <div style={{ fontSize:12, color:'#666', marginTop:4 }}>Job: {lead.job_type}</div>}
        </div>

        {(quote.sections || []).map(section => (
          <div key={section.id}>
            <div className="section-header">{section.tradeName}</div>
            <table>
              <thead><tr><th>Description</th><th style={{ textAlign:'center' }}>Qty</th><th style={{ textAlign:'right' }}>Unit price</th><th>Total</th></tr></thead>
              <tbody>
                {section.items.filter(i => i.name || i.unit_price > 0).map(item => (
                  <tr key={item.id}>
                    <td>{item.name || '—'}</td>
                    <td style={{ textAlign:'center', color:'#666' }}>{item.qty}</td>
                    <td style={{ textAlign:'right', color:'#666' }}>{fmt(item.unit_price)}</td>
                    <td>{fmt(item.total || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="totals">
          <div className="total-row"><span style={{ color:'#666' }}>Subtotal</span><span style={{ fontWeight:600 }}>{fmt(quote.subtotal || 0)}</span></div>
          {quote.tax_rate > 0 && <div className="total-row"><span style={{ color:'#666' }}>{business?.country === 'PT' ? 'IVA' : 'Tax'} ({quote.tax_rate}%)</span><span style={{ fontWeight:600 }}>{fmt(quote.tax_amount || 0)}</span></div>}
          {quote.stripe_fee > 0 && <div className="total-row" style={{ background:'#eff6ff', borderRadius:4, padding:'4px 8px' }}><span style={{ color:'#3b82f6' }}>💳 Card fee</span><span style={{ color:'#3b82f6', fontWeight:600 }}>{fmt(quote.stripe_fee)}</span></div>}
          <div className="total-row total-main"><span>Total</span><span className="amt">{fmt(quote.total || 0)}</span></div>
        </div>

        {quote.deposit_pct > 0 && (
          <div className="deposit">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div><div style={{ fontWeight:600, fontSize:14, color:'#92400e' }}>Deposit to confirm</div><div style={{ fontSize:12, color:'#b45309', marginTop:2 }}>{quote.deposit_pct}% upfront · Remainder on completion</div></div>
              <div style={{ fontSize:18, fontWeight:700, color:'#92400e' }}>{fmt(depositAmt)}</div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#b45309', marginTop:8, paddingTop:8, borderTop:'1px solid #fde68a' }}>
              <span>Remaining on completion</span><span>{fmt((quote.total || 0) - depositAmt)}</span>
            </div>
          </div>
        )}

        {quote.notes && (
          <div className="notes">
            <div style={{ fontSize:11, color:'#999', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Notes</div>
            <div style={{ fontSize:13, color:'#444', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{quote.notes}</div>
          </div>
        )}

        {quote.photo_url && (
          <div className="photo">
            <img src={quote.photo_url} alt="Job site" />
            <div className="photo-caption">📷 Job site photo taken during site visit</div>
          </div>
        )}

        <div className="legal">
          <div className="legal-label">Important Notice</div>
          <div className="legal-text">This quotation is valid for 30 days from the date issued. Final costs may vary due to unforeseen site conditions, changes in material prices, or variations in scope requested by the client. Any changes to the agreed scope will be communicated and approved in writing before work proceeds. This quote is not binding until a deposit is received or written acceptance is confirmed by both parties.</div>
        </div>

        <div className="footer">
          <span>{business?.name} · {new Date(quote.created_at).toLocaleDateString()}</span>
          <span>Lead-to-Quote</span>
        </div>
      </div>
    </>
  )
}

export const dynamic = 'force-dynamic'
