import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faFileAlt, faHourglassHalf, faPlay, faStop } from '@fortawesome/free-solid-svg-icons';
import { eventService } from '../../services/apiService';

const toIso = (val) => {
  try {
    return new Date(val).toISOString();
  } catch (e) {
    return null;
  }
};

const CreateEventForm = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    dateDeadline: '',
    startDate: '',
    endDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
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
        // location is frontend-only for now; do not send to backend
        dateDeadline: toIso(form.dateDeadline),
        startDate: toIso(form.startDate),
        endDate: toIso(form.endDate),
        // status will be set to DRAFT by backend
      };
      const created = await eventService.createEvent(payload);
      setSuccess('Tạo sự kiện thành công (trạng thái DRAFT).');
      if (onCreated) onCreated(created);
      // Optional: close after short delay
      setTimeout(() => onClose && onClose(), 800);
    } catch (err) {
      setError(err.message || 'Không thể tạo sự kiện.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card mb-4">
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
