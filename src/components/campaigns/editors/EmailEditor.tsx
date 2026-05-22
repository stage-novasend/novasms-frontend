import type { CSSProperties, FC } from 'react';
import { useState, useRef } from 'react';
import { useCampaignStore } from '@/store/campaign.store';
import { CONTACT_VARIABLES } from '@/types/campaign.types';
import type { CampaignBlock } from '@/store/campaign.store';
import MobilePreview from '@/components/campaigns/previews/MobilePreview';
import { imageUploadService, type UploadedImage } from '@/services/imageUpload';
import api from '@/api/axios';

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
  const pendingImageUploadRef = useRef<((uploadedImage: UploadedImage) => void) | null>(null);

  // Get campaign ID from store (used for image uploads)
  const campaignId = selectedCampaignId;

  const handleSave = () => {
    setDraftEmailContent({
      subject,
      preheader,
      blocks,
    });
  };

  const createBlockByType = (type: CampaignBlock['type']): CampaignBlock => {
    const block: CampaignBlock = {
      id: `block-${crypto.randomUUID()}`,
      type,
      content: {},
    };

    if (type === 'text') {
      block.content = {
        text: 'Nouveau paragraphe',
        fontSize: 14,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 400,
        textAlign: 'left',
        color: '#111827',
      };
    } else if (type === 'image') {
      block.content = { src: '', alt: '' };
    } else if (type === 'button') {
      block.content = { text: 'Cliquez ici', url: '' };
    } else if (type === 'divider') {
      block.content = {
        thickness: 2,
        color: '#d1d5db',
        width: '100%',
      };
    } else if (type === 'product') {
      block.content = {
        title: 'Produit vedette',
        description: 'Décrivez votre offre en une phrase claire.',
        price: '25 000 FCFA',
        image: '',
        url: '',
      };
    } else if (type === 'social') {
      block.content = {
        facebook: '',
        instagram: '',
        tiktok: '',
        linkedin: '',
      };
    } else if (type === 'columns') {
      block.content = {
        layout: '2',
        columns: [{ blocks: [] }, { blocks: [] }],
      };
    } else if (type === 'spacing') {
      block.content = { size: 'medium' };
    } else if (type === 'html') {
      block.content = { html: '' };
    }

    return block;
  };

  const handleAddBlock = (type: CampaignBlock['type']) => {
    const newBlock = createBlockByType(type);

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

  const ensureCampaignIdForUpload = async (): Promise<string> => {
    if (campaignId) return campaignId;

    const response = await api.post<{ id: string }>('/campaigns', {
      channelType: 'EMAIL',
      name: draft.name || `Campagne email ${new Date().toLocaleDateString('fr-FR')}`,
      status: 'DRAFT',
    });
    useCampaignStore.setState({ selectedCampaignId: response.data.id });
    return response.data.id;
  };

  const triggerImageUpload = (onUploaded: (uploadedImage: UploadedImage) => void) => {
    pendingImageUploadRef.current = onUploaded;
    fileInputRef.current?.click();
  };

  const uploadImageFile = async (
    file: File | null,
    onUploaded?: (uploadedImage: UploadedImage) => void,
  ) => {
    if (!file) return;

    const validation = imageUploadService.validateImage(file);
    if (!validation.valid) {
      alert(validation.error);
      pendingImageUploadRef.current = null;
      return;
    }

    try {
      setIsUploadingImage(true);

      const realCampaignId = await ensureCampaignIdForUpload();
      const uploadedImage = await imageUploadService.uploadImage(file, realCampaignId);
      setUploadedImages([...uploadedImages, uploadedImage]);
      onUploaded?.(uploadedImage);
    } catch (error) {
      alert('Erreur lors de l\'upload: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const pendingUpload = pendingImageUploadRef.current;

    await uploadImageFile(file, (uploadedImage) => {
      if (pendingUpload) {
        pendingUpload(uploadedImage);
        return;
      }

      const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
      if (selectedBlock && selectedBlock.type === 'image') {
        handleUpdateBlock(selectedBlock.id, {
          src: uploadedImage.url,
          alt: uploadedImage.name,
        });
      }
    });

    pendingImageUploadRef.current = null;

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateNestedColumnBlock = (
    blockId: string,
    columnIndex: number,
    nestedIndex: number,
    nextContent: Record<string, unknown>,
  ) => {
    updateColumnsContent(blockId, (state) => {
      const nextColumns = [...state.columns];
      const target = nextColumns[columnIndex] || { blocks: [] };
      const nextBlocks = [...target.blocks];
      const nestedBlock = nextBlocks[nestedIndex];

      if (!nestedBlock) return state;

      nextBlocks[nestedIndex] = {
        ...nestedBlock,
        content: nextContent,
      };
      target.blocks = nextBlocks;
      nextColumns[columnIndex] = target;
      return { layout: state.layout, columns: nextColumns };
    });
  };

  const getImageSrc = (content: Record<string, unknown>): string => {
    const value = content.src;
    return typeof value === 'string' ? imageUploadService.getThumbnail(value) : '';
  };
  const getTextStyle = (content: Record<string, unknown>): CSSProperties => {
    const fontSizeRaw = content.fontSize;
    const fontWeightRaw = content.fontWeight;
    const textAlignRaw = content.textAlign;
    const textAlign: CSSProperties['textAlign'] =
      textAlignRaw === 'center' ||
      textAlignRaw === 'right' ||
      textAlignRaw === 'justify'
        ? textAlignRaw
        : 'left';

    return {
      fontSize: typeof fontSizeRaw === 'number' ? `${fontSizeRaw}px` : '14px',
      fontFamily:
        typeof content.fontFamily === 'string'
          ? content.fontFamily
          : 'Inter, system-ui, sans-serif',
      fontWeight: typeof fontWeightRaw === 'number' ? fontWeightRaw : 400,
      textAlign,
      color: typeof content.color === 'string' ? content.color : '#111827',
    };
  };


  const getImageAlt = (content: Record<string, unknown>): string => {
    const value = content.alt;
    return typeof value === 'string' ? value : '';
  };

  const getButtonText = (content: Record<string, unknown>): string => {
    const value = content.text;
    return typeof value === 'string' && value.trim().length > 0 ? value : 'Bouton';
  };

  const getButtonUrl = (content: Record<string, unknown>): string => {
    const value = content.url;
    return typeof value === 'string' ? value : '';
  };

  const getSpacingHeight = (size: string | undefined): string => {
    if (size === 'small') return '8px';
    if (size === 'large') return '24px';
    if (size === 'extra-large') return '32px';
    return '16px';
  };

  const getDividerStyle = (content: Record<string, unknown>): CSSProperties => {
    const thickness = Number(content.thickness || 2);
    const width = typeof content.width === 'string' && content.width ? content.width : '100%';
    const color = typeof content.color === 'string' && content.color ? content.color : '#d1d5db';

    return {
      width,
      borderTopWidth: `${thickness}px`,
      borderTopStyle: 'solid',
      borderTopColor: color,
      margin: '12px auto',
    };
  };

  const getColumnsState = (content: Record<string, unknown>) => {
    const layout = Number(content.layout || 2);
    const safeLayout = [1, 2, 3].includes(layout) ? layout : 2;
    const rawColumns = Array.isArray(content.columns) ? content.columns : [];
    const columns = Array.from({ length: safeLayout }).map((_, index) => {
      const col = rawColumns[index] as Record<string, unknown> | undefined;
      const blocksInColumn = Array.isArray(col?.blocks)
        ? (col?.blocks as CampaignBlock[])
        : [];
      return { blocks: blocksInColumn };
    });
    return { layout: safeLayout, columns };
  };

  const updateColumnsContent = (
    blockId: string,
    updater: (state: { layout: number; columns: { blocks: CampaignBlock[] }[] }) => {
      layout: number;
      columns: { blocks: CampaignBlock[] }[];
    },
  ) => {
    const current = blocks.find((b) => b.id === blockId);
    if (!current) return;
    const state = getColumnsState(current.content);
    const next = updater(state);
    handleUpdateBlock(blockId, {
      layout: String(next.layout),
      columns: next.columns,
    });
  };

  const blockTypes: CampaignBlock['type'][] = ['text', 'image', 'button', 'product', 'divider', 'social', 'columns', 'spacing', 'html'];

  return (
    <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        disabled={isUploadingImage}
        className="hidden"
      />
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
                        : type === 'product'
                          ? 'shopping_bag'
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
                        : type === 'product'
                          ? 'Produit'
                        : type === 'divider'
                          ? 'Séparateur'
                          : type === 'columns'
                            ? 'Colonnes'
                            : type === 'spacing'
                              ? 'Espacement'
                              : type === 'html'
                                ? 'HTML'
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
                  <p
                    className="text-sm text-on-surface line-clamp-2"
                    style={getTextStyle(block.content)}
                  >
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
                {block.type === 'button' && (() => {
                  const buttonUrl = getButtonUrl(block.content);
                  const buttonLabel = getButtonText(block.content);
                  const buttonNode = (
                    <span className="inline-flex px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-sm">
                      {buttonLabel}
                    </span>
                  );

                  if (buttonUrl) {
                    return (
                      <a href={buttonUrl} target="_blank" rel="noreferrer" className="inline-block">
                        {buttonNode}
                      </a>
                    );
                  }

                  return (
                    <div>
                      {buttonNode}
                      <p className="mt-1 text-[11px] text-on-surface-variant">Aucun lien défini</p>
                    </div>
                  );
                })()}
                {block.type === 'product' && (() => {
                  const product = block.content as Record<string, unknown>;
                  const productTitle = typeof product.title === 'string' ? product.title : 'Produit';
                  const productDescription = typeof product.description === 'string' ? product.description : '';
                  const productPrice = typeof product.price === 'string' ? product.price : '';
                  const productUrl = typeof product.url === 'string' ? product.url : '';
                  const productImage = typeof product.image === 'string' ? product.image : '';

                  const card = (
                    <div className="rounded-xl border border-outline-variant/20 overflow-hidden bg-surface-container-low">
                      <div className="h-28 bg-surface-container flex items-center justify-center overflow-hidden">
                        {productImage ? (
                          <img src={imageUploadService.getThumbnail(productImage)} alt={productTitle} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-4xl text-on-surface-variant">shopping_bag</span>
                        )}
                      </div>
                      <div className="p-3 space-y-1 text-left">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-on-surface">{productTitle}</p>
                          {productPrice && <span className="text-xs font-bold text-primary">{productPrice}</span>}
                        </div>
                        {productDescription && <p className="text-[11px] text-on-surface-variant line-clamp-2">{productDescription}</p>}
                      </div>
                    </div>
                  );

                  if (productUrl) {
                    return (
                      <a href={productUrl} target="_blank" rel="noreferrer" className="block">
                        {card}
                      </a>
                    );
                  }

                  return card;
                })()}
                {block.type === 'divider' && (
                  <div className="mx-auto" style={getDividerStyle(block.content)} />
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
                {block.type === 'columns' && (
                  <div className="space-y-2">
                    <div className="text-xs p-2 bg-primary/10 rounded">
                      Colonnes ({getColumnsState(block.content).layout})
                    </div>
                    <div
                      className="grid gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${getColumnsState(block.content).layout}, minmax(0, 1fr))`,
                      }}
                    >
                      {getColumnsState(block.content).columns.map((column, index) => (
                        <div
                          key={index}
                          className="min-h-14 bg-surface-container rounded border border-outline-variant/20 p-2"
                        >
                          {column.blocks.length === 0 ? (
                            <div className="text-[10px] text-on-surface-variant">Colonne vide</div>
                          ) : (
                            <div className="space-y-1">
                              {column.blocks.map((nested) => (
                                <div
                                  key={nested.id}
                                  className="rounded bg-primary/5 px-2 py-1 text-[10px] text-on-surface"
                                >
                                  {nested.type === 'text'
                                    ? ((nested.content.text as string) || 'Texte')
                                    : nested.type === 'button'
                                      ? ((nested.content.text as string) || 'Bouton')
                                      : nested.type === 'image'
                                        ? 'Image'
                                        : nested.type === 'spacing'
                                          ? 'Espacement'
                                          : nested.type === 'divider'
                                            ? 'Séparateur'
                                            : nested.type === 'html'
                                              ? 'HTML'
                                              : nested.type}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {block.type === 'spacing' && (
                  <div
                    className="w-full rounded bg-primary/10"
                    style={{ height: getSpacingHeight((block.content as Record<string, unknown>)?.size as string | undefined) }}
                    title={`Espacement ${String((block.content as Record<string, unknown>)?.size || 'medium')}`}
                  >
                    <span className="sr-only">Espacement</span>
                  </div>
                )}
                {block.type === 'html' && (
                  <div className="p-2 bg-surface-container rounded text-xs font-mono truncate text-on-surface-variant">
                    HTML code...
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
          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 space-y-4">
            <h3 className="text-label-sm font-bold uppercase tracking-widest text-on-surface-variant">
              Éditer Bloc
            </h3>

            {(() => {
              const block = blocks.find((b) => b.id === selectedBlockId);
              if (!block) return null;

              if (block.type === 'text') {
                const currentStyle = getTextStyle(block.content);
                return (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-on-surface">Texte</label>
                    <textarea
                      value={getContentText(block.content)}
                      onChange={(e) =>
                        handleUpdateBlock(block.id, {
                          ...block.content,
                          text: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-lg px-3 py-2 font-body text-on-surface"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-on-surface-variant">Taille</label>
                        <input
                          type="number"
                          min={10}
                          max={42}
                          value={parseInt(String(currentStyle.fontSize).replace('px', ''), 10)}
                          onChange={(e) =>
                            handleUpdateBlock(block.id, {
                              ...block.content,
                              fontSize: Number(e.target.value),
                            })
                          }
                          className="w-full mt-1 bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-on-surface-variant">Graisse</label>
                        <select
                          value={Number(currentStyle.fontWeight)}
                          onChange={(e) =>
                            handleUpdateBlock(block.id, {
                              ...block.content,
                              fontWeight: Number(e.target.value),
                            })
                          }
                          className="w-full mt-1 bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-lg px-3 py-2"
                        >
                          <option value={400}>Normal</option>
                          <option value={500}>Medium</option>
                          <option value={600}>Semi-bold</option>
                          <option value={700}>Bold</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-on-surface-variant">Police</label>
                        <select
                          value={String(currentStyle.fontFamily)}
                          onChange={(e) =>
                            handleUpdateBlock(block.id, {
                              ...block.content,
                              fontFamily: e.target.value,
                            })
                          }
                          className="w-full mt-1 bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-lg px-3 py-2"
                        >
                          <option value="Inter, system-ui, sans-serif">Inter</option>
                          <option value="Manrope, system-ui, sans-serif">Manrope</option>
                          <option value="Georgia, serif">Georgia</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-on-surface-variant">Alignement</label>
                        <select
                          value={String(currentStyle.textAlign)}
                          onChange={(e) =>
                            handleUpdateBlock(block.id, {
                              ...block.content,
                              textAlign: e.target.value,
                            })
                          }
                          className="w-full mt-1 bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-lg px-3 py-2"
                        >
                          <option value="left">Gauche</option>
                          <option value="center">Centre</option>
                          <option value="right">Droite</option>
                          <option value="justify">Justifié</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-on-surface-variant">Couleur du texte</label>
                      <input
                        type="color"
                        value={String(currentStyle.color)}
                        onChange={(e) =>
                          handleUpdateBlock(block.id, {
                            ...block.content,
                            color: e.target.value,
                          })
                        }
                        className="w-full mt-1 h-10 bg-surface-container-lowest border-none ring-1 ring-outline-variant rounded-lg"
                      />
                    </div>
                  </div>
                );
              } else if (block.type === 'image') {
                return (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-on-surface">Image</label>
                    <div className="space-y-2">
                      <button
                        onClick={() =>
                          triggerImageUpload((uploadedImage) => {
                            handleUpdateBlock(block.id, {
                              src: uploadedImage.url,
                              alt: uploadedImage.name,
                            });
                          })
                        }
                        disabled={isUploadingImage}
                        className="w-full py-3 px-4 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined">
                          {isUploadingImage ? 'hourglass_empty' : 'upload'}
                        </span>
                        {isUploadingImage ? 'Envoi en cours...' : 'Insérer une image'}
                      </button>
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
              } else if (block.type === 'columns') {
                const currentColumnsState = getColumnsState(block.content);
                const nestedTypes: CampaignBlock['type'][] = ['text', 'image', 'button', 'divider', 'spacing', 'html'];
                return (
                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-on-surface">
                      Nombre de colonnes
                    </label>
                    <div className="flex gap-2">
                      {['1', '2', '3'].map((num) => (
                        <button
                          key={num}
                          onClick={() => {
                            const colCount = parseInt(num);
                            updateColumnsContent(block.id, (state) => {
                              const nextColumns = Array.from({ length: colCount }).map((_, index) => state.columns[index] || { blocks: [] });
                              return { layout: colCount, columns: nextColumns };
                            });
                          }}
                          className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all ${
                            String(currentColumnsState.layout) === num
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      Chaque colonne accepte les blocs imbriqués (texte, images, etc.)
                    </p>

                    <div className="space-y-3">
                      {currentColumnsState.columns.map((column, columnIndex) => (
                        <div key={columnIndex} className="rounded-lg border border-outline-variant/30 p-3 space-y-3">
                          <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                            Colonne {columnIndex + 1}
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {nestedTypes.map((nestedType) => (
                              <button
                                key={nestedType}
                                onClick={() => {
                                  updateColumnsContent(block.id, (state) => {
                                    const nextColumns = [...state.columns];
                                    const target = nextColumns[columnIndex] || { blocks: [] };
                                    const nested = createBlockByType(nestedType);
                                    target.blocks = [...target.blocks, nested];
                                    nextColumns[columnIndex] = target;
                                    return { layout: state.layout, columns: nextColumns };
                                  });
                                }}
                                className="rounded-md bg-surface-container-low px-2 py-1 text-[11px] font-semibold hover:bg-surface-container"
                              >
                                + {nestedType}
                              </button>
                            ))}
                          </div>

                          {column.blocks.length === 0 ? (
                            <p className="text-xs text-on-surface-variant">Aucun élément.</p>
                          ) : (
                            <div className="space-y-2">
                              {column.blocks.map((nestedBlock, nestedIndex) => (
                                <div key={nestedBlock.id} className="rounded-md border border-outline-variant/20 p-2 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase text-primary">{nestedBlock.type}</span>
                                    <button
                                      onClick={() => {
                                        updateColumnsContent(block.id, (state) => {
                                          const nextColumns = [...state.columns];
                                          const target = nextColumns[columnIndex] || { blocks: [] };
                                          target.blocks = target.blocks.filter((b) => b.id !== nestedBlock.id);
                                          nextColumns[columnIndex] = target;
                                          return { layout: state.layout, columns: nextColumns };
                                        });
                                      }}
                                      className="text-xs text-error"
                                    >
                                      Supprimer
                                    </button>
                                  </div>

                                  {nestedBlock.type === 'text' && (
                                    <textarea
                                      value={(nestedBlock.content.text as string) || ''}
                                      onChange={(e) => {
                                        updateColumnsContent(block.id, (state) => {
                                          const nextColumns = [...state.columns];
                                          const target = nextColumns[columnIndex] || { blocks: [] };
                                          const nextBlocks = [...target.blocks];
                                          nextBlocks[nestedIndex] = {
                                            ...nestedBlock,
                                            content: {
                                              ...nestedBlock.content,
                                              text: e.target.value,
                                            },
                                          };
                                          target.blocks = nextBlocks;
                                          nextColumns[columnIndex] = target;
                                          return { layout: state.layout, columns: nextColumns };
                                        });
                                      }}
                                      rows={2}
                                      className="w-full bg-surface-container-lowest ring-1 ring-outline-variant rounded px-2 py-1 text-xs"
                                    />
                                  )}

                                  {nestedBlock.type === 'button' && (
                                    <div className="space-y-2">
                                      <input
                                        type="text"
                                        value={(nestedBlock.content.text as string) || ''}
                                        onChange={(e) => {
                                          updateColumnsContent(block.id, (state) => {
                                            const nextColumns = [...state.columns];
                                            const target = nextColumns[columnIndex] || { blocks: [] };
                                            const nextBlocks = [...target.blocks];
                                            nextBlocks[nestedIndex] = {
                                              ...nestedBlock,
                                              content: {
                                                ...nestedBlock.content,
                                                text: e.target.value,
                                              },
                                            };
                                            target.blocks = nextBlocks;
                                            nextColumns[columnIndex] = target;
                                            return { layout: state.layout, columns: nextColumns };
                                          });
                                        }}
                                        className="w-full bg-surface-container-lowest ring-1 ring-outline-variant rounded px-2 py-1 text-xs"
                                        placeholder="Texte du bouton"
                                      />

                                      <input
                                        type="url"
                                        value={(nestedBlock.content.url as string) || ''}
                                        onChange={(e) => {
                                          updateColumnsContent(block.id, (state) => {
                                            const nextColumns = [...state.columns];
                                            const target = nextColumns[columnIndex] || { blocks: [] };
                                            const nextBlocks = [...target.blocks];
                                            nextBlocks[nestedIndex] = {
                                              ...nestedBlock,
                                              content: {
                                                ...nestedBlock.content,
                                                url: e.target.value,
                                              },
                                            };
                                            target.blocks = nextBlocks;
                                            nextColumns[columnIndex] = target;
                                            return { layout: state.layout, columns: nextColumns };
                                          });
                                        }}
                                        className="w-full bg-surface-container-lowest ring-1 ring-outline-variant rounded px-2 py-1 text-xs"
                                        placeholder="https://..."
                                      />
                                    </div>
                                  )}

                                  {nestedBlock.type === 'image' && (
                                    <div className="space-y-2">
                                      <button
                                        onClick={() =>
                                          triggerImageUpload((uploadedImage) => {
                                            updateNestedColumnBlock(block.id, columnIndex, nestedIndex, {
                                              ...nestedBlock.content,
                                              src: uploadedImage.url,
                                              alt: uploadedImage.name,
                                            });
                                          })
                                        }
                                        disabled={isUploadingImage}
                                        className="w-full rounded-md bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 disabled:opacity-50"
                                      >
                                        {isUploadingImage ? 'Envoi...' : 'Insérer une image'}
                                      </button>
                                      <input
                                        type="url"
                                        value={(nestedBlock.content.src as string) || ''}
                                        onChange={(e) => {
                                          updateNestedColumnBlock(block.id, columnIndex, nestedIndex, {
                                            ...nestedBlock.content,
                                            src: e.target.value,
                                          });
                                        }}
                                        className="w-full bg-surface-container-lowest ring-1 ring-outline-variant rounded px-2 py-1 text-xs"
                                        placeholder="URL d'image (https://...)"
                                      />
                                    </div>
                                  )}

                                  {nestedBlock.type === 'divider' && (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <label className="text-[11px] font-semibold text-on-surface-variant">Épaisseur</label>
                                        <input
                                          type="range"
                                          min={1}
                                          max={8}
                                          value={Number((nestedBlock.content as Record<string, unknown>).thickness || 2)}
                                          onChange={(e) => {
                                            updateNestedColumnBlock(block.id, columnIndex, nestedIndex, {
                                              ...nestedBlock.content,
                                              thickness: Number(e.target.value),
                                            });
                                          }}
                                          className="flex-1"
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="text-[11px] font-semibold text-on-surface-variant">Couleur</label>
                                          <input
                                            type="color"
                                            value={(nestedBlock.content as Record<string, unknown>).color as string || '#d1d5db'}
                                            onChange={(e) => {
                                              updateNestedColumnBlock(block.id, columnIndex, nestedIndex, {
                                                ...nestedBlock.content,
                                                color: e.target.value,
                                              });
                                            }}
                                            className="mt-1 h-9 w-full rounded border border-outline-variant bg-transparent"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[11px] font-semibold text-on-surface-variant">Largeur</label>
                                          <select
                                            value={(nestedBlock.content as Record<string, unknown>).width as string || '100%'}
                                            onChange={(e) => {
                                              updateNestedColumnBlock(block.id, columnIndex, nestedIndex, {
                                                ...nestedBlock.content,
                                                width: e.target.value,
                                              });
                                            }}
                                            className="mt-1 w-full bg-surface-container-lowest ring-1 ring-outline-variant rounded px-2 py-1 text-xs"
                                          >
                                            <option value="100%">Pleine largeur</option>
                                            <option value="75%">75%</option>
                                            <option value="50%">50%</option>
                                            <option value="25%">25%</option>
                                          </select>
                                        </div>
                                      </div>
                                      <div className="pt-1">
                                        <div
                                          className="mx-auto"
                                          style={getDividerStyle(nestedBlock.content as Record<string, unknown>)}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {nestedBlock.type === 'html' && (
                                    <div className="space-y-2">
                                      <label className="text-[11px] font-semibold text-on-surface-variant">Code HTML</label>
                                      <textarea
                                        value={(nestedBlock.content as Record<string, unknown>)?.html as string || ''}
                                        onChange={(e) => {
                                          updateNestedColumnBlock(block.id, columnIndex, nestedIndex, {
                                            ...nestedBlock.content,
                                            html: e.target.value,
                                          });
                                        }}
                                        rows={4}
                                        placeholder="<div><strong>Bonjour</strong></div>"
                                        className="w-full bg-surface-container-lowest ring-1 ring-outline-variant rounded px-2 py-1 text-xs font-mono"
                                      />
                                      <div className="rounded border border-outline-variant/20 bg-white p-2 text-[11px] overflow-auto max-h-28">
                                        <div
                                          dangerouslySetInnerHTML={{
                                            __html:
                                              ((nestedBlock.content as Record<string, unknown>)?.html as string) ||
                                              '<p style="color:#9ca3af">HTML vide</p>',
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {nestedBlock.type === 'product' && (
                                    <div className="space-y-2">
                                      <input
                                        type="text"
                                        value={(nestedBlock.content.title as string) || ''}
                                        onChange={(e) => {
                                          updateColumnsContent(block.id, (state) => {
                                            const nextColumns = [...state.columns];
                                            const target = nextColumns[columnIndex] || { blocks: [] };
                                            const nextBlocks = [...target.blocks];
                                            nextBlocks[nestedIndex] = {
                                              ...nestedBlock,
                                              content: {
                                                ...nestedBlock.content,
                                                title: e.target.value,
                                              },
                                            };
                                            target.blocks = nextBlocks;
                                            nextColumns[columnIndex] = target;
                                            return { layout: state.layout, columns: nextColumns };
                                          });
                                        }}
                                        className="w-full bg-surface-container-lowest ring-1 ring-outline-variant rounded px-2 py-1 text-xs"
                                        placeholder="Titre du produit"
                                      />

                                      <input
                                        type="text"
                                        value={(nestedBlock.content.price as string) || ''}
                                        onChange={(e) => {
                                          updateColumnsContent(block.id, (state) => {
                                            const nextColumns = [...state.columns];
                                            const target = nextColumns[columnIndex] || { blocks: [] };
                                            const nextBlocks = [...target.blocks];
                                            nextBlocks[nestedIndex] = {
                                              ...nestedBlock,
                                              content: {
                                                ...nestedBlock.content,
                                                price: e.target.value,
                                              },
                                            };
                                            target.blocks = nextBlocks;
                                            nextColumns[columnIndex] = target;
                                            return { layout: state.layout, columns: nextColumns };
                                          });
                                        }}
                                        className="w-full bg-surface-container-lowest ring-1 ring-outline-variant rounded px-2 py-1 text-xs"
                                        placeholder="Prix"
                                      />

                                      <input
                                        type="text"
                                        value={(nestedBlock.content.description as string) || ''}
                                        onChange={(e) => {
                                          updateColumnsContent(block.id, (state) => {
                                            const nextColumns = [...state.columns];
                                            const target = nextColumns[columnIndex] || { blocks: [] };
                                            const nextBlocks = [...target.blocks];
                                            nextBlocks[nestedIndex] = {
                                              ...nestedBlock,
                                              content: {
                                                ...nestedBlock.content,
                                                description: e.target.value,
                                              },
                                            };
                                            target.blocks = nextBlocks;
                                            nextColumns[columnIndex] = target;
                                            return { layout: state.layout, columns: nextColumns };
                                          });
                                        }}
                                        className="w-full bg-surface-container-lowest ring-1 ring-outline-variant rounded px-2 py-1 text-xs"
                                        placeholder="Description"
                                      />

                                      <input
                                        type="url"
                                        value={(nestedBlock.content.image as string) || ''}
                                        onChange={(e) => {
                                          updateColumnsContent(block.id, (state) => {
                                            const nextColumns = [...state.columns];
                                            const target = nextColumns[columnIndex] || { blocks: [] };
                                            const nextBlocks = [...target.blocks];
                                            nextBlocks[nestedIndex] = {
                                              ...nestedBlock,
                                              content: {
                                                ...nestedBlock.content,
                                                image: e.target.value,
                                              },
                                            };
                                            target.blocks = nextBlocks;
                                            nextColumns[columnIndex] = target;
                                            return { layout: state.layout, columns: nextColumns };
                                          });
                                        }}
                                        className="w-full bg-surface-container-lowest ring-1 ring-outline-variant rounded px-2 py-1 text-xs"
                                        placeholder="URL image (https://...)"
                                      />

                                      <input
                                        type="url"
                                        value={(nestedBlock.content.url as string) || ''}
                                        onChange={(e) => {
                                          updateColumnsContent(block.id, (state) => {
                                            const nextColumns = [...state.columns];
                                            const target = nextColumns[columnIndex] || { blocks: [] };
                                            const nextBlocks = [...target.blocks];
                                            nextBlocks[nestedIndex] = {
                                              ...nestedBlock,
                                              content: {
                                                ...nestedBlock.content,
                                                url: e.target.value,
                                              },
                                            };
                                            target.blocks = nextBlocks;
                                            nextColumns[columnIndex] = target;
                                            return { layout: state.layout, columns: nextColumns };
                                          });
                                        }}
                                        className="w-full bg-surface-container-lowest ring-1 ring-outline-variant rounded px-2 py-1 text-xs"
                                        placeholder="Lien du produit (https://...)"
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } else if (block.type === 'spacing') {
                return (
                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-on-surface">
                      Taille de l'espacement
                    </label>
                    <div className="space-y-2">
                      {['small', 'medium', 'large', 'extra-large'].map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            handleUpdateBlock(block.id, { size });
                          }}
                          className={`w-full py-2 px-3 rounded-lg font-semibold transition-all text-sm ${
                            ((block.content as Record<string, unknown>)?.size as string) === size
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          {size === 'small' && '↕ Petit (8px)'}
                          {size === 'medium' && '↕ Moyen (16px)'}
                          {size === 'large' && '↕ Grand (24px)'}
                          {size === 'extra-large' && '↕ Très grand (32px)'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              } else if (block.type === 'html') {
                return (
                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-on-surface">
                      Code HTML personnalisé
                    </label>
                    <textarea
                      value={(block.content as Record<string, unknown>)?.html as string || ''}
                      onChange={(e) => {
                        handleUpdateBlock(block.id, { html: e.target.value });
                      }}
                      rows={6}
                      placeholder="<div><p>Mon contenu HTML personnalisé</p></div>"
                      className="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-lg px-3 py-2 font-mono text-xs text-on-surface"
                    />
                    <div className="p-3 bg-surface-container-low rounded-lg">
                      <p className="text-xs text-on-surface-variant font-semibold mb-2">Aperçu HTML:</p>
                      <div 
                        className="bg-white rounded text-xs text-on-surface max-h-32 overflow-auto"
                        dangerouslySetInnerHTML={{
                          __html: (((block.content as Record<string, unknown>)?.html as string) || '<p style="color: #999;">Pas de contenu</p>'),
                        }}
                      />
                    </div>
                  </div>
                );
              }

              // Product block editor (top-level product block)
              if (block.type === 'product') {
                const product = block.content as Record<string, unknown>;
                const currentTitle = (product.title as string) || '';
                const currentDescription = (product.description as string) || '';
                const currentPrice = (product.price as string) || '';
                const currentUrl = (product.url as string) || '';
                const currentImage = (product.image as string) || '';

                return (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-on-surface">Produit</label>
                    <input
                      type="text"
                      value={currentTitle}
                      onChange={(e) => handleUpdateBlock(block.id, { ...product, title: e.target.value })}
                      placeholder="Titre du produit"
                      className="w-full bg-surface-container-lowest ring-1 ring-outline-variant rounded px-3 py-2"
                    />

                    <input
                      type="text"
                      value={currentPrice}
                      onChange={(e) => handleUpdateBlock(block.id, { ...product, price: e.target.value })}
                      placeholder="Prix"
                      className="w-full bg-surface-container-lowest ring-1 ring-outline-variant rounded px-3 py-2"
                    />

                    <textarea
                      value={currentDescription}
                      onChange={(e) => handleUpdateBlock(block.id, { ...product, description: e.target.value })}
                      rows={3}
                      placeholder="Description"
                      className="w-full bg-surface-container-lowest ring-1 ring-outline-variant rounded px-3 py-2"
                    />

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-on-surface-variant">Image du produit</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            triggerImageUpload((uploadedImage) => {
                              handleUpdateBlock(block.id, { ...product, image: uploadedImage.url });
                            })
                          }
                          disabled={isUploadingImage}
                          className="py-2 px-3 bg-primary/10 text-primary rounded"
                        >
                          {isUploadingImage ? 'Envoi...' : 'Insérer une image'}
                        </button>
                      </div>

                      {currentImage && (
                        <div className="p-2 bg-surface-container rounded">
                          <img src={imageUploadService.getThumbnail(currentImage)} alt={currentTitle || 'product'} className="w-full h-24 object-cover rounded" />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-on-surface-variant">Lien du produit</label>
                      <input
                        type="url"
                        value={currentUrl}
                        onChange={(e) => handleUpdateBlock(block.id, { ...product, url: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-surface-container-lowest ring-1 ring-outline-variant rounded px-3 py-2"
                      />
                    </div>
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
