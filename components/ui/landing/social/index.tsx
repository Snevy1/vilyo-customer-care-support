import React from 'react'

export const SocialProof = () => {
  return (
    <section className='py-12 border-y border-white/5 bg-black/20 '>
        <div className='max-w-6xl mx-auto px-6 text-center'>

           <p className='text-xs font-medium text-zinc-600 uppercase tracking-widest mb-8'>
            Trusted by forward-thinking companies worldwide to enhance customer support and drive satisfaction.
           </p>

             <div className='flex flex-wrap justify-center gap-12 md:gap-20 opacity-40 grayscale'>

                {/* Simple text logos for minimal feel */}

                <span className='text-lg font-bold tracking-tight text-white'>
                    VILYO
                </span>

                <span className='text-lg font-bold tracking-tight text-white flex items-center gap-1'>
                    <div className='w-4 h-4 bg-white rounded-full'>
                       
                        </div>
                         Stripe
                </span>

                <span className='text-lg font-semibold tracking-tight text-white  font-serif'>
                    SAFARICOM
                </span>

                <span className='text-lg font-bold tracking-tight text-white italic font-serif'>
                   Ventures
                </span>
                <span className='text-lg font-light tracking-[0.2em] text-white '>
                     HORIZON
                </span>



             </div>
        </div>

    </section>
  )
}
