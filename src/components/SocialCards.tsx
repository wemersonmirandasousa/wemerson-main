import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSocialCards } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import SocialCardDrawer from '@/components/SocialCardDrawer';
import ChatDocsPopup from '@/components/WeChatPopup';
import NotesPopup from '@/components/NotesPopup';
// ProcessesPopup removed as per instructions
import { sendAudit } from '@/lib/audit';

interface SocialCardsProps {
  visible: boolean;
  onClose: () => void;
}

const SocialCards: React.FC<SocialCardsProps> = ({ visible, onClose }) => {
  const { user } = useAuth();
  const { data: cards = [] } = useQuery({
    queryKey: ['social-cards'],
    queryFn: fetchSocialCards,
  });

  const [chatDocsOpen, setChatDocsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  // processesOpen state removed

  const handleCardClick = (card: any) => {
    const usuario = user?.email || 'Visitante';

    if (card.icon === 'chatdocs' || card.icon === 'wechat' || card.url === '#wechat' || card.url === '#chatdocs') {
      setChatDocsOpen(true);
      onClose();
      sendAudit('acesso_card', `Card "${card.titulo}" (ChatDocs) acessado`, usuario);
    } else if (card.icon === 'notes' || card.url === '#notes') {
      setNotesOpen(true);
      onClose();
      sendAudit('acesso_card', `Card "${card.titulo}" (Notas) acessado`, usuario);
    } else if (card.url) {

      window.open(card.url, '_blank', 'noopener,noreferrer');
      onClose();
      sendAudit('acesso_card', `Card "${card.titulo}" acessado - URL: ${card.url}`, usuario);
    }
  };

  return (
    <>
      {visible && <SocialCardDrawer cards={cards} onCardClick={handleCardClick} onClose={onClose} />}
      <ChatDocsPopup open={chatDocsOpen} onOpenChange={setChatDocsOpen} />
      <NotesPopup open={notesOpen} onOpenChange={setNotesOpen} />
      {/* ProcessesPopup removed */}
    </>
  );
};

export default SocialCards;
