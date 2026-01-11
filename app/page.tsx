import Features from '@/components/ui/landing/features'
import Footer from '@/components/ui/landing/footer'
import Hero from '@/components/ui/landing/hero'
import Integration from '@/components/ui/landing/integration'
import Navbar from '@/components/ui/landing/nav'
import Pricing from '@/components/ui/landing/pricing'
import { SocialProof } from '@/components/ui/landing/social'
import React from 'react'

const page = () => {
  return (
    <main className='w-full flex flex-col relative z-10'>
      <Navbar />
      <Hero />
      <SocialProof />
      <Features />
      <Integration />
      <Pricing />
      <Footer />
    </main>
  )
}

export default page