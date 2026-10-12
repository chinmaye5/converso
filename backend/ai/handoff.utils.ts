export function customerRequestsHuman(question: string): boolean {
  const normalized = question.toLowerCase().trim();

  const patterns = [
    /\b(speak|talk|connect|transfer|escalate)\b.{0,40}\b(human|person|agent|representative|support|staff)\b/,
    /\b(human|live|real)\s+(support|agent|person)\b/,
    /\b(customer service|support agent|human agent)\b/,
    /\b(speak|talk|connect|transfer)\s+to\s+(someone|a person|an agent)\b/,
    /\b(real person|actual person)\b/,
  ];

  return patterns.some((pattern) => pattern.test(normalized));
}
