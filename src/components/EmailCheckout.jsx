import { useState } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { apiUrl } from '../api'
import { money } from '../utils/format'

export default function EmailCheckout({ total, cart, onClose, onComplete, razorpayEnabled, loadRazorpay }) {
  const [step, setStep] = useState('contact')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [otpChallengeId, setOtpChallengeId] = useState('')
  const [otp, setOtp] = useState('')
  const [developmentOtp, setDevelopmentOtp] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [address, setAddress] = useState({ door: '', line1: '', line2: '', city: '', pincode: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function request(path, body) {
    const response = await fetch(apiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
    return data
  }

  function clearVerification() {
    setOtpChallengeId('')
    setOtp('')
    setDevelopmentOtp('')
    setVerificationToken('')
  }

  async function sendOtp() {
    setSendingOtp(true)
    setError('')
    try {
      const result = await request('/api/send-email', {
        name,
        email,
        subject: 'OTP for verification',
        message: '{otp} for the verification, do not share with anyone',
      })
      setOtpChallengeId(result.challenge_id)
      setOtp('')
      setDevelopmentOtp(result.development_otp || '')
      setVerificationToken('')
    } catch (err) {
      setError(err.message || 'Could not send verification code.')
    } finally {
      setSendingOtp(false)
    }
  }

  async function verifyOtp() {
    setVerifyingOtp(true)
    setError('')
    try {
      const result = await request('/api/otp/verify', { challenge_id: otpChallengeId, otp })
      setVerificationToken(result.verification_token)
    } catch (err) {
      setError(err.message || 'Could not verify that code.')
    } finally {
      setVerifyingOtp(false)
    }
  }

  function updateAddress(field, value) {
    setAddress(current => ({ ...current, [field]: value }))
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
        verification_token: verificationToken,
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
            <form onSubmit={event => { event.preventDefault(); if (verificationToken) { setError(''); setStep('address') } }}>
              <label>Full name<input name="name" required autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Your name" /></label>
              <label>Email address<input name="email" type="email" required autoComplete="email" value={email} onChange={event => { setEmail(event.target.value); clearVerification() }} placeholder="you@example.com" /></label>
              {otpChallengeId && !verificationToken && <label>Email verification code<input name="otp" type="text" inputMode="numeric" autoComplete="one-time-code" required maxLength="6" pattern="[0-9]{6}" value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" /></label>}
              {developmentOtp && <p className="development-otp">Development OTP: <strong>{developmentOtp}</strong></p>}
              {verificationToken && <p className="otp-verified">Email address verified</p>}
              {error && <p className="form-error">{error}</p>}
              {!otpChallengeId ? <button className="button dark wide" type="button" disabled={sendingOtp || !email.includes('@') || !name.trim()} onClick={sendOtp}>{sendingOtp ? 'Sending code…' : 'Send email verification code'}</button> : !verificationToken ? <><button className="button dark wide" type="button" disabled={verifyingOtp || otp.length !== 6} onClick={verifyOtp}>{verifyingOtp ? 'Verifying…' : 'Verify email address'}</button><button className="otp-resend" type="button" disabled={sendingOtp} onClick={sendOtp}>{sendingOtp ? 'Sending code…' : 'Resend code'}</button></> : <button className="button dark wide">Continue to address <ArrowRight size={17} /></button>}
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
              {error && <p className="form-error">{error}</p>}
              <div className="checkout-actions"><button className="button outline" type="button" disabled={submitting} onClick={() => { setStep('contact'); setError('') }}><ArrowLeft size={17} /> Back</button><button className="button dark" disabled={submitting}>{submitting ? 'Opening payment…' : 'Proceed to payment'} <ArrowRight size={17} /></button></div>
              <p className="payment-note">Payments are securely processed by Razorpay.</p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}