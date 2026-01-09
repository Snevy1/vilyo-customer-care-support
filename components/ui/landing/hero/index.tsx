import React from 'react'

const Hero = () => {
  return (
    <section className='relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden'>
        <div className='max-w-4xl mx-auto text-center relative z-20'>
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 animate-float'>

            <span className='w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)'>


            </span>
            <span className='text-xs text-zinc-300 tracking-wide font-light'>
                Version 1.0.0 available now

            </span>

            </div>

            <h1 className='text-5xl md:text-7xl font-medium tracking-tight text-white mb-6 leading-[1.1]'>
    24/7 support that actually helps
    <br />
    <span className='text-zinc-500'>faster answers, fewer frustrations</span>
</h1>




        </div>
    </section>
  )
}

export default Hero