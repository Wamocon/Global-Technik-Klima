B=http://localhost:4321
for p in \
  "/instruction.md" "/HANDBUCH.md" "/Senior_UI_Tech_Audit_Methode_und_Testlauf.md" \
  "/docs/" "/docs/index.html" "/content/de/master.md" "/content/" \
  "/.git/config" "/.git/HEAD" "/.env" "/.env.production" \
  "/api/chat" "/api/chat.js" "/api/" \
  "/package.json" "/package-lock.json" "/vercel.json" "/astro.config.mjs" \
  "/src/content/home.ts" "/src/components/Assistant.astro" "/scripts/guard.mjs" \
  "/node_modules/" "/.astro/" "/robots.txt" "/sitemap-0.xml" "/sitemap-index.xml" \
  "/angebot/" "/angebot/Global%20Technik%20Klima%20Bestellung.html" \
  "/og.jpg" "/favicon.svg" "/404.html" "/definitely-not-here-xyz" \
  "/.well-known/security.txt" "/_astro/" "/dist/" "/..%2f..%2fpackage.json" \
  "/%2e%2e/%2e%2e/package.json" "/kvkk" ; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$B$p")
  len=$(curl -s -o /dev/null -w "%{size_download}" "$B$p")
  ct=$(curl -s -o /dev/null -w "%{content_type}" "$B$p")
  printf "%-4s %-9s %-26s %s\n" "$code" "$len" "$ct" "$p"
done
