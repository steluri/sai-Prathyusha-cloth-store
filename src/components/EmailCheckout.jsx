import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, QrCode, X } from 'lucide-react'
import QRCode from 'qrcode'
import { apiUrl } from '../api'
import { money } from '../utils/format'

const MERCHANT_UPI_ID = 'telurisrikanth@ybl'

export default function EmailCheckout({ total, cart, onClose, onComplete, razorpayEnabled, loadRazorpay }) {
  const [step, setStep] = useState('contact')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState({ door: '', line1: '', line2: '', city: '', pincode: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showUpiQr, setShowUpiQr] = useState(false)
  const [qrImage, setQrImage] = useState('')
  const [qrError, setQrError] = useState('')
  const [utr, setUtr] = useState('')
  const [submittingUtr, setSubmittingUtr] = useState(false)
  const amount = (Math.round(Number(total) * 100) / 100).toFixed(2)
  const upiUri = `upi://pay?${new globalThis.URLSearchParams({ pa: MERCHANT_UPI_ID, pn: 'Pandu', am: amount, cu: 'INR' })}`

  useEffect(() => {
    if (!showUpiQr) return
    let active = true
    QRCode.toDataURL(upiUri, { width: 240, margin: 2, errorCorrectionLevel: 'M' })
      .then(image => { if (active) { setQrImage(image); setQrError('') } })
      .catch(() => { if (active) setQrError('Could not generate the UPI QR code.') })
    return () => { active = false }
  }, [showUpiQr, upiUri])

  async function request(path, body) {
    const response = await fetch(apiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!response.ok) {
      const detail = data.error_message
        ? `${data.error_message} (HTTP ${data.status_code || response.status})`
        : data.error || `Request failed (HTTP ${response.status}).`
      throw new Error(detail)
    }
    return data
  }

  function updateAddress(field, value) {
    setAddress(current => ({ ...current, [field]: value }))
  }

  async function submitUtr(event) {
    event.preventDefault()
    setError('')
    if (!name.trim() || !email || !address.door.trim() || !address.line1.trim() || !address.city.trim() || !/^[1-9][0-9]{5}$/.test(address.pincode)) {
      setError('Complete your delivery address before submitting the UTR.')
      return
    }
    setSubmittingUtr(true)
    try {
      const order = await request('/api/orders/upi', {
        customer: name,
        email,
        address,
        utr: utr.trim(),
        expected_total: Number(total),
        items: cart.map(item => ({ product_id: item.id, quantity: item.quantity })),
      })
      onComplete(order)
    } catch (err) {
      setError(err.message || 'Could not submit the UTR. Please try again.')
    } finally {
      setSubmittingUtr(false)
    }
  }

  async function beginPayment(event) {
    event.preventDefault()
    setError('')
    if (!razorpayEnabled) {
      setError('Online checkout is currently unavailable.')
      return
    }
    setSubmitting(true)
    try {
      await loadRazorpay()
      const paymentOrder = await request('/api/payments/razorpay/order', {
        customer: name,
        email,
        address,
        items: cart.map(item => ({ product_id: item.id, quantity: item.quantity })),
      })
      const checkout = new window.Razorpay({
        key: paymentOrder.key_id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'Pandu',
        description: 'Clothing order',
        order_id: paymentOrder.order_id,
        prefill: paymentOrder.prefill,
        theme: { color: '#a95f36' },
        config: {
          display: {
            blocks: { upi: { name: 'Pay using UPI or QR', instruments: [{ method: 'upi' }] } },
            sequence: ['block.upi'],
            preferences: { show_default_blocks: true },
          },
        },
        handler: async payment => {
          try {
            onComplete(await request('/api/orders', payment))
          } catch (err) {
            setError(err.message || 'Payment verification failed. Please contact support.')
            setSubmitting(false)
          }
        },
        modal: {
          ondismiss: () => {
            setError('Payment was cancelled. You can try again when you’re ready.')
            setSubmitting(false)
          },
        },
      })
      checkout.on('payment.failed', response => {
        setError(response.error?.description || 'Payment failed. Please try another payment method.')
        setSubmitting(false)
      })
      checkout.open()
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-wrap">
      <button className="scrim" onClick={onClose} aria-label="Close checkout" />
      <div className="checkout-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close checkout"><X /></button>
        <p className="eyebrow">Secure checkout · {step === 'contact' ? 'Step 1 of 2' : 'Step 2 of 2'}</p>
        {step === 'contact' ? (
          <>
            <h2>Your details.</h2>
            <p className="checkout-intro">Tell us who the order is for.</p>
            <form onSubmit={event => { event.preventDefault(); setError(''); setStep('address') }}>
              <label>Full name<input name="name" required autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Your name" /></label>
              <label>Email address<input name="email" type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label>
              {error && <p className="form-error">{error}</p>}
              <button className="button dark wide">Continue to delivery <ArrowRight size={17} /></button>
            </form>
          </>
        ) : (
          <>
            <h2>Delivery address.</h2>
            <p className="checkout-intro">Where should we send your order?</p>
            <form onSubmit={beginPayment}>
              <label>Door / flat number<input name="door" required autoComplete="address-line1" value={address.door} onChange={event => updateAddress('door', event.target.value)} placeholder="Flat 4B / Door 24" autoFocus /></label>
              <label>Address line 1 <span className="required-note">Required</span><input name="address-line1" required autoComplete="address-line1" value={address.line1} onChange={event => updateAddress('line1', event.target.value)} placeholder="Street, area or locality" /></label>
              <label>Address line 2 <span className="optional-note">Optional</span><input name="address-line2" autoComplete="address-line2" value={address.line2} onChange={event => updateAddress('line2', event.target.value)} placeholder="Landmark or nearby place" /></label>
              <div className="address-grid">
                <label>City<input name="city" required autoComplete="address-level2" value={address.city} onChange={event => updateAddress('city', event.target.value)} placeholder="Chennai" /></label>
                <label>PIN code<input name="pincode" required inputMode="numeric" autoComplete="postal-code" maxLength="6" pattern="[1-9][0-9]{5}" value={address.pincode} onChange={event => setAddress(current => ({ ...current, pincode: event.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="600001" /></label>
              </div>
              <div className="checkout-total"><span>Amount payable</span><strong>{money(total)}</strong></div>
              <div className="checkout-upi">
                <button className="checkout-upi-toggle" type="button" aria-expanded={showUpiQr} onClick={() => setShowUpiQr(current => !current)}><QrCode size={18} /> {showUpiQr ? 'Hide direct UPI QR' : 'Show direct UPI QR'}</button>
                {showUpiQr && <div className="checkout-upi-details">
                  {qrImage && <img src={qrImage} alt={`UPI QR for ${money(total)} payable to ${MERCHANT_UPI_ID}`} width="240" height="240" />}
                  {qrError && <p className="form-error">{qrError}</p>}
                  <strong>{money(total)}</strong>
                  <span>{MERCHANT_UPI_ID}</span>
                  <a href={upiUri}>Open UPI app</a>
                  <p>Pay using the QR, then enter the 12-digit transaction reference from your UPI app. Your order will wait for merchant verification before delivery.</p>
                  <label className="checkout-upi-utr">UPI transaction reference (UTR)
                    <input form="upi-utr-form" inputMode="numeric" pattern="[0-9]{12}" maxLength="12" required value={utr} onChange={event => setUtr(event.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="12-digit UTR" />
                  </label>
                  <button className="button dark wide" type="submit" form="upi-utr-form" disabled={submittingUtr || submitting || utr.length !== 12}>{submittingUtr ? 'Submitting…' : 'Submit for verification'}</button>
                </div>}
              </div>
              {error && <p className="form-error">{error}</p>}
              <div className="checkout-actions"><button className="button outline" type="button" disabled={submitting} onClick={() => { setStep('contact'); setError('') }}><ArrowLeft size={17} /> Back</button><button className="button dark" disabled={submitting}>{submitting ? 'Opening payment…' : 'Proceed to payment'} <ArrowRight size={17} /></button></div>
              <p className="payment-note">Payments are securely processed by Razorpay.</p>
            </form>
            <form id="upi-utr-form" onSubmit={submitUtr} />
          </>
        )}
      </div>
    </div>
  )
}