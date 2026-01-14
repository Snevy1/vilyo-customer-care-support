"use client";


import AddKnowledgeModal from '@/components/dashboard/knowledge/addKnowledgeModal';
import QuickActions from '@/components/dashboard/knowledge/quickActions';
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import React, { useState } from 'react'

const page = () => {
    const [defaultTab, setDefaultTab] = useState("website");
    const [isAddOpen, setIsAddOpen] = useState(false);


    const openModal = (tab:string)=>{

        setDefaultTab(tab);
        setIsAddOpen(true);


    };






  return (
    <div className='p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500 '>
       <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
        <div>
            <h1 className='text-2xl font-semibold text-white tracking-tight'>
                Knowledge Base
            </h1>
            <p className='text-sm text-zinc-400 mt-1'>
                Manage your website sources, documents, and uploads here.

            </p>
        </div>

         <div className='flex items-center gap-2'>
            <Button
            onClick={()=>openModal("website")}
            className='bg-white text-black hover:bg-zinc-200'
            
            >
                <Plus className='w-4 h-4 mr-2' />
                Add Knowledge

            </Button>

         </div>

       </div>

        {/* QuickActions */}

        <QuickActions onOpenModal={openModal} />

         <AddKnowledgeModal />
    </div>
  )
}

export default page