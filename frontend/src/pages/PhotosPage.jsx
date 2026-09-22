import React, { useState, useEffect } from 'react';
import { 
  Camera, Plus, Upload, Trash2, ArrowRightLeft, 
  Calendar, Scale, Image as ImageIcon, X 
} from 'lucide-react';
import { useUnits } from '../context/UnitContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

export const PhotosPage = () => {
  const { formatWeight, weightUnit } = useUnits();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [poseFilter, setPoseFilter] = useState('all');

  // Upload Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [photoDate, setPhotoDate] = useState(new Date().toISOString().slice(0, 10));
  const [photoWeight, setPhotoWeight] = useState('');
  const [photoPose, setPhotoPose] = useState('front');
  const [photoNotes, setPhotoNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Compare Tool states
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareBeforeId, setCompareBeforeId] = useState('');
  const [compareAfterId, setCompareAfterId] = useState('');
  const [comparison, setComparison] = useState(null);

  const fetchPhotos = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/photos');
      setPhotos(data || []);
      if (data && data.length >= 2) {
        setCompareBeforeId(data[data.length - 1].id);
        setCompareAfterId(data[0].id);
      }
    } catch (err) {
      toast.error('Failed to load progress photos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select an image file to upload.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('photo_date', photoDate);
      if (photoWeight) formData.append('weight', photoWeight);
      formData.append('pose', photoPose);
      if (photoNotes) formData.append('notes', photoNotes);

      await api.upload('/photos', formData);
      toast.success('Progress photo uploaded successfully!');
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setFilePreview(null);
      await fetchPhotos();
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (id) => {
    if (!window.confirm('Delete this progress photo?')) return;
    try {
      await api.delete(`/photos/${id}`);
      toast.success('Progress photo deleted.');
      await fetchPhotos();
    } catch (err) {
      toast.error('Failed to delete photo.');
    }
  };

  const handleCompare = async () => {
    if (!compareBeforeId || !compareAfterId) {
      toast.error('Please select two photos to compare.');
      return;
    }
    try {
      const result = await api.get('/photos/compare', {
        before_id: compareBeforeId,
        after_id: compareAfterId,
      });
      setComparison(result);
    } catch (err) {
      toast.error(err.message || 'Failed to compare photos.');
    }
  };

  const filteredPhotos = poseFilter === 'all'
    ? photos
    : photos.filter((p) => p.pose === poseFilter);

  const poses = ['all', 'front', 'side', 'back', 'custom'];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Progress Photos & Transformation</h1>
          <p className="text-sm text-slate-400 mt-1">
            Private, encrypted physical transformation timeline with side-by-side comparison.
          </p>
        </div>
        <div className="flex gap-3">
          {photos.length >= 2 && (
            <Button
              variant="outline"
              size="md"
              icon={ArrowRightLeft}
              onClick={() => {
                setIsCompareModalOpen(true);
                handleCompare();
              }}
            >
              Compare Photos
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Upload Photo
          </Button>
        </div>
      </div>

      {/* Filter Tabs by Pose */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {poses.map((p) => (
          <button
            key={p}
            onClick={() => setPoseFilter(p)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              poseFilter === p
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-glow-emerald'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-800">
          <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No photos in this category yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Take consistent lighting photos in Front, Side, or Back poses to track visual transformation over time.
          </p>
          <Button
            variant="primary"
            size="sm"
            className="mt-4"
            icon={Upload}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Upload First Photo
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPhotos.map((photo) => (
            <Card key={photo.id} className="p-0 overflow-hidden border-slate-800 group">
              <div className="relative aspect-[3/4] bg-slate-950 flex items-center justify-center overflow-hidden">
                <img
                  src={photo.image_url}
                  alt={`Progress on ${photo.date}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback placeholder graphic if file is not locally on disk yet
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden absolute inset-0 items-center justify-center flex-col gap-2 p-4 text-center bg-slate-900">
                  <ImageIcon className="w-8 h-8 text-slate-600" />
                  <span className="text-xs font-semibold text-slate-400">{photo.pose.toUpperCase()} POSE</span>
                  <span className="text-[10px] text-slate-500">{photo.date}</span>
                </div>

                <div className="absolute top-3 left-3">
                  <Badge variant="emerald" size="xs" className="capitalize">
                    {photo.pose}
                  </Badge>
                </div>

                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-950/80 text-slate-400 hover:text-rose-400 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-slate-900/90">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span className="font-semibold">{photo.date}</span>
                  {photo.weight && (
                    <span className="text-emerald-400 font-bold">{formatWeight(photo.weight)}</span>
                  )}
                </div>
                {photo.notes && (
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 italic">
                    "{photo.notes}"
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Progress Photo"
        subtitle="Photos are strictly isolated and private to your account"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          {/* File Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Select Image</label>
            <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-colors bg-slate-950/60">
              {filePreview ? (
                <div className="relative inline-block">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="max-h-48 rounded-xl object-contain mx-auto"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center">
                  <Camera className="w-8 h-8 text-emerald-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-200">Click to choose image</span>
                  <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, or WEBP up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Date Taken"
              type="date"
              value={photoDate}
              onChange={(e) => setPhotoDate(e.target.value)}
              required
            />

            <Input
              label={`Weight (${weightUnit})`}
              type="number"
              step="0.1"
              placeholder="Optional"
              value={photoWeight}
              onChange={(e) => setPhotoWeight(e.target.value)}
            />

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Pose</label>
              <select
                value={photoPose}
                onChange={(e) => setPhotoPose(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white capitalize focus:outline-none focus:border-emerald-500"
              >
                <option value="front">Front</option>
                <option value="side">Side</option>
                <option value="back">Back</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g., Morning lighting, 4 weeks into cutting phase."
              value={photoNotes}
              onChange={(e) => setPhotoNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="md" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isUploading} icon={Upload}>
              Upload Photo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Side-by-Side Comparison Modal */}
      <Modal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title="Side-by-Side Physical Transformation"
        subtitle="Compare your before and after progress photos"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Before Photo</label>
              <select
                value={compareBeforeId}
                onChange={(e) => setCompareBeforeId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
              >
                {photos.map((p) => (
                  <option key={`before-${p.id}`} value={p.id}>
                    {p.date} ({p.pose}) - {p.weight ? `${p.weight}kg` : 'No weight'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">After Photo</label>
              <select
                value={compareAfterId}
                onChange={(e) => setCompareAfterId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
              >
                {photos.map((p) => (
                  <option key={`after-${p.id}`} value={p.id}>
                    {p.date} ({p.pose}) - {p.weight ? `${p.weight}kg` : 'No weight'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button variant="cyan" size="md" onClick={handleCompare} className="w-full">
            Update Comparison
          </Button>

          {comparison && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center text-xs text-slate-300">
                <span className="font-bold text-emerald-400">{comparison.days_apart} Days Apart</span>
                {comparison.weight_diff !== null && (
                  <span className="ml-3">
                    Weight Delta:{' '}
                    <span className={comparison.weight_diff < 0 ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'}>
                      {comparison.weight_diff > 0 ? `+${comparison.weight_diff}` : comparison.weight_diff} kg
                    </span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="aspect-[3/4] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                    <img
                      src={comparison.before_photo.image_url}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-center text-xs font-bold text-slate-300">
                    Before: {comparison.before_photo.date}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="aspect-[3/4] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                    <img
                      src={comparison.after_photo.image_url}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-center text-xs font-bold text-slate-300">
                    After: {comparison.after_photo.date}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
