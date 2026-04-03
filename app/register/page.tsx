'use client'

import { useState } from 'react'
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
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!agreeTerms) {
      setError('Please agree to terms & conditions')
      return
    }
    if (formData.password !== formData.repeatPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        window.location.href = '/login'
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="_social_registration_wrapper _layout_main_wrapper">

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

      <div className="_social_registration_wrap">
        <div className="container">
          <div className="row align-items-center">

            {/* Left: Illustration */}
            <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
              <div className="_social_registration_right">
                <div className="_social_registration_right_image">
                  <Image
                    src="/assets/images/registration.png"
                    alt="Image"
                    width={633}
                    height={500}
                    priority
                  />
                </div>
                <div className="_social_registration_right_image_dark">
                  <Image
                    src="/assets/images/registration1.png"
                    alt="Image"
                    width={633}
                    height={500}
                  />
                </div>
              </div>
            </div>

            {/* Right: Registration Form */}
            <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
              <div className="_social_registration_content">

                {/* Logo */}
                <div className="_social_registration_right_logo _mar_b28">
                  <Image
                    src="/assets/images/logo.svg"
                    alt="Image"
                    width={161}
                    height={40}
                    className="_right_logo"
                  />
                </div>

                <p className="_social_registration_content_para _mar_b8">Get Started Now</p>
                <h4 className="_social_registration_content_title _titl4 _mar_b50">Registration</h4>

                {/* Google Register Button */}
                <button
                  type="button"
                  className="_social_registration_content_btn _mar_b40"
                >
                  <Image
                    src="/assets/images/google.svg"
                    alt="Image"
                    width={20}
                    height={20}
                    className="_google_img"
                  />
                  <span>Register with google</span>
                </button>

                {/* Or Divider */}
                <div className="_social_registration_content_bottom_txt _mar_b40">
                  <span>Or</span>
                </div>

                {/* Registration Form */}
                <form className="_social_registration_form" onSubmit={handleSubmit}>
                  <div className="row">

                    {/* ✅ First Name — job description requirement */}
                    <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          className="form-control _social_registration_input"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    {/* ✅ Last Name — job description requirement */}
                    <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          className="form-control _social_registration_input"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">Email</label>
                        <input
                          type="email"
                          name="email"
                          className="form-control _social_registration_input"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">Password</label>
                        <input
                          type="password"
                          name="password"
                          className="form-control _social_registration_input"
                          value={formData.password}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Repeat Password */}
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">Repeat Password</label>
                        <input
                          type="password"
                          name="repeatPassword"
                          className="form-control _social_registration_input"
                          value={formData.repeatPassword}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                  </div>

                  {/* Terms & Conditions */}
                  <div className="row">
                    <div className="col-lg-12 col-xl-12 col-md-12 col-sm-12">
                      <div className="form-check _social_registration_form_check">
                        <input
                          className="form-check-input _social_registration_form_check_input"
                          type="radio"
                          name="flexRadioDefault"
                          id="flexRadioDefault2"
                          checked={agreeTerms}
                          onChange={() => setAgreeTerms(!agreeTerms)}
                        />
                        <label
                          className="form-check-label _social_registration_form_check_label"
                          htmlFor="flexRadioDefault2"
                        >
                          I agree to terms &amp; conditions
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="row">
                      <div className="col-12">
                        <p className="text-danger _mar_t8">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="row">
                    <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
                      <div className="_social_registration_form_btn _mar_t40 _mar_b60">
                        <button
                          type="submit"
                          className="_social_registration_form_btn_link _btn1"
                          disabled={loading}
                        >
                          {loading ? 'Creating account...' : 'Register now'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                {/* Bottom: Login link */}
                <div className="row">
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="_social_registration_bottom_txt">
                      <p className="_social_registration_bottom_txt_para">
                        Already have an account?{' '}
                        <Link href="/login">Login now</Link>
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