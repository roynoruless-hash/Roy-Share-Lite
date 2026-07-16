import { Timestamp } from "firebase/firestore";

/**
 * Parses any date format (Firestore Timestamp, ISO 8601, local datetime-local string)
 * into a standard JS Date. If the string lacks a timezone, we assume it's Asia/Kolkata.
 */
export function parseInKolkata(input: any): Date {
  if (!input) {
    return new Date();
  }

  // 1. Handle Firestore Timestamp instance
  if (typeof input.toDate === "function") {
    return input.toDate();
  }

  // 2. Handle Firestore Timestamp representation as object { seconds, nanoseconds }
  if (typeof input === "object" && "seconds" in input) {
    return new Date(input.seconds * 1000 + Math.floor((input.nanoseconds || 0) / 1000000));
  }

  // 3. Handle standard Date object
  if (input instanceof Date) {
    return input;
  }

  // 4. Handle numbers (epoch timestamps)
  if (typeof input === "number") {
    return new Date(input);
  }

  // 5. Handle string parsing
  const str = String(input).trim();
  if (!str) {
    return new Date();
  }

  // If the string contains explicit timezone info (e.g. Z or offset +05:30)
  if (str.includes("Z") || /([+-]\d{2}:?\d{2})$/.test(str)) {
    return new Date(str);
  }

  // If it is a local datetime string (e.g. from <input type="datetime-local"> like "2026-07-12T20:00")
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed month
    const day = parseInt(match[3], 10);
    const hours = parseInt(match[4], 10);
    const minutes = parseInt(match[5], 10);
    const seconds = match[6] ? parseInt(match[6], 10) : 0;

    // Create a date assuming it's in UTC
    const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    // Since Asia/Kolkata is +5:30 (330 mins) ahead of UTC, we subtract 330 minutes to get the actual UTC Date
    utcDate.setMinutes(utcDate.getMinutes() - 330);
    return utcDate;
  }

  // Fallback
  return new Date(str);
}

/**
 * Formats a Date/Timestamp into YYYY-MM-DDTHH:mm format in Asia/Kolkata timezone.
 * Useful for populating datetime-local inputs in Admin Manager.
 */
export function formatInKolkata(input: any): string {
  if (!input) return "";
  const d = parseInKolkata(input);
  if (isNaN(d.getTime())) return "";

  // Shift by 5.5 hours to represent Kolkata local time
  const kolkataTime = new Date(d.getTime() + 330 * 60 * 1000);
  const year = kolkataTime.getUTCFullYear();
  const month = String(kolkataTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kolkataTime.getUTCDate()).padStart(2, '0');
  const hours = String(kolkataTime.getUTCHours()).padStart(2, '0');
  const minutes = String(kolkataTime.getUTCMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Formats a Date/Timestamp into a friendly display string in Asia/Kolkata timezone (e.g. "12 Jul 2026, 08:00 PM IST").
 */
export function formatFriendlyKolkata(input: any): string {
  if (!input) return "";
  const d = parseInKolkata(input);
  if (isNaN(d.getTime())) return "";

  const kolkataTime = new Date(d.getTime() + 330 * 60 * 1000);
  const day = kolkataTime.getUTCDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[kolkataTime.getUTCMonth()];
  const year = kolkataTime.getUTCFullYear();
  
  let hours = kolkataTime.getUTCHours();
  const minutes = String(kolkataTime.getUTCMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

  return `${day} ${month} ${year}, ${strTime} IST`;
}

/**
 * Gets the current status of the giveaway based on dates and status field.
 * Adds development logs as requested in Requirement 8.
 */
export function getGiveawayTimingStatus(giveaway: any): { 
  status: "Draft" | "NotStarted" | "Active" | "Ended" | "Paused" | "Drawing" | "Completed";
  message: string;
} {
  if (!giveaway) {
    return { status: "Draft", message: "Giveaway not loaded" };
  }

  const rawStatus = giveaway.status || "Draft";
  let startVal = giveaway.startDate;
  let endVal = giveaway.endDate;
  if (startVal && typeof startVal === "string" && giveaway.startTime) {
    if (startVal.indexOf("T") === -1) {
      startVal = `${startVal}T${giveaway.startTime}`;
    }
  }
  if (endVal && typeof endVal === "string" && giveaway.endTime) {
    if (endVal.indexOf("T") === -1) {
      endVal = `${endVal}T${giveaway.endTime}`;
    }
  }

  const now = new Date();
  const parsedStart = startVal ? parseInKolkata(startVal) : null;
  const parsedEnd = endVal ? parseInKolkata(endVal) : null;

  // Requirement 8: Add console logs during development
  console.log("=== GIVEAWAY TIMING AUDIT ===");
  console.log("Giveaway ID:", giveaway.id || "N/A");
  console.log("Title:", giveaway.title);
  console.log("Current Time (UTC):", now.toISOString());
  console.log("Current Time (Kolkata Local String):", formatFriendlyKolkata(now));
  console.log("Raw Start Date:", startVal);
  console.log("Parsed Start Date (UTC):", parsedStart ? parsedStart.toISOString() : "N/A");
  console.log("Parsed Start Date (Kolkata Local String):", parsedStart ? formatFriendlyKolkata(parsedStart) : "N/A");
  console.log("Raw End Date:", endVal);
  console.log("Parsed End Date (UTC):", parsedEnd ? parsedEnd.toISOString() : "N/A");
  console.log("Parsed End Date (Kolkata Local String):", parsedEnd ? formatFriendlyKolkata(parsedEnd) : "N/A");
  console.log("Firestore Status:", rawStatus);

  if (rawStatus === "Draft") {
    console.log("Result: Draft - This giveaway is currently draft.");
    return { status: "Draft", message: "This giveaway is currently draft." };
  }

  if (rawStatus === "Paused") {
    console.log("Result: Paused - This giveaway is currently paused.");
    return { status: "Paused", message: "This giveaway is currently paused." };
  }

  if (rawStatus === "Drawing Winners" || rawStatus === "Drawing") {
    console.log("Result: Drawing Winners");
    return { status: "Drawing", message: "Winners are currently being drawn." };
  }

  if (rawStatus === "Completed" || giveaway.winnersDrawn) {
    console.log("Result: Completed");
    return { status: "Completed", message: "This giveaway has been completed." };
  }

  // For "Live" status:
  if (rawStatus === "Live" || rawStatus === "Ended") {
    if (parsedStart && now < parsedStart) {
      console.log("Comparison: current < start => Not Started");
      return { status: "NotStarted", message: "This giveaway has not started yet." };
    }
    if (parsedEnd && now > parsedEnd) {
      console.log("Comparison: current > end => Ended");
      return { status: "Ended", message: "Giveaway has ended." };
    }
    console.log("Comparison: start <= current <= end => Active");
    return { status: "Active", message: "" };
  }

  console.log("Result: Draft (Fallback)");
  return { status: "Draft", message: "This giveaway is currently draft." };
}


export function getGiveawayTimeLeft(giveaway: any) {
  let startVal = giveaway?.startDate;
  let endVal = giveaway?.endDate;
  
  if (startVal && typeof startVal === "string" && giveaway.startTime) {
    if (startVal.indexOf("T") === -1) {
      startVal = `${startVal}T${giveaway.startTime}`;
    }
  }
  if (endVal && typeof endVal === "string" && giveaway.endTime) {
    if (endVal.indexOf("T") === -1) {
      endVal = `${endVal}T${giveaway.endTime}`;
    }
  }

  const now = new Date();
  const parsedStart = startVal ? parseInKolkata(startVal) : null;
  const parsedEnd = endVal ? parseInKolkata(endVal) : null;

  let targetDate = parsedEnd;
  let isCountingToStart = false;

  if (parsedStart && now < parsedStart) {
    targetDate = parsedStart;
    isCountingToStart = true;
  }

  if (!targetDate) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, isCountingToStart: false };
  }

  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, isCountingToStart };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isExpired: false,
    isCountingToStart
  };
}
