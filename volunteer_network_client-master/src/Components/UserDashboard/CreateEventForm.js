import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faFileAlt, faHourglassHalf, faPlay, faStop, faImage } from '@fortawesome/free-solid-svg-icons';
import { eventService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const toIso = (val) => {
  try {
    return new Date(val).toISOString();
  } catch (e) {
    return null;
  }
};

const CreateEventForm = ({ onClose, onCreated }) => {
  const isMounted = useRef(true);
  const { user } = useAuth();

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    dateDeadline: '',
    startDate: '',
    endDate: '',
    images: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      Promise.all(files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }))
      .then(results => {
        setForm(prev => ({ ...prev, images: [...(prev.images || []), ...results] }));
      });
    }
  };

  const removeImage = (index) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    if (!form.name || !form.dateDeadline || !form.startDate || !form.endDate) {
      return 'Vui lòng nhập đầy đủ các trường bắt buộc.';
    }
    const dd = new Date(form.dateDeadline).getTime();
    const sd = new Date(form.startDate).getTime();
    const ed = new Date(form.endDate).getTime();
    if (isNaN(dd) || isNaN(sd) || isNaN(ed)) return 'Định dạng ngày/giờ không hợp lệ.';
    if (sd > ed) return 'Thời gian bắt đầu phải trước hoặc bằng thời gian kết thúc.';
    if (dd > sd) return 'Hạn đăng ký phải trước hoặc bằng thời gian bắt đầu.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        name: form.name,
        description: form.description || '',
        location: form.location || '',
        dateDeadline: toIso(form.dateDeadline),
        startDate: toIso(form.startDate),
        endDate: toIso(form.endDate),
        images: form.images,
        image: form.images && form.images.length > 0 ? form.images[0] : null,
        // status will be set to DRAFT by backend
      };

      let created;
      try {
        created = await eventService.createEvent(payload);
      } catch (backendErr) {
        console.warn('Backend creation failed, using mock fallback:', backendErr);
        created = {
          id: Date.now(),
          ...payload,
          images: form.images || [],
          image: (form.images && form.images.length > 0) ? form.images[0] : 'https://i.imgur.com/Uj2Iq0R.png',
          status: 'DRAFT',
          owner: user?.username || 'Me'
        };
      }
      
      // Save to localStorage for frontend persistence (mock mode)
      try {
        const existing = JSON.parse(localStorage.getItem('mockEvents') || '[]');
        existing.push(created);
        localStorage.setItem('mockEvents', JSON.stringify(existing));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.error("Failed to save to localStorage", e);
      }
      
      if (isMounted.current) {
        setSuccess('Tạo sự kiện thành công (trạng thái DRAFT).');
      }

      if (onCreated) {
        onCreated(created);
      } else {
        // Optional: close after short delay if onCreated didn't handle it
        setTimeout(() => {
          if (isMounted.current && onClose) onClose();
        }, 800);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.message || 'Không thể tạo sự kiện.');
      }
    } finally {
      if (isMounted.current) {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="card mb-4" style={{ boxShadow: 'none', transform: 'none' }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Tạo sự kiện mới</h5>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
            Đóng
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="field-label event-title">Tên sự kiện *</label>
            <input
              type="text"
              name="name"
              className="form-control"
              value={form.name}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="field-label location-line">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 location-icon" />
              Địa điểm
            </label>
            <input
              type="text"
              name="location"
              className="form-control"
              placeholder="Ví dụ: Nhà văn hóa X, Quận 1"
              value={form.location}
              onChange={onChange}
            />
          </div>

          <div className="form-group">
            <label className="field-label desc-line">
              <FontAwesomeIcon icon={faFileAlt} className="mr-1 desc-icon" />
              Mô tả
            </label>
            <textarea
              name="description"
              className="form-control"
              rows="3"
              value={form.description}
              onChange={onChange}
            />
          </div>

          <div className="form-group">
            <label className="field-label">
              <FontAwesomeIcon icon={faImage} className="mr-1" />
              Hình ảnh
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="form-control-file"
              onChange={handleImageChange}
            />
            <div className="d-flex flex-wrap mt-2">
              {form.images && form.images.map((img, index) => (
                <div key={index} className="position-relative mr-2 mb-2">
                  <img 
                    src={img} 
                    alt={`Preview ${index}`} 
                    style={{ height: '100px', width: '100px', objectFit: 'cover', borderRadius: '4px' }} 
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm position-absolute"
                    style={{ top: 0, right: 0, padding: '0px 5px', fontSize: '12px', lineHeight: '1.2' }}
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group col-md-4">
              <label className="field-label deadline-line">
                <FontAwesomeIcon icon={faHourglassHalf} className="mr-1 deadline-icon" />
                Hạn đăng ký *
              </label>
              <input
                type="datetime-local"
                name="dateDeadline"
                className="form-control"
                value={form.dateDeadline}
                onChange={onChange}
                required
              />
            </div>
            <div className="form-group col-md-4">
              <label className="field-label start-line">
                <FontAwesomeIcon icon={faPlay} className="mr-1 start-icon" />
                Bắt đầu *
              </label>
              <input
                type="datetime-local"
                name="startDate"
                className="form-control"
                value={form.startDate}
                onChange={onChange}
                required
              />
            </div>
            <div className="form-group col-md-4">
              <label className="field-label end-line">
                <FontAwesomeIcon icon={faStop} className="mr-1 end-icon" />
                Kết thúc *
              </label>
              <input
                type="datetime-local"
                name="endDate"
                className="form-control"
                value={form.endDate}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <div className="mt-3 text-center">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo sự kiện'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventForm;
