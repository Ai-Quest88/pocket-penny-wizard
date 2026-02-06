# AI Transaction Categorization - Requirements & Tasks

## 📋 Project Overview

**Feature**: AI-Powered Transaction Categorization  
**Status**: In Progress  
**Priority**: High  
**Owner**: TBD

---

## 🎯 Current State Assessment

### What's Already Built
- [x] SmartCategorizer - 3-tier orchestration system
- [x] UserHistoryMatcher - Fuzzy matching against past transactions
- [x] SystemKeywordMatcher - Australian merchant keyword matching
- [x] AICategorizer - Google Gemini AI integration
- [x] CategorizationMonitor - Performance tracking

### Current Accuracy Estimates
| Tier | Component | Accuracy | Status |
|------|-----------|----------|--------|
| 1 | User History | 90-95% | ✅ Working |
| 2 | System Keywords | 80-85% | ✅ Working |
| 3 | AI (Gemini) | 70-80% | ✅ Working |
| 4 | Fallback | 0% | ❓ Uncategorized |

---

## 🔴 Open Requirements Questions

### REQ-1: Category Structure
**Status**: 🔴 Needs Decision  
**Question**: What is the complete category hierarchy?

**Options**:
- [ ] A) Simple (10-15 categories)
- [ ] B) Detailed (40+ categories) 
- [ ] C) Hierarchical (Groups → Buckets → Categories)
- [ ] D) Custom structure (define below)

**Current Categories**:
```
Income:
- Salary
- Investment Income

Expenses:
- Food & Dining
- Transportation
- Housing
- Healthcare
- Entertainment
- Telecommunications
- Shopping
- Other Expenses

Transfers:
- Account Transfer

Other:
- Uncategorized
```

**Your Answer**: _____________

---

### REQ-2: Merchant Learning
**Status**: 🔴 Needs Decision  
**Question**: Should the system remember merchant → category mappings?

**Options**:
- [ ] A) No learning - rely on AI each time
- [ ] B) Session learning - remember during import only
- [ ] C) Persistent learning - save merchant patterns to database
- [ ] D) User-controlled learning - "remember this" button

**Your Answer**: _____________

---

### REQ-3: User Rules Engine
**Status**: 🔴 Needs Decision  
**Question**: Should users be able to create custom categorization rules?

**Options**:
- [ ] A) No user rules - fully automatic
- [ ] B) Simple rules - "if contains X, use category Y"
- [ ] C) Advanced rules - regex, amount ranges, date patterns
- [ ] D) Rule builder UI - visual rule creation

**Your Answer**: _____________

---

### REQ-4: Category Correction UX
**Status**: 🔴 Needs Decision  
**Question**: How should users correct wrong categories?

**Options**:
- [ ] A) Inline edit only - change and move on
- [ ] B) Apply to similar - "use this for all similar transactions"
- [ ] C) Create rule - "always use this category for this merchant"
- [ ] D) Review queue - batch review low-confidence items

**Your Answer**: _____________

---

### REQ-5: Australian Merchant Expansion
**Status**: 🔴 Needs Decision  
**Question**: How comprehensive should Australian merchant patterns be?

**Current coverage**:
- Supermarkets: Coles, Woolworths, Aldi, IGA
- Transport: Linkt, Uber
- Healthcare: CBHS, Medicare
- Telco: Telstra, Optus, Vodafone
- Banks: CBA, NAB, ANZ, Westpac

**Missing (examples)**:
- Retail: Bunnings, JB Hi-Fi, Kmart, Target, Officeworks, Big W
- Fast Food: Maccas, Hungry Jacks, Guzman, Nandos
- Fuel: BP, Shell, Ampol, 7-Eleven
- Government: Centrelink, ATO, Service NSW
- Insurance: RACV, NRMA, AAMI, Allianz

**Options**:
- [ ] A) Keep minimal - let AI handle unknowns
- [ ] B) Expand moderately - add top 50 merchants
- [ ] C) Comprehensive - 200+ merchant patterns
- [ ] D) Community-driven - crowdsource patterns

**Your Answer**: _____________

---

### REQ-6: AI Improvement Priority
**Status**: 🔴 Needs Decision  
**Question**: What should we improve about AI categorization?

**Options** (select multiple):
- [ ] A) Better prompts for more accurate results
- [ ] B) User context (their categories) sent to AI
- [ ] C) Confidence thresholds (auto-approve high confidence)
- [ ] D) Batch processing optimization
- [ ] E) Fallback to secondary AI if primary fails
- [ ] F) Cost optimization (reduce API calls)

**Your Answer**: _____________

---

## 📝 Implementation Tasks

### Phase 1: Foundation (Current Sprint)
| ID | Task | Status | Priority | Depends On |
|----|------|--------|----------|------------|
| T1.1 | Finalize category structure | 🔴 TODO | High | REQ-1 |
| T1.2 | Document all categories with examples | 🔴 TODO | High | T1.1 |
| T1.3 | Create category database schema | 🔴 TODO | High | T1.1 |

### Phase 2: Merchant Learning
| ID | Task | Status | Priority | Depends On |
|----|------|--------|----------|------------|
| T2.1 | Design merchant pattern storage | 🔴 TODO | High | REQ-2 |
| T2.2 | Implement "remember merchant" feature | 🔴 TODO | High | T2.1 |
| T2.3 | Add merchant matching to categorization flow | 🔴 TODO | Medium | T2.2 |

### Phase 3: User Rules (if selected)
| ID | Task | Status | Priority | Depends On |
|----|------|--------|----------|------------|
| T3.1 | Design rules engine architecture | 🔴 TODO | Medium | REQ-3 |
| T3.2 | Implement rule matching logic | 🔴 TODO | Medium | T3.1 |
| T3.3 | Build rule creation UI | 🔴 TODO | Medium | T3.2 |

### Phase 4: UX Improvements
| ID | Task | Status | Priority | Depends On |
|----|------|--------|----------|------------|
| T4.1 | Improve category correction flow | 🔴 TODO | High | REQ-4 |
| T4.2 | Add "apply to similar" functionality | 🔴 TODO | Medium | T4.1 |
| T4.3 | Build low-confidence review queue | 🔴 TODO | Low | T4.1 |

### Phase 5: Australian Expansion
| ID | Task | Status | Priority | Depends On |
|----|------|--------|----------|------------|
| T5.1 | Research top Australian merchants | 🔴 TODO | Medium | REQ-5 |
| T5.2 | Add merchant patterns | 🔴 TODO | Medium | T5.1 |
| T5.3 | Test against sample data | 🔴 TODO | Medium | T5.2 |

### Phase 6: AI Optimization
| ID | Task | Status | Priority | Depends On |
|----|------|--------|----------|------------|
| T6.1 | Improve AI prompts | 🔴 TODO | Medium | REQ-6 |
| T6.2 | Add user context to AI calls | 🔴 TODO | Medium | T6.1 |
| T6.3 | Implement confidence thresholds | 🔴 TODO | Low | T6.1 |

---

## 📊 Success Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Overall Accuracy | ~80% | 95%+ | User corrections / Total transactions |
| User History Hits | ~30% | 60%+ | Tier 1 matches / Total |
| AI Calls | 70% | <20% | AI calls / Total |
| Processing Time | ~5s | <3s | Average batch time |
| Uncategorized Rate | ~10% | <2% | Uncategorized / Total |

---

## 📅 Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Requirements Finalization | 1 day | TBD | TBD |
| Phase 1: Foundation | 2 days | TBD | TBD |
| Phase 2: Merchant Learning | 3 days | TBD | TBD |
| Phase 3: User Rules | 3 days | TBD | TBD |
| Phase 4: UX Improvements | 2 days | TBD | TBD |
| Phase 5: Australian Expansion | 2 days | TBD | TBD |
| Phase 6: AI Optimization | 2 days | TBD | TBD |

---

## 📝 Notes

_Add any additional notes, decisions, or context here._

---

**Last Updated**: December 10, 2025  
**Next Review**: After requirements decisions
