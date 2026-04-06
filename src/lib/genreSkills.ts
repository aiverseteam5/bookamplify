export const genreSkills = {
  fiction: "Lead with story hooks, mystery, or a compelling character moment. Create curiosity gaps. Build community around themes.",
  history: "Open with a surprising fact or counterintuitive truth. Reference sources credibly. Build intellectual authority.",  
  'self-help': "Start with the reader's pain or aspiration. Give an actionable micro-tip. Warm second-person voice. End with transformation.",
  business: "Data-first opening. Thought leadership framing. Contrast conventional wisdom with the book's insight.",
  children: "Target parents. Focus on learning outcomes and reading-together moments. Warm community tone.",
  cookbook: "Recipe tease with ingredient hints. Visual-first. Seasonal hooks. Community sharing prompt."
}

export type GenreSkillKey = keyof typeof genreSkills
