import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ message, onConfirm, onCancel, isVisible, modalStep }) => {
  if (!isVisible) return null;

  // Determine if it's the second step based on modalStep
  const isSecondStep = modalStep === 2;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>{message}</p>
        <div className="modal-actions">
          {/* Conditional rendering based on isSecondStep */}
          {isSecondStep ? (
            // For the second warning: Confirm on left, Cancel on right
            <>
              <button onClick={onConfirm} className="confirm-button">Confirm</button>
              <button onClick={onCancel} className="cancel-button">Cancel</button>
            </>
          ) : (
            // For the first warning (and default): Cancel on left, Confirm on right
            <>
              <button onClick={onCancel} className="cancel-button">Cancel</button>
              <button onClick={onConfirm} className="confirm-button">Confirm</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;