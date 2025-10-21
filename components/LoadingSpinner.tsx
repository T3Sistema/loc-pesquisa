import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text = 'Carregando' }) => {
  return (
    <div className="loader-container">
      <div className="loader triangle">
        <svg viewBox="0 0 86 80">
          <polygon points="43 8 79 72 7 72"></polygon>
        </svg>
      </div>
      <div className="loadingtext">
        <p>{text}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
