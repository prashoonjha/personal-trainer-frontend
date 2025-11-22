import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Button } from '@mui/material'; // NEW

const API_BASE_URL =
  'https://customer-rest-service-frontend-personaltrainer.2.rahtiapp.fi/api';

interface TrainingCustomer {
  id: number;
  firstname: string;
  lastname: string;
  streetaddress: string;
  postcode: string;
  city: string;
  email: string;
  phone: string;
}

interface Training {
  id: number;
  date: string;
  duration: number;
  activity: string;
  customer: TrainingCustomer;
}

type SortKey = 'date' | 'activity' | 'duration' | 'customerName';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

function TrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [filtered, setFiltered] = useState<Training[]>([]);
  const [searchText, setSearchText] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'date',
    direction: 'asc',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load trainings with customer info
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`${API_BASE_URL}/gettrainings`);
        if (!res.ok) throw new Error('Failed to load trainings');

        const data: Training[] = await res.json();
        setTrainings(data);
        setFiltered(data);
      } catch (err) {
        console.error(err);
        setError('Unable to fetch trainings');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Search / filter
  useEffect(() => {
    const term = searchText.trim().toLowerCase();

    if (!term) {
      setFiltered(trainings);
      return;
    }

    const result = trainings.filter((t) => {
      const customerName = `${t.customer.firstname} ${t.customer.lastname}`.toLowerCase();

      const text = [
        t.activity,
        t.duration.toString(),
        customerName,
        t.customer.email,
        t.customer.phone,
        t.customer.city,
      ]
        .join(' ')
        .toLowerCase();

      return text.includes(term);
    });

    setFiltered(result);
  }, [trainings, searchText]);

  // Sorting
  function handleSort(key: SortKey) {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  }

  function sortIndicator(key: SortKey) {
    if (sortConfig.key !== key) return null;
    return (
      <span className="sort-indicator">
        {sortConfig.direction === 'asc' ? '▲' : '▼'}
      </span>
    );
  }

  const sorted = [...filtered].sort((a, b) => {
    const { key, direction } = sortConfig;

    const valueA =
      key === 'date'
        ? new Date(a.date).getTime()
        : key === 'duration'
        ? a.duration
        : key === 'activity'
        ? a.activity.toLowerCase()
        : `${a.customer.firstname} ${a.customer.lastname}`.toLowerCase();

    const valueB =
      key === 'date'
        ? new Date(b.date).getTime()
        : key === 'duration'
        ? b.duration
        : key === 'activity'
        ? b.activity.toLowerCase()
        : `${b.customer.firstname} ${b.customer.lastname}`.toLowerCase();

    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });


  async function handleDeleteTraining(training: Training) {
    const formattedDate = dayjs(training.date).format('DD.MM.YYYY HH:mm');
    const customerName = `${training.customer.firstname} ${training.customer.lastname}`;

    const ok = window.confirm(
      `Delete training "${training.activity}" on ${formattedDate} for ${customerName}?`
    );
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE_URL}/trainings/${training.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        
        const refreshed = await fetch(`${API_BASE_URL}/gettrainings`);
        const data: Training[] = await refreshed.json();
        setTrainings(data);
        setFiltered(data);
      } else {
        alert(`Failed to delete training (status ${res.status}).`);
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting training.');
    }
  }

  return (
    <div>
      <h1>Trainings</h1>

      <div className="search-bar">
        <label>Search:</label>
        <input
          type="text"
          placeholder="Filter by activity, customer, city..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <span className="badge">
          {filtered.length} / {trainings.length} shown
        </span>
      </div>

      {loading && <div className="message">Loading trainings...</div>}
      {error && <div className="message error">{error}</div>}

      {!loading && !error && trainings.length === 0 && (
        <div className="message">
          No trainings found.
          <br />
          If the demo database is empty, check the REST API documentation for how
          to reset it.
        </div>
      )}

      {!loading && !error && trainings.length > 0 && (
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('date')}>
                Date {sortIndicator('date')}
              </th>
              <th onClick={() => handleSort('activity')}>
                Activity {sortIndicator('activity')}
              </th>
              <th onClick={() => handleSort('duration')}>
                Duration (min) {sortIndicator('duration')}
              </th>
              <th onClick={() => handleSort('customerName')}>
                Customer {sortIndicator('customerName')}
              </th>
              <th>City</th>
              <th>Actions</th> 
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => {
              const formattedDate = dayjs(t.date).format('DD.MM.YYYY HH:mm');
              const name = `${t.customer.firstname} ${t.customer.lastname}`;
              return (
                <tr key={t.id}>
                  <td>{formattedDate}</td>
                  <td>{t.activity}</td>
                  <td>{t.duration}</td>
                  <td>{name}</td>
                  <td>{t.customer.city}</td>
                  <td>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => handleDeleteTraining(t)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TrainingsPage;
