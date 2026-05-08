// Canonical tiered lists for the intake form, sourced from the product spec
// (Guthub_Product_Specification_v2.2.pdf — Appendix A).
//
// Tier 1 = visible chips (defined in app/onboarding/page.tsx).
// Tier 2 = autocomplete suggestions revealed when user clicks "+ Other".
// Tier 3 = out-of-scope conditions that trigger a physician-redirect message.

// ─── Medical conditions — Tier 2 (autocomplete) ────────────────────────────
export const CONDITION_TIER2: string[] = [
  // GI & Functional
  'H. pylori',
  'Histamine intolerance',
  'Candida overgrowth',
  'Celiac disease',
  'Non-celiac gluten sensitivity',
  'Leaky gut syndrome',
  'Gastroparesis',
  'Diverticulitis',
  'Gastritis',
  'Ulcerative colitis',
  'Microscopic colitis',
  'Functional dyspepsia',
  'Eosinophilic esophagitis',
  'Hemorrhoids',
  'Chronic constipation',
  'Chronic diarrhea',
  'Bile acid malabsorption',
  // Metabolic / Hormonal
  'PCOS',
  'Insulin resistance',
  'Prediabetes',
  'Metabolic syndrome',
  "Hashimoto's",
  'Hypothyroidism',
  'Hyperthyroidism',
  // Neurological / Immune / Inflammatory
  'Migraines',
  'Fibromyalgia',
  'Chronic fatigue syndrome',
  'Mast cell activation syndrome (MCAS)',
  // Skin & Gut-Related
  'Eczema',
  'Psoriasis',
  'Acne',
  'Rosacea',
]

// ─── Medical conditions — Tier 3 (out of scope, refuse to add) ─────────────
export const CONDITION_TIER3: string[] = [
  'Active cancer treatment',
  'Severe eating disorders',
  'Feeding tube dependency',
  'Advanced liver disease',
  'Kidney failure',
  'Organ transplant',
  'Pregnancy complications',
  'Severe malnutrition',
  'Pediatric GI disorders',
  'Post-bariatric surgery complications',
  'Severe gastroparesis',
  'Active GI bleeding',
  'Suicidal ideation',
  'Uncontrolled diabetes',
  'Acute pancreatitis',
]

export const TIER3_REDIRECT_MESSAGE =
  "This is outside what GutHub can safely help with. Please work with your physician for this condition. We can still support general gut wellness alongside your care."

// ─── Food allergies & sensitivities — Tier 2 ───────────────────────────────
export const ALLERGEN_TIER2: string[] = [
  // FODMAP-related
  'Apples',
  'Pears',
  'Watermelon',
  'Stone fruits',
  'Cauliflower',
  'Mushrooms',
  'Legumes',
  'Honey',
  'Wheat',
  'Sugar alcohols / polyols',
  // Functional / Integrative
  'Histamine-rich foods',
  'Fermented foods',
  'Nightshades',
  'High-oxalate foods',
  'High-salicylate foods',
  'Sulfur-containing foods',
  'Lectins',
  'Artificial sweeteners',
  'HFCS (high-fructose corn syrup)',
  'Seed oils',
  'Processed foods',
]

// ─── Eating style — Tier 2 ─────────────────────────────────────────────────
export const EATING_STYLE_TIER2: { value: string; label: string }[] = [
  { value: 'aip',                 label: 'AIP (Autoimmune Protocol)' },
  { value: 'anti_inflammatory',   label: 'Anti-inflammatory' },
  { value: 'whole30',             label: 'Whole30' },
  { value: 'scd',                 label: 'SCD (Specific Carbohydrate Diet)' },
  { value: 'gaps',                label: 'GAPS' },
  { value: 'high_protein',        label: 'High-protein' },
  { value: 'balanced_whole_foods',label: 'Balanced / Whole foods' },
  { value: 'carnivore',           label: 'Carnivore' },
  { value: 'dairy_free',          label: 'Dairy-free' },
  { value: 'gluten_free',         label: 'Gluten-free' },
]
