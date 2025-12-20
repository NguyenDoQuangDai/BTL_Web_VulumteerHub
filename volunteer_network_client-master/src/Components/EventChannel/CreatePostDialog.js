import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faImage,
  faTimes,
  faUser,
  faGlobeAmericas,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import './CreatePostDialog.css';

const CreatePostDialog = ({ isOpen, onClose, onSubmit, user }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/uploads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        // Create preview URL for display
        const previewUrl = URL.createObjectURL(file);
        
        return {
          tempFileName: data.tempFileName,
          previewUrl: previewUrl
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...uploadedImages]);
    } catch (error) {
      console.error('Failed to upload images:', error);
      alert('Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    setImages(prev => {
      const newImages = [...prev];
      // Revoke the object URL to free memory
      URL.revokeObjectURL(newImages[index].previewUrl);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      alert('Vui lòng nhập nội dung hoặc thêm ảnh');
      return;
    }

    setSubmitting(true);
    try {
      // Pass temp file names to the parent component
      const mediaUrls = images.map(img => img.tempFileName);
      await onSubmit(content, mediaUrls);
      
      // Clear form
      setContent('');
      setImages([]);
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Không thể đăng bài viết. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Clean up preview URLs
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setContent('');
    setImages([]);
    onClose();
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div 
      className="create-post-backdrop" 
      onClick={handleClose}
    >
      <div 
        className="create-post-dialog" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="create-post-header">
          <h5 className="mb-0">Tạo bài viết</h5>
          <button 
            className="btn btn-light rounded-circle p-2"
            onClick={handleClose}
            disabled={submitting}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="create-post-body">
          <div className="d-flex align-items-center mb-3">
            <div 
              className="bg-light rounded-circle d-flex align-items-center justify-content-center mr-2" 
              style={{ width: '40px', height: '40px' }}
            >
              <FontAwesomeIcon icon={faUser} className="text-secondary" />
            </div>
            <div>
              <div className="font-weight-bold">
                {user?.name || user?.username || 'Bạn'}
              </div>
              <div className="small text-muted">
                <FontAwesomeIcon icon={faGlobeAmericas} className="mr-1" />
                Công khai
              </div>
            </div>
          </div>

          <textarea
            className="form-control border-0 mb-3"
            placeholder="Bạn đang nghĩ gì?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="4"
            style={{ resize: 'none', fontSize: '1.1rem' }}
            disabled={submitting}
          />

          {images.length > 0 && (
            <div className="images-preview mb-3">
              <div className="row no-gutters">
                {images.map((image, index) => (
                  <div 
                    key={index} 
                    className={`col-${images.length === 1 ? '12' : '6'} p-1 position-relative`}
                  >
                    <img
                      src={image.previewUrl}
                      alt={`Preview ${index + 1}`}
                      className="img-fluid rounded"
                      style={{ 
                        width: '100%', 
                        height: images.length === 1 ? '300px' : '150px',
                        objectFit: 'cover' 
                      }}
                    />
                    <button
                      className="btn btn-danger btn-sm position-absolute"
                      style={{ top: '10px', right: '10px' }}
                      onClick={() => handleRemoveImage(index)}
                      disabled={submitting}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border rounded p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <span className="font-weight-bold">Thêm vào bài viết</span>
              <div>
                <label 
                  className="btn btn-light rounded-circle p-2 mb-0 mr-2"
                  style={{ cursor: uploading || submitting ? 'not-allowed' : 'pointer' }}
                >
                  <FontAwesomeIcon 
                    icon={uploading ? faSpinner : faImage} 
                    className={`text-success ${uploading ? 'fa-spin' : ''}`}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="d-none"
                    onChange={handleImageSelect}
                    disabled={uploading || submitting}
                  />
                </label>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary btn-block font-weight-bold"
            onClick={handleSubmit}
            disabled={(!content.trim() && images.length === 0) || submitting || uploading}
          >
            {submitting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="fa-spin mr-2" />
                Đang đăng...
              </>
            ) : (
              'Đăng'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CreatePostDialog;