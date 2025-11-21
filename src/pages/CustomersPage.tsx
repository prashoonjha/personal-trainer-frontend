import React, { useEffect, useState } from 'react';

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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CustomersPage;
