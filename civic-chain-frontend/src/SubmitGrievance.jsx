import { useState, useRef } from 'react';
import { FiMapPin, FiList, FiFileText, FiCamera, FiUpload, FiX } from 'react-icons/fi';
import { FaRegImages } from 'react-icons/fa';

function SubmitGrievance() {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    location: '',
    description: '',
  });

  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const categories = [
    'Roads & Pavements',
    'Street Lighting',
    'Garbage & Sanitation',
    'Water Supply',
    'Sewage & Drainage',
    'Public Parks',
    'Traffic Signals',
    'Other',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileUpload = (e, source) => {
    const files = Array.from(e.target.files);
    // Limit to 5 photos
    if (photos.length + files.length > 5) {
      alert('You can upload a maximum of 5 photos.');
      return;
    }
    // Validate file size (max 5MB each)
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is larger than 5MB. Please choose a smaller file.`);
        return false;
      }
      return true;
    });
    // Create preview URLs
    const newPhotos = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
    // Reset input value so same file can be re-selected if needed
    if (source === 'upload') fileInputRef.current.value = '';
    if (source === 'camera') cameraInputRef.current.value = '';
  };

  const removePhoto = (index) => {
    setPhotos(prev => {
      const updated = [...prev];
      // Revoke object URL to avoid memory leaks
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.category) newErrors.category = 'Please select a category';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    // Prepare data for submission (including photos)
    const submissionData = {
      ...formData,
      photos: photos.map(p => p.file), // actual file objects
    };
    console.log('Grievance submitted:', submissionData);
    alert('Grievance submitted successfully! (check console)');
    // Optionally reset form
    // setFormData({ title: '', category: '', location: '', description: '' });
    // setPhotos([]);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Submit a Grievance</h2>
      <p className="text-gray-600 mb-6">Help us improve your neighbourhood by reporting civic issues.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Issue Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Broken streetlight on Main Street"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FiList className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.category ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.location ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter address or landmark"
            />
          </div>
          {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FiFileText className="absolute left-3 top-3 text-gray-400" />
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe the issue in detail..."
            ></textarea>
          </div>
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Photos (max 5, up to 5MB each)
          </label>
          <div className="flex flex-wrap gap-3">
            {/* Upload from device button */}
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition"
            >
              <FiUpload className="mr-2 text-gray-500" />
              Choose files
            </button>
            {/* Camera button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current.click()}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition"
            >
              <FiCamera className="mr-2 text-gray-500" />
              Take photo
            </button>
          </div>

          {/* Hidden file inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e, 'upload')}
            accept="image/*"
            multiple
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={(e) => handleFileUpload(e, 'camera')}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {/* Photo previews */}
          {photos.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">{photos.length} photo(s) selected</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit button */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
          >
            Submit Grievance
          </button>
        </div>
      </form>
    </div>
  );
}

export default SubmitGrievance;