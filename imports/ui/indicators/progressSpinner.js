import React from 'react';

const ProgressSpinner = () => {
    return (
        <div className="d-flex justify-content-center" style={{marginBottom: '1rem'}}>
            <div className="spinner-border" role="status" aria-hidden="true">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );
}
export default ProgressSpinner;
