# L7-13 exploded-unit boot cost on a mobile connection (390x844 DPR2, CPU 4x)
| net | rep | scroll at ms | three req start | three finished | first WebGL draw | scroll→first draw ms | three KB | worst long task in window | frames in window | mean interval ms |
|---|---|---|---|---|---|---|---|---|---|---|
| fast3g | 0 | 4498.3 | 4602.7 | 6494.8 | 6649.3 | 2151 | 179.3 | 188 ms (blocking 175) | 117 | 19.3 |
| fast3g | 1 | 4494.2 | 4587 | 6482.2 | 6600.6 | 2106.4 | 179.3 | 159 ms (blocking 124) | 116 | 19 |
| fast3g | 2 | 4480.9 | 4543 | 6460.7 | 6605.1 | 2124.2 | 179.3 | 163 ms (blocking 137) | 120 | 18.8 |
| slow3g | 0 | 20461.3 | 20590.2 | 26759.9 | 26890.7 | 6429.4 | 179.3 | 186 ms (blocking 181) | 365 | 18 |
| slow3g | 1 | 20481.7 | 20601.7 | 26815.4 | 26952.1 | 6470.4 | 179.3 | 182 ms (blocking 161) | 374 | 17.6 |
| slow3g | 2 | 20452.4 | 20521.3 | 26728.2 | 26896.6 | 6444.2 | 179.3 | 191 ms (blocking 199) | 372 | 17.6 |

Medians:
- fast3g: scroll→first draw 2124.2 ms (2106.4–2151) · download 1895.2 ms · parse/setup after download 144.4 ms · worst long task 163 ms · mean frame interval in window 19 ms
- slow3g: scroll→first draw 6444.2 ms (6429.4–6470.4) · download 6206.9 ms · parse/setup after download 136.7 ms · worst long task 186 ms · mean frame interval in window 17.6 ms