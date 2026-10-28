import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  AlertTriangle,
  Upload,
  MapPin,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  X,
} from 'lucide-react';
import { Button } from '../components/ui';

const CreateReportPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    building: '',
    locationDetail: '',
    suggestedSeverity: 'medium',
  });
  const [files, setFiles] = useState([]);
  const [similarReports, setSimilarReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Campus building choices
  const buildings = [
    'Academic Block A',
    'Science Block B',
    'Engineering Block C',
    'Central Library',
    'Main Auditorium',
    'Hostel Block 1',
    'Hostel Block 2',
    'Hostel Block 3',
    'Hostel Block 4',
    'Central Cafeteria',
    'Indoor Sports Complex',
    'Campus Perimeter & Roads',
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res?.success && res.data.categories.length > 0) {
          setCategories(res.data.categories);
          setFormData((prev) => ({ ...prev, category: res.data.categories[0].name }));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchCategories();
  }, []);

  // Debounce check for duplicates
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.title.length > 4 && formData.category && formData.building) {
        try {
          const res = await api.get('/reports/check-duplicates', {
            params: {
              title: formData.title,
              category: formData.category,
              building: formData.building,
            },
          });
          if (res?.success) {
            setSimilarReports(res.data.similarReports || []);
          }
        } catch (e) {
          // Ignore duplicate check network error
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.title, formData.category, formData.building]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      // Validate file size (5MB max) and MIME
      const validFiles = selectedFiles.filter((f) => {
        const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(f.type);
        const isValidSize = f.size <= 5 * 1024 * 1024;
        return isValidType && isValidSize;
      });

      if (validFiles.length !== selectedFiles.length) {
        setError('Some files were ignored because they were over 5MB or not JPG/PNG/WebP images.');
      }

      setFiles((prev) => [...prev, ...validFiles].slice(0, 5));
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }
    if (formData.description.length < 15) {
      setError('Description must be at least 15 characters to provide adequate context for maintenance.');
      return;
    }
    if (!formData.building) {
      setError('Please select a campus building or zone.');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('building', formData.building);
      data.append('locationDetail', formData.locationDetail);
      data.append('suggestedSeverity', formData.suggestedSeverity);

      files.forEach((file) => {
        data.append('images', file);
      });

      const res = await api.post('/reports', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res?.success) {
        navigate(`/issues/${res.data.report._id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please verify input.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Report a Campus Issue</h1>
            <p className="text-xs text-slate-500">Provide accurate details so other students can verify and staff can fix.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Duplicate detection warning */}
        {similarReports.length > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs space-y-2">
            <div className="font-semibold text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              Similar issues already reported in this building:
            </div>
            <p className="text-amber-700">
              Please check if someone already reported this issue. If so, you can verify their report instead of creating a duplicate!
            </p>
            <div className="divide-y divide-amber-200/60 pt-1">
              {similarReports.map((sr) => (
                <div key={sr._id} className="py-1.5 flex justify-between items-center">
                  <span className="font-medium text-slate-800">{sr.title} ({sr.locationDetail})</span>
                  <a
                    href={`/issues/${sr._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline font-semibold"
                  >
                    View existing &rarr;
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Issue Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Broken ceiling fan sparking in Room 304"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Suggested Severity
              </label>
              <select
                name="suggestedSeverity"
                value={formData.suggestedSeverity}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low (Cosmetic, minor wear)</option>
                <option value="medium">Medium (Standard repair)</option>
                <option value="high">High (Disrupts classes or hygiene)</option>
                <option value="critical">Critical (Immediate safety hazard)</option>
              </select>
            </div>
          </div>

          {/* Location & Building */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Campus Building / Zone <span className="text-rose-500">*</span>
              </label>
              <select
                name="building"
                required
                value={formData.building}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Select Building --</option>
                {buildings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Specific Location Details <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="locationDetail"
                required
                value={formData.locationDetail}
                onChange={handleChange}
                placeholder="e.g. 2nd Floor, Room 204 near rear window"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Explain the problem thoroughly: When did it happen? Is it dangerous? Has anyone attempted to fix it?"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="text-[11px] text-slate-400 mt-1">
              {formData.description.length}/2000 characters (minimum 15 characters)
            </div>
          </div>

          {/* Supporting Images */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Supporting Photographic Evidence (up to 5 images, max 5MB each)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors bg-slate-50/50">
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs text-slate-600 font-medium">
                Click to browse images or drag and drop here
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, or WebP</div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="mt-3 text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            {/* Selected files preview */}
            {files.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-xs px-2.5 py-1 rounded-md text-slate-700"
                  >
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-slate-400 hover:text-rose-600 ml-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading} className="px-6">
              Submit Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReportPage;
