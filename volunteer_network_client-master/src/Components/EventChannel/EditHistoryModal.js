import React from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faHistory, faClock } from '@fortawesome/free-solid-svg-icons';
import './EditHistoryModal.css';

const EditHistoryModal = ({ isOpen, onClose, history = [] }) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="edit-history-modal-overlay">
            <div className="edit-history-modal-content">
                <div className="edit-history-header">
                    <h5 className="mb-0 font-weight-bold">
                        <FontAwesomeIcon icon={faHistory} className="mr-2 text-primary" />
                        Lịch sử chỉnh sửa
                    </h5>
                    <button className="close-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                
                <div className="edit-history-body">
                    {history.length === 0 ? (
                        <div className="empty-history">
                            <p className="text-muted">Chưa có lịch sử chỉnh sửa nào.</p>
                        </div>
                    ) : (
                        <div className="history-timeline">
                            {history.map((item, index) => (
                                <div key={index} className="history-item">
                                    <div className="history-meta">
                                        <div className="history-icon">
                                            <FontAwesomeIcon icon={faClock} size="sm" />
                                        </div>
                                        <span className="history-time">{item.time}</span>
                                    </div>
                                    <div className="history-content">
                                        {item.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="edit-history-footer">
                    <button className="btn btn-secondary btn-sm" onClick={onClose}>Đóng</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default EditHistoryModal;
