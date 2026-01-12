

import { useUser } from '@/hooks/useUser'
import { isAuthorized } from '@/lib/isAuthorized'
import Link from 'next/link'
import React from 'react'

const Navbar = async() => {
const user =  await isAuthorized();
  return (
    <nav className='fixed top-0 inset-x-0 z-50 transition-all duration-300 backdrop-blur-sm border-b border-white/5 bg-[#050509]/50'>
        <div className='max-w-6xl mx-auto px-6 h-16 flex items-center justify-between'>

            <Link href={"/"} className='flex items-center gap-2'>
  <div className='w-6 h-6 bg-white/10 rounded-md border border-white/20 flex items-center justify-center'>
    <svg 
      viewBox="0 0 24 24" 
      className="w-4 h-4 text-white" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  </div>

  <span className='text-base font-semibold font-inter tracking-tight text-white/90'>
    Vilyo Customer Support
  </span>
</Link>

            <div className='hidden md:flex items-center gap-8 text-sm font-light text-zinc-400'>

                <Link href='#features' className='hover:text-white transition-colors'>
                  Features
                </Link>
                <Link href='#how-it-works' className='hover:text-white transition-colors'>

                  Integration
                </Link>
                <Link href='#pricing' className='hover:text-white transition-colors'>
                  Pricing
                </Link>

            </div>

                <div className='flex items-center gap-4'>

                  {
                    user ? (
                      <div className='flex items-center gap-3'>
                        <Link href="/dashboard" className='h-10 px-4 rounded-xl bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-all flex items-center gap-2'>
                        
                        Dashboard
                        </Link>

                      </div>
                    ):(
                      <>
                      <Link
                    href="/api/auth"
                    className='text-xs font-medium text-zinc-400 hover:text-white transition-colors'
                    
                    >
                        Sign in
                    
                    </Link>
                    <Link
                    href="/api/auth"
                    className='text-xs font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors'

                    
                    >
                        Get started
                    
                    </Link></>

                    )
                  }
                    

                </div>
            

        </div>

    </nav>
  )
}

export default Navbar