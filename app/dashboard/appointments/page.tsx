"use client"

import { AppointmentsList } from '@/components/appointmentList'
import { Loader2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'

const AppointmentsPage = () => {
  const [organization, setOrganization] = useState<{id: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch("/api/organization/fetch");
        
        if (!response.ok) {
          throw new Error('Failed to fetch organization data');
        }
        
        const data = await response.json();
        setOrganization(data.organization);
      } catch (error) {
        console.error('Error fetching organization:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrganization();
  }, []);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-[#050509]'>
        <Loader2 className='w-8 h-8 animate-spin text-indigo-500' />
      </div>
    );
  }

  if (!organization?.id) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-[#050509]'>
        <div className='text-center'>
          <p className='text-zinc-400'>Unable to load organization data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
        <AppointmentsList orgId={organization.id} />;
    </div>
  )
}

export default AppointmentsPage;