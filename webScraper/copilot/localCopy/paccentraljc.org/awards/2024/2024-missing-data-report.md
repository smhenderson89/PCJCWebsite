# 2024 Orchid Awards - Missing Data Analysis

Generated: October 4, 2025 at 12:06 AM

## Summary Statistics

- **Total Files**: 63
- **Files with Missing Data**: 12
- **Complete Files**: 51
- **Completion Rate**: 81.0%

## Missing Data by Field

- **genus**: 2 files missing (3.2%)
- **species**: 2 files missing (3.2%)
- **clone**: 6 files missing (9.5%)
- **award**: 4 files missing (6.3%)
- **awardpoints**: 11 files missing (17.5%)
- **cross**: ✅ Complete in all files
- **exhibitor**: ✅ Complete in all files
- **photographer**: ✅ Complete in all files

## Files Requiring Attention

### 20245262.json (Award 20245262)

**Missing Fields**: `awardpoints`

**Current Data**:
- Genus: Cymbidium
- Species: dayanum
- Clone: Red
- Award: JC
- Award Points: null
- Exhibitor: Sylvia Darr
- Photographer: Chaunie Langland

---

### 20245266.json (Award 20245266)

**Missing Fields**: `awardpoints`

**Current Data**:
- Genus: Chiloschista
- Species: shanica
- Clone: Adrienne
- Award: CBR
- Award Points: null
- Exhibitor: Mark Pendleton
- Photographer: Lynne Murrell

---

### 20245267.json (Award 20245267)

**Missing Fields**: `awardpoints`

**Current Data**:
- Genus: Chiloschista
- Species: lindstroemii
- Clone: Lace
- Award: CBR
- Award Points: null
- Exhibitor: Mark Pendleton
- Photographer: Lynne Murrell

---

### 20245268.json (Award 20245268)

**Missing Fields**: `clone`, `award`, `awardpoints`

**Current Data**:
- Genus: Sonoma
- Species: County
- Clone: null
- Award: null
- Award Points: null
- Exhibitor: Sonoma County Orchid Society
- Photographer: Lynne Murrell

---

### 20245269.json (Award 20245269)

**Missing Fields**: `clone`, `award`, `awardpoints`

**Current Data**:
- Genus: Sonoma
- Species: County
- Clone: null
- Award: null
- Award Points: null
- Exhibitor: Sonoma County Orchid Society
- Photographer: Lynne Murrell

---

### 20245274.json (Award 20245274)

**Missing Fields**: `awardpoints`

**Current Data**:
- Genus: Microcoelia
- Species: cornuta
- Clone: Menominee
- Award: CBR
- Award Points: null
- Exhibitor: Jim Heilig
- Photographer: Chaunie Langland

---

### 20245280.json (Award 20245280)

**Missing Fields**: `awardpoints`

**Current Data**:
- Genus: Cattleya
- Species: intermedia
- Clone: Awesome
- Award: HCC
- Award Points: null
- Exhibitor: Amy and Ken Jacobsen
- Photographer: Chaunie Langland

---

### 20245284.json (Award 20245284)

**Missing Fields**: `award`, `awardpoints`

**Current Data**:
- Genus: Cattleya
- Species: mendelii
- Clone: Best
- Award: null
- Award Points: null
- Exhibitor: Amy and Ken Jacobsen
- Photographer: Chaunie Langland

---

### 20245352.json (Award 20245352)

**Missing Fields**: `clone`, `awardpoints`

**Current Data**:
- Genus: Cymbidium
- Species: Samurai
- Clone: null
- Award: AQ
- Award Points: null
- Exhibitor: Pierre Pujol
- Photographer: Ken Jacobsen

---

### 20245355.json (Award 20245355)

**Missing Fields**: `clone`, `awardpoints`

**Current Data**:
- Genus: Paphiopedilum
- Species: Sierra
- Clone: null
- Award: AQ
- Award Points: null
- Exhibitor: Dave Sorokowsky
- Photographer: Ken Jacobsen

---

### 20245368.json (Award 20245368)

**Missing Fields**: `genus`, `species`, `clone`, `award`, `awardpoints`

**Current Data**:
- Genus: null
- Species: null
- Clone: null
- Award: null
- Award Points: null
- Exhibitor: Marin Orchid Society
- Photographer: Ken Jacobsen

---

### 20245369.json (Award 20245369)

**Missing Fields**: `genus`, `species`, `clone`

**Current Data**:
- Genus: null
- Species: null
- Clone: null
- Award: SC
- Award Points: 88
- Exhibitor: Marin Orchid Society
- Photographer: Ken Jacobsen

---

## Fields with Missing Data Details

### genus (2 missing)

Files: `20245368.json`, `20245369.json`

### species (2 missing)

Files: `20245368.json`, `20245369.json`

### clone (6 missing)

Files: `20245268.json`, `20245269.json`, `20245352.json`, `20245355.json`, `20245368.json`, `20245369.json`

### award (4 missing)

Files: `20245268.json`, `20245269.json`, `20245284.json`, `20245368.json`

### awardpoints (11 missing)

Files: `20245262.json`, `20245266.json`, `20245267.json`, `20245268.json`, `20245269.json`, `20245274.json`, `20245280.json`, `20245284.json`, `20245352.json`, `20245355.json`, `20245368.json`

## Recommendations

1. **Priority 1**: Fix missing `award` and `awardpoints` data - these are critical award information
2. **Priority 2**: Complete missing `genus` and `species` data for taxonomic accuracy
3. **Priority 3**: Fill in missing `clone` names where available
4. **Priority 4**: Complete exhibitor and photographer information for credit

## Next Steps

- Review HTML source files for missing information
- Consider manual data entry for critical missing fields
- Implement enhanced parsing for edge cases
- Validate data consistency across all files
