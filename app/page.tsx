import Hero from '@/components/ui/landing/hero'
import Navbar from '@/components/ui/landing/nav'
import React from 'react'

const page = () => {
  return (
    <main className='w-full flex flex-col relative z-10'>
      <Navbar />
      <Hero />
    </main>
  )
}

export default page