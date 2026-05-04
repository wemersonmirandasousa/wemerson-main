// GPT name → link autocomplete mappings

export interface GptLink {
  name: string;
  url: string;
  category: 'prompt_builder' | 'knowledge_base';
}

export const GPT_LINKS: GptLink[] = [
  { name: 'Gandalf (GPT Wizard)', url: 'https://chatgpt.com/g/g-6897aa8af8148191b955d630b30c8ca0-gpt-wizard-by-rdd-v7-00', category: 'prompt_builder' },
  { name: 'Lavoisier (Research)', url: 'https://chatgpt.com/g/g-67c985c3b740819186fad9a96975b78b-research-prompt-builder-by-rdd-v2-0', category: 'prompt_builder' },
  { name: 'Edison (PRD Builder)', url: 'https://chatgpt.com/g/g-691a24e3a6cc8191a56e1050471e8559-prd-builder-by-rdd-v2-0', category: 'prompt_builder' },
  { name: 'Heisenberg (Reasoning v2.1)', url: 'https://chatgpt.com/g/g-6897bcad8ae081918872f9c22798eb46-reasoning-prompt-builder-v2-1-by-rdd', category: 'prompt_builder' },
  { name: 'Reasoning v1.05', url: 'https://chatgpt.com/g/g-679787d4cb1081919c21e3f6b59b2431-reasoning-prompt-builder-v1-05-by-rdd', category: 'prompt_builder' },
  { name: 'Yoda (AOT v2.0)', url: 'https://chatgpt.com/g/g-693e16cd88448191bfeee2c5abaabd90-aot-prompt-builder-2-0-by-rdd', category: 'prompt_builder' },
  { name: 'Neo (Agent 2.0)', url: 'https://chatgpt.com/g/g-6930784096a481918bbafa701c5538e1-agent-prompt-builder-2-0-by-rdd', category: 'prompt_builder' },
  { name: 'Agent Prompt Builder', url: 'https://chatgpt.com/g/g-684724131c0081918f3669c05b7b48c4-agent-prompt-builder-by-rdd', category: 'prompt_builder' },
  { name: 'Project Wizard v1.7', url: 'https://chatgpt.com/g/g-6769561a7d8c81918594793965dc5b89-project-wizard-by-rdd-v1-7', category: 'prompt_builder' },
  { name: 'Skill Builder (Neo)', url: 'https://chatgpt.com/g/g-6995ebff236c81919178e07e612d8174-skill-builder-by-rdd-v1-0', category: 'prompt_builder' },
  { name: 'Prompt GPT Builder', url: 'https://chatgpt.com/g/g-68eeb27007988191bb6c8f226fd81c39-prompt-gpt-builder-by-rdd', category: 'prompt_builder' },
  { name: 'Stakes-First v1.5', url: 'https://chatgpt.com/g/g-69501a26c1f08191b0e7546db007f8f3-stakes-first-prompt-builder-by-rdd-v1-5', category: 'prompt_builder' },
  { name: 'Think Tool (Beta)', url: 'https://chatgpt.com/g/g-68ecd810de248191bb0c2d2a8c7303d0-think-tool-prompt-builder-by-rdd-beta', category: 'prompt_builder' },
  { name: 'Image Generation Prompt Builder', url: 'https://chatgpt.com/g/g-67c3a2403fd881918f8227d77779bc59-image-generation-prompt-builder-by-rdd', category: 'prompt_builder' },
  { name: 'Visual Prompt Builder 2.1', url: 'https://chatgpt.com/g/g-67fc4fd24e708191b76934573e5b1005-visual-prompt-builder-for-image-2-1-by-rdd', category: 'prompt_builder' },
  { name: 'Darwin (Lovable Plan Builder)', url: 'https://chatgpt.com/g/g-6980edae294c8191914df9b7ef6f38f7-lovable-plan-builder-darwin-by-rdd', category: 'prompt_builder' },
];

export const KNOWLEDGE_BASE_LINKS: GptLink[] = [
  { name: 'Deadpool (Parsing & Chunking)', url: 'https://chatgpt.com/g/g-69692123f1648191acb9667b261f20f9-parsing-and-chunking-optimizer-for-rag-by-rdd', category: 'knowledge_base' },
  { name: 'Logan (Semantic Map)', url: 'https://chatgpt.com/g/g-69692b3440588191b72e11782f2e2290-semantic-map-for-rag-by-rdd', category: 'knowledge_base' },
];

export function matchGptByPrefix(input: string, links: GptLink[] = GPT_LINKS): GptLink[] {
  if (!input || input.length < 2) return [];
  const lower = input.toLowerCase().trim();
  // Match any part of the name, not just prefix
  return links.filter(l => l.name.toLowerCase().includes(lower));
}

export const GENERATOR_OPTIONS = ['Base 44', 'Lovable'] as const;
