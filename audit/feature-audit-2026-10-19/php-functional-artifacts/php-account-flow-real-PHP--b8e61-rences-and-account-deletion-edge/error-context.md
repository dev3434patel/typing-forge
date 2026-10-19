# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: php-account-flow.spec.ts >> real PHP account signup, replay upload, independent-device history/preferences and account deletion
- Location: e2e\php-account-flow.spec.ts:6:1

# Error details

```
Test timeout of 90000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=f2e4]:
  - banner [ref=f2e5]:
    - link "Skip to content" [ref=f2e6] [cursor=pointer]:
      - /url: "#main-content"
    - generic [ref=f2e7]:
      - link "SparowType home" [ref=f2e8] [cursor=pointer]:
        - /url: /
        - generic [ref=f2e9]:
          - generic [ref=f2e10]: Sparow
          - generic [ref=f2e11]: Type
      - navigation "Main navigation" [ref=f2e12]:
        - link "Test" [ref=f2e13] [cursor=pointer]:
          - /url: /
        - link "Learn" [ref=f2e16] [cursor=pointer]:
          - /url: /learn
        - link "Race" [ref=f2e20] [cursor=pointer]:
          - /url: /race
        - link "Stats" [ref=f2e30] [cursor=pointer]:
          - /url: /stats
        - link "Rankings" [ref=f2e33] [cursor=pointer]:
          - /url: /leaderboard
        - link "Keyboard Lab" [ref=f2e40] [cursor=pointer]:
          - /url: /keyboard-lab
      - generic [ref=f2e43]:
        - button "Switch to dark theme" [ref=f2e44]
        - button "Open command palette" [ref=f2e47]
        - link "Settings" [ref=f2e50] [cursor=pointer]:
          - /url: /settings
        - link "Account" [ref=f2e54] [cursor=pointer]:
          - /url: /profile
  - main [ref=f2e59]:
    - generic [ref=f2e60]:
      - generic [ref=f2e66]:
        - paragraph [ref=f2e67]: Your SparowType profile
        - heading "typist_741cf63c58bc43df" [level=1] [ref=f2e68]
        - paragraph [ref=f2e69]: 1 saved sessions · 0.1 minutes practiced
      - button "Sign out" [ref=f2e70]
    - generic [ref=f2e71]:
      - generic [ref=f2e72]:
        - generic [ref=f2e73]:
          - heading "Public identity" [level=2] [ref=f2e74]
          - paragraph [ref=f2e75]: A handle appears in human rooms and eligible rankings. Your email is private.
          - generic [ref=f2e76]: Handle
          - textbox "Handle" [active] [ref=f2e77]:
            - /placeholder: forge_typist
            - text: typist_741cf63c58bc43df
          - paragraph [ref=f2e78]: 3–24 lowercase letters, numbers or underscores.
          - button "Save handle" [disabled] [ref=f2e79]
        - generic [ref=f2e80]:
          - heading "Your data, your choice" [level=2] [ref=f2e81]
          - paragraph [ref=f2e85]: Replay evidence and private text expire after 90 days. Summary history stays until you delete it. Cloud storage of private passages needs separate consent for each session.
          - button "Export this workspace" [ref=f2e86]
          - link "Practice & appearance settings" [ref=f2e90] [cursor=pointer]:
            - /url: /settings
          - paragraph [ref=f2e94]: "Workspace: signed-in account · durable browser storage"
      - generic [ref=f2e95]:
        - generic [ref=f2e96]:
          - heading "Personal bests by comparison" [level=2] [ref=f2e97]
          - paragraph [ref=f2e98]: V3 metrics only. Repeated content, languages and durations are separate comparisons.
          - generic [ref=f2e100]:
            - paragraph [ref=f2e101]: words · 10 words · en · qwerty · keyboard · prose
            - paragraph [ref=f2e102]: 135.4 WPM
        - generic [ref=f2e103]:
          - generic [ref=f2e104]:
            - generic [ref=f2e105]:
              - heading "Your saved sessions" [level=2] [ref=f2e106]
              - paragraph [ref=f2e107]: Deletion also reconciles cloud comparisons and learning evidence.
            - link "View progress" [ref=f2e108] [cursor=pointer]:
              - /url: /stats
          - generic [ref=f2e110]:
            - generic [ref=f2e111]:
              - paragraph [ref=f2e112]:
                - text: words
                - generic [ref=f2e113]: 135.4 WPM
              - paragraph [ref=f2e114]: 19/10/2026, 10:54:17 pm · synced
            - button "Delete words session from 19/10/2026, 10:54:17 pm" [ref=f2e115]: Delete
    - generic [ref=f2e116]:
      - heading "Delete account" [level=2] [ref=f2e117]
      - paragraph [ref=f2e118]: Permanently remove this account, owned sessions, cloud evidence, shares and learning data. Host-owned rooms are removed; other shared race records anonymize your identity. Downloaded exports must be removed separately. Export your history first if you want a copy.
      - generic [ref=f2e119]: Type DELETE to enable this action
      - generic [ref=f2e120]:
        - textbox "Type DELETE to enable this action" [ref=f2e121]
        - button "Permanently delete account" [disabled] [ref=f2e122]
  - contentinfo [ref=f2e123]:
    - generic [ref=f2e124]:
      - generic [ref=f2e125]:
        - generic [ref=f2e126]:
          - generic [ref=f2e127]: Sparow
          - generic [ref=f2e128]: Type
        - text: Find your rhythm.
      - generic [ref=f2e129]:
        - link "About & metrics" [ref=f2e130] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=f2e131] [cursor=pointer]:
          - /url: /settings
        - link "Touch typing guide" [ref=f2e132] [cursor=pointer]:
          - /url: /touch-typing
        - link "Privacy" [ref=f2e133] [cursor=pointer]:
          - /url: /privacy
        - link "Terms" [ref=f2e134] [cursor=pointer]:
          - /url: /terms
        - link "Offline" [ref=f2e135] [cursor=pointer]:
          - /url: /offline
        - generic [ref=f2e136]: SparowType © 2026
```