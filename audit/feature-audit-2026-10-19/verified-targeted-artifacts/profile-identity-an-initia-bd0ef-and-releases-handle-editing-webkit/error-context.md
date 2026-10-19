# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: profile-identity.spec.ts >> an initial profile fetch error remains visible and releases handle editing
- Location: e2e\profile-identity.spec.ts:85:1

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - banner [ref=e5]:
    - link "Skip to content" [ref=e6]:
      - /url: "#main-content"
    - generic [ref=e7]:
      - link "SparowType home" [ref=e8]:
        - /url: /
        - generic [ref=e9]:
          - generic [ref=e10]: Sparow
          - generic [ref=e11]: Type
      - generic [ref=e12]:
        - button "Switch to light theme" [ref=e13]
        - button "Open command palette" [ref=e20]
        - link "Settings" [ref=e23]:
          - /url: /settings
        - link "Sign in" [ref=e27]:
          - /url: /auth
    - navigation "Mobile navigation" [ref=e32]:
      - link "Test" [ref=e33]:
        - /url: /
      - link "Learn" [ref=e36]:
        - /url: /learn
      - link "Race" [ref=e40]:
        - /url: /race
      - link "Stats" [ref=e50]:
        - /url: /stats
      - link "Rankings" [ref=e53]:
        - /url: /leaderboard
      - link "Keyboard Lab" [ref=e60]:
        - /url: /keyboard-lab
  - main [ref=e63]:
    - generic [ref=e64]:
      - generic [ref=e70]:
        - paragraph [ref=e71]: Your SparowType profile
        - heading "Guest workspace" [level=1] [ref=e72]
        - paragraph [ref=e73]: 0 saved sessions · 0.0 minutes practiced
      - link "Sign in" [ref=e74]:
        - /url: /auth
    - generic [ref=e78]:
      - generic [ref=e79]:
        - generic [ref=e80]:
          - heading "Public identity" [level=2] [ref=e81]
          - paragraph [ref=e82]: A handle appears in human rooms and eligible rankings. Your email is private.
          - generic [ref=e83]: Handle
          - textbox "Handle" [disabled] [ref=e84]:
            - /placeholder: Sign in to choose a handle
          - paragraph [ref=e85]: 3–24 lowercase letters, numbers or underscores.
          - button "Save handle" [disabled] [ref=e86]
        - generic [ref=e87]:
          - heading "Your data, your choice" [level=2] [ref=e88]
          - paragraph [ref=e92]: Raw replay evidence and private text expire after 90 days. Summaries and public-corpus learning data, including expected and typed keys with timing, can remain until you delete the session or account. Cloud storage of private passages needs separate consent for each session.
          - button "Export this workspace" [disabled] [ref=e93]
          - link "Practice & appearance settings" [ref=e97]:
            - /url: /settings
          - paragraph [ref=e101]: "Workspace: guest · durable browser storage"
      - generic [ref=e102]:
        - generic [ref=e103]:
          - heading "Personal bests by comparison" [level=2] [ref=e104]
          - paragraph [ref=e105]: V3 metrics only. Repeated content, languages and durations are separate comparisons.
          - paragraph [ref=e106]: Complete a V3 session to set your first personal best.
        - generic [ref=e107]:
          - generic [ref=e108]:
            - generic [ref=e109]:
              - heading "Your saved sessions" [level=2] [ref=e110]
              - paragraph [ref=e111]: Deletion also reconciles cloud comparisons and learning evidence.
            - link "View progress" [ref=e112]:
              - /url: /stats
          - paragraph [ref=e113]: No sessions saved in this workspace yet.
    - generic [ref=e114]:
      - heading "Reset guest workspace" [level=2] [ref=e115]
      - paragraph [ref=e116]: Remove guest history and learning evidence from this device. Other signed-in workspaces are preserved. Export your history first if you want a copy.
      - generic [ref=e117]: Type DELETE to enable this action
      - generic [ref=e118]:
        - textbox "Type DELETE to enable this action" [ref=e119]
        - button "Reset guest workspace" [disabled] [ref=e120]
  - contentinfo [ref=e121]:
    - generic [ref=e122]:
      - generic [ref=e123]:
        - generic [ref=e124]:
          - generic [ref=e125]: Sparow
          - generic [ref=e126]: Type
        - text: Find your rhythm.
      - generic [ref=e127]:
        - link "About & metrics" [ref=e128]:
          - /url: /about
        - link "Preferences & data" [ref=e129]:
          - /url: /settings
        - link "Touch typing guide" [ref=e130]:
          - /url: /touch-typing
        - link "Privacy" [ref=e131]:
          - /url: /privacy
        - link "Terms" [ref=e132]:
          - /url: /terms
        - link "Offline" [ref=e133]:
          - /url: /offline
        - generic [ref=e134]: SparowType © 2026
```