import React from 'react';
import type { Tool } from '@/types/tool';

interface StatsCardsProps {
  tools: Tool[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ tools }) => {
  // Stats cards are intentionally hidden — data is shown via CategoryCards
  return null;
};

export default StatsCards;
