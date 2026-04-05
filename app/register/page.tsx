'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    repeatPassword: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreeTerms) { setError('Please agree to terms & conditions'); return }
    if (formData.password !== formData.repeatPassword) { setError('Passwords do not match'); return }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    setError('')
    try {
      let avatarUrl: string | null = null
      if (avatarFile) {
        const fd = new FormData()
        fd.append('file', avatarFile)
        const uploadRes = await fetch('/api/uploadcloudinary', { method: 'POST', body: fd })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          avatarUrl = uploadData.url
        }
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          avatar: avatarUrl,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        window.location.href = '/feed'
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        html, body { height: 100%; margin: 0; padding: 0; }
        .auth-page-wrapper {
          min-height: 100vh;
          background: var(--bg1, #f5f7fb);
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
        }
        .auth-page-wrapper .container { width: 100%; }
        @media (max-height: 800px) {
          .auth-page-wrapper { align-items: flex-start; padding: 24px 0; }
        }
      `}</style>

      <section className="_social_registration_wrapper auth-page-wrapper">
        {/* Shapes */}
        <div className="_shape_one">
          <Image src="/assets/images/shape1.svg" alt="" width={300} height={300} className="_shape_img" />
          <Image src="/assets/images/dark_shape.svg" alt="" width={300} height={300} className="_dark_shape" />
        </div>
        <div className="_shape_two">
          <Image src="/assets/images/shape2.svg" alt="" width={300} height={300} className="_shape_img" />
          <Image src="/assets/images/dark_shape1.svg" alt="" width={300} height={300} className="_dark_shape _dark_shape_opacity" />
        </div>
        <div className="_shape_three">
          <Image src="/assets/images/shape3.svg" alt="" width={300} height={300} className="_shape_img" />
          <Image src="/assets/images/dark_shape2.svg" alt="" width={300} height={300} className="_dark_shape _dark_shape_opacity" />
        </div>

        <div style={{ padding: '32px 0', width: '100%' }}>
          <div className="container">
            <div className="row align-items-center">

              {/* Left — illustration, hidden on small screens */}
              <div className="col-xl-8 col-lg-7 col-md-12 col-sm-12 d-none d-lg-block">
                <div className="_social_registration_right">
                  <div className="_social_registration_right_image">
                    <Image src="/assets/images/registration.png" alt="Image" width={633} height={440} priority style={{ maxWidth: '100%', height: 'auto' }} />
                  </div>
                  <div className="_social_registration_right_image_dark">
                    <Image src="/assets/images/registration1.png" alt="Image" width={633} height={440} style={{ maxWidth: '100%', height: 'auto' }} />
                  </div>
                </div>
              </div>

              {/* Right — form */}
              <div className="col-xl-4 col-lg-5 col-md-12 col-sm-12">
                <div className="_social_registration_content" style={{ padding: '32px 40px' }}>

                  {/* Logo */}
                  <div className="_social_registration_right_logo _mar_b20" style={{ textAlign: 'center' }}>
                    <Image src="/assets/images/logo.svg" alt="BuddyScript" width={140} height={36} className="_right_logo" />
                  </div>

                  <p className="_social_registration_content_para _mar_b4">Get Started Now</p>
                  <h4 className="_social_registration_content_title _titl4 _mar_b24" style={{ fontSize: 24 }}>Registration</h4>

                  {/* Google */}
                  <button type="button" className="_social_registration_content_btn _mar_b24">
                    <Image src="/assets/images/google.svg" alt="Google" width={20} height={20} className="_google_img" />
                    <span>Register with Google</span>
                  </button>

                  <div className="_social_registration_content_bottom_txt _mar_b24"><span>Or</span></div>

                  <form onSubmit={handleSubmit}>
                    {/* Avatar upload */}
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <div
                        onClick={() => fileRef.current?.click()}
                        style={{
                          width: 64, height: 64, borderRadius: '50%',
                          background: avatarPreview ? 'transparent' : 'var(--bg3, #F0F2F5)',
                          border: '2px dashed #1890FF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', margin: '0 auto 6px', overflow: 'hidden',
                        }}
                        title="Add profile photo"
                      >
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#1890FF" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: '#888', margin: 0 }}>
                        {avatarPreview ? (
                          <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null) }}
                            style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: 11 }}>
                            Remove
                          </button>
                        ) : 'Profile photo (optional)'}
                      </p>
                      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                    </div>

                    <div className="row">
                      <div className="col-6">
                        <div className="_social_registration_form_input _mar_b12">
                          <label className="_social_registration_label _mar_b6" style={{ fontSize: 13 }}>First Name</label>
                          <input type="text" name="firstName" className="form-control _social_registration_input"
                            style={{ height: 42 }}
                            value={formData.firstName} onChange={handleChange} required />
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="_social_registration_form_input _mar_b12">
                          <label className="_social_registration_label _mar_b6" style={{ fontSize: 13 }}>Last Name</label>
                          <input type="text" name="lastName" className="form-control _social_registration_input"
                            style={{ height: 42 }}
                            value={formData.lastName} onChange={handleChange} required />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="_social_registration_form_input _mar_b12">
                          <label className="_social_registration_label _mar_b6" style={{ fontSize: 13 }}>Email</label>
                          <input type="email" name="email" className="form-control _social_registration_input"
                            style={{ height: 42 }}
                            value={formData.email} onChange={handleChange} required />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="_social_registration_form_input _mar_b12">
                          <label className="_social_registration_label _mar_b6" style={{ fontSize: 13 }}>Password</label>
                          <input type="password" name="password" className="form-control _social_registration_input"
                            style={{ height: 42 }}
                            value={formData.password} onChange={handleChange} required />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="_social_registration_form_input _mar_b12">
                          <label className="_social_registration_label _mar_b6" style={{ fontSize: 13 }}>Repeat Password</label>
                          <input type="password" name="repeatPassword" className="form-control _social_registration_input"
                            style={{ height: 42 }}
                            value={formData.repeatPassword} onChange={handleChange} required />
                        </div>
                      </div>
                    </div>

                    <div className="form-check _social_registration_form_check" style={{ marginBottom: 8 }}>
                      <input className="form-check-input _social_registration_form_check_input" type="radio"
                        name="flexRadioDefault" id="agreeTerms"
                        checked={agreeTerms} onChange={() => setAgreeTerms(!agreeTerms)} />
                      <label className="form-check-label _social_registration_form_check_label" htmlFor="agreeTerms" style={{ fontSize: 13 }}>
                        I agree to terms &amp; conditions
                      </label>
                    </div>

                    {error && <p className="text-danger" style={{ fontSize: 12, marginBottom: 8 }}>{error}</p>}

                    <div className="_social_registration_form_btn _mar_t16 _mar_b20">
                      <button type="submit" className="_social_registration_form_btn_link _btn1"
                        disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Creating account…' : 'Register now'}
                      </button>
                    </div>
                  </form>

                  <div className="_social_registration_bottom_txt">
                    <p className="_social_registration_bottom_txt_para" style={{ fontSize: 13 }}>
                      Already have an account?{' '}
                      <Link href="/login">Login now</Link>
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}