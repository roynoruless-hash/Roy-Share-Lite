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
 * Create one function: getGiveawayStatus(giveaway)
 * Return only:
 * - LIVE
 * - ENDED
 * 
 * Logic:
 * if(now < endTimestamp)
 *     LIVE
 * else
 *     ENDED
 */
export function getGiveawayStatus(giveaway: any): "LIVE" | "ENDED" {
  if (!giveaway) {
    console.log("[getGiveawayStatus] No giveaway data provided => ENDED");
    return "ENDED";
  }

  let endVal = giveaway.endDate;
  if (!endVal && giveaway.endTime) {
    endVal = giveaway.endTime;
  }

  if (!endVal) {
    if (giveaway.status === "Live" || giveaway.status === "LIVE") {
      console.log("[getGiveawayStatus] No endDate or endTime but board status is Live => LIVE");
      return "LIVE";
    }
    console.log("[getGiveawayStatus] No endDate or endTime found on giveaway => ENDED");
    return "ENDED";
  }

  // Handle case where we have separate endDate and endTime strings without a T
  if (typeof endVal === "string" && giveaway.endDate && giveaway.endTime && endVal.indexOf("T") === -1) {
    endVal = `${endVal}T${giveaway.endTime}`;
  }

  const now = new Date();
  const parsedEnd = parseInKolkata(endVal);

  console.log("[getGiveawayStatus] Evaluating giveaway state:", {
    id: giveaway.id || "N/A",
    title: giveaway.title,
    now: now.toISOString(),
    parsedEnd: parsedEnd.toISOString(),
    currentTimeFriendly: formatFriendlyKolkata(now),
    endTimeFriendly: formatFriendlyKolkata(parsedEnd),
  });

  if (now.getTime() < parsedEnd.getTime()) {
    console.log("[getGiveawayStatus] Outcome: LIVE");
    return "LIVE";
  } else {
    console.log("[getGiveawayStatus] Outcome: ENDED");
    return "ENDED";
  }
}

/**
 * Gets the current status of the giveaway based on getGiveawayStatus helper.
 */
export function getGiveawayTimingStatus(giveaway: any): { 
  status: "Draft" | "Active" | "Ended" | "Paused" | "Drawing" | "Completed";
  message: string;
} {
  if (!giveaway) {
    return { status: "Draft", message: "Giveaway not loaded" };
  }

  const status = getGiveawayStatus(giveaway);
  if (status === "LIVE") {
    return { status: "Active", message: "" };
  } else {
    return { status: "Ended", message: "Giveaway has ended." };
  }
}

export function getGiveawayTimeLeft(giveaway: any) {
  let endVal = giveaway?.endDate;
  if (!endVal && giveaway?.endTime) {
    endVal = giveaway.endTime;
  }
  
  if (endVal && typeof endVal === "string" && giveaway?.endDate && giveaway?.endTime) {
    if (endVal.indexOf("T") === -1) {
      endVal = `${endVal}T${giveaway.endTime}`;
    }
  }

  const now = new Date();
  const parsedEnd = endVal ? parseInKolkata(endVal) : null;
  const targetDate = parsedEnd;

  if (!targetDate) {
    const isLiveManual = giveaway?.status === "Live" || giveaway?.status === "LIVE";
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: !isLiveManual, isIndefinite: true };
  }

  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isExpired: false
  };
}
