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
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
    <div className="_login_wrapper">
      <div className="_login_wrap">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
              <div className="_login_left">
                <div className="_login_left_img">
                  <Image src="/assets/images/registration.png" alt="Registration" width={500} height={400} priority />
                </div>
              </div>
            </div>

            <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
              <div className="_login_right">
                <div className="_login_right_main _b_radious6">
                  <div className="_login_right_top _mar_b32">
                    <div className="_login_right_logo _mar_b24">
                      <Image src="/assets/images/logo.svg" alt="Logo" width={150} height={40} />
                    </div>
                    <h4 className="_login_right_title _title1 _mar_b8">Sign Up</h4>
                    <p className="_login_right_para _para1">Join our community and share your moments</p>
                  </div>

                  <form onSubmit={handleSubmit} className="_login_right_form">
                    <div className="row">
                       <div className="col-6">
                          <div className="form-group _mar_b24">
                             <label className="_login_label _mar_b8">First Name</label>
                             <input 
                               type="text" 
                               name="firstName"
                               className="form-control _login_input" 
                               placeholder="First Name"
                               value={formData.firstName}
                               onChange={handleChange}
                               required
                             />
                          </div>
                       </div>
                       <div className="col-6">
                          <div className="form-group _mar_b24">
                             <label className="_login_label _mar_b8">Last Name</label>
                             <input 
                               type="text" 
                               name="lastName"
                               className="form-control _login_input" 
                               placeholder="Last Name"
                               value={formData.lastName}
                               onChange={handleChange}
                               required
                             />
                          </div>
                       </div>
                    </div>

                    <div className="form-group _mar_b24">
                      <label className="_login_label _mar_b8">Email Address</label>
                      <input 
                        type="email" 
                        name="email"
                        className="form-control _login_input" 
                        placeholder="Enter email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group _mar_b24">
                      <label className="_login_label _mar_b8">Password</label>
                      <input 
                        type="password" 
                        name="password"
                        className="form-control _login_input" 
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {error && <p className="text-danger mb-3">{error}</p>}

                      <button type="submit" className="_login_btn _btn1 w-100" disabled={loading}>
                        {loading ? 'Creating account...' : 'Register Account'}
                      </button>

                    <div className="_login_right_form_bottom text-center">
                      <p className="_login_right_form_bottom_para">
                        Already have an account? <Link href="/login" className="_login_right_form_bottom_link">Log In</Link>
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

       {/* Decorative shapes from the template */}
       <div className="_shape_one">
        <Image src="/assets/images/shape1.svg" alt="" width={100} height={100} />
      </div>
      <div className="_shape_two">
        <Image src="/assets/images/shape2.svg" alt="" width={100} height={100} />
      </div>
      <div className="_shape_three">
        <Image src="/assets/images/shape3.svg" alt="" width={100} height={100} />
      </div>
    </div>
  )
}
