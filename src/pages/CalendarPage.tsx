import React, { useEffect, useState } from 'react';
import { Calendar, dayjsLocalizer, Views } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const API_BASE_URL =
  'https://customer-rest-service-frontend-personaltrainer.2.rahtiapp.fi/api';

const localizer = dayjsLocalizer(dayjs);

interface TrainingCustomer {
  firstname: string;
  lastname: string;
}

interface Training {
  id: number;
  date: string;
  duration: number;
  activity: string;
  customer: TrainingCustomer;
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
}

function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTrainings() {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`${API_BASE_URL}/gettrainings`);
        if (!res.ok) throw new Error('Failed to load trainings');

        const data: Training[] = await res.json();

        const mapped: CalendarEvent[] = data.map((t) => {
          const start = new Date(t.date);
          const end = new Date(start.getTime() + t.duration * 60000);
          const customerName = t.customer
            ? `${t.customer.firstname} ${t.customer.lastname}`
            : 'Unknown';

          return {
            id: t.id,
            title: `${t.activity} / ${customerName}`,
            start,
            end,
          };
        });

        setEvents(mapped);
      } catch (err) {
        console.error(err);
        setError('Unable to load calendar data');
      } finally {
        setLoading(false);
      }
    }

    loadTrainings();
  }, []);

  return (
    <div style={{ height: '90vh', padding: '1rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Training Calendar</h1>

      {loading && <p>Loading calendar...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView={Views.WEEK}
          views={['month', 'week', 'day', 'agenda']}
          style={{ height: '80vh', background: 'white' }}
        />
      )}
    </div>
  );
}

export default CalendarPage;
