# L7-06d FrostHero drawing cost, isolated (CDP Performance.getMetrics TaskDuration, 3000 ms idle windows)
| case | rep | TaskDuration ms | busy % | 2D fills | fills/frame est |
|---|---|---|---|---|---|
| footer · frost drawing (as shipped) | 0 | 1396.2 | 46.1 | 31008 | 170.7 |
| footer · frost drawing (as shipped) | 1 | 1627.7 | 53.8 | 27948 | 153.9 |
| footer · frost drawing (as shipped) | 2 | 1613.1 | 53.3 | 28356 | 156.2 |
| footer · frost neutralised (0 particles) | 0 | 1234.9 | 40.9 | 0 | 0 |
| footer · frost neutralised (0 particles) | 1 | 1164.8 | 38.7 | 0 | 0 |
| footer · frost neutralised (0 particles) | 2 | 1072.7 | 35.6 | 0 | 0 |
| hero · frost drawing (as shipped) | 0 | 1559.3 | 51.4 | 37128 | 204.1 |
| hero · frost drawing (as shipped) | 1 | 1540 | 50.8 | 37332 | 205.3 |
| hero · frost drawing (as shipped) | 2 | 1519.4 | 50.3 | 37128 | 204.9 |
| hero · frost neutralised (0 particles) | 0 | 456.3 | 15.2 | 0 | 0 |
| hero · frost neutralised (0 particles) | 1 | 446.6 | 14.8 | 0 | 0 |
| hero · frost neutralised (0 particles) | 2 | 489 | 16.2 | 0 | 0 |
| desktop 1440x900 hero · frost drawing, CPU 1x | 0 | 307.5 | 10.2 | 88366 | 490.3 |
| desktop 1440x900 hero · frost drawing, CPU 1x | 1 | 353.5 | 11.7 | 96186 | 531.7 |
| desktop 1440x900 hero · frost drawing, CPU 1x | 2 | 342.9 | 11.4 | 96186 | 532.1 |
| desktop 1440x900 hero · frost neutralised, CPU 1x | 0 | 102.2 | 3.4 | 0 | 0 |
| desktop 1440x900 hero · frost neutralised, CPU 1x | 1 | 83.2 | 2.8 | 0 | 0 |
| desktop 1440x900 hero · frost neutralised, CPU 1x | 2 | 81.8 | 2.7 | 0 | 0 |

Medians:
- footer · frost drawing (as shipped): 1613.1 ms busy (1396.2–1627.7), 53.3 % · fills 28356
- footer · frost neutralised (0 particles): 1164.8 ms busy (1072.7–1234.9), 38.7 % · fills 0
- hero · frost drawing (as shipped): 1540 ms busy (1519.4–1559.3), 50.8 % · fills 37128
- hero · frost neutralised (0 particles): 456.3 ms busy (446.6–489), 15.2 % · fills 0
- desktop 1440x900 hero · frost drawing, CPU 1x: 342.9 ms busy (307.5–353.5), 11.4 % · fills 96186
- desktop 1440x900 hero · frost neutralised, CPU 1x: 83.2 ms busy (81.8–102.2), 2.8 % · fills 0

Isolated frost drawing cost per 3000 ms:
- mobile, hero off-screen (footer): 448.3 ms of main thread — 100 % of it invisible
- mobile, hero on screen:          1083.6 ms
- desktop CPU 1x, hero on screen:  259.7 ms