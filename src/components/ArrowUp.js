import React, { useState, useEffect } from 'react';
import arrowIcon from '../assets/pfad_pfeil.png';
import arrowHoverIcon from '../assets/pfad_pfeil_hover.png';

/**
 * Floating button that appears when the user scrolls down the page.
 * Clicking the button scrolls smoothly to the top. The icon
 * changes on hover to provide visual feedback.
 */
const ArrowUp = () => {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;
  return (
    <button
      className="arrow-up"
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Nach oben scrollen"
    >
      <img
        src={hovered ? arrowHoverIcon : arrowIcon}
        alt="Nach oben"
        className="h-6 w-6"
      />
    </button>
  );
};

export default ArrowUp;