import React from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-inner">

                <NavLink to="/" className="navbar-brand">
                    <div className="navbar-brand-icon">A</div>
                    Ad Studio
                </NavLink>

                <ul className="navbar-links">
                    <li>
                        <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>
                            <span className="nav-icon">🏠</span>
                            Home
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/feed" className={({ isActive }) => isActive ? "active" : ""}>
                            <span className="nav-icon">📡</span>
                            Ad Feed
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/ads/manage" className={({ isActive }) => isActive ? "active" : ""}>
                            <span className="nav-icon">📦</span>
                            Ad Manager
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/ctr" className={({ isActive }) => isActive ? "active" : ""}>
                            <span className="nav-icon">🧠</span>
                            CTR Predict
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/events" className={({ isActive }) => isActive ? "active" : ""}>
                            <span className="nav-icon">📨</span>
                            Events
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/experiments" className={({ isActive }) => isActive ? "active" : ""}>
                            <span className="nav-icon">📊</span>
                            Analytics
                        </NavLink>
                    </li>
                </ul>

                {/* <div className="navbar-status">
                    <span className="status-dot"></span>
                    System Online
                </div> */}

            </div>
        </nav>
    );
}
