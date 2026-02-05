// Function to convert hours to a human-readable string
export function convertHoursToString(hours: number): string {
  const days = Math.floor(hours / 24); // 1 day = 24 hours
  const weeks = Math.floor(days / 7); // 1 week = 7 days
  const months = Math.floor(days / 30); // Approx. 1 month = 30 days
  const years = Math.floor(days / 365); // Approx. 1 year = 365 days

  // Calculate remaining units
  const remainingDays = days % 7;
  const remainingHours = hours % 24;

  let result = "";

  // Add years if greater than 0
  if (years > 0) {
    result += `${years} year${years > 1 ? "s" : ""}`;
  }

  // Add months if greater than 0
  if (months > 0) {
    if (result) result += ", "; // Add comma if there are previous parts
    result += `${months} month${months > 1 ? "s" : ""}`;
  }

  // Add weeks if greater than 0
  if (weeks > 0) {
    if (result) result += ", "; // Add comma if there are previous parts
    result += `${weeks} week${weeks > 1 ? "s" : ""}`;
  }

  // Add days if greater than 0
  if (remainingDays > 0) {
    if (result) result += ", "; // Add comma if there are previous parts
    result += `${remainingDays} day${remainingDays > 1 ? "s" : ""}`;
  }

  // Add hours if greater than 0 (only if it's the smallest unit left)
  if (remainingHours > 0 || result === "") {
    if (result) result += ", "; // Add comma if there are previous parts
    result += `${remainingHours} hour${remainingHours > 1 ? "s" : ""}`;
  }

  // Return the result as a string
  return result || "0 hours"; // If no time units are found, return "0 hours"
}

export function convertStringToHours(timeString: string | null | undefined): number {
  if (!timeString || typeof timeString !== "string") return 0;

  const timeUnits: Record<string, number> = {
    year: 365 * 24,
    month: 30 * 24,
    week: 7 * 24,
    day: 24,
    hour: 1,
  };

  let totalHours = 0;

  // Match patterns like "2 weeks", "3 days", "5 hours"
  const regex = /(\d+)\s*(year|month|week|day|hour)s?/gi;
  let match;

  while ((match = regex.exec(timeString)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    if (timeUnits[unit]) {
      totalHours += value * timeUnits[unit];
    }
  }

  return totalHours;
}