import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from '@mui/material';
import React, { useEffect, useState } from 'react';

import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const API_BASE_URL =
  'https://customer-rest-service-frontend-personaltrainer.2.rahtiapp.fi/api';

interface CustomerLinks {
  self?: { href: string };
  customer?: { href: string };
  trainings?: { href: string };
}

interface Customer {
  firstname: string;
  lastname: string;
  streetaddress: string;
  postcode: string;
  city: string;
  email: string;
  phone: string;
  _links?: CustomerLinks;
}

interface CustomersResponse {
  _embedded?: {
    customers?: Customer[];
  };
}

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: keyof Customer;
  direction: SortDirection;
}

interface TrainingForm {
  date: Dayjs | null;
  activity: string;
  duration: string; 
}

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'lastname',
    direction: 'asc',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Add customer dialog state
  const [openAdd, setOpenAdd] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    streetaddress: '',
    postcode: '',
    city: '',
  });
  const [openEdit, setOpenEdit] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);

    // Add training dialog state
  const [openTraining, setOpenTraining] = useState(false);
  const [trainingTarget, setTrainingTarget] = useState<Customer | null>(null);
  const [newTraining, setNewTraining] = useState<TrainingForm>({
    date: dayjs(),
    activity: '',
    duration: '',
  });


  function openEditDialog(customer: Customer) {
    setEditCustomer(customer);
    setOpenEdit(true);
  }

    function openAddTrainingDialog(customer: Customer) {
    setTrainingTarget(customer);
    setNewTraining({
      date: dayjs(),
      activity: '',
      duration: '',
    });
    setOpenTraining(true);
  }

  // Fetch customers
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`${API_BASE_URL}/customers`);
        if (!res.ok) {
          throw new Error('Failed to load customers');
        }

        const data: CustomersResponse = await res.json();
        const list = data._embedded?.customers ?? [];

        setCustomers(list);
        setFilteredCustomers(list);
      } catch (err) {
        console.error(err);
        setError('Unable to fetch customers');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Add customer handler
  async function handleAddCustomer() {
    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });

      if (response.ok) {
        // Close dialog
        setOpenAdd(false);

        // Reload customers from API
        const res = await fetch(`${API_BASE_URL}/customers`);
        const data: CustomersResponse = await res.json();
        const list = data._embedded?.customers ?? [];

        setCustomers(list);
        setFilteredCustomers(list);

        // Reset form
        setNewCustomer({
          firstname: '',
          lastname: '',
          email: '',
          phone: '',
          streetaddress: '',
          postcode: '',
          city: '',
        });
      } else {
        alert('Failed to add customer.');
      }
    } catch (err) {
      console.error(err);
      alert('Error while adding customer.');
    }
  }
  async function handleEditCustomer() {
    if (!editCustomer) return;

    const url = editCustomer._links?.customer?.href;
    if (!url) {
      alert("Missing customer URL");
      return;
    }

    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editCustomer),
      });

      if (res.ok) {
        setOpenEdit(false);

        // Reload list
        const refreshed = await fetch(`${API_BASE_URL}/customers`);
        const data: CustomersResponse = await refreshed.json();
        const list = data._embedded?.customers ?? [];

        setCustomers(list);
        setFilteredCustomers(list);
      } else {
        alert("Failed to update customer.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating customer.");
    }
  }

  async function handleAddTraining() {
    if (!trainingTarget) {
      alert('Missing customer for training');
      return;
    }

    if (!newTraining.date) {
      alert('Please choose a date and time');
      return;
    }

    const durationNumber = Number(newTraining.duration);
    if (!durationNumber || durationNumber <= 0) {
      alert('Please enter a valid duration (minutes)');
      return;
    }

    const customerUrl = trainingTarget._links?.self?.href;
    if (!customerUrl) {
      alert('Missing customer link');
      return;
    }

    const payload = {
      date: newTraining.date.toISOString(), // ISO string
      activity: newTraining.activity,
      duration: durationNumber,
      customer: customerUrl,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/trainings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setOpenTraining(false);

      
        setNewTraining({
          date: dayjs(),
          activity: '',
          duration: '',
        });
      } else {
        alert(`Failed to add training (status ${res.status})`);
      }
    } catch (err) {
      console.error(err);
      alert('Error while adding training.');
    }
  }



async function handleDeleteCustomer(customer: Customer) {
    const url = customer._links?.customer?.href;
    if (!url) {
      alert('Missing customer URL');
      return;
    }

    const fullName = `${customer.firstname} ${customer.lastname}`;
    const ok = window.confirm(
      `Delete customer "${fullName}" and ALL their trainings?`
    );
    if (!ok) return;

    try {
      const res = await fetch(url, {
        method: 'DELETE',
      });

      if (res.ok) {
        // reload list after delete
        const refreshed = await fetch(`${API_BASE_URL}/customers`);
        const data: CustomersResponse = await refreshed.json();
        const list = data._embedded?.customers ?? [];
        setCustomers(list);
        setFilteredCustomers(list);
      } else {
        alert('Failed to delete customer.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting customer.');
    }
  }

    // ---- CSV EXPORT ----
  function toCsvValue(value: unknown): string {
    const str = value === null || value === undefined ? '' : String(value);
    
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  function handleExportCsv() {
    if (customers.length === 0) {
      alert('No customers to export.');
      return;
    }


    const headers = [
      'firstname',
      'lastname',
      'email',
      'phone',
      'streetaddress',
      'postcode',
      'city',
    ];

    const rows = customers.map((c) => [
      c.firstname,
      c.lastname,
      c.email,
      c.phone,
      c.streetaddress,
      c.postcode,
      c.city,
    ]);

    const csvLines = [
      headers.map(toCsvValue).join(','), 
      ...rows.map((row) => row.map(toCsvValue).join(',')),
    ];

    const csvContent = csvLines.join('\r\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'customers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
  


  // Search/filter
  useEffect(() => {
    const term = searchText.trim().toLowerCase();

    if (!term) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter((c) => {
      const fullText = [
        c.firstname,
        c.lastname,
        c.email,
        c.phone,
        c.streetaddress,
        c.postcode,
        c.city,
      ]
        .join(' ')
        .toLowerCase();

      return fullText.includes(term);
    });

    setFilteredCustomers(filtered);
  }, [customers, searchText]);

  // Sorting
  function handleSort(key: keyof Customer) {
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

  function sortIndicator(key: keyof Customer) {
    if (sortConfig.key !== key) return null;
    return (
      <span className="sort-indicator">
        {sortConfig.direction === 'asc' ? '▲' : '▼'}
      </span>
    );
  }

  const sorted = [...filteredCustomers].sort((a, b) => {
    const aVal = (a[sortConfig.key] ?? '').toString().toLowerCase();
    const bVal = (b[sortConfig.key] ?? '').toString().toLowerCase();

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

    return (
    <div>
      <h1>Customers</h1>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenAdd(true)}
        >
          Add Customer
        </Button>

        <Button variant="outlined" color="primary" onClick={handleExportCsv}>
          Export CSV
        </Button>
      </div>

      {/* Add Customer dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
        <DialogTitle>Add Customer</DialogTitle>
        <DialogContent
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          <TextField
            label="First Name"
            value={newCustomer.firstname}
            onChange={(e) =>
              setNewCustomer({ ...newCustomer, firstname: e.target.value })
            }
          />
          <TextField
            label="Last Name"
            value={newCustomer.lastname}
            onChange={(e) =>
              setNewCustomer({ ...newCustomer, lastname: e.target.value })
            }
          />
          <TextField
            label="Email"
            value={newCustomer.email}
            onChange={(e) =>
              setNewCustomer({ ...newCustomer, email: e.target.value })
            }
          />
          <TextField
            label="Phone"
            value={newCustomer.phone}
            onChange={(e) =>
              setNewCustomer({ ...newCustomer, phone: e.target.value })
            }
          />
          <TextField
            label="Street Address"
            value={newCustomer.streetaddress}
            onChange={(e) =>
              setNewCustomer({
                ...newCustomer,
                streetaddress: e.target.value,
              })
            }
          />
          <TextField
            label="Postcode"
            value={newCustomer.postcode}
            onChange={(e) =>
              setNewCustomer({ ...newCustomer, postcode: e.target.value })
            }
          />
          <TextField
            label="City"
            value={newCustomer.city}
            onChange={(e) =>
              setNewCustomer({ ...newCustomer, city: e.target.value })
            }
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddCustomer}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogContent
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          <TextField
            label="First Name"
            value={editCustomer?.firstname ?? ""}
            onChange={(e) =>
              setEditCustomer({ ...editCustomer!, firstname: e.target.value })
            }
          />
          <TextField
            label="Last Name"
            value={editCustomer?.lastname ?? ""}
            onChange={(e) =>
              setEditCustomer({ ...editCustomer!, lastname: e.target.value })
            }
          />
          <TextField
            label="Email"
            value={editCustomer?.email ?? ""}
            onChange={(e) =>
              setEditCustomer({ ...editCustomer!, email: e.target.value })
            }
          />
          <TextField
            label="Phone"
            value={editCustomer?.phone ?? ""}
            onChange={(e) =>
              setEditCustomer({ ...editCustomer!, phone: e.target.value })
            }
          />
          <TextField
            label="Street Address"
            value={editCustomer?.streetaddress ?? ""}
            onChange={(e) =>
              setEditCustomer({
                ...editCustomer!,
                streetaddress: e.target.value,
              })
            }
          />
          <TextField
            label="Postcode"
            value={editCustomer?.postcode ?? ""}
            onChange={(e) =>
              setEditCustomer({ ...editCustomer!, postcode: e.target.value })
            }
          />
          <TextField
            label="City"
            value={editCustomer?.city ?? ""}
            onChange={(e) =>
              setEditCustomer({ ...editCustomer!, city: e.target.value })
            }
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditCustomer}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

            <Dialog
        open={openTraining}
        onClose={() => setOpenTraining(false)}
      >
        <DialogTitle>
          {trainingTarget
            ? `Add training for ${trainingTarget.firstname} ${trainingTarget.lastname}`
            : 'Add training'}
        </DialogTitle>

        <DialogContent
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label="Date & time"
              value={newTraining.date}
              onChange={(value) =>
                setNewTraining((prev) => ({ ...prev, date: value }))
              }
            />
          </LocalizationProvider>

          <TextField
            label="Activity"
            value={newTraining.activity}
            onChange={(e) =>
              setNewTraining((prev) => ({
                ...prev,
                activity: e.target.value,
              }))
            }
          />

          <TextField
            label="Duration (minutes)"
            type="number"
            inputProps={{ min: 1 }}
            value={newTraining.duration}
            onChange={(e) =>
              setNewTraining((prev) => ({
                ...prev,
                duration: e.target.value,
              }))
            }
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenTraining(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddTraining}>
            Save
          </Button>
        </DialogActions>
      </Dialog>


      <div className="search-bar">
        <label>Search:</label>
        <input
          type="text"
          placeholder="Filter by name, email, phone, city..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <span className="badge">
          {filteredCustomers.length} / {customers.length} shown
        </span>
      </div>

      {loading && <div className="message">Loading customers...</div>}
      {error && <div className="message error">{error}</div>}

      {!loading && !error && customers.length === 0 && (
        <div className="message">
          No customers found.
          <br />
          If the demo database is empty, see the REST API docs for how to reset
          it.
        </div>
      )}

      {!loading && !error && customers.length > 0 && (
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('firstname')}>
                First name {sortIndicator('firstname')}
              </th>
              <th onClick={() => handleSort('lastname')}>
                Last name {sortIndicator('lastname')}
              </th>
              <th onClick={() => handleSort('email')}>
                Email {sortIndicator('email')}
              </th>
              <th onClick={() => handleSort('phone')}>
                Phone {sortIndicator('phone')}
              </th>
              <th onClick={() => handleSort('streetaddress')}>
                Street address {sortIndicator('streetaddress')}
              </th>
              <th onClick={() => handleSort('postcode')}>
                Post code {sortIndicator('postcode')}
              </th>
              <th onClick={() => handleSort('city')}>
                City {sortIndicator('city')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, index) => (
              <tr key={c._links?.self?.href ?? index}>
                <td>{c.firstname}</td>
                <td>{c.lastname}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td>{c.streetaddress}</td>
                <td>{c.postcode}</td>
                <td>{c.city}</td>
                <td>
  <Button
    variant="outlined"
    size="small"
    onClick={() => openEditDialog(c)}
    style={{ marginRight: '0.5rem' }}
  >
    Edit
  </Button>

  <Button
    variant="outlined"
    size="small"
    onClick={() => openAddTrainingDialog(c)}
    style={{ marginRight: '0.5rem' }}
  >
    Add Training
  </Button>

  <Button
    variant="outlined"
    size="small"
    color="error"
    onClick={() => handleDeleteCustomer(c)}
  >
    Delete
  </Button>
</td>

              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CustomersPage;
