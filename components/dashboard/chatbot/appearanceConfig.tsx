import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Value } from '@radix-ui/react-select';
import { Palette } from 'lucide-react';
import React from 'react';

interface  AppearanceConfigProps {
    primaryColor: string;
    setPrimaryColor: (color:string) => void;
    welcomeMessage: string;
    setWelcomeMessage: (msg:string)=> void;
    handleSave: ()=>void;
    isSaving: boolean;
    hasChanges: boolean;
}


const PRESET_COLORS = [
    {name: "Indigo", value: "#4f46e5"},
    {name: 'Blue', value: "#2563eb"},
    {name: "Emerald", value: "#059669"},
    {name: "Rose", value: "#e11d48"},
    {name: "Orange", value: "#ea580c"}
]

const AppearanceConfig = ({primaryColor,
    setPrimaryColor,
    welcomeMessage,
    setWelcomeMessage,
    handleSave,
    isSaving,
    hasChanges

}:AppearanceConfigProps) => {
  return (
    <Card
    className='border-white/5 bg-[#0a0a0e]'
    
    >
        <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
                <Palette className='w-4 h-4 text-zinc-500' />
                <CardTitle className='text-sm font-medium text-white uppercase tracking-wider'>
                     Appearance
                </CardTitle>

            </div>

        </CardHeader>

        <CardContent className='space-y-5'>
            <div className='space-y-3'>
                <Label className='text-zinc-300'>Primary Color</Label>
                <div className='flex gap-3'>
                    {
                        PRESET_COLORS.map((color)=>(
                            <button
                            key={color.name}
                            onClick={()=>setPrimaryColor(color.value)}
                            className={
                                cn(
                                    "w-6 h-6 rounded-full border-2 transition-all",
                                    primaryColor === color.value
                                    ? "ring-2 ring-white ring-offset-2 ring-offset-[#0A0A0E] scale-110"
                                     : "opacity-60 hover:opacity-100"
                                )
                            }

                            style={{
                                backgroundColor: color.value,
                                borderColor: color.value
                            }}

                            title={color.name}
                            
                            />

                            
                        ))
                    }

                    <div>
                        
                    </div>

                </div>
            </div>

        </CardContent>

    </Card>
  )
}

export default AppearanceConfig