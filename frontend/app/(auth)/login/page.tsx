'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/authStore';
import { apiClient } from '@/lib/apiClient';
import { Loader2, Eye, EyeOff, ArrowRight, Package, Shield, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TenantLoginPage() {
  const { setAuth } = useAuth();
  const [email, setEmail]         = useState('admin@acme.com');
  const [password, setPassword]   = useState('Password123!');
  const [subdomain, setSubdomain] = useState('acme');
  const [showPass, setShowPass]   = useState(false);
  const [totpToken, setTotpToken] = useState('');
  const [stage, setStage]         = useState<'credentials' | '2fa'>('credentials');
  const [tempToken, setTempToken] = useState('');
  const [loading, setLoading]     = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { subdomain, email, password });
      if (res.data.success && res.data.data.access_token) {
        setAuth(res.data.data.user, res.data.data.access_token);
        toast.success('Signed in!');
        window.location.href = '/dashboard';
      } else if (res.data.data?.status === '2fa_required') {
        setTempToken(res.data.data.temp_token);
        setStage('2fa');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handle2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/verify-2fa', { token: totpToken },
        { headers: { Authorization: `Bearer ${tempToken}` } });
      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.access_token);
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f4f6fa]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col w-[52%] relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0a0d14 0%, #0f1a2e 50%, #0d1528 100%)' }}>

        {/* Orbs */}
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-80px] left-[-80px] w-[350px] h-[350px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }} />
        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 16px rgba(37,99,235,0.5)' }}>N</div>
            <span className="text-white font-semibold text-base tracking-tight">Nanoshipy</span>
          </div>

          {/* Hero */}
          <div className="flex-1 flex flex-col justify-center max-w-[380px]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 w-fit"
              style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
              <span className="text-[11.5px] font-semibold text-[#60a5fa]">Seller Workspace</span>
            </div>

            <h1 className="text-[36px] font-bold text-white leading-[1.15] tracking-tight mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}>
              Ship orders.<br />
              <span style={{ background: 'linear-gradient(90deg, #60a5fa, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Track everything.
              </span>
            </h1>
            <p className="text-[14px] leading-relaxed mb-8" style={{ color: '#6b7f99' }}>
              Book shipments across 18+ couriers, manage NDRs, recharge your wallet, and grow your business with powerful analytics.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Package, stat: '18+',      label: 'Couriers' },
                { icon: Zap,     stat: 'Real-time', label: 'Tracking' },
                { icon: Shield,  stat: '99.2%',    label: 'Uptime' },
              ].map(({ icon: Icon, stat, label }) => (
                <div key={label} className="p-3.5 rounded-2xl text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: '#3b82f6' }} />
                  <div className="text-white font-bold text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>{stat}</div>
                  <div className="text-[10.5px] font-medium mt-0.5" style={{ color: '#4b5870' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px]" style={{ color: '#3d4f66' }}>© 2026 Nanoshipy Technologies Inc.</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[360px]">

          {/* Mobile brand */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>N</div>
            <span className="font-semibold text-[#0a0d14]">Nanoshipy</span>
          </div>

          {stage === 'credentials' ? (
            <>
              <div className="mb-6">
                <h2 className="text-[24px] font-bold text-[#0a0d14] tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Sign in to workspace
                </h2>
                <p className="text-[12.5px] text-[#6b7280] mt-1">Access your seller account and shipping operations.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[11.5px] font-semibold text-[#374151] mb-1.5">Workspace ID</label>
                  <input value={subdomain} onChange={e => setSubdomain(e.target.value)} placeholder="your-company"
                    className="w-full border rounded-xl px-3.5 py-2.5 text-[13px] font-medium bg-white outline-none transition-all"
                    style={{ borderColor: '#e2e6ef' }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#2563eb'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#e2e6ef'; (e.target as HTMLInputElement).style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold text-[#374151] mb-1.5">Email address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full border rounded-xl px-3.5 py-2.5 text-[13px] font-medium bg-white outline-none transition-all"
                    style={{ borderColor: '#e2e6ef' }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#2563eb'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#e2e6ef'; (e.target as HTMLInputElement).style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold text-[#374151] mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full border rounded-xl px-3.5 py-2.5 pr-10 text-[13px] font-medium bg-white outline-none transition-all"
                      style={{ borderColor: '#e2e6ef' }}
                      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#2563eb'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                      onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#e2e6ef'; (e.target as HTMLInputElement).style.boxShadow = 'none'; }}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: '#9ca3af' }}>
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[12px] text-[#4b5563] font-medium">
                    <input type="checkbox" defaultChecked className="rounded" />Stay signed in
                  </label>
                  <span className="text-[12px] font-semibold cursor-pointer" style={{ color: '#2563eb' }}>Forgot password?</span>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[13px] text-white cursor-pointer disabled:opacity-60 mt-2 transition-all"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 2px 8px rgba(37,99,235,0.4)' }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Sign in</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <div className="mt-5 p-3.5 rounded-xl" style={{ background: '#f0f5ff', border: '1px solid #bfdbfe' }}>
                <p className="text-[11.5px] text-[#1e40af] leading-relaxed">
                  <span className="font-bold">Test workspace:</span> <code className="font-mono text-[11px] px-1.5 py-0.5 rounded" style={{ background: '#dbeafe' }}>acme</code> — credentials pre-filled.
                </p>
              </div>
            </>
          ) : (
            <div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <Shield className="w-6 h-6 text-[#2563eb]" />
              </div>
              <h2 className="text-[22px] font-bold text-[#0a0d14] mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Two-factor auth
              </h2>
              <p className="text-[12.5px] text-[#6b7280] mb-6">Enter the 6-digit code from your authenticator app.</p>
              <form onSubmit={handle2fa} className="space-y-4">
                <input type="text" required maxLength={6} value={totpToken}
                  onChange={e => setTotpToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="000 000"
                  className="w-full border rounded-2xl px-4 py-4 text-center text-3xl font-bold text-[#0a0d14] outline-none transition-all"
                  style={{ borderColor: '#e2e6ef', letterSpacing: '0.35em' }}
                  onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#2563eb'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#e2e6ef'; (e.target as HTMLInputElement).style.boxShadow = 'none'; }}
                />
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-[13px] text-white cursor-pointer disabled:opacity-60 transition-all"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 2px 8px rgba(37,99,235,0.4)' }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Verify & Continue'}
                </button>
                <button type="button" onClick={() => setStage('credentials')}
                  className="w-full text-center text-[12px] font-semibold cursor-pointer" style={{ color: '#6b7280' }}>
                  ← Back to sign in
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
