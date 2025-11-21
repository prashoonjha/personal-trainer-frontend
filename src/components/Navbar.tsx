import React from 'react';
import { NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">Personal Trainer</div>

        <nav className="navbar-links">
          <NavLink
            to="/customers"
            className={({ isActive }) =>
              isActive ? 'navbar-link navbar-link-active' : 'navbar-link'
            }
          >
            Customers
          </NavLink>

          <NavLink
            to="/trainings"
            className={({ isActive }) =>
              isActive ? 'navbar-link navbar-link-active' : 'navbar-link'
            }
          >
            Trainings
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
