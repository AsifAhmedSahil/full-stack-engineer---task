'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok) {
        window.location.href = '/feed'
      } else {
        setError(data.error || 'Login failed')
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
        html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
        .auth-outer {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg1, #f5f7fb);
          position: relative;
          overflow: hidden;
        }
        .auth-inner {
          width: 100%;
          max-width: 1200px;
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 0;
        }
        .auth-illustration {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .auth-illustration img { max-width: 100%; max-height: 70vh; object-fit: contain; }
        .auth-form-col {
          width: 380px;
          flex-shrink: 0;
        }
        @media (max-width: 991px) {
          .auth-illustration { display: none; }
          .auth-form-col { width: 100%; max-width: 420px; margin: 0 auto; }
        }
      `}</style>

      <section className="_social_login_wrapper auth-outer" style={{ padding: 0 }}>
        {/* Shapes */}
        <div className="_shape_one" style={{ position: 'absolute', zIndex: 0 }}>
          <Image src="/assets/images/shape1.svg" alt="" width={280} height={280} className="_shape_img" />
          <Image src="/assets/images/dark_shape.svg" alt="" width={280} height={280} className="_dark_shape" />
        </div>
        <div className="_shape_two" style={{ position: 'absolute', zIndex: 0 }}>
          <Image src="/assets/images/shape2.svg" alt="" width={280} height={280} className="_shape_img" />
          <Image src="/assets/images/dark_shape1.svg" alt="" width={280} height={280} className="_dark_shape _dark_shape_opacity" />
        </div>
        <div className="_shape_three" style={{ position: 'absolute', zIndex: 0 }}>
          <Image src="/assets/images/shape3.svg" alt="" width={280} height={280} className="_shape_img" />
          <Image src="/assets/images/dark_shape2.svg" alt="" width={280} height={280} className="_dark_shape _dark_shape_opacity" />
        </div>

        <div className="auth-inner" style={{ position: 'relative', zIndex: 1 }}>
          {/* Left — illustration */}
          <div className="auth-illustration">
            <div>
              <div className="_social_login_left_image">
                <Image src="/assets/images/login.png" alt="Login" width={580} height={450}
                  priority style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }} />
              </div>
            </div>
          </div>

          {/* Right — form card */}
          <div className="auth-form-col">
            <div className="_social_registration_content">
              {/* Logo */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Image src="/assets/images/logo.svg" alt="BuddyScript" width={150} height={38} className="_right_logo" />
              </div>

              <p className="_social_registration_content_para" style={{ marginBottom: 4 }}>Welcome back</p>
              <h4 className="_social_registration_content_title _titl4" style={{ marginBottom: 32, fontSize: 26 }}>
                Login to your account
              </h4>

              {/* Google */}
              <button type="button" className="_social_registration_content_btn" style={{ marginBottom: 24 }}>
                <Image src="/assets/images/google.svg" alt="Google" width={20} height={20} className="_google_img" />
                <span>Continue with Google</span>
              </button>

              <div className="_social_registration_content_bottom_txt" style={{ marginBottom: 24 }}><span>Or</span></div>

              <form onSubmit={handleSubmit}>
                <div className="_social_registration_form_input" style={{ marginBottom: 14 }}>
                  <label className="_social_registration_label" style={{ marginBottom: 6, display: 'block' }}>Email</label>
                  <input type="email" className="form-control _social_registration_input"
                    style={{ height: 46 }}
                    placeholder="Enter your email"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>

                <div className="_social_registration_form_input" style={{ marginBottom: 8 }}>
                  <label className="_social_registration_label" style={{ marginBottom: 6, display: 'block' }}>Password</label>
                  <input type="password" className="form-control _social_registration_input"
                    style={{ height: 46 }}
                    placeholder="Enter your password"
                    value={password} onChange={e => setPassword(e.target.value)} required />
                </div>

                <div style={{ textAlign: 'right', marginBottom: 20 }}>
                  <a href="#0" style={{ fontSize: 13, color: '#1890FF', fontWeight: 500 }}>Forgot password?</a>
                </div>

                {error && <p className="text-danger" style={{ fontSize: 13, marginBottom: 10 }}>{error}</p>}

                <button type="submit" className="_social_registration_form_btn_link _btn1"
                  disabled={loading} style={{ width: '100%', marginBottom: 24 ,whiteSpace: "nowrap",textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center' }}>
                  {loading ? 'Logging in…' : 'Login now'}
                </button>
              </form>

              <div className="_social_registration_bottom_txt">
                <p className="_social_registration_bottom_txt_para" style={{ fontSize: 13 }}>
                  Don&apos;t have an account?{' '}
                  <Link href="/register">Create New Account</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}