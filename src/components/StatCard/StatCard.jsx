import React from 'react';
import './StatCard.css';

export const StatCard = ({ icon: Icon, value, label }) => {
  return (
    <div className="stat-card card">
      <div className="stat-icon-wrapper">
        <Icon size={22} className="stat-icon" />
      </div>
      <div className="stat-details">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
};
