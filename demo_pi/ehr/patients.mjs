// The synthetic cohort: Rosa plus 99 look-alikes, built from a fixed seed so there is no data file to commit. Every
// patient has HFrEF; half are on an evidence-based beta blocker and half are not, for a reason the chart documents
// (or doesn't). Each patient's gold label comes from how the chart was written, so the annotation is the scenario.
//
//   PATIENTS[i]  { id, name, sex, age, ..., conditions, meds, vitals, labs, allergies, notes, gold: {status, given, gap, why},
//                  coverage, immunizations, family, social, appointments }   (the last five play no part in the answer)
//
// ehr/fhir.mjs turns a patient into FHIR R4 resources; nothing else reads these fields directly.

export const TODAY = "2026-11-02";

export const STATUSES = {
  on_treatment: "On a beta blocker",
  gap: "Care gap",
  documented_reason: "Documented reason",
};

// Where the deciding evidence lives, for the cohort breakdown.
export const WHERE = { meds: "medications", note: "a note", diagnoses: "diagnoses", vitals: "vital signs", allergies: "allergies" };

// ---- seeded randomness ----

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rng = mulberry32(2026);
const int = (a, b) => a + Math.floor(rng() * (b - a + 1));
const pick = (xs) => xs[Math.floor(rng() * xs.length)];
const chance = (p) => rng() < p;
function shuffle(xs) { for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; } return xs; }

const day = (iso, delta) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + delta); return d.toISOString().slice(0, 10); };
const ago = (days) => day(TODAY, -days);

// ---- vocabulary (RxNorm ingredient codes, SNOMED CT and ICD-10-CM for diagnoses) ----

const DRUG = {
  carvedilol: { rxnorm: "20352", name: "carvedilol" },
  metoprolol_succinate: { rxnorm: "221124", name: "metoprolol succinate" },
  metoprolol_tartrate: { rxnorm: "49737", name: "metoprolol tartrate" },
  bisoprolol: { rxnorm: "19484", name: "bisoprolol" },
  atenolol: { rxnorm: "1202", name: "atenolol" },
  sacubitril_valsartan: { rxnorm: "1656339", name: "sacubitril / valsartan" },
  lisinopril: { rxnorm: "29046", name: "lisinopril" },
  losartan: { rxnorm: "52175", name: "losartan" },
  spironolactone: { rxnorm: "9997", name: "spironolactone" },
  dapagliflozin: { rxnorm: "1488564", name: "dapagliflozin" },
  empagliflozin: { rxnorm: "1545653", name: "empagliflozin" },
  furosemide: { rxnorm: "4603", name: "furosemide" },
  torsemide: { rxnorm: "38413", name: "torsemide" },
  atorvastatin: { rxnorm: "83367", name: "atorvastatin" },
  metformin: { rxnorm: "6809", name: "metformin" },
  apixaban: { rxnorm: "1364430", name: "apixaban" },
  albuterol: { rxnorm: "435", name: "albuterol" },
  fluticasone_salmeterol: { rxnorm: "284635", name: "fluticasone / salmeterol" },
};

const DX = {
  hfref: { snomed: "703272007", icd10: "I50.22", text: "Heart failure with reduced ejection fraction" },
  htn: { snomed: "38341003", icd10: "I10", text: "Essential hypertension" },
  t2dm: { snomed: "44054006", icd10: "E11.9", text: "Type 2 diabetes mellitus" },
  ckd3a: { snomed: "700378005", icd10: "N18.31", text: "Chronic kidney disease stage 3a" },
  hld: { snomed: "55822004", icd10: "E78.5", text: "Hyperlipidemia" },
  osa: { snomed: "78275009", icd10: "G47.33", text: "Obstructive sleep apnea" },
  obesity: { snomed: "414916001", icd10: "E66.9", text: "Obesity" },
  cad: { snomed: "53741008", icd10: "I25.10", text: "Coronary artery disease" },
  mobitz2: { snomed: "28189009", icd10: "I44.1", text: "Second-degree atrioventricular block, Mobitz type II" },
  chb: { snomed: "27885002", icd10: "I44.2", text: "Complete atrioventricular block" },
  pacer: { snomed: "441509002", icd10: "Z95.0", text: "Cardiac pacemaker in situ" },
  hypotension: { snomed: "45007003", icd10: "I95.9", text: "Hypotension" },
  asthma_severe: { snomed: "195967001", icd10: "J45.50", text: "Severe persistent asthma" },
  asthma_child: { snomed: "195967001", icd10: "J45.909", text: "Asthma (childhood)" },
};

const FIRST_F = ["Maria", "Linda", "Patricia", "Barbara", "Elizabeth", "Jennifer", "Susan", "Margaret", "Dorothy", "Lisa", "Nancy", "Karen", "Betty", "Helen", "Sandra", "Donna", "Carol", "Ruth", "Sharon", "Michelle", "Laura", "Grace", "Deborah", "Joyce", "Gloria", "Evelyn", "Mei", "Aisha", "Priya", "Yolanda"];
const FIRST_M = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Daniel", "Matthew", "Anthony", "Donald", "Mark", "Paul", "Steven", "Andrew", "Kenneth", "George", "Edward", "Ronald", "Kevin", "Raymond", "Frank", "Samuel", "Wei", "Omar", "Rajesh", "Luis"];
const LAST = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Clark", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Green", "Baker", "Adams", "Nelson", "Hill", "Campbell", "Mitchell", "Roberts", "Carter", "Phillips", "Evans", "Turner", "Torres", "Parker", "Collins", "Edwards", "Stewart", "Morris", "Nguyen", "Murphy", "Rivera", "Cook", "Rogers", "Patel", "Kim", "Chen", "Okafor", "Shah"];
const STREETS = ["Elm St", "Oak Ave", "Maple Dr", "Cedar Ln", "Park Rd", "Church St", "Whitney Ave", "Chapel St", "Orange St", "Prospect St"];
const AUTHORS = { hf: ["Dr. A. Patel, Cardiology", "Dr. M. Chen, Cardiology", "Dr. S. Okafor, Heart Failure"], pcp: ["Dr. L. Rivera, Internal Medicine", "Dr. J. Kim, Family Medicine"], ep: ["Dr. R. Shah, Electrophysiology"], rn: ["K. Murphy, RN", "T. Evans, RN"], pulm: ["Dr. E. Nelson, Pulmonology"] };

// ---- one patient ----

const SIG = { carvedilol: [["3.125 mg", "twice daily"], ["6.25 mg", "twice daily"], ["12.5 mg", "twice daily"], ["25 mg", "twice daily"]], metoprolol_succinate: [["25 mg", "once daily"], ["50 mg", "once daily"], ["100 mg", "once daily"]], bisoprolol: [["2.5 mg", "once daily"], ["5 mg", "once daily"]], metoprolol_tartrate: [["25 mg", "twice daily"], ["50 mg", "twice daily"]], atenolol: [["25 mg", "once daily"], ["50 mg", "once daily"]] };

function med(key, dose, freq, { status = "active", start, end, brand, form } = {}) {
  const d = DRUG[key];
  const tab = form || (key === "metoprolol_succinate" ? "extended-release oral tablet" : "oral tablet");
  return { key, rxnorm: d.rxnorm, text: `${brand ? `${brand} (${d.name})` : d.name} ${dose} ${tab}`, sig: `${dose} by mouth ${freq}`, status, start, end };
}
const cond = (key, onset, { status = "active", category = "problem-list-item", text } = {}) => ({ ...DX[key], text: text || DX[key].text, onset, status, category });

function person(i, sex, name) {
  const age = int(54, 88);
  const born = day(ago(age * 365 + int(0, 360)), 0);
  return {
    id: `p${String(i).padStart(3, "0")}`, index: i, name, sex, age, dob: born,
    mrn: String(40_000_000 + int(100_000, 999_999)),
    address: `${int(10, 980)} ${pick(STREETS)}, New Haven, CT 065${int(10, 19)}`, phone: `203-555-${String(int(100, 9999)).padStart(4, "0")}`,
  };
}

const she = (p) => (p.sex === "female" ? { s: "she", o: "her", p: "her", S: "She", man: "woman" } : { s: "he", o: "him", p: "his", S: "He", man: "man" });

function basePatient(i) {
  const sex = chance(0.5) ? "female" : "male";
  const name = `${pick(sex === "female" ? FIRST_F : FIRST_M)} ${pick(LAST)}`;
  const p = person(i, sex, name);
  p.ef = int(20, 38);
  p.hfSince = ago(int(400, 2500));
  const lastVisit = int(7, 40);
  p.visits = [lastVisit, lastVisit + int(80, 110), lastVisit + int(170, 220)].map(ago);   // newest first
  p.conditions = [cond("hfref", p.hfSince), ...shuffle(["htn", "t2dm", "ckd3a", "hld", "osa", "obesity", "cad"]).slice(0, int(2, 4)).map((k) => cond(k, ago(int(800, 5000))))];
  const ras = pick([["sacubitril_valsartan", "49/51 mg", "twice daily"], ["sacubitril_valsartan", "97/103 mg", "twice daily"], ["lisinopril", "10 mg", "once daily"], ["losartan", "50 mg", "once daily"]]);
  p.meds = [med(...ras, { start: ago(int(200, 900)) })];
  if (chance(0.65)) p.meds.push(med("spironolactone", "25 mg", "once daily", { start: ago(int(150, 700)) }));
  if (chance(0.65)) p.meds.push(med(pick(["dapagliflozin", "empagliflozin"]), "10 mg", "once daily", { start: ago(int(100, 600)) }));
  p.meds.push(med(...pick([["furosemide", "40 mg", "once daily"], ["furosemide", "20 mg", "once daily"], ["torsemide", "20 mg", "once daily"]]), { start: ago(int(300, 1200)) }));
  p.meds.push(med("atorvastatin", pick(["20 mg", "40 mg"]), "once daily", { start: ago(int(400, 2000)) }));
  if (p.conditions.some((c) => c.icd10 === "E11.9")) p.meds.push(med("metformin", "500 mg", "twice daily", { start: ago(int(400, 2000)) }));
  p.vitals = p.visits.map((date) => ({ date, hr: int(62, 86), sbp: int(104, 138), dbp: int(60, 84) }));
  p.labs = [{ date: p.visits[0], loinc: "2823-3", name: "Potassium", value: (int(38, 50) / 10).toFixed(1), unit: "mmol/L" },
    { date: p.visits[0], loinc: "2160-0", name: "Creatinine", value: (int(80, 160) / 100).toFixed(2), unit: "mg/dL" },
    { date: p.visits[0], loinc: "33762-6", name: "NT-proBNP", value: String(int(300, 4200)), unit: "pg/mL" }];
  p.allergies = chance(0.3) ? [{ substance: "penicillin", snomed: "764146007", type: "allergy", reaction: "rash", date: ago(int(2000, 8000)) }] : [];
  p.notes = [];
  p.gold = null;
  return p;
}

// The latest heart-failure clinic note; `bb` is its beta blocker sentence (or none).
function hfNote(p, bb, { extra = "" } = {}) {
  const w = she(p), v = p.vitals[0];
  const others = p.meds.filter((m) => ["sacubitril_valsartan", "lisinopril", "losartan", "spironolactone", "dapagliflozin", "empagliflozin"].includes(m.key) && m.status === "active").map((m) => DRUG[m.key].name);
  return {
    date: p.visits[0], type: "progress", author: pick(AUTHORS.hf), title: "Heart failure clinic follow-up",
    text: `${p.age}-year-old ${w.man} with HFrEF (LVEF ${p.ef}%), NYHA class ${pick(["I", "II", "II"])}. ${w.S} feels ${pick(["well", "about the same", "a little more tired than usual"])}; no orthopnea, PND or leg swelling.${extra ? ` ${extra}` : ""}\n` +
      `Exam: BP ${v.sbp}/${v.dbp}, HR ${v.hr}. JVP not raised, lungs clear, no edema.\n` +
      `Assessment and plan: HFrEF, euvolemic. Continue ${others.join(", ") || "current therapy"}.${bb ? ` ${bb}` : ""} Labs today. Follow up in ${pick(["3", "3", "4", "6"])} months.`,
  };
}

function fillerNotes(p) {
  const w = she(p), out = [];
  out.push({ date: p.visits[1], type: "nursing", author: pick(AUTHORS.rn), title: "Nurse visit: weight and vitals",
    text: `Weight ${int(58, 112)} kg, stable from last visit. ${w.S} reports taking ${w.p} medications as prescribed. Reviewed low-sodium diet and daily weights.` });
  if (chance(0.6)) out.push({ date: p.visits[2], type: "progress", author: pick(AUTHORS.pcp), title: "Primary care visit",
    text: `Seen for ${pick(["annual wellness visit", "knee pain", "diabetes follow-up", "a cough after a cold", "blood pressure check"])}. ${pick(["Up to date on vaccines.", "Flu vaccine given.", "Referred to physical therapy.", "No changes made today."])} Heart failure followed by cardiology.` });
  return out;
}

// ---- scenarios: [key, count, gold status, where the deciding evidence is, why (the gold rationale), build] ----

function bbOn(p, key, opts = {}) {
  const [dose, freq] = opts.sig || pick(SIG[key]);
  const m = med(key, dose, freq, { start: ago(int(120, 900)), brand: opts.brand });
  p.meds.splice(1, 0, m);
  return m;
}

const ON = "on_treatment", GAP = "gap", REASON = "documented_reason";
const BETA_BLOCKERS = ["carvedilol", "metoprolol_succinate", "bisoprolol", "metoprolol_tartrate", "atenolol"];

const SCENARIOS = [
  ["on_carvedilol", 15, ON, "meds", "Active carvedilol, an evidence-based beta blocker.", (p) => { const m = bbOn(p, "carvedilol"); p.notes.push(hfNote(p, `Continue carvedilol ${m.sig.split(" by")[0]} twice daily.`)); }],
  ["on_metoprolol_succinate", 12, ON, "meds", "Active metoprolol succinate, an evidence-based beta blocker.", (p) => { const m = bbOn(p, "metoprolol_succinate"); p.notes.push(hfNote(p, `Continue metoprolol succinate ${m.sig.split(" by")[0]} daily.`)); }],
  ["on_bisoprolol", 8, ON, "meds", "Active bisoprolol, an evidence-based beta blocker.", (p) => { bbOn(p, "bisoprolol"); p.notes.push(hfNote(p, "Continue bisoprolol.")); }],
  ["on_brand_name", 5, ON, "meds", "On Toprol-XL or Coreg: brand names for metoprolol succinate and carvedilol.", (p) => {
    const brand = pick(["Toprol-XL", "Coreg"]);
    bbOn(p, brand === "Coreg" ? "carvedilol" : "metoprolol_succinate", { brand });
    p.notes.push(hfNote(p, `Continue ${brand}.`));
  }],
  ["on_restarted", 5, ON, "meds", "Carvedilol was held for low blood pressure during an admission, then restarted; it is active now.", (p) => {
    const w = she(p);
    bbOn(p, "carvedilol", { sig: ["3.125 mg", "twice daily"] });
    const adm = ago(int(200, 330));
    p.notes.push({ date: adm, type: "discharge", author: pick(AUTHORS.hf), title: "Discharge summary", text: `Admitted with decompensated heart failure. Diuresed 4 kg. Carvedilol held on admission for hypotension (SBP 84) and not restarted before discharge. Recheck BP in clinic.` });
    p.notes.push(hfNote(p, "Carvedilol restarted at 3.125 mg twice daily; tolerating it.", { extra: `BP has recovered since ${w.p} admission.` }));
  }],
  ["on_first_degree_block", 5, ON, "meds", "On carvedilol; the note mentions first-degree AV block, which is not a reason to stop it.", (p) => {
    bbOn(p, "carvedilol");
    p.notes.push(hfNote(p, "Continue carvedilol. First-degree AV block on ECG, stable; no change."));
  }],

  ["reason_av_block_in_note", 5, REASON, "note", "Carvedilol was stopped for second-degree AV block on an ambulatory monitor; cardiology documented not to restart it. Only the notes say so.", (p) => avBlockNote(p)],
  ["reason_av_block_coded", 3, REASON, "diagnoses", "Active Mobitz II second-degree AV block on the diagnosis list, no pacemaker.", (p) => {
    p.conditions.push(cond("mobitz2", ago(int(60, 400))));
    p.notes.push(hfNote(p, "No beta blocker given second-degree AV block; EP following."));
  }],
  ["reason_bradycardia_vitals", 3, REASON, "vitals", "Two consecutive heart rates under 50 in the vital signs.", (p) => {
    p.vitals[0].hr = int(42, 48); p.vitals[1].hr = int(43, 49);
    p.notes.push(hfNote(p, null));
  }],
  ["reason_bradycardia_in_note", 2, REASON, "note", "Bisoprolol was stopped for symptomatic bradycardia seen on home readings; only a telephone note records it.", (p) => {
    const w = she(p), stop = ago(int(90, 200));
    p.meds.splice(1, 0, med("bisoprolol", "5 mg", "once daily", { status: "stopped", start: ago(int(400, 700)), end: stop }));
    p.notes.push({ date: stop, type: "telephone", author: pick(AUTHORS.hf), title: "Telephone encounter", text: `${w.S} called: dizzy for a week, home pulse readings 38 to 45. Bisoprolol stopped for symptomatic bradycardia. Do not restart a beta blocker.` });
    p.notes.push(hfNote(p, "Not on a beta blocker."));
  }],
  ["reason_hypotension_in_note", 4, REASON, "note", "Carvedilol was stopped for symptomatic low blood pressure at home; clinic readings are normal and only a note records it.", (p) => {
    const w = she(p), stop = ago(int(80, 260));
    p.meds.splice(1, 0, med("carvedilol", "6.25 mg", "twice daily", { status: "stopped", start: ago(int(300, 700)), end: stop }));
    p.notes.push({ date: stop, type: "telephone", author: pick(AUTHORS.hf), title: "Telephone encounter", text: `${w.S} reports lightheadedness on standing and home BP readings in the low 80s systolic since carvedilol was increased. Carvedilol stopped for symptomatic hypotension; not a candidate to rechallenge.` });
    p.notes.push(hfNote(p, "Not on a beta blocker."));
  }],
  ["reason_hypotension_coded", 2, REASON, "diagnoses", "Active hypotension on the diagnosis list, with systolic pressures in the 80s.", (p) => {
    p.conditions.push(cond("hypotension", ago(int(60, 300))));
    p.vitals[0].sbp = int(82, 88); p.vitals[0].dbp = int(48, 56); p.vitals[1].sbp = int(84, 89);
    p.notes.push(hfNote(p, "Blood pressure remains low; no room for a beta blocker."));
  }],
  ["reason_asthma", 3, REASON, "diagnoses", "Active severe persistent asthma on the diagnosis list; bronchospasm on a beta blocker in the past.", (p) => {
    p.conditions.push(cond("asthma_severe", ago(int(3000, 12000))));
    p.meds.push(med("fluticasone_salmeterol", "250/50 mcg", "twice daily", { start: ago(int(400, 2000)), form: "inhalation powder" }), med("albuterol", "90 mcg", "every 4 hours as needed", { start: ago(int(400, 2000)), form: "metered-dose inhaler" }));
    p.notes.push({ date: ago(int(300, 700)), type: "consult", author: pick(AUTHORS.pulm), title: "Pulmonology consult", text: `Severe persistent asthma, two exacerbations this year. Wheezing and bronchospasm after metoprolol was started in hospital. Avoid beta blockers.` });
    p.notes.push(hfNote(p, null));
  }],
  ["reason_intolerance_allergy_list", 3, REASON, "allergies", "A beta blocker intolerance is recorded in the allergy list only.", (p) => {
    p.allergies.push({ substance: "beta-adrenergic blocking agent", snomed: "373254001", type: "intolerance", reaction: pick(["severe fatigue and bradycardia", "bronchospasm", "dizziness and syncope"]), date: ago(int(300, 1500)) });
    p.notes.push(hfNote(p, null));
  }],
  ["reason_declined", 5, REASON, "note", "The patient declined a beta blocker after discussion.", (p) => {
    const w = she(p);
    p.notes.push(hfNote(p, `Discussed starting a beta blocker and its benefits; ${w.s} declines and does not want to add another medication. Will revisit.`));
  }],

  ["gap_no_reason", 5, GAP, "meds", "Not on a beta blocker, and nothing in the chart says why.", (p) => { p.notes.push(hfNote(p, null)); }],
  ["gap_consider_starting", 3, GAP, "note", "Not on one; \"consider starting\" is a plan, not a reason.", (p) => { p.notes.push(hfNote(p, `Not on a beta blocker. Consider starting ${pick(["carvedilol", "metoprolol succinate", "bisoprolol"])} at the next visit.`)); }],
  ["gap_heart_block_paced", 3, GAP, "diagnoses", "The beta blocker was stopped for complete heart block, but a pacemaker has since been placed, so the reason no longer applies.", (p) => {
    const blockDate = ago(int(500, 800)), pmDate = day(blockDate, int(5, 20));
    p.meds.splice(1, 0, med("carvedilol", "12.5 mg", "twice daily", { status: "stopped", start: ago(int(900, 1400)), end: blockDate }));
    p.conditions.push(cond("chb", blockDate, { status: "resolved" }), cond("pacer", pmDate));
    p.notes.push({ date: blockDate, type: "consult", author: pick(AUTHORS.ep), title: "Electrophysiology consult", text: `Complete heart block. Carvedilol held. Dual-chamber pacemaker planned.` });
    p.notes.push({ date: pmDate, type: "procedure", author: pick(AUTHORS.ep), title: "Pacemaker implant", text: `Dual-chamber pacemaker implanted without complication. Beta blockers can be restarted from a conduction standpoint.` });
    p.notes.push(hfNote(p, null, { extra: "Pacemaker check normal." }));
  }],
  ["gap_metoprolol_tartrate", 3, GAP, "meds", "On metoprolol tartrate, which is not an evidence-based beta blocker for HFrEF.", (p) => { bbOn(p, "metoprolol_tartrate"); p.notes.push(hfNote(p, "Continue metoprolol.")); }],
  ["gap_atenolol", 2, GAP, "meds", "On atenolol, which is not an evidence-based beta blocker for HFrEF.", (p) => { bbOn(p, "atenolol"); p.notes.push(hfNote(p, "Continue atenolol.")); }],
  ["gap_lapsed", 2, GAP, "meds", "Carvedilol lapsed when the patient ran out; that is not a medical reason.", (p) => {
    const w = she(p), stop = ago(int(60, 120));
    p.meds.splice(1, 0, med("carvedilol", "12.5 mg", "twice daily", { status: "stopped", start: ago(int(500, 900)), end: stop }));
    p.notes.push(hfNote(p, `Ran out of carvedilol ${int(2, 4)} months ago and has not refilled. ${w.S} is willing to restart.`));
  }],
  ["gap_childhood_asthma", 2, GAP, "diagnoses", "Asthma on the diagnosis list is childhood asthma, resolved; it is not a current reason.", (p) => {
    p.conditions.push(cond("asthma_child", ago(int(18000, 24000)), { status: "resolved" }));
    p.notes.push(hfNote(p, null));
  }],
];

// The first patient: Rosa Delgado from the talk. Carvedilol was stopped in May for Mobitz II heart block found on a
// monitor she wore for dizzy spells at home; her clinic vital signs and problem list look normal. Only the notes say why.
function avBlockNote(p, rosa = false) {
  const w = she(p);
  const stop = rosa ? "2026-05-14" : ago(int(120, 260));
  const ep = day(stop, rosa ? 47 : int(30, 60));
  p.meds.splice(1, 0, med("carvedilol", "12.5 mg", "twice daily", { status: "stopped", start: day(stop, -int(200, 500)), end: stop }));
  p.notes.push({ date: stop, type: "telephone", author: rosa ? "Dr. A. Patel, Cardiology" : pick(AUTHORS.hf), title: "Telephone encounter",
    text: `${w.S} called with three episodes of lightheadedness at home this week; ${w.p} watch flagged pauses. 14-day event monitor shows intermittent Mobitz II second-degree AV block with 2:1 conduction while on carvedilol 12.5 mg twice daily. Carvedilol stopped today. Do not restart a beta blocker. Urgent electrophysiology referral.` });
  p.notes.push({ date: ep, type: "consult", author: pick(AUTHORS.ep), title: "Electrophysiology consult",
    text: `Mobitz II block on carvedilol. Off it for ${Math.round((Date.parse(ep) - Date.parse(stop)) / 864e5)} days, symptoms resolved and repeat monitor shows only first-degree AV block. No pacemaker at present. Avoid beta blockers and other AV nodal blocking drugs; revisit if a device is ever implanted.` });
  if (rosa) p.notes.push({ date: p.visits[0], type: "progress", author: "Dr. L. Rivera, Internal Medicine", title: "Primary care visit",
    text: `Seen for diabetes and blood pressure. A1c 7.1%. BP ${p.vitals[0].sbp}/${p.vitals[0].dbp}, HR ${p.vitals[0].hr}. Heart failure followed by cardiology; not on a beta blocker, will leave that to them. Flu vaccine given.` });
  else p.notes.push(hfNote(p, "Not on a beta blocker."));
}

// ---- what an EHR also holds, and the answer doesn't need ----

// payer types from the Source of Payment Typology (PHDSC)
const PAYERS = [["11", "Medicare managed care", "Aetna Medicare", "Medicare Advantage PPO"], ["1", "Medicare", "Medicare Part A and B", "Original Medicare"],
  ["5", "Private health insurance", "Anthem Blue Cross", "Anthem PPO"], ["2", "Medicaid", "HUSKY Health", "HUSKY D"]];
const RELATIVES = [["FTH", "father"], ["MTH", "mother"], ["BRO", "brother"], ["SIS", "sister"]];
const FAMILY_DX = [["22298006", "Myocardial infarction"], ["44054006", "Type 2 diabetes mellitus"], ["254837009", "Breast cancer"], ["230690007", "Stroke"], ["26929004", "Alzheimer's disease"], ["38341003", "Hypertension"]];
const SMOKING = [["266919005", "Never smoked tobacco"], ["8517006", "Ex-smoker"], ["8517006", "Ex-smoker"], ["77176002", "Smoker"]];

function extras(p) {
  if (!p.coverage) {
    const [code, type, payer, plan] = p.age >= 65 ? pick(PAYERS.slice(0, 2)) : pick(PAYERS.slice(2));
    p.coverage = { code, type, payer, plan, member: `${payer[0]}${int(100000000, 999999999)}`, since: ago(int(200, 3000)) };
  }
  p.immunizations ||= [{ cvx: "141", text: "Influenza, seasonal, injectable", date: ago(int(10, 60)) }, { cvx: "300", text: "COVID-19, mRNA, 2024-2025 formula", date: ago(int(200, 400)) },
    ...(chance(0.7) ? [{ cvx: "33", text: "Pneumococcal polysaccharide PPV23", date: ago(int(800, 3000)) }] : [])];
  p.family ||= shuffle([...RELATIVES]).slice(0, int(1, 3)).map(([rel, relText]) => { const [snomed, text] = pick(FAMILY_DX); return { rel, relText, snomed, text, age: int(48, 82) }; });
  if (!p.social) {
    const [snomed, value] = pick(SMOKING);
    p.social = [{ date: p.visits[0], loinc: "72166-2", name: "Tobacco smoking status", snomed, value },
      { date: p.visits[0], loinc: "74013-4", name: "Alcoholic drinks per day", value: pick(["none", "none", "1", "2", "less than 1"]) },
      { date: p.visits[0], loinc: "71802-3", name: "Housing status", value: pick(["Lives with spouse", "Lives alone", "Lives with family", "Lives alone", "Assisted living"]) }];
  }
  p.appointments ||= [{ date: day(TODAY, int(20, 90)), time: pick(["09:00", "10:30", "13:15", "15:45"]), service: "Heart failure clinic follow-up", with: pick(AUTHORS.hf) }];
}

function rosa() {
  rng = mulberry32(71);
  const p = basePatient(0);
  Object.assign(p, { name: "Rosa Delgado", sex: "female", age: 71, dob: "1955-03-08", mrn: "40118342", address: "214 Orange St, New Haven, CT 06511", phone: "203-555-0174", ef: 30, hfSince: "2023-02-10" });
  p.visits = ["2026-10-20", "2026-07-22", "2026-04-30"];
  p.conditions = [cond("hfref", "2023-02-10"), cond("htn", "2009-06-01"), cond("t2dm", "2014-09-15"), cond("ckd3a", "2021-11-03")];
  p.meds = [med("sacubitril_valsartan", "49/51 mg", "twice daily", { start: "2023-08-14" }), med("spironolactone", "25 mg", "once daily", { start: "2023-11-02" }),
    med("dapagliflozin", "10 mg", "once daily", { start: "2024-03-20" }), med("furosemide", "40 mg", "once daily", { start: "2023-02-12" }),
    med("atorvastatin", "40 mg", "once daily", { start: "2019-05-01" }), med("metformin", "500 mg", "twice daily", { start: "2014-10-01" })];
  p.vitals = [{ date: "2026-10-20", hr: 72, sbp: 122, dbp: 74 }, { date: "2026-07-22", hr: 70, sbp: 118, dbp: 72 }, { date: "2026-04-30", hr: 64, sbp: 116, dbp: 70 }];
  p.labs = [{ date: "2026-10-20", loinc: "2823-3", name: "Potassium", value: "4.6", unit: "mmol/L" }, { date: "2026-10-20", loinc: "2160-0", name: "Creatinine", value: "1.24", unit: "mg/dL" },
    { date: "2026-10-20", loinc: "33762-6", name: "NT-proBNP", value: "1180", unit: "pg/mL" }];
  p.allergies = [];
  p.notes = [{ date: "2026-03-18", type: "progress", author: "Dr. A. Patel, Cardiology", title: "Heart failure clinic follow-up",
    text: "71-year-old woman with HFrEF (LVEF 30%), NYHA class II. Feels well; no orthopnea or leg swelling.\nExam: BP 124/76, HR 78. Euvolemic.\nAssessment and plan: Continue sacubitril/valsartan, spironolactone and dapagliflozin. Carvedilol increased to 12.5 mg twice daily. Labs in two weeks." }];
  avBlockNote(p, true);
  p.coverage = { code: "11", type: "Medicare managed care", payer: "Aetna Medicare", plan: "Medicare Advantage PPO", member: "A482913376", since: "2021-01-01" };
  p.immunizations = [{ cvx: "141", text: "Influenza, seasonal, injectable", date: "2026-10-20" }, { cvx: "300", text: "COVID-19, mRNA, 2024-2025 formula", date: "2025-10-02" }];
  p.family = [{ rel: "FTH", relText: "father", snomed: "22298006", text: "Myocardial infarction", age: 62 }, { rel: "SIS", relText: "sister", snomed: "44054006", text: "Type 2 diabetes mellitus", age: 50 }];
  p.social = [{ date: "2026-10-20", loinc: "72166-2", name: "Tobacco smoking status", snomed: "8517006", value: "Ex-smoker" },
    { date: "2026-10-20", loinc: "74013-4", name: "Alcoholic drinks per day", value: "none" }, { date: "2026-10-20", loinc: "71802-3", name: "Housing status", value: "Lives with daughter" }];
  p.appointments = [{ date: "2026-12-08", time: "10:30", service: "Heart failure clinic follow-up", with: "Dr. A. Patel, Cardiology" }];
  p.notes.push({ date: "2026-07-22", type: "nursing", author: "K. Murphy, RN", title: "Nurse visit: weight and vitals", text: "Weight 74 kg, stable. Reports taking her medications as prescribed. Reviewed low-sodium diet and daily weights." });
  p.gold = { status: REASON, scenario: "reason_av_block_in_note", where: "note", why: "Carvedilol was stopped in May for Mobitz II heart block found on a home event monitor; cardiology and EP say not to restart a beta blocker. Her vital signs and problem list look normal: only the notes say why." };
  return p;
}

function build() {
  const out = [rosa()];
  rng = mulberry32(2026);
  const plan = [];
  for (const [scenario, count, status, where, why, make] of SCENARIOS) {
    const n = scenario === "reason_av_block_in_note" ? count - 1 : count;      // Rosa is one of them
    for (let k = 0; k < n; k++) plan.push({ scenario, status, where, why, make });
  }
  shuffle(plan);
  const used = new Set(["Rosa Delgado"]);
  plan.forEach((s, k) => {
    let p;
    do { p = basePatient(k + 1); } while (used.has(p.name));
    used.add(p.name);
    s.make(p);
    p.notes.push(...fillerNotes(p));
    p.gold = { status: s.status, scenario: s.scenario, where: s.where, why: s.why };
    out.push(p);
  });
  rng = mulberry32(7);
  for (const p of out) {
    extras(p);
    // the three questions: is a beta blocker given (any, even one that doesn't count), why or why not, is it a gap
    p.gold.given = p.meds.some((m) => m.status === "active" && BETA_BLOCKERS.includes(m.key));
    p.gold.gap = p.gold.status === GAP;
    p.notes.sort((a, b) => b.date.localeCompare(a.date));
    p.notes.forEach((n, k) => (n.id = `N${k + 1}`));
  }
  return out;
}

export const PATIENTS = build();
export const SCENARIO_LABELS = Object.fromEntries(SCENARIOS.map(([k, , , , why]) => [k, why]));
