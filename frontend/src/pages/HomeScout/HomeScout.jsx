import React from 'react';
import ScoutLayout from '../../components/ScoutLayout/ScoutLayout';
import "./HomeScout.css";

const HomeScout = () => {
  return (
    <ScoutLayout title="Home">
      {/* Everything inside here becomes the 'children' prop in ScoutLayout */}
      <div className="scout-home-content">
        <div className="empty-state">
          <p>Scout Dashboard</p>
          <span>Content for plant quality control will appear here.</span>
        </div>
      </div>
    </ScoutLayout>
  );
};

export default HomeScout;