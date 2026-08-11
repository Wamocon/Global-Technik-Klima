# L7-12 FOUT precision — per-font-subset arrival vs first paint (mobile 390x844 DPR2, CPU 4x)

## fast3g/tr — FCP median 1860 ms, all-fonts-ready median 4135.3 ms
| font file | initiator | started ms | finished ms | vs FCP | visible swap? |
|---|---|---|---|---|---|
| cormorant-600-normal-latin.woff2 | link | 605 | 1564 | -348 ms | no (arrived before first paint) |
| jost-300-600-normal-latin.woff2 | link | 606 | 1594 | -318 ms | no (arrived before first paint) |
| cormorant-600-normal-latin-ext.woff2 | css | 1598 | 3121 | +1209 ms | YES — fallback shown first for 1209 ms |
| cormorant-500-italic-latin.woff2 | css | 1568 | 3191 | +1279 ms | YES — fallback shown first for 1279 ms |
| jost-300-600-normal-latin-ext.woff2 | css | 1602 | 3867 | +1955 ms | YES — fallback shown first for 1955 ms |
| cormorant-500-italic-latin-ext.woff2 | css | 1808 | 4107 | +2195 ms | YES — fallback shown first for 2195 ms |

## fast3g/ru — FCP median 1876 ms, all-fonts-ready median 4035.3 ms
| font file | initiator | started ms | finished ms | vs FCP | visible swap? |
|---|---|---|---|---|---|
| cormorant-600-normal-latin.woff2 | link | 603 | 1556 | -320 ms | no (arrived before first paint) |
| jost-300-600-normal-latin.woff2 | link | 604 | 1588 | -288 ms | no (arrived before first paint) |
| jost-300-600-normal-cyrillic.woff2 | css | 1559 | 2788 | +912 ms | YES — fallback shown first for 912 ms |
| cormorant-500-italic-cyrillic.woff2 | css | 1541 | 2851 | +975 ms | YES — fallback shown first for 975 ms |
| cormorant-600-normal-cyrillic.woff2 | css | 1564 | 3654 | +1778 ms | YES — fallback shown first for 1778 ms |
| jost-300-600-normal-latin-ext.woff2 | css | 1803 | 3927 | +2051 ms | YES — fallback shown first for 2051 ms |
| cormorant-500-italic-latin.woff2 | css | 1771 | 3990 | +2114 ms | YES — fallback shown first for 2114 ms |

## slow3g/tr — FCP median 5144 ms, all-fonts-ready median 10435.5 ms
| font file | initiator | started ms | finished ms | vs FCP | visible swap? |
|---|---|---|---|---|---|
| cormorant-600-normal-latin.woff2 | link | 2053 | 5422 | +278 ms | YES — fallback shown first for 278 ms |
| jost-300-600-normal-latin.woff2 | link | 2053 | 5516 | +372 ms | YES — fallback shown first for 372 ms |
| cormorant-600-normal-latin-ext.woff2 | css | 4835 | 9444 | +4300 ms | YES — fallback shown first for 4300 ms |
| cormorant-500-italic-latin.woff2 | css | 4807 | 9637 | +4493 ms | YES — fallback shown first for 4493 ms |
| jost-300-600-normal-latin-ext.woff2 | css | 4844 | 10172 | +5028 ms | YES — fallback shown first for 5028 ms |
| cormorant-500-italic-latin-ext.woff2 | css | 5036 | 10346 | +5202 ms | YES — fallback shown first for 5202 ms |

## slow3g/ru — FCP median 5224 ms, all-fonts-ready median 11395.4 ms
| font file | initiator | started ms | finished ms | vs FCP | visible swap? |
|---|---|---|---|---|---|
| cormorant-600-normal-latin.woff2 | link | 2060 | 5451 | -81 ms | no (arrived before first paint) |
| jost-300-600-normal-latin.woff2 | link | 2061 | 5539 | +7 ms | YES — fallback shown first for 7 ms |
| cormorant-500-italic-cyrillic.woff2 | css | 4913 | 8596 | +3064 ms | YES — fallback shown first for 3064 ms |
| jost-300-600-normal-cyrillic.woff2 | css | 4946 | 9498 | +3966 ms | YES — fallback shown first for 3966 ms |
| cormorant-600-normal-cyrillic.woff2 | css | 4954 | 9726 | +4194 ms | YES — fallback shown first for 4194 ms |
| cormorant-500-italic-latin.woff2 | css | 5408 | 11791 | +6259 ms | YES — fallback shown first for 6259 ms |
| jost-300-600-normal-latin-ext.woff2 | css | 5450 | 12692 | +7160 ms | YES — fallback shown first for 7160 ms |

## Summary
- fast3g/tr: 4 of 6 subsets arrive AFTER first paint · worst late-by median 2211 ms (2195–2262) · FCP→all-ready 2234.5 ms
- fast3g/ru: 5 of 7 subsets arrive AFTER first paint · worst late-by median 2114 ms (2113–2114) · FCP→all-ready 2161.2 ms
- slow3g/tr: 6 of 6 subsets arrive AFTER first paint · worst late-by median 5226 ms (5202–5242) · FCP→all-ready 5290.9 ms
- slow3g/ru: 7 of 7 subsets arrive AFTER first paint · worst late-by median 6124 ms (6101–7160) · FCP→all-ready 6171.4 ms