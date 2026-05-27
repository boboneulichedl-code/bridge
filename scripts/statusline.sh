#!/usr/bin/env bash
# Agent Bridge CLI Statusline — zeigt Modell und Kontext-Nutzung
payload=$(cat)
model=$(echo "$payload" | jq -r '.model.display_name // "Agent"')
pct=$(echo "$payload" | jq -r '.context_window.used_percentage // 0' | cut -d. -f1)
session=$(echo "$payload" | jq -r '.session_name // .session_id // ""' | cut -c1-20)
printf "\033[36mBridge\033[0m \033[90m%s\033[0m  ctx %s%%" "$model" "$pct"
[ -n "$session" ] && printf "  \033[90m%s\033[0m" "$session"
