/* =====================================================================
   DEGUM LANDLORD — ACCESS CONTROL  (the ONLY file you edit to manage customers)

   One shared link for all landlords. Each landlord types their own private ACCESS CODE once
   and the app then follows THEIR entry below. Entries are keyed by a scrambled (hashed) version
   of the code, so reading this file does not reveal anybody's code.

   NEW LANDLORD ........ open your PRIVATE copy of make-code.html (it is NOT on the website), tap Generate, paste the entry it makes
                         below, and send that landlord the code. Each code works on 2 PHONES ONLY:
                         put the two Device IDs (shown on the phone's lock screen) in devices: ["ID1","ID2"] (only you ever see the code)
   START TRIAL ......... mode "TRIAL",  trialStart / trialEnd
   ACTIVATE (paid) ..... mode "ACTIVE", subscriptionStart / subscriptionEnd
   EXTEND .............. change subscriptionEnd (or trialEnd) to the new date
   LOCK ................ mode "LOCKED"      UNLOCK ... set mode back to TRIAL or ACTIVE
   Dates are YYYY-MM-DD. The landlord has access THROUGH the end date (inclusive):
                         a 14-day trial starting 20 Oct ends 2 Nov. The private generator calculates this.
   After editing: commit on GitHub, Netlify deploys in about a minute, done.

   DEV NOTE (code only): this is client-side access control for pilot customers. It is not
   server-enforced and is not tamper-proof, and this file is readable by anyone who opens the
   site, so keep only first names / labels here (no phone numbers). A later backend version
   should validate on a server.
   ===================================================================== */
const DEGUM_APP_VERSION = "3.1.0";     // optional: raise (e.g. 1.0.1) when you deploy a change
const DEGUM_ACTIVE_CUSTOMER = "";      // leave EMPTY for the shared link (landlords enter their code)

const DEGUM_MAX_DEVICES = 2;                 // a code works on at most 2 phones
const DEGUM_REQUIRE_DEVICE_REGISTRATION = true; // false = skip the phone check (testing only)

const DEGUM_CONTACT = { whatsapp: "254768675139", phone: "0768675139", email: "" };  // shown on the restricted screen

const DEGUM_CUSTOMERS = {
  "153fe8faffd9fac40fc009f651068a36b264951936107de7facf89c7ca4c31bb": {
    name: "Owner test",
    devices: ["1DBJ-WQ4Z"],                   // up to 2 Device IDs, e.g. ["K3F9-2QAB", "7HDM-XP4C"]
    mode: "TRIAL",                 // TRIAL | ACTIVE | LOCKED
    trialStart: "2026-10-06",
    trialEnd: "2026-10-20",        // 14-day trial, then the app locks
    subscriptionStart: null,
    subscriptionEnd: null
  },
     "80bd6dc3fee6c68c98dc58c3fada0b9e6ceedc65e8d47099abfb860db5ad96cb": {
    name: "Peter Muchoki",
    devices: ["4OJT-7IUO"],
    mode: "TRIAL",
    trialStart: "2026-10-08",
    trialEnd: "2026-10-22",
    subscriptionStart: null,
    subscriptionEnd: null
  },
     "807a7974103c24571fd200b80b65d7b9cf9f5ca5ddf6ee46065eda125c9e5bc2": {
    name: "Julia",
    devices: ["1FHE-DZBB"],
    mode: "Trial",
    trialStart: "2026-10-07",
    trialEnd: "2026-10-21",
    subscriptionStart: null,
    subscriptionEnd: null
  },

  /* Founding church testers: exactly 35 calendar days, 13 Oct 2026 to 16 Nov 2026 inclusive. */
  "cd2f2e714291f4bd9470b7371053590dc1841026e5d3e8328089a539924b834c": {
    name: "Church tester 1",
    devices: ["V4F5-1T0F"],
    mode: "TRIAL",
    trialStart: "2026-10-13",
    trialEnd: "2026-11-16",
    subscriptionStart: null,
    subscriptionEnd: null
  },
  "73dd5907d0bcc489223c2f04705c89785f560c059df8e23228a9a15f8d5f2c51": {
    name: "Church tester 2",
    devices: [],
    mode: "TRIAL",
    trialStart: "2026-10-13",
    trialEnd: "2026-11-16",
    subscriptionStart: null,
    subscriptionEnd: null
  },

  /* Ordinary customers (dates kept exactly as supplied). */
  "5b9c4111963bccba9386440f57e28e3ce007d76e8e470bc9b0061f998ea50495": {
    name: "Landlord 4",
    devices: [],
    mode: "TRIAL",
    trialStart: "2026-10-11",
    trialEnd: "2026-10-25",
    subscriptionStart: null,
    subscriptionEnd: null
  },
     "6313476b7aafe5e343f4f67dbf6e005432f5d9a80b6dbdcc8d33fb8346f9563a": {
    name: "Owner",
    devices: ["4TT7-1MES"],
    mode: "TRIAL",
    trialStart: "2026-10-12",
    trialEnd: "2026-11-15",
    subscriptionStart: null,
    subscriptionEnd: null
  },
  "67cc5ec37bcea3bf3e256b5529d1c7cc1cb28963b38624eadb80a00b0344cce7": {
    name: "Landlord 5",
    devices: [],
    mode: "TRIAL",
    trialStart: "2026-10-11",
    trialEnd: "2026-10-25",
    subscriptionStart: null,
    subscriptionEnd: null
  }
};

/* Works out the access state for a given day (YYYY-MM-DD). Fails closed on bad data. */
function degumAccessStatus(todayISO, code) {
  const id = String(DEGUM_ACTIVE_CUSTOMER || code || "").trim().toLowerCase();
  const c = DEGUM_CUSTOMERS[id];
  const r = { customerId: id, name: c && c.name, state: "EXPIRED", blocked: true, daysLeft: null, endDate: null, needsCode: false, wasTrial: false };
  if (!c) { if (DEGUM_ACTIVE_CUSTOMER) r.state = "LOCKED"; else { r.state = "NEEDS_CODE"; r.needsCode = true; } return r; }
  const mode = String(c.mode || "").toUpperCase();
  r.wasTrial = mode === "TRIAL";
  const diff = (a, b) => Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 86400000);
  if (mode === "LOCKED") { r.state = "LOCKED"; return r; }
  const end = mode === "ACTIVE" ? c.subscriptionEnd : mode === "TRIAL" ? c.trialEnd : null;
  if (!end || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return r;
  r.endDate = end;
  const left = diff(todayISO, end);
  if (left >= 0) { r.state = mode; r.blocked = false; r.daysLeft = left; }
  return r;
}
