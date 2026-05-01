import * as React from "react";
import PropTypes from "prop-types";
import "./index.css";

export function SuggestToolDialog({ isOpen, onClose }) {
  const dialogRef = React.useRef(null);
  const [formData, setFormData] = React.useState({
    title: "",
    url: "",
    description: "",
    logo: null,
    tag: "",
    repo: ""
  });
  const [errors, setErrors] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    
    if (isOpen && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog && dialog.open) {
      dialog.close();
    }

    return () => {
      if (dialog && dialog.open) {
        dialog.close();
      }
    };
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'logo' && files?.length) {
      // Validate file size and type
      const file = files[0];
      const validTypes = ['image/png', 'image/svg+xml', 'image/webp', 'image/avif'];
      const maxSize = 1024 * 1024; // 1MB
      
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          logo: 'File size exceeds 1MB limit'
        }));
        return;
      }
      
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          logo: 'Only PNG, SVG, WebP, and AVIF formats are allowed'
        }));
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        logo: file
      }));
      
      // Clear error if valid
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.logo;
        return newErrors;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!/^https?:\/\/.+\..+/.test(formData.url)) {
      newErrors.url = 'Please enter a valid URL';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.tag.trim()) {
      newErrors.tag = 'At least one tag is required';
    }
    
    if (formData.repo && !/^https?:\/\/.+\..+/.test(formData.repo)) {
      newErrors.repo = 'Please enter a valid repository URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare form data for submission
      const submitData = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'tag') {
          // Convert comma-separated tags to an array
          submitData.append(key, JSON.stringify(value.split(',').map(tag => tag.trim())));
        } else if (key !== 'logo' || value !== null) {
          submitData.append(key, value);
        }
      });
      
      // Submit to Netlify function
      const response = await fetch('/.netlify/functions/suggest-tool', {
        method: 'POST',
        body: submitData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit tool suggestion');
      }
      
      // Show success state
      setSubmitSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (error) {
      console.error('Error submitting tool suggestion:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'Failed to submit. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      url: "",
      description: "",
      logo: null,
      tag: "",
      repo: ""
    });
    setErrors({});
    setSubmitSuccess(false);
  };

  const handleDialogClose = () => {
    resetForm();
    onClose();
  };

  return (
    <dialog 
      ref={dialogRef} 
      className="suggest-tool-dialog"
      onClose={handleDialogClose}
    >
      <div className="dialog-header">
        <h2 id="dialog-title">Suggest a Tool</h2>
        <button 
          type="button" 
          className="close-button" 
          aria-label="Close dialog"
          onClick={handleDialogClose}
        >
          ✕
        </button>
      </div>

      {submitSuccess ? (
        <div className="success-message" role="status">
          <h3>Thank you for your suggestion!</h3>
          <p>Your tool has been submitted for review and will be added to MakerBench soon.</p>
          <button 
            type="button" 
            className="primary-button" 
            onClick={handleDialogClose}
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleInputChange}
              aria-required="true"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
            {errors.title && (
              <p id="title-error" className="error-message">{errors.title}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="url">URL</label>
            <input
              id="url"
              name="url"
              type="url"
              value={formData.url}
              onChange={handleInputChange}
              aria-required="true"
              aria-invalid={!!errors.url}
              aria-describedby={errors.url ? "url-error" : undefined}
            />
            {errors.url && (
              <p id="url-error" className="error-message">{errors.url}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              aria-required="true"
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "description-error" : undefined}
            />
            {errors.description && (
              <p id="description-error" className="error-message">{errors.description}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="logo">Logo (optional)</label>
            <input
              id="logo"
              name="logo"
              type="file"
              onChange={handleInputChange}
              accept=".png,.svg,.webp,.avif"
              aria-invalid={!!errors.logo}
              aria-describedby="logo-help logo-error"
            />
            <p id="logo-help" className="help-text">
              Max size: 1MB. Formats: PNG, SVG, WebP, AVIF
            </p>
            {errors.logo && (
              <p id="logo-error" className="error-message">{errors.logo}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="tag">Tags</label>
            <input
              id="tag"
              name="tag"
              type="text"
              value={formData.tag}
              onChange={handleInputChange}
              placeholder="e.g. javascript, framework, utility"
              aria-required="true"
              aria-invalid={!!errors.tag}
              aria-describedby="tag-help tag-error"
            />
            <p id="tag-help" className="help-text">
              Separate tags with commas
            </p>
            {errors.tag && (
              <p id="tag-error" className="error-message">{errors.tag}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="repo">Repository URL (optional)</label>
            <input
              id="repo"
              name="repo"
              type="url"
              value={formData.repo}
              onChange={handleInputChange}
              aria-invalid={!!errors.repo}
              aria-describedby={errors.repo ? "repo-error" : undefined}
            />
            {errors.repo && (
              <p id="repo-error" className="error-message">{errors.repo}</p>
            )}
          </div>

          {errors.submit && (
            <p className="error-message submit-error">{errors.submit}</p>
          )}

          <div className="button-group">
            <button
              type="button"
              className="secondary-button"
              onClick={handleDialogClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Tool"}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}

SuggestToolDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};