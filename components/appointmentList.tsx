'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Video, User } from 'lucide-react';
import { format } from 'date-fns';

export function AppointmentsList({ orgId }: { orgId: string }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/appointments`)
      .then(res => res.json())
      .then(data => {
        setAppointments(data);
        setLoading(false);
      });
  }, [orgId]);

  if (loading) return <div className="p-4">Loading schedule...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Upcoming Appointments</h2>
      {appointments.length === 0 ? (
        <p className="text-gray-500">No appointments booked yet.</p>
      ) : (
        appointments.map((apt: any) => (
          <Card key={apt.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{apt.customer_name}</h3>
                  <p className="text-sm text-gray-500">{apt.service_type}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(apt.scheduled_at), 'PPP p')}
                    </span>
                    {apt.google_meet_link && (
                      <a 
                        href={apt.google_meet_link} 
                        target="_blank" 
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Video className="h-4 w-4" />
                        Join Meet
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {apt.status.toUpperCase()}
                </span>
                <p className="text-xs text-gray-400 mt-1">{apt.customer_email}</p>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}