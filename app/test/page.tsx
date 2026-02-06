import React from 'react';

import Script from "next/script";


const Page = () => {
  
  return (
    <div>
        <Script src="http://localhost:3000/widget.js" data-id="ca939e72-f6e3-4962-9c48-51a067b735be" defer></Script>
    </div>
  )
}

export default Page