import { SectionFormData, Tone } from '@/@types/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Value } from '@radix-ui/react-select';
import React from 'react';



interface SectionFormFieldProps {
    formData: SectionFormData
    setFormData:(data:SectionFormData) => void;
    selectedSources: string[];
    setSelectedSources: (sources:string[])=> void;
    knowledgeSource: KnowledgeSource[]
    isLoadingSources: boolean;
    isDisabled:boolean;

}

interface KnowledgeSource {
    id: string;
    name: string;
    type: string;
}

const TONE_OPTIONS = [
    {
        value:"strict",
        label: "Strict",
        badge: "Fact-based",
        description: "Only answer if fully confident. No small talk"

    },
    {
        value: "neutral",
        label: "Neutral",
        description: "Professional, concise, and direct"
    },
    {
        value: "friendly",
        label: "Friendly",
        description: "Warm and conversational. Good for general FAQ."
    },
    {
        value: "empathetic",
        label: "Empathetic",
        description: "Support-first, apologetic, and calming"
    }
]

const SectionFormFields = ({
    formData,
    setFormData,
    selectedSources,
    knowledgeSource,
    isLoadingSources,
    isDisabled,
    setSelectedSources


}: SectionFormFieldProps) => {
  return <>
    <div className='space-y-4'>
        <h4 className='text-xs font-semibold text-zinc-500 uppercase tracking-wider'>
            Basics
        </h4>
        <div className='space-y-2'>
            <Label className='text-zinc-300'>Section Name</Label>
            <Input
            placeholder='e.g Billing Policy'
            className='bg-white/2 border-white/10 text-white placeholder:'
            value={formData.name}
            onChange={(e)=> setFormData({...formData, name: e.target.value})}
            disabled={isDisabled}
            
            
            />

        </div>
        <div className='space-y-2'>
            <Label className='text-zinc-300'>Description</Label>
            <Input
            placeholder='When should the AI use this?'
            className='bg-white/2 border-white/10 text-white placeholder:'
            value={formData.description}
            onChange={(e)=> setFormData({...formData, description: e.target.value})}
            disabled={isDisabled}
            
            
            />
            <p className='text-[11px] text-zinc-500'>
                Used by the routing model to decide when to activate this section.

            </p>

        </div>

        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <h4 className='text-xs font-semibold text-zinc-500 uppercase tracking-wider'>
                    Data Sources
                </h4>

                <span className='text-xs text-zinc-500'>
                    {selectedSources.length} attached
                </span>

            </div>

            <Select
            value={selectedSources[0] || ""}
            onValueChange={(value)=>{

                if(!selectedSources.includes(value)){
                    setSelectedSources([...selectedSources, value])
                }
            }}
            disabled={isDisabled}
            
            
            >
                <SelectTrigger className='bg-white/2 border-white/10 text-white'>
                    <SelectValue
                    placeholder={
                        isLoadingSources
                        ? "Loading sources..."
                        : "Select knowledge sources..."
                    }
                    
                    
                    >

                    </SelectValue>
                </SelectTrigger>
                <SelectContent className='bg-[#0A0A0E] border-white/10 text-zinc-300'>
                {
                    knowledgeSource.length > 0 ? (
                        knowledgeSource?.map((source)=>(
                            <SelectItem key={source.id} value={source.id}>
                                <div className='flex items-center gap-2'>
                                    <span className='text-xs text-zinc-500 capitalize'>
                                     [{source.type}]
                                    </span>
                                    <span>{source.name}</span>

                                </div>

                            </SelectItem>
                        ))
                    ): (
                        <SelectItem value='none' disabled>
                            No sources available yet

                        </SelectItem>
                    )
                }

                </SelectContent>

            </Select>

            {selectedSources?.length >0 && (
                <div className='space-y-2'>
                    {selectedSources?.map((sourceId)=>{
                        const source = knowledgeSource?.find((s)=>s.id === sourceId);

                        if(!source) return null;

                        return <div key={sourceId}

                        className='flex items-center justify-between p-2 rounded-md bg-white/5 border border-white/10'
                        
                        >
                          <div className='flex items-center gap-2'>
                            <span className='text-xs text-zinc-500 capitalize'>
                                [{source.type}]
                            </span>
                            <span className='text-sm text-zinc-300'>
                                {source.name}

                            </span>

                            <Button
                            variant="ghost"
                            size="sm"
                            className='h-6 w-6 p-0 text-zinc-500 hover:text-red-400'
                            onClick={()=>
                                setSelectedSources(
                                    selectedSources.filter((id) => id !== sourceId)
                                )
                            }

                            disabled={isDisabled}
                            
                            >

                            </Button>
                            </div>  


                        </div>
                    })}

                </div>
            )}

            

        </div>

        <div className='space-y-4'>
            <h4 className='text-xs font-semibold text-zinc-500 uppercase transition-colors'>
                Tone
            </h4>
            <RadioGroup
            value={formData.tone}
            onValueChange={(value)=>
                setFormData({...formData, tone: value as Tone})
            }
            className='grid grid-cols-1 gap-2'
            
            >
                {TONE_OPTIONS.map((option)=>(
                    <div
                    key={option.value}
                    className='flex items-center space-x-2 rounded-md border border-white/5 bg-white/1 p-3 hover:bg-white/5 transition-colors '
                    
                    >
                        <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        className='border-white/20 text-indigo-500'
                        
                        />
                        <Label htmlFor={option.value} className='flex-1 cursor-pointer'>
                             
                             <div className='flex items-center gap-2'>
                                <span className='text-zinc-200 font-medium'>
                                    {option.label}

                                </span>
                                {
                                    option.badge && (
                                        <span className='text-[10px] bg-red-500/10 text-red-500 px-1.5 rounded-sm border border-red-500/10'>
                                            {option.badge}
                                        </span>
                                    )
                                }

                             </div>
                             <span className='text-xs text-zinc-500 font-normal'>
                                {option.description}
                             </span>


                        </Label>


                    </div>
                ))}

            </RadioGroup>

        </div>

           <div className='space-y-4'>
            <h4 className='text-xs font-semibold text-zinc-500 uppercase transition-colors'>
                Scope Rules
            </h4>

            <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                    <Label className='text-zinc-300 text-xs'>
                        Allowed Topics

                    </Label>

                    <Input
                    className='bg-white/2 border-white/10 text-white placeholder:'
                    placeholder='e.g pricing, refunds'
                    value={formData.allowedTopics}
                    onChange={(e)=>
                        setFormData({...formData, allowedTopics: e.target.value})
                    }

                    disabled={isDisabled}
                    
                    
                    
                    />

                </div>

                <div className='space-y-2'>
                    <Label className='text-zinc-300 text-xs'>
                        Blocked Topics

                    </Label>

                    <Input
                    className='bg-white/2 border-white/10 text-white placeholder:'
                    placeholder='e.g competitors'
                    value={formData.blockedTopics}
                    onChange={(e)=>
                        setFormData({...formData, blockedTopics: e.target.value})
                    }

                    disabled={isDisabled}
                    
                    
                    
                    />

                </div>

            </div>

           </div>



    </div>
  </>
}

export default SectionFormFields