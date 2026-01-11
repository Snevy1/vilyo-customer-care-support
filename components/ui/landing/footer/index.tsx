import Link from 'next/link'
import React from 'react'

const Footer = () => {
  return (
    <footer className='border-t border-white/5 py-12 bg-black/40'>
          <div className='max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6'>
            <div className='flex items-center gap-2'>
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

            </div>

            <div className='flex gap-8 text-sm text-zinc-600 font-light'>
                <Link href="#" className='hover:text-zinc-400 transition-colors'>
                Privacy
                </Link>
                <Link href="#" className='hover:text-zinc-400 transition-colors'>
                 Terms
                </Link>
                <Link href="#" className='hover:text-zinc-400 transition-colors'>
                 Twitter
                </Link>

            </div>

            <div className='text-xs text-zinc-700'>
                 &copy; 2026 All rights reserved.
            </div>

          </div>
    </footer>
  )
}

export default Footer