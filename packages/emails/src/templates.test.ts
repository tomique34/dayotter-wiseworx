import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type BookingEmailData,
  bookingCancellation,
  bookingConfirmation,
  bookingReminder,
  bookingRescheduled,
  brandName,
  weeklyDigest,
} from "./templates";

const base: BookingEmailData = {
  eventTitle: "Konzultácia",
  start: new Date("2026-11-03T14:00:00Z"),
  end: new Date("2026-11-03T14:45:00Z"),
  timezone: "Europe/Bratislava",
  hostName: "Tomáš Vince",
  attendeeName: "Jana Nováková",
  manageUrl: "https://app.example.com/booking/abc",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("brandName", () => {
  it("defaults to DayOtter", () => {
    expect(brandName()).toBe("DayOtter");
  });

  it("uses EMAIL_BRAND_NAME and strips markup characters", () => {
    vi.stubEnv("EMAIL_BRAND_NAME", '  Meeting <b>"Manager"</b> ');
    expect(brandName()).toBe("Meeting bManager/b");
  });

  it("falls back when the env value is blank", () => {
    vi.stubEnv("EMAIL_BRAND_NAME", "   ");
    expect(brandName()).toBe("DayOtter");
  });

  it("rebrands the shared footer of other emails", () => {
    vi.stubEnv("EMAIL_BRAND_NAME", "Meeting Manager");
    const r = weeklyDigest({
      name: "Tomáš",
      meetings: 0,
      hours: 0,
      focusHours: 0,
      upcoming: 0,
      manageUrl: "https://x.test",
      unsubscribeUrl: "https://x.test/u",
    });
    expect(r.html).toContain("Sent by Meeting Manager");
    expect(r.html).not.toContain("DayOtter");
  });
});

describe("bookingConfirmation", () => {
  it("renders Slovak copy with local time and duration", () => {
    const r = bookingConfirmation(base);
    expect(r.subject).toBe("Potvrdené: Konzultácia, 3. 11. o 15:00");
    expect(r.text).toContain("Vaša rezervácia je potvrdená.");
    expect(r.text).toContain("Kedy: Utorok 3. novembra 2026 o 15:00");
    expect(r.text).toContain("Trvanie: 45 min");
    expect(r.html).toContain("Odoslané cez DayOtter");
  });

  it("shows a provider-named join button for Google Meet and Teams", () => {
    const meet = bookingConfirmation({
      ...base,
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    });
    expect(meet.html).toContain("Pripojiť sa cez Google Meet");
    expect(meet.text).toContain("Pripojiť sa: https://meet.google.com/abc-defg-hij");

    const teams = bookingConfirmation({
      ...base,
      meetingUrl: "https://teams.microsoft.com/l/meetup-join/xyz",
    });
    expect(teams.html).toContain("Pripojiť sa cez Microsoft Teams");
  });

  it("never renders a non-http meeting URL as a link", () => {
    const r = bookingConfirmation({ ...base, meetingUrl: "javascript:alert(1)" });
    expect(r.html).not.toContain("javascript:");
    expect(r.html).not.toContain("Pripojiť sa");
  });

  it("applies the brand colour with readable button text", () => {
    const dark = bookingConfirmation({
      ...base,
      brandColor: "#0f766e",
      meetingUrl: "https://meet.google.com/x",
    });
    expect(dark.html).toContain("background:#0f766e;color:#ffffff");

    const light = bookingConfirmation({
      ...base,
      brandColor: "#fde047",
      meetingUrl: "https://meet.google.com/x",
    });
    expect(light.html).toContain("background:#fde047;color:#0c0e14");

    const bad = bookingConfirmation({ ...base, brandColor: "red;background:url(x)" });
    expect(bad.html).not.toContain("url(x)");
    expect(bad.html).toContain("#4f46e5");
  });

  it("includes the escaped host message for the attendee only", () => {
    const msg = "Teším sa!\n<script>x</script>";
    const attendee = bookingConfirmation({ ...base, hostMessage: msg });
    expect(attendee.html).toContain("Správa od hostiteľa");
    expect(attendee.html).toContain("Teším sa!<br>&lt;script&gt;");
    expect(attendee.html).not.toContain("<script>");

    const host = bookingConfirmation({ ...base, hostMessage: msg, recipient: "host" });
    expect(host.html).not.toContain("Teším sa");
    expect(host.subject).toBe("Nová rezervácia: Konzultácia, Jana Nováková, 3. 11. o 15:00");
    expect(host.text).toContain("Účastník: Jana Nováková");
  });

  it("drops the host row when the host has no name", () => {
    const r = bookingConfirmation({ ...base, hostName: "" });
    expect(r.text).not.toContain("Hostiteľ");
  });

  it("uses EMAIL_BRAND_NAME in the footer", () => {
    vi.stubEnv("EMAIL_BRAND_NAME", "Meeting Manager");
    const r = bookingConfirmation(base);
    expect(r.html).toContain("Odoslané cez Meeting Manager");
    expect(r.text).toContain("Odoslané cez Meeting Manager");
  });
});

describe("bookingReminder", () => {
  it("renders Slovak copy with the lead label, join button and brand colour", () => {
    vi.stubEnv("EMAIL_BRAND_NAME", "Meeting Manager");
    const r = bookingReminder({
      ...base,
      leadLabel: "zajtra",
      brandColor: "#0f766e",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    });
    expect(r.subject).toBe("Pripomienka: Konzultácia, zajtra");
    expect(r.text).toContain("stretnutie začína zajtra");
    expect(r.html).toContain("Stretnutie začína zajtra.");
    expect(r.html).toContain("Pripojiť sa cez Google Meet");
    expect(r.html).toContain("background:#0f766e");
    expect(r.html).toContain("Odoslané cez Meeting Manager");
    expect(r.html).not.toContain("Reminder");
  });
});

describe("bookingRescheduled", () => {
  it("shows the new time, the struck-through old time and the reason", () => {
    const r = bookingRescheduled({
      ...base,
      previousStart: new Date("2026-11-02T09:00:00Z"),
      reason: "Kolízia s <iným> stretnutím",
      meetingUrl: "https://teams.microsoft.com/l/meetup-join/xyz",
    });
    expect(r.subject).toBe("Presunuté: Konzultácia, 3. 11. o 15:00");
    expect(r.text).toContain("Nový termín: Utorok 3. novembra 2026 o 15:00");
    expect(r.text).toContain("Pôvodne: Pondelok 2. novembra 2026 o 10:00");
    expect(r.html).toContain("text-decoration:line-through");
    expect(r.html).toContain("Dôvod presunu");
    expect(r.html).toContain("&lt;iným&gt;");
    expect(r.html).toContain("Pripojiť sa cez Microsoft Teams");
  });

  it("frames the host copy around the attendee and omits the old time when unknown", () => {
    const r = bookingRescheduled({ ...base, recipient: "host" });
    expect(r.text).toContain("Účastník: Jana Nováková");
    expect(r.text).not.toContain("Pôvodne");
  });
});

describe("bookingCancellation", () => {
  it("renders Slovak copy with the cancelled time and reason, without a join button", () => {
    const r = bookingCancellation({
      ...base,
      reason: "Ochorenie",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    });
    expect(r.subject).toBe("Zrušené: Konzultácia, 3. 11. o 15:00");
    expect(r.text).toContain("Táto rezervácia bola zrušená.");
    expect(r.text).toContain("Termín: Utorok 3. novembra 2026 o 15:00");
    expect(r.html).toContain("Dôvod zrušenia");
    expect(r.html).toContain("Ochorenie");
    expect(r.html).not.toContain("Pripojiť sa");
    expect(r.html).toContain("Rezervácia zrušená");
  });
});
