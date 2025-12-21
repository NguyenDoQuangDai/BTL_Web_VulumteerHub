import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faFileAlt, faHourglassHalf, faPlay, faStop } from '@fortawesome/free-solid-svg-icons';
import { eventService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import './CreateEventForm.css';

const parseToTimestamp = (val) => {
  if (!val) return NaN;
  const s = String(val).trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (!m) return NaN;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  const year = parseInt(m[3], 10);
  const hour = parseInt(m[4] || '0', 10);
  const minute = parseInt(m[5] || '0', 10);
  const d = new Date(year, month, day, hour, minute, 0, 0);
  return d.getTime();
};

const toIso = (val) => {
  const ts = parseToTimestamp(val);
  if (isNaN(ts)) return null;
  return new Date(ts).toISOString();
};

const formatFromDatetimeLocal = (dtLocal) => {
  if (!dtLocal) return '';
  const m = String(dtLocal).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return '';
  const y = m[1], mo = m[2], d = m[3], h = m[4], mi = m[5];
  return `${d}/${mo}/${y} ${h}:${mi}`;
};

const CreateEventForm = ({ onClose, onCreated }) => {
  const isMounted = useRef(true);
  const { user } = useAuth();
  const deadlinePickerRef = useRef(null);
  const startPickerRef = useRef(null);
  const endPickerRef = useRef(null);

  const openPicker = (ref) => {
    if (!ref || !ref.current) return;
    const el = ref.current;
    try {
      if (typeof el.showPicker === 'function') {
        el.showPicker();
        return;
      }
    } catch (e) {}
    // fallback cho các browser cũ
    const prev = {
      display: el.style.display,
      position: el.style.position,
      left: el.style.left,
      width: el.style.width,
      height: el.style.height,
      opacity: el.style.opacity
    };
    el.style.display = 'block';
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    el.style.width = '1px';
    el.style.height = '1px';
    el.style.opacity = '0';
    el.focus();
    el.click();
    setTimeout(() => {
      el.style.display = prev.display || 'none';
      el.style.position = prev.position || '';
      el.style.left = prev.left || '';
      el.style.width = prev.width || '';
      el.style.height = prev.height || '';
      el.style.opacity = prev.opacity || '';
    }, 800);
  };

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

  const formatDateInput = (raw) => {
    const digits = String(raw || '').replace(/\D/g, '').slice(0, 12);
    const parts = [];
    if (digits.length <= 2) return digits;
    parts.push(digits.slice(0, 2));
    if (digits.length <= 4) return `${parts[0]}/${digits.slice(2)}`;
    parts.push(digits.slice(2, 4));
    if (digits.length <= 8) return `${parts[0]}/${parts[1]}/${digits.slice(4)}`;
    parts.push(digits.slice(4, 8));
    if (digits.length <= 10) return `${parts[0]}/${parts[1]}/${parts[2]} ${digits.slice(8)}`;
    return `${parts[0]}/${parts[1]}/${parts[2]} ${digits.slice(8,10)}:${digits.slice(10,12)}`;
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    const input = e.target;

    if (name === 'dateDeadline' || name === 'startDate' || name === 'endDate') {
      // Lấy vị trí con trỏ hiện tại trước khi thay đổi
      const cursorPos = input.selectionStart;

      // Chỉ giữ lại tối đa 12 chữ số
      const digits = value.replace(/\D/g, '').slice(0, 12);

      // Format lại theo định dạng dd/mm/yyyy hh:mm
      const formatted = formatDateInput(digits);

      // Tính vị trí con trỏ mới dựa trên số chữ số đã nhập trước vị trí cũ
      let digitCountBeforeCursor = 0;
      for (let i = 0; i < cursorPos; i++) {
        if (/\d/.test(value[i])) {
          digitCountBeforeCursor++;
        }
      }

      // Đếm số chữ số đã đặt vào formatted trước vị trí tương ứng
      let newCursorPos = 0;
      let digitsPlaced = 0;
      const len = formatted.length;

      for (let i = 0; i < len; i++) {
        if (/\d/.test(formatted[i])) {
          digitsPlaced++;
          if (digitsPlaced > digitCountBeforeCursor) {
            break;
          }
        }
        newCursorPos = i + 1;
      }

      // Cập nhật state
      setForm((prev) => ({ ...prev, [name]: formatted }));

      // Khôi phục vị trí con trỏ sau khi React render lại
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    setError(null);
  };

  const restrictDateInput = (e) => {
    if (e.ctrlKey || e.metaKey) return;
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
    if (allowedKeys.includes(e.key)) return;
    if (/^[0-9]$/.test(e.key)) return;
    e.preventDefault();
  };

  const handlePickerChange = (pickerName, value) => {
    const formatted = formatFromDatetimeLocal(value);
    setForm((prev) => ({ ...prev, [pickerName]: formatted }));
  };

  const handlePasteDate = (e, name) => {
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const formatted = formatDateInput(pasted);
    setForm(prev => ({ ...prev, [name]: formatted }));
    e.preventDefault();
  };

  const validate = () => {
    if (!form.name || !form.dateDeadline || !form.startDate || !form.endDate) {
      return 'Vui lòng nhập đầy đủ các trường bắt buộc.';
    }

    const dd = parseToTimestamp(form.dateDeadline);
    const sd = parseToTimestamp(form.startDate);
    const ed = parseToTimestamp(form.endDate);
    const now = Date.now();

    if (isNaN(dd) || isNaN(sd) || isNaN(ed)) {
      return 'Định dạng ngày/giờ không hợp lệ.';
    }

    if (dd <= now) {
      return 'Hạn đăng ký phải lớn hơn thời gian hiện tại.';
    }

    if (sd > ed) {
      return 'Thời gian bắt đầu phải trước hoặc bằng thời gian kết thúc.';
    }

    if (dd > sd) {
      return 'Hạn đăng ký phải trước hoặc bằng thời gian bắt đầu.';
    }

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
        endDate: toIso(form.endDate)
      };

      const created = await eventService.createEvent(payload);

      if (isMounted.current) {
        setSuccess('Tạo sự kiện thành công.');
      }

      if (onCreated) {
        onCreated(created);
      } else {
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

          <div className="form-row">
            <div className="form-group col-md-4">
              <label className="field-label deadline-line">
                <FontAwesomeIcon icon={faHourglassHalf} className="mr-1 deadline-icon" />
                Hạn đăng ký *
              </label>
              <div className="input-group">
                <input
                  type="text"
                  name="dateDeadline"
                  className="form-control"
                  placeholder="dd/mm/yyyy hh:mm"
                  value={form.dateDeadline}
                  onChange={onChange}
                  onKeyDown={restrictDateInput}
                  onPaste={(e) => handlePasteDate(e, 'dateDeadline')}
                  required
                  pattern="^\d{1,2}\/\d{1,2}\/\d{4}(\s+\d{1,2}:\d{2})?$"
                  title="dd/mm/yyyy hh:mm"
                />
                <div className="input-group-append">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => openPicker(deadlinePickerRef)}>
                    📅
                  </button>
                </div>
                <input
                  type="datetime-local"
                  ref={deadlinePickerRef}
                  className="datetime-overlay"
                  onChange={(e) => handlePickerChange('dateDeadline', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group col-md-4">
              <label className="field-label start-line">
                <FontAwesomeIcon icon={faPlay} className="mr-1 start-icon" />
                Bắt đầu *
              </label>
              <div className="input-group">
                <input
                  type="text"
                  name="startDate"
                  className="form-control"
                  placeholder="dd/mm/yyyy hh:mm"
                  value={form.startDate}
                  onChange={onChange}
                  onKeyDown={restrictDateInput}
                  onPaste={(e) => handlePasteDate(e, 'startDate')}
                  required
                  pattern="^\d{1,2}\/\d{1,2}\/\d{4}(\s+\d{1,2}:\d{2})?$"
                  title="dd/mm/yyyy hh:mm"
                />
                <div className="input-group-append">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => openPicker(startPickerRef)}>
                    📅
                  </button>
                </div>
                <input
                  type="datetime-local"
                  ref={startPickerRef}
                  className="datetime-overlay"
                  onChange={(e) => handlePickerChange('startDate', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group col-md-4">
              <label className="field-label end-line">
                <FontAwesomeIcon icon={faStop} className="mr-1 end-icon" />
                Kết thúc *
              </label>
              <div className="input-group">
                <input
                  type="text"
                  name="endDate"
                  className="form-control"
                  placeholder="dd/mm/yyyy hh:mm"
                  value={form.endDate}
                  onChange={onChange}
                  onKeyDown={restrictDateInput}
                  onPaste={(e) => handlePasteDate(e, 'endDate')}
                  required
                  pattern="^\d{1,2}\/\d{1,2}\/\d{4}(\s+\d{1,2}:\d{2})?$"
                  title="dd/mm/yyyy hh:mm"
                />
                <div className="input-group-append">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => openPicker(endPickerRef)}>
                    📅
                  </button>
                </div>
                <input
                  type="datetime-local"
                  ref={endPickerRef}
                  className="datetime-overlay"
                  onChange={(e) => handlePickerChange('endDate', e.target.value)}
                />
              </div>
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