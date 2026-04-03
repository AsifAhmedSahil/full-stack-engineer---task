'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
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
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="_social_login_wrapper _layout_main_wrapper">
      {/* Shape decorations */}
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

      <div className="_social_login_wrap">
        <div className="container">
          <div className="row align-items-center">

            {/* Left: Illustration */}
            <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
              <div className="_social_login_left">
                <div className="_social_login_left_image">
                  <Image
                    src="/assets/images/login.png"
                    alt="Image"
                    width={633}
                    height={500}
                    className="_left_img"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Right: Login Form */}
            <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
              <div className="_social_login_content">

                {/* Logo */}
                <div className="_social_login_left_logo _mar_b28">
                  <Image
                    src="/assets/images/logo.svg"
                    alt="Image"
                    width={161}
                    height={40}
                    className="_left_logo"
                  />
                </div>

                <p className="_social_login_content_para _mar_b8">Welcome back</p>
                <h4 className="_social_login_content_title _titl4 _mar_b50">Login to your account</h4>

                {/* Google Sign-in Button */}
                <button
                  type="button"
                  className="_social_login_content_btn _mar_b40"
                  onClick={() => {/* Google OAuth handler */}}
                >
                  <Image
                    src="/assets/images/google.svg"
                    alt="Image"
                    width={20}
                    height={20}
                    className="_google_img"
                  />
                  <span>Or sign-in with google</span>
                </button>

                {/* Divider */}
                <div className="_social_login_content_bottom_txt _mar_b40">
                  <span>Or</span>
                </div>

                {/* Login Form */}
                <form className="_social_login_form" onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_login_form_input _mar_b14">
                        <label className="_social_login_label _mar_b8">Email</label>
                        <input
                          type="email"
                          className="form-control _social_login_input"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_login_form_input _mar_b14">
                        <label className="_social_login_label _mar_b8">Password</label>
                        <input
                          type="password"
                          className="form-control _social_login_input"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
                      <div className="form-check _social_login_form_check">
                        <input
                          className="form-check-input _social_login_form_check_input"
                          type="radio"
                          name="flexRadioDefault"
                          id="flexRadioDefault2"
                          checked={rememberMe}
                          onChange={() => setRememberMe(!rememberMe)}
                        />
                        <label
                          className="form-check-label _social_login_form_check_label"
                          htmlFor="flexRadioDefault2"
                        >
                          Remember me
                        </label>
                      </div>
                    </div>
                    <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
                      <div className="_social_login_form_left">
                        <p className="_social_login_form_left_para">
                          <Link href="/forgot-password">Forgot password?</Link>
                        </p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="row">
                      <div className="col-12">
                        <p className="text-danger mt-2">{error}</p>
                      </div>
                    </div>
                  )}

                  <div className="row">
                    <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
                      <div className="_social_login_form_btn _mar_t40 _mar_b60">
                        <button
                          type="submit"
                          className="_social_login_form_btn_link _btn1"
                          disabled={loading}
                        >
                          {loading ? 'Logging in...' : 'Login now'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                {/* Bottom: Register link */}
                <div className="row">
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="_social_login_bottom_txt">
                      <p className="_social_login_bottom_txt_para">
                        Dont have an account?{' '}
                        <Link href="/register">Create New Account</Link>
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}