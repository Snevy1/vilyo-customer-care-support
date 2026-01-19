import { Section } from '@/@types/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import React from 'react';
import { getStatusBadge, getToneBadge } from './sectionBadges';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

interface SectionTableProps {
    sections: Section[];
    isLoading: boolean;
    onPreview: (section:Section)=> void;
    onCreateSection: ()=> void;
}

const SectionsTable = ({
    sections,
    isLoading,
    onPreview,
    onCreateSection

}:SectionTableProps) => {
  return (
    <Table>
        <TableHeader>
            <TableRow className='border-white/5 hover:bg-transparent'>
             <TableHead className='text-xs uppercase font-medium text-zinc-500'>
                Name

             </TableHead>
             <TableHead className='text-xs uppercase font-medium text-zinc-500'>
                Sources

             </TableHead>
             <TableHead className='text-xs uppercase font-medium text-zinc-500'>
                Tone

             </TableHead>
             <TableHead className='text-xs uppercase font-medium text-zinc-500'>
                Scope

             </TableHead>
             <TableHead className='text-xs uppercase font-medium text-zinc-500'>
                Status

             </TableHead>

             <TableHead className='text-xs uppercase font-medium text-zinc-500 text-right'>
                Action

             </TableHead>

            </TableRow>

        </TableHeader>
        <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell 
                    colSpan={6}
                    className='h-48 text-center'
                    
                    
                    >
                        <div className='flex items-center justify-center gap-2 text-zinc-400 '>
                            <div className='w-4 h-4 border-2 border-zinc-600 '>
                                <span>Loading sections...</span>
                            </div>



                        </div>

                    </TableCell>

                </TableRow>
            ):
            (
               sections.length > 0 ? sections.map((section)=>
            <TableRow key={section.id}
               className='border-white/5 group transition-colors'
            
            
            >
                <TableCell className='font-medium text-zinc-200'>
                    {section.name}
                </TableCell>
                <TableCell className='font-medium text-zinc-200'>
                    {section.sourceCount}{" "}
                    <span className='text-zinc-600'>sources</span>
                </TableCell>
                <TableCell className='font-medium text-zinc-200'>
                   {getToneBadge(section.tone)}
                </TableCell>
                <TableCell className='font-medium text-zinc-200'>
                   {section.scopeLabel}
                </TableCell>
                <TableCell className='font-medium text-zinc-200'>
                   {getStatusBadge(section.status)}
                </TableCell>
                <TableCell className='text-right'>
                    <Button
                    variant="ghost"
                    size="sm"
                    className='h-8 text-zinc-400 hover:text-white hover:bg-white/5'
                    onClick={()=>onPreview(section)}
                    >
                        Preview

                    </Button>
                   
                </TableCell>




            </TableRow>) :(
                <TableRow>
                    <TableCell colSpan={6}
                    className='h-48 text-center'
                    
                    >
                        <div className='flex flex-col items-center justify-center gap-2'>
                            <ShieldAlert className='w-8 h-8 text-zinc-600' />
                            <span className='text-zinc-400'>No sections defined yet.</span>
                            <Button
                            variant="link"
                            className='text-indigo-400'
                            onClick={onCreateSection}
                            
                            >
                                Create your first section.

                            </Button>

                        </div>



                    </TableCell>
                </TableRow>
            )
            )
            
            }

        </TableBody>

    </Table>
    
  )
}

export default SectionsTable