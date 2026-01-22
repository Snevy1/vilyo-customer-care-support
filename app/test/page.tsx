import React from 'react';

import Script from "next/script";


const Page = () => {
  return (
    <div>
        <Script 
        src="http://localhost:3000/widget.js"
         data-id="0a4659c4-2d1d-4a93-9fdb-87dafa563c80" 
         defer></Script>
    </div>
  )
}

export default Page