import type { FC } from 'react';
import type { CampaignBlock, EmailContent, SMSContent } from '@/store/campaign.store';

interface MobilePreviewProps {
  type: 'sms' | 'email';
  emailContent?: EmailContent;
  smsContent?: SMSContent;
}

/**
 * Mobile Preview Component
 * Affiche une prévisualisation réaliste sur téléphone mobile
 */
export const MobilePreview: FC<MobilePreviewProps> = ({
  type,
  emailContent,
  smsContent,
}) => {
  return (
    <div className="sticky top-8 h-fit">
      <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/10 space-y-4">
        <h3 className="font-headline font-bold text-sm text-on-surface">
          Aperçu Mobile
        </h3>

        {/* iPhone Frame */}
        <div className="bg-black rounded-[40px] p-3 shadow-2xl" style={{ aspectRatio: '9/16', maxWidth: '280px', margin: '0 auto' }}>
          {/* Status Bar */}
          <div className="bg-black rounded-[30px] text-white text-[10px] px-4 py-2 flex justify-between items-center mb-1">
            <span>9:41</span>
            <span>●●●●●</span>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-[30px] h-full overflow-hidden flex flex-col">
            {type === 'sms' && smsContent && (
              <div className="flex-1 p-4 flex flex-col justify-end space-y-2 overflow-auto">
                {/* SMS Message */}
                <div className="flex justify-end">
                  <div className="bg-primary text-on-primary rounded-2xl rounded-tr-sm p-3 max-w-[200px] shadow-sm">
                    <p className="text-sm leading-relaxed break-words">
                      {smsContent.message}
                    </p>
                  </div>
                </div>
                {/* Timestamp */}
                <div className="flex justify-end text-[10px] text-on-surface-variant">
                  {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}

            {type === 'email' && emailContent && (
              <div className="flex-1 flex flex-col overflow-auto">
                {/* Email Header */}
                <div className="bg-surface-container p-3 border-b border-outline-variant/20">
                  <p className="text-xs font-bold text-on-surface-variant mb-1">DE: noreply@novasms.ci</p>
                  <p className="text-xs font-bold text-on-surface truncate">
                    {emailContent.subject}
                  </p>
                  {emailContent.preheader && (
                    <p className="text-[10px] text-on-surface-variant truncate">
                      {emailContent.preheader}
                    </p>
                  )}
                </div>

                {/* Email Body */}
                <div className="flex-1 p-3 text-sm overflow-auto space-y-2">
                  {emailContent.blocks.length === 0 ? (
                    <p className="text-on-surface-variant text-xs">Aucun bloc ajouté</p>
                  ) : (
                    emailContent.blocks.map((block: CampaignBlock) => (
                      <div key={block.id}>
                        {block.type === 'text' && (
                          <p className="text-xs text-on-surface leading-relaxed">
                            {typeof block.content.text === 'string' ? block.content.text : 'Texte'}
                          </p>
                        )}
                        {block.type === 'image' && (
                          <div className="w-full h-20 bg-surface-container rounded flex items-center justify-center text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm">image</span>
                          </div>
                        )}
                        {block.type === 'button' && (
                          <button className="w-full px-3 py-2 bg-primary text-on-primary font-bold rounded text-xs">
                            {typeof block.content.text === 'string' ? block.content.text : 'Bouton'}
                          </button>
                        )}
                        {block.type === 'divider' && (
                          <div className="h-px bg-outline-variant my-1" />
                        )}
                        {block.type === 'social' && (
                          <div className="flex gap-2 justify-center py-2">
                            {['facebook', 'instagram', 'tiktok', 'linkedin'].map((network) => {
                              const icons: Record<string, string> = {
                                facebook: 'f',
                                instagram: '📷',
                                tiktok: '♪',
                                linkedin: '🔗',
                              };
                              const url = ((block.content as Record<string, unknown>)?.[network] as string) || '#';
                              return (
                                <a
                                  key={network}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold hover:bg-primary/30"
                                >
                                  {icons[network]}
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Device Info */}
        <div className="pt-3 border-t border-outline-variant/20 text-center">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">
            iPhone 15 · 390×844px
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobilePreview;
