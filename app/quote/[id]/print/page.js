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

  // Auto-trigger print once loaded
  useEffect(() => {
    if (!loading && quote) {
      setTimeout(() => window.print(), 500)
    }
  }, [loading, quote])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <p>Preparing PDF...</p>
    </div>
  )

  if (!quote) return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <p>Quote not found.</p>
    </div>
  )

  const currency = business?.currency || 'USD'
  const fmt = n => formatCurrency(n, currency)
  const sym = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€'
  const accent = '#E85D26'

  const depositAmt = (quote.total || 0) * (quote.deposit_pct || 0) / 100
  const remaining = (quote.total || 0) - depositAmt

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #111; background: white; }
        .page { max-width: 700px; margin: 0 auto; padding: 40px; }
        .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #f0f0f0; }
        .logo-area { display: flex; align-items: center; gap: 16px; }
        .logo { width: 56px; height: 56px; border-radius: 12px; background: ${accent}; display: flex; align-items: center; justify-content: center; color: white; font-size: 22px; font-weight: 700; overflow: hidden; }
        .logo img { width: 100%; height: 100%; object-fit: cover; }
        .biz-name { font-size: 18px; font-weight: 700; color: #111; }
        .biz-detail { font-size: 12px; color: #666; margin-top: 2px; }
        .quote-meta { text-align: right; }
        .quote-number { font-size: 22px; font-weight: 700; color: ${accent}; }
        .quote-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .quote-date { font-size: 12px; color: #666; margin-top: 4px; }
        .client-section { background: #f9f9f9; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
        .client-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .client-name { font-size: 16px; font-weight: 700; }
        .client-contact { font-size: 12px; color: #666; margin-top: 2px; }
        .section-header { background: #f5f5f5; padding: 8px 14px; border-radius: 6px 6px 0 0; font-weight: 600; font-size: 12px; color: #444; margin-top: 20px; border: 1px solid #e8e8e8; border-bottom: none; }
        .items-table { width: 100%; border-collapse: collapse; border: 1px solid #e8e8e8; border-radius: 0 0 6px 6px; overflow: hidden; }
        .items-table th { background: white; padding: 8px 14px; text-align: left; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e8e8e8; }
        .items-table th:last-child { text-align: right; }
        .items-table td { padding: 10px 14px; border-bottom: 1px solid #f5f5f5; font-size: 13px; }
        .items-table td:last-child { text-align: right; font-weight: 600; }
        .items-table tr:last-child td { border-bottom: none; }
        .totals { margin-top: 20px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
        .total-row { display: flex; justify-content: flex-end; gap: 80px; font-size: 13px; }
        .total-row.main { font-size: 16px; font-weight: 700; border-top: 2px solid #f0f0f0; padding-top: 10px; margin-top: 4px; }
        .total-row.main .amount { color: ${accent}; }
        .total-label { color: #666; }
        .total-amount { font-weight: 600; min-width: 100px; text-align: right; }
        .deposit-box { margin-top: 20px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 16px 20px; }
        .deposit-row { display: flex; justify-content: space-between; align-items: center; }
        .deposit-label { font-weight: 600; font-size: 14px; color: #92400e; }
        .deposit-pct { font-size: 12px; color: #b45309; margin-top: 2px; }
        .deposit-amount { font-size: 18px; font-weight: 700; color: #92400e; }
        .deposit-remaining { display: flex; justify-content: space-between; font-size: 12px; color: #b45309; margin-top: 8px; padding-top: 8px; border-top: 1px solid #fde68a; }
        .notes-box { margin-top: 20px; padding: 16px 20px; background: #f9f9f9; border-radius: 10px; }
        .notes-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .notes-text { font-size: 13px; color: #444; line-height: 1.6; white-space: pre-wrap; }
        .photo-box { margin-top: 20px; border-radius: 10px; overflow: hidden; border: 1px solid #e8e8e8; }
        .photo-box img { width: 100%; max-height: 300px; object-fit: cover; display: block; }
        .photo-caption { padding: 8px 14px; font-size: 11px; color: #666; background: #f9f9f9; }
        .legal-box { margin-top: 24px; padding: 16px 20px; border: 1px solid #e8e8e8; border-radius: 10px; }
        .legal-label { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .legal-text { font-size: 11px; color: #888; line-height: 1.6; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f0f0f0; display: flex; justify-content: space-between; font-size: 11px; color: #aaa; }
        .card-fee-row { background: #eff6ff; border-radius: 4px; padding: 4px 8px; }
        .card-fee-row .total-label { color: #3b82f6; }
        .card-fee-row .total-amount { color: #3b82f6; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          @page { margin: 20mm; }
        }
      `}</style>

      {/* Print button — hidden when printing */}
      <div className="no-print" style={{ background: '#f5f5f5', padding: '12px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e8e8e8' }}>
        <span style={{ fontSize: 13, color: '#666' }}>Quote {quote.quote_number} — ready to save as PDF</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.close()} style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13 }}>
            Close
          </button>
          <button onClick={() => window.print()} style={{ padding: '8px 16px', background: accent, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            💾 Save as PDF
          </button>
        </div>
      </div>

      <div className="page">
        {/* Header */}
        <div className="header">
          <div className="logo-area">
            <div className="logo">
              {business?.logo_url
                ? <img src={business.logo_url} alt={business.name} />
                : (business?.name?.[0]?.toUpperCase() || '?')
              }
            </div>
            <div>
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
            <div className="quote-date">Date: {new Date(quote.created_at).toLocaleDateString()}</div>
            <div className="quote-date" style={{ color: '#f59e0b' }}>Valid 30 days</div>
          </div>
        </div>

        {/* Client */}
        <div className="client-section">
          <div className="client-label">Prepared for</div>
          <div className="client-name">{lead?.name}</div>
          {lead?.phone && <div className="client-contact">{lead.phone}</div>}
          {lead?.email && <div className="client-contact">{lead.email}</div>}
          {lead?.job_type && <div className="client-contact" style={{ marginTop: 4 }}>Job: {lead.job_type}</div>}
        </div>

        {/* Line items */}
        {(quote.sections || []).map(section => (
          <div key={section.id}>
            <div className="section-header">{section.tradeName}</div>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {section.items.filter(i => i.name || i.unit_price > 0).map(item => (
                  <tr key={item.id}>
                    <td>{item.name || '—'}</td>
                    <td style={{ textAlign: 'center', color: '#666' }}>{item.qty}</td>
                    <td style={{ textAlign: 'right', color: '#666' }}>{fmt(item.unit_price)}</td>
                    <td>{fmt(item.total || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* Totals */}
        <div className="totals">
          <div className="total-row">
            <span className="total-label">Subtotal</span>
            <span className="total-amount">{fmt(quote.subtotal || 0)}</span>
          </div>
          {quote.tax_rate > 0 && (
            <div className="total-row">
              <span className="total-label">{business?.country === 'PT' ? 'IVA' : 'Tax'} ({quote.tax_rate}%)</span>
              <span className="total-amount">{fmt(quote.tax_amount || 0)}</span>
            </div>
          )}
          {quote.stripe_fee > 0 && (
            <div className="total-row card-fee-row">
              <span className="total-label">💳 Card fee ({currency === 'USD' ? '2.9% + $0.30' : '1.5% + €0.25'})</span>
              <span className="total-amount">{fmt(quote.stripe_fee)}</span>
            </div>
          )}
          <div className="total-row main">
            <span className="total-label">Total</span>
            <span className="total-amount amount">{fmt(quote.total || 0)}</span>
          </div>
        </div>

        {/* Deposit */}
        {quote.deposit_pct > 0 && (
          <div className="deposit-box">
            <div className="deposit-row">
              <div>
                <div className="deposit-label">Deposit to confirm</div>
                <div className="deposit-pct">{quote.deposit_pct}% upfront · Remainder on completion</div>
              </div>
              <div className="deposit-amount">{fmt(depositAmt)}</div>
            </div>
            <div className="deposit-remaining">
              <span>Remaining on completion</span>
              <span>{fmt(remaining)}</span>
            </div>
          </div>
        )}

        {/* Notes */}
        {quote.notes && (
          <div className="notes-box">
            <div className="notes-label">Notes</div>
            <div className="notes-text">{quote.notes}</div>
          </div>
        )}

        {/* Photo */}
        {quote.photo_url && (
          <div className="photo-box">
            <img src={quote.photo_url} alt="Job site" />
            <div className="photo-caption">📷 Job site photo taken during site visit</div>
          </div>
        )}

        {/* Legal */}
        <div className="legal-box">
          <div className="legal-label">Important Notice</div>
          <div className="legal-text">
            This quotation is valid for 30 days from the date issued. Final costs may vary due to unforeseen site conditions, changes in material prices, or variations in scope requested by the client. Any changes to the agreed scope will be communicated and approved in writing before work proceeds. This quote is not binding until a deposit is received or written acceptance is confirmed by both parties.
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <span>{business?.name} · {new Date(quote.created_at).toLocaleDateString()}</span>
          <span>Powered by Lead-to-Quote</span>
        </div>
      </div>
    </>
  )
}

export const dynamic = 'force-dynamic'
