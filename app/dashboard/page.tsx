"use client";


import InitialForm from '@/components/dashboard/InitialForm'
import React, { useEffect, useState } from 'react'

const Page = () => {

    const [isMetadaAvailable, setIsMetaDataAvailable] = useState(false);
    const [isLoading, setIsLoading] = useState(true);




    useEffect(()=>{
        const fetchMetadata = async()=>{
            const response = await fetch("/api/metadata/fetch");

            const data = await response.json();

            setIsMetaDataAvailable(data.exists);
            setIsLoading(false)
        };

        fetchMetadata()
    },[]);


    if(isLoading){
        return (
            <div className='flex-1 flex w-full items-center justify-center p-4' />

        )
    }


  return (
    <div className='flex-1 flex w-full'>

        {
            !isMetadaAvailable ? (
                <div className='w-full flex items-center justify-center p-4 min-h-[calc'>
           <InitialForm/>
        </div>
        
                
            ):(
              <></>
            )
        }
        

    </div>
  )
}

export default Page;

