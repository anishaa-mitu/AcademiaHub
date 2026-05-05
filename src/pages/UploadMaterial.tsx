import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle, ImagePlus, X } from 'lucide-react';
import { MaterialBuilder } from '../patterns/MaterialBuilder';
import { MaterialFacade } from '../patterns/MaterialFacade';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import { supabase } from '../lib/supabase';

export default function UploadMaterial() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'notes' as const,
    category: 'general',
    price: 0,
    condition: 'good' as const,
    tags: '',
    fileUrl: '',
  });

  const set = (field: string) => (e: any) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }
    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile || !user) return '';
    const ext = imageFile.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('material-images')
      .upload(path, imageFile, { upsert: false });
    if (error) throw new Error('Image upload failed: ' + error.message);
    const { data } = supabase.storage.from('material-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!user) { setError('You must be logged in.'); setLoading(false); return; }

      // Upload image first if selected
      const imageUrl = await uploadImage();

      const builder = new MaterialBuilder()
        .setTitle(form.title)
        .setDescription(form.description)
        .setType(form.type)
        .setCategory(form.category)
        .setPrice(Number(form.price))
        .setCondition(form.condition)
        .setFileUrl(form.fileUrl)
        .setImageUrl(imageUrl);

      form.tags.split(',').forEach(tag => {
        const trimmed = tag.trim();
        if (trimmed) builder.addTag(trimmed);
      });

      const materialData = builder.build();
      const { error: submitError } = await MaterialFacade.submitMaterial(user.id, materialData as any);

      if (submitError) {
        setError(submitError);
      } else {
        setSuccess('Material uploaded! Pending admin approval.');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload');
    }
    setLoading(false);
  };

  const categories = ['General', 'Math', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Engineering', 'Literature'];
  const types = ['PDF', 'Book', 'Project', 'Notes', 'Other'];
  const conditions = ['New', 'Good', 'Fair', 'Poor'];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <button onClick={() => navigate('/materials')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="bg-white rounded-xl border border-gray-100 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Material</h1>
            <p className="text-gray-600 mb-8">Share notes, books, or projects</p>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="font-medium text-red-900">{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p className="font-medium text-green-900">{success}</p>
              </div>
            )}

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8 max-w-md">
              {[1, 2].map(s => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {s}
                  </div>
                  {s < 2 && <div className={`flex-1 h-1 transition-colors ${s < step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            <form className="space-y-6">
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                    <input type="text" required value={form.title} onChange={set('title')}
                      placeholder="e.g., Calculus Notes"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea required value={form.description} onChange={set('description')}
                      placeholder="Describe your material..." rows={4}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                      <select required value={form.type} onChange={set('type')}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {types.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                      <select required value={form.category} onChange={set('category')}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {categories.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Condition *</label>
                      <select required value={form.condition} onChange={set('condition')}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {conditions.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (৳) *</label>
                      <input type="number" required min="0" step="0.01" value={form.price} onChange={set('price')}
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
                    <input type="text" value={form.tags} onChange={set('tags')}
                      placeholder="e.g., calculus, math, exam"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Material Image (optional)</label>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

                    {imagePreview ? (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button"
                          onClick={() => { setImageFile(null); setImagePreview(''); }}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50">
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        <ImagePlus className="w-10 h-10 text-gray-400" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-700">Click to upload image</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* File/Drive URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">File / Drive Link (optional)</label>
                    <input type="text" value={form.fileUrl} onChange={set('fileUrl')}
                      placeholder="https://drive.google.com/... or any link"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-xs text-gray-400 mt-1">Paste a Google Drive, Dropbox, or any download link.</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      Your material will be reviewed by an admin before appearing in the marketplace.
                    </p>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between gap-4 pt-6 border-t border-gray-200">
                <button type="button" onClick={() => setStep(1)}
                  disabled={step === 1}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40">
                  Back
                </button>
                {step === 1 ? (
                  <button type="button" onClick={() => setStep(2)}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                    Next
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={loading}
                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-60">
                    {loading ? 'Uploading...' : 'Submit'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}