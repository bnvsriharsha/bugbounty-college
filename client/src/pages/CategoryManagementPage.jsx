import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Tag, Plus, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui';

const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slaHours: 48,
    icon: 'AlertCircle',
  });

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res?.success) {
        setCategories(res.data.categories || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/categories', formData);
      if (res?.success) {
        setModalOpen(false);
        setFormData({ name: '', description: '', slaHours: 48, icon: 'AlertCircle' });
        fetchCategories();
      }
    } catch (err) {
      alert(err.message || 'Failed to create category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Tag className="h-6 w-6 text-indigo-600" />
            Category & SLA Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure dynamic campus problem categories and expected Service Level Agreement (SLA) turnaround times.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((c) => (
          <div key={c._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">{c.name}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {c.slaHours}h SLA
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">{c.description || 'General category'}</p>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Create Campus Category</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Elevators and Escalators"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  SLA Hours (Expected Resolution Time)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.slaHours}
                  onChange={(e) => setFormData({ ...formData, slaHours: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed scope of this category..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create Category
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagementPage;
