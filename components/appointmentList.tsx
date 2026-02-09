'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Video, User, Mail, Phone, MapPin, Loader2, CalendarDays, ExternalLink } from 'lucide-react';
import { format, isPast, isToday, isTomorrow, isFuture } from 'date-fns';

interface Appointment {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  service_type: string;
  scheduled_at: string;
  duration_minutes?: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  google_meet_link?: string;
  location?: string;
  notes?: string;
}

export function AppointmentsList({ orgId }: { orgId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (!orgId) return;
    
    setLoading(true);
    fetch(`/api/appointments`)
      .then(res => res.json())
      .then(data => {
        setAppointments(data || []);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch appointments:', error);
        setLoading(false);
      });
  }, [orgId]);

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMMM d');
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' };
      case 'pending':
        return { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20' };
      case 'cancelled':
        return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' };
      case 'completed':
        return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' };
      default:
        return { bg: 'bg-zinc-500/10', text: 'text-zinc-500', border: 'border-zinc-500/20' };
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduled_at);
    if (filter === 'upcoming') return isFuture(aptDate) || isToday(aptDate);
    if (filter === 'past') return isPast(aptDate) && !isToday(aptDate);
    return true;
  });

  const groupedAppointments = filteredAppointments.reduce((groups: Record<string, Appointment[]>, apt) => {
    const date = format(new Date(apt.scheduled_at), 'yyyy-MM-dd');
    if (!groups[date]) groups[date] = [];
    groups[date].push(apt);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedAppointments).sort();

  if (loading) {
    return (
      <div className='p-6 md:p-8 space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500'>
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='w-8 h-8 animate-spin text-indigo-500' />
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 md:p-8 space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold text-white tracking-tight flex items-center gap-2'>
            <CalendarDays className='w-6 h-6 text-indigo-500' />
            Appointments
          </h1>
          <p className='text-sm text-zinc-400 mt-1'>
            Manage your scheduled meetings and bookings
          </p>
        </div>

        {/* Stats */}
        <div className='flex gap-2'>
          <div className='bg-[#0A0A0E] border border-white/5 rounded-lg px-4 py-2'>
            <div className='text-xs text-zinc-500'>Total</div>
            <div className='text-xl font-semibold text-white'>{appointments.length}</div>
          </div>
          <div className='bg-[#0A0A0E] border border-white/5 rounded-lg px-4 py-2'>
            <div className='text-xs text-zinc-500'>Upcoming</div>
            <div className='text-xl font-semibold text-emerald-500'>
              {appointments.filter(apt => isFuture(new Date(apt.scheduled_at)) || isToday(new Date(apt.scheduled_at))).length}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className='flex gap-2'>
        <Button
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'default' : 'outline'}
          className={filter === 'all' 
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
            : 'bg-transparent border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white'
          }
          size="sm"
        >
          All
        </Button>
        <Button
          onClick={() => setFilter('upcoming')}
          variant={filter === 'upcoming' ? 'default' : 'outline'}
          className={filter === 'upcoming' 
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
            : 'bg-transparent border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white'
          }
          size="sm"
        >
          Upcoming
        </Button>
        <Button
          onClick={() => setFilter('past')}
          variant={filter === 'past' ? 'default' : 'outline'}
          className={filter === 'past' 
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
            : 'bg-transparent border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white'
          }
          size="sm"
        >
          Past
        </Button>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <Card className='border-white/5 bg-[#0A0A0E]'>
          <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='bg-zinc-900/50 p-4 rounded-full mb-4'>
              <Calendar className='w-8 h-8 text-zinc-600' />
            </div>
            <h3 className='text-white font-medium mb-2'>No appointments found</h3>
            <p className='text-zinc-500 text-sm'>
              {filter === 'upcoming' && 'No upcoming appointments scheduled yet.'}
              {filter === 'past' && 'No past appointments to display.'}
              {filter === 'all' && 'No appointments booked yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-6'>
          {sortedDates.map(date => (
            <div key={date} className='space-y-3'>
              {/* Date Header */}
              <div className='flex items-center gap-2 text-sm'>
                <div className='h-px flex-1 bg-white/5'></div>
                <span className='text-zinc-400 font-medium px-3'>
                  {getDateLabel(new Date(date))}
                </span>
                <div className='h-px flex-1 bg-white/5'></div>
              </div>

              {/* Appointments for this date */}
              {groupedAppointments[date].map((apt) => {
                const statusConfig = getStatusConfig(apt.status);
                const appointmentTime = new Date(apt.scheduled_at);

                return (
                  <Card 
                    key={apt.id} 
                    className='border-white/5 bg-[#0A0A0E] hover:border-white/10 transition-all duration-200'
                  >
                    <CardContent className='p-5'>
                      <div className='flex flex-col lg:flex-row lg:items-start justify-between gap-4'>
                        {/* Left Section - Main Info */}
                        <div className='flex gap-4 flex-1'>
                          {/* Time Badge */}
                          <div className='bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 flex flex-col items-center justify-center min-w-17.5'>
                            <div className='text-xs text-indigo-400 font-medium'>
                              {format(appointmentTime, 'MMM')}
                            </div>
                            <div className='text-2xl font-bold text-white'>
                              {format(appointmentTime, 'd')}
                            </div>
                            <div className='text-xs text-indigo-400'>
                              {format(appointmentTime, 'HH:mm')}
                            </div>
                          </div>

                          {/* Details */}
                          <div className='flex-1 space-y-3'>
                            {/* Customer & Service */}
                            <div>
                              <div className='flex items-center gap-2 mb-1'>
                                <h3 className='text-white font-semibold text-base'>{apt.customer_name}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                  {apt.status}
                                </span>
                              </div>
                              <p className='text-sm text-zinc-400'>{apt.service_type}</p>
                            </div>

                            {/* Contact Info */}
                            <div className='flex flex-wrap gap-x-4 gap-y-2 text-xs'>
                              <div className='flex items-center gap-1.5 text-zinc-500'>
                                <Mail className='w-3.5 h-3.5' />
                                <span>{apt.customer_email}</span>
                              </div>
                              {apt.customer_phone && (
                                <div className='flex items-center gap-1.5 text-zinc-500'>
                                  <Phone className='w-3.5 h-3.5' />
                                  <span>{apt.customer_phone}</span>
                                </div>
                              )}
                              {apt.duration_minutes && (
                                <div className='flex items-center gap-1.5 text-zinc-500'>
                                  <Clock className='w-3.5 h-3.5' />
                                  <span>{apt.duration_minutes} minutes</span>
                                </div>
                              )}
                              {apt.location && (
                                <div className='flex items-center gap-1.5 text-zinc-500'>
                                  <MapPin className='w-3.5 h-3.5' />
                                  <span>{apt.location}</span>
                                </div>
                              )}
                            </div>

                            {/* Notes */}
                            {apt.notes && (
                              <div className='bg-zinc-900/50 border border-white/5 rounded p-2.5'>
                                <p className='text-xs text-zinc-400'>{apt.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Section - Actions */}
                        <div className='flex flex-col gap-2 lg:items-end'>
                          {apt.google_meet_link && (
                            <Button
                              asChild
                              size="sm"
                              className='bg-indigo-600 hover:bg-indigo-700 text-white w-full lg:w-auto'
                            >
                              <a href={apt.google_meet_link} target="_blank" rel="noopener noreferrer">
                                <Video className='w-4 h-4 mr-2' />
                                Join Meeting
                                <ExternalLink className='w-3 h-3 ml-1' />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}