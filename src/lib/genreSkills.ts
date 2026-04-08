export const genreSkills: Record<string, string> = {
  fiction:      "Lead with story hooks, mystery, or a compelling character moment. Create curiosity gaps. Build community around themes. Tease — never spoil.",
  history:      "Open with a surprising fact or counterintuitive truth. Reference sources credibly. Draw parallels to today. Build intellectual authority.",
  "self-help":  "Start with the reader's pain or aspiration. Give an actionable micro-tip. Use warm second-person voice. End with transformation.",
  business:     "Data-first opening. Thought-leadership framing. Contrast conventional wisdom with the book's core insight. Speak to ROI and outcomes.",
  children:     "Target parents. Focus on learning outcomes, reading-together moments, and childhood development. Warm, inclusive tone.",
  cookbook:     "Recipe tease with ingredient or technique hints. Visual-first writing. Seasonal hooks. Community sharing prompt.",
  poetry:       "Use vivid, precise imagery. Let white space and rhythm show. Post fragments or lines that leave the reader wanting the full collection.",
  academic:     "Lead with the research question. Highlight the gap you fill. Cite evidence. Speak to peers and educated non-specialists alike.",
  other:        "Lead with the most surprising or intriguing insight from the book. Make it specific. Invite the reader's reaction.",
  memoir:       "Open with a vivid, specific memory. Make the personal universal. Invite empathy. Leave an emotional question unanswered.",
  fantasy:      "Build the world in one detail. Tease magic or conflict without over-explaining. Use evocative, sense-rich language.",
  thriller:     "Open mid-action or mid-tension. Short sentences. Clock is ticking. Create dread or anticipation.",
  romance:      "Lead with emotional stakes, not plot. Use sensory detail. Tease chemistry and longing. Community is everything — invite discussion.",
  science:      "Lead with a mind-bending fact or counterintuitive finding. Break down complex ideas into one clear analogy. Inspire curiosity.",
}

export type GenreSkillKey = keyof typeof genreSkills
