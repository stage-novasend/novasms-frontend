import type { FC } from 'react';
import { useState, useRef } from 'react';
import { useCampaignStore } from '@/store/campaign.store';
import { CONTACT_VARIABLES } from '@/types/campaign.types';
import type { CampaignBlock } from '@/store/campaign.store';
import MobilePreview from '@/components/campaigns/previews/MobilePreview';
import { imageUploadService, type UploadedImage } from '@/services/imageUpload';

/**
 * Email Editor Component
 * Features:
 * - Drag-and-drop blocks (Text, Image, Button, Divider, Social)
 * - Rich content editing
 * - Subject line + preheader
 * - Variable insertion
 * - Live preview
 */

export const EmailEditor: FC = () => {
  const { draft, setDraftEmailContent, selectedCampaignId } = useCampaignStore();
  const [subject, setSubject] = useState(draft.emailContent?.subject || '');
  const [preheader, setPreheader] = useState(draft.emailContent?.preheader || '');
  const [blocks, setBlocks] = useState<CampaignBlock[]>(draft.emailContent?.blocks || []);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get campaign ID from store (used for image uploads)
  const campaignId = selectedCampaignId;

  const handleSave = () => {
    setDraftEmailContent({
      subject,
      preheader,
      blocks,
    });
  };

  const handleAddBlock = (type: CampaignBlock['type']) => {
    const newBlock: CampaignBlock = {
      id: `block-${crypto.randomUUID()}`,
      type,
      content: {},
    };

    if (type === 'text') {
      newBlock.content = { text: 'Nouveau paragraphe' };
    } else if (type === 'image') {
      newBlock.content = { src: '', alt: '' };
    } else if (type === 'button') {
      newBlock.content = { text: 'Cliquez ici', url: '' };
    } else if (type === 'social') {
      newBlock.content = {
        facebook: '',
        instagram: '',
        tiktok: '',
        linkedin: '',
      };
    }

    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const handleRemoveBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
    setSelectedBlockId(null);
  };

  const handleUpdateBlock = (id: string, content: Record<string, unknown>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, content } : b)));
  };

  const getContentText = (content: Record<string, unknown>): string => {
    const value = content.text;
    return typeof value === 'string' ? value : '';
  };

  const handleInsertVariable = (variable: string) => {
    const block = blocks.find((b) => b.id === selectedBlockId);
    if (block && block.type === 'text') {
      handleUpdateBlock(block.id, {
        text: `${getContentText(block.content)}${variable}`,
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = imageUploadService.validateImage(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      setIsUploadingImage(true);
      
      // RG-08: Upload image locally even if campaign doesn't exist yet
      // Use draft campaign name or temp ID
      const tempCampaignId = campaignId || `draft-${draft.name || Date.now()}`;
      const uploadedImage = await imageUploadService.uploadImage(file, tempCampaignId);
      setUploadedImages([...uploadedImages, uploadedImage]);

      // Auto-update le bloc image sélectionné si c'est un bloc image
      const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
      if (selectedBlock && selectedBlock.type === 'image') {
        handleUpdateBlock(selectedBlock.id, {
          src: uploadedImage.url,
          alt: uploadedImage.name,
        });
      }
    } catch (error) {
      alert('Erreur lors de l\'upload: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setIsUploadingImage(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getImageSrc = (content: Record<string, unknown>): string => {
    const value = content.src;
    return typeof value === 'string' ? value : '';
  };

  const getImageAlt = (content: Record<string, unknown>): string => {
    const value = content.alt;
    return typeof value === 'string' ? value : '';
  };

  const blockTypes: CampaignBlock['type'][] = ['text', 'image', 'button', 'divider', 'social'];

  return (
    <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* Left: Content Blocks Panel */}
      <aside className="lg:col-span-3 space-y-8">
        {/* Block Tools */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 space-y-4">
          <h3 className="text-label-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">
            Blocs de contenu
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {blockTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleAddBlock(type)}
                className="flex flex-col items-center justify-center p-4 bg-surface-container-lowest rounded-xl border border-transparent hover:border-primary/20 hover:bg-surface-container-high transition-all active:translate-x-1 group"
              >
                <span className="material-symbols-outlined text-primary mb-2 group-hover:scale-110 transition-transform">
                  {type === 'text'
                    ? 'format_align_left'
                    : type === 'image'
                      ? 'image'
                      : type === 'button'
                        ? 'smart_button'
                        : type === 'divider'
                          ? 'horizontal_rule'
                          : 'share'}
                </span>
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-tighter">
                  {type === 'text'
                    ? 'Texte'
                    : type === 'image'
                      ? 'Image'
                      : type === 'button'
                        ? 'Bouton'
                        : type === 'divider'
                          ? 'Séparateur'
                          : 'Social'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Variables */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 space-y-4">
          <h3 className="text-label-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">
            Variables dynamiques
          </h3>
          <div className="space-y-2">
            {Object.entries(CONTACT_VARIABLES.email)
              .slice(0, 3)
              .map(([key, variable]) => (
                <button
                  key={key}
                  onClick={() => handleInsertVariable(variable)}
                  className="w-full flex items-center justify-between p-3 bg-surface-container rounded-lg text-sm text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <span>{key}</span>
                  <code className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">
                    {variable}
                  </code>
                </button>
              ))}
          </div>
        </div>
      </aside>

      {/* Center: Editor */}
      <div className="lg:col-span-6 space-y-8">
        {/* Subject & Preheader */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 space-y-6">
          <div className="space-y-3">
            <label className="block text-label-sm font-bold uppercase tracking-widest text-on-surface-variant">
              Ligne d'objet
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Sujet accrocheur..."
              maxLength={120}
              className="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-xl px-4 py-3 font-body text-on-surface transition-all"
            />
          </div>
          <div className="space-y-3">
            <label className="block text-label-sm font-bold uppercase tracking-widest text-on-surface-variant">
              Prévisualisation (optionnel)
            </label>
            <input
              type="text"
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
              placeholder="Texte visible avant d'ouvrir..."
              maxLength={100}
              className="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-xl px-4 py-3 font-body text-on-surface transition-all"
            />
          </div>
        </div>

        {/* Canvas */}
        <div className="bg-surface-container-low rounded-2xl p-8 shadow-lg space-y-4 min-h-[400px]">
          {blocks.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <p className="text-sm">Cliquez sur un bloc à gauche pour commencer</p>
            </div>
          ) : (
            blocks.map((block) => (
              <div
                key={block.id}
                onClick={() => setSelectedBlockId(block.id)}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer group ${
                  selectedBlockId === block.id
                    ? 'border-primary bg-primary/5'
                    : 'border-outline-variant/20 hover:border-primary/50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-primary uppercase">
                    {block.type}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveBlock(block.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-error hover:bg-error/10 p-1 rounded transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">
                      delete
                    </span>
                  </button>
                </div>

                {/* Block Preview */}
                {block.type === 'text' && (
                  <p className="text-sm text-on-surface line-clamp-2">
                    {getContentText(block.content) || 'Texte vide'}
                  </p>
                )}
                {block.type === 'image' && (
                  <div className="w-full h-24 bg-surface-container rounded flex items-center justify-center text-on-surface-variant overflow-hidden">
                    {getImageSrc(block.content) ? (
                      <img
                        src={getImageSrc(block.content)}
                        alt={getImageAlt(block.content) || 'Email image'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined">image</span>
                    )}
                  </div>
                )}
                {block.type === 'button' && (
                  <button className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-sm">
                    {getContentText(block.content) || 'Bouton'}
                  </button>
                )}
                {block.type === 'divider' && (
                  <div className="h-[2px] bg-outline-variant" />
                )}
                {block.type === 'social' && (
                  <div className="flex gap-3 justify-center py-2">
                    {[
                      { id: 'facebook', icon: 'f', color: '#1877F2' },
                      { id: 'instagram', icon: '📷', color: '#E4405F' },
                      { id: 'tiktok', icon: '♪', color: '#000000' },
                      { id: 'linkedin', icon: '🔗', color: '#0A66C2' },
                    ].map((network) => {
                      const url = ((block.content as Record<string, unknown>)?.[network.id] as string) || '';
                      // Ne pas afficher si l'URL est vide
                      if (!url) return null;
                      return (
                        <a
                          key={network.id}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: network.color }}
                          title={network.id}
                        >
                          {network.icon}
                        </a>
                      );
                    }).filter(Boolean)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl shadow-lg hover:brightness-110 transition-all active:scale-95"
        >
          Enregistrer le contenu
        </button>
      </div>

      {/* Right: Mobile Preview + Image Manager */}
      <div className="lg:col-span-3 space-y-6">
        {/* Block Editor Panel */}
        {selectedBlockId && (
          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 space-y-4 sticky top-20">
            <h3 className="text-label-sm font-bold uppercase tracking-widest text-on-surface-variant">
              Éditer Bloc
            </h3>

            {(() => {
              const block = blocks.find((b) => b.id === selectedBlockId);
              if (!block) return null;

              if (block.type === 'text') {
                return (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-on-surface">Texte</label>
                    <textarea
                      value={getContentText(block.content)}
                      onChange={(e) =>
                        handleUpdateBlock(block.id, { text: e.target.value })
                      }
                      rows={4}
                      className="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-lg px-3 py-2 font-body text-on-surface"
                    />
                  </div>
                );
              } else if (block.type === 'image') {
                return (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-on-surface">Image</label>
                    <div className="space-y-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="w-full py-3 px-4 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined">
                          {isUploadingImage ? 'hourglass_empty' : 'upload'}
                        </span>
                        {isUploadingImage ? 'Envoi en cours...' : 'Uploader une image'}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                      {getImageSrc(block.content) && (
                        <div className="p-2 bg-surface-container rounded">
                          <img
                            src={getImageSrc(block.content)}
                            alt="preview"
                            className="w-full h-24 object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-on-surface-variant">Alt Text</label>
                      <input
                        type="text"
                        value={getImageAlt(block.content)}
                        onChange={(e) =>
                          handleUpdateBlock(block.id, {
                            src: getImageSrc(block.content),
                            alt: e.target.value,
                          })
                        }
                        placeholder="Description de l'image..."
                        className="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                );
              } else if (block.type === 'button') {
                return (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-semibold text-on-surface">Texte du bouton</label>
                      <input
                        type="text"
                        value={getContentText(block.content)}
                        onChange={(e) =>
                          handleUpdateBlock(block.id, {
                            text: e.target.value,
                            url: (block.content.url as string) || '',
                          })
                        }
                        className="w-full mt-1 bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-on-surface">URL</label>
                      <input
                        type="url"
                        value={(block.content.url as string) || ''}
                        onChange={(e) =>
                          handleUpdateBlock(block.id, {
                            text: getContentText(block.content),
                            url: e.target.value,
                          })
                        }
                        placeholder="https://..."
                        className="w-full mt-1 bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                );
              } else if (block.type === 'social') {
                const socialNetworks = [
                  { 
                    id: 'facebook', 
                    name: 'Facebook', 
                    url: 'https://facebook.com',
                    icon: '🔵 f',
                    color: '#1877F2'
                  },
                  { 
                    id: 'instagram', 
                    name: 'Instagram', 
                    url: 'https://instagram.com',
                    icon: '🎨 📷',
                    color: '#E4405F'
                  },
                  { 
                    id: 'tiktok', 
                    name: 'TikTok', 
                    url: 'https://tiktok.com',
                    icon: '🎵 ♪',
                    color: '#000000'
                  },
                  { 
                    id: 'linkedin', 
                    name: 'LinkedIn', 
                    url: 'https://linkedin.com',
                    icon: '🔗 in',
                    color: '#0A66C2'
                  },
                ];
                
                return (
                  <div className="space-y-4">
                    <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-widest">
                      Réseaux sociaux
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Activez les réseaux à afficher et entrez vos URLs
                    </p>
                    {socialNetworks.map((network) => {
                      const isEnabled = Boolean(((block.content as Record<string, unknown>)?.[network.id] as string));
                      const url = ((block.content as Record<string, unknown>)?.[network.id] as string) || '';
                      
                      return (
                        <div key={network.id} className="border border-outline-variant/30 rounded-lg p-3">
                          <div className="flex items-center gap-3 mb-2">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={(e) => {
                                handleUpdateBlock(block.id, {
                                  ...block.content,
                                  [network.id]: e.target.checked ? `https://${network.id}.com/votre-profil` : '',
                                });
                              }}
                              className="w-5 h-5 rounded border-outline-variant cursor-pointer"
                            />
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                              style={{ backgroundColor: network.color }}
                              title={network.name}
                            >
                              {network.icon.split(' ')[1]}
                            </div>
                            <label className="text-sm font-semibold text-on-surface flex-1 cursor-pointer">
                              {network.name}
                            </label>
                          </div>
                          {isEnabled && (
                            <input
                              type="url"
                              value={url}
                              onChange={(e) =>
                                handleUpdateBlock(block.id, {
                                  ...block.content,
                                  [network.id]: e.target.value,
                                })
                              }
                              placeholder={`https://${network.id}.com/votre-profil`}
                              className="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-lg px-3 py-2 text-sm"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }

              return null;
            })()}
          </div>
        )}

        {/* Mobile Preview */}
        <MobilePreview
          type="email"
          emailContent={{
            subject,
            preheader,
            blocks,
          }}
        />
      </div>
    </div>
  );
};
