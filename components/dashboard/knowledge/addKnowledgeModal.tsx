import { KnowledgeSource } from '@/@types/types';
import { Dialog } from '@/components/ui/dialog';
import React from 'react'

interface AddKnowledgeModalProps {
    isOpen: boolean;
    setIsOpen: (open:boolean)=> void;
    defaultTab: string;
    setDefaultTab: (tab:string)=> void;
    onImport: (data:any) => Promise<void>;
    isLoading: boolean;
    existingSources: KnowledgeSource[]
}

const AddKnowledgeModal = ({isOpen, setIsOpen, defaultTab, setDefaultTab, onImport, isLoading, existingSources}:AddKnowledgeModalProps) => {
  return (
    <Dialog>
        
    </Dialog>
  )
}

export default AddKnowledgeModal