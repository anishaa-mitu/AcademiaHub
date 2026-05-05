import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, MessageCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Material } from '../types';
import { enrichMaterial } from '../patterns/MaterialDecorator';
import { whatsAppAdapter } from '../patterns/WhatsAppAdapter';
import { useAuth } from '../context/AuthContext';

export default function MaterialDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);

  
useEffect(() => {
  if (!id) return;
  fetchMaterial();
  // Increment only once, ignore StrictMode double-fire
  const timer = setTimeout(() => {
    supabase.rpc('increment_view_count', { material_id: id });
  }, 500);
  return () => clearTimeout(timer);
}, [id]);

const fetchMaterial = async () => {
  const { data, error } = await supabase
    .from('materials')
    .select('*, seller:profiles(*)')
    .eq('id', id)
    .maybeSingle();
  if (!error && data) setMaterial(data);
  setLoading(false);
};

  // WhatsApp Adapter Pattern — opens WhatsApp with a pre-filled message
  const handleWhatsAppBuy = () => {
    const seller = material?.seller as any;
    const phone = seller?.whatsapp_number;
    if (!phone) {
      alert('This seller has not provided a WhatsApp number.');
      return;
    }
    const message =
      `Hi! I'm interested in buying your material:\n` +
      `*${material?.title}*\n` +
      `Price: ৳${material?.price}\n` +
      `Category: ${material?.category}\n\n` +
      `Is it still available?`;
    whatsAppAdapter.sendMessage(phone, message);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!material) return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Not Found</h1>
        <Link to="/materials" className="text-blue-600 hover:underline font-medium">Back to Materials →</Link>
      </div>
    </div>
  );

  const enriched = enrichMaterial(material);
  const seller = material.seller as any;
  const hasWhatsApp = !!seller?.whatsapp_number;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/materials" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {/* Image or fallback icon */}
            <div className="rounded-xl h-72 overflow-hidden mb-6 bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
              {material.image_url ? (
                <img src={material.image_url} alt={material.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-9xl">{enriched.typeIcon}</span>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{material.title}</h1>
              <p className="text-gray-600 leading-relaxed mb-6">{material.description}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded">{material.type.toUpperCase()}</span>
                <span className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded">{material.category}</span>
                <span className="text-xs px-3 py-1 bg-amber-50 text-amber-700 rounded">{enriched.conditionLabel}</span>
              </div>

              {material.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {material.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-1 bg-gray-50 text-gray-500 rounded border border-gray-100">#{tag}</span>
                  ))}
                </div>
              )}

              <div className="text-sm text-gray-500 space-y-1">
                <p>👁 {material.view_count} views</p>
                <p>📅 Listed {new Date(material.created_at).toLocaleDateString()}</p>
                {seller && <p>👤 Seller: <span className="font-medium text-gray-700">{seller.full_name}</span></p>}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24 space-y-4">
              <div>
                <p className="text-gray-500 text-sm mb-1">Price</p>
                <p className="text-4xl font-bold text-gray-900">{enriched.priceLabel}</p>
              </div>

              {user ? (
                <>
                  {/* WhatsApp Buy — Adapter Pattern */}
                  <button
                    onClick={handleWhatsAppBuy}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${hasWhatsApp
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    disabled={!hasWhatsApp}
                  >
                    <MessageCircle className="w-5 h-5" />
                    {hasWhatsApp ? 'Buy via WhatsApp' : 'No WhatsApp listed'}
                  </button>

                  {/* File download link if exists */}
                  {material.file_url && (
                    <a href={material.file_url} target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      View / Download File
                    </a>
                  )}
                </>
              ) : (
                <Link to="/login"
                  className="w-full block text-center bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
                  Sign in to Buy
                </Link>
              )}

              {!hasWhatsApp && user && (
                <p className="text-xs text-gray-400 text-center">
                  The seller hasn't added a WhatsApp number yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}