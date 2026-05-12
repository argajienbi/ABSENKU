# Agent Instructions

## Custom User Guidelines

### Build Optimization
- To maintain hosting performance (especially on Vercel) and avoid chunk-size warnings:
  - Use `React.lazy` and `Suspense` for large components and primary routes.
    - Update `manualChunks` inside `vite.config.ts` when adding large external dependencies.
      - Avoid unnecessarily increasing the main bundle size.
        - Prefer code splitting for dashboard pages, editors, analytics, AI modules, and admin panels.

        ---

        # GLOBAL RULES

        ## 1. Token Efficiency Rules

        - Avoid unnecessary explanations.
        - Use concise technical responses.
        - Do not repeat user prompts.
        - Do not regenerate entire files for small changes.
        - Show minimal diffs when possible.
        - Avoid verbose disclaimers.
        - Avoid explaining obvious code.

        Preferred:
        - short,
        - direct,
        - actionable.

        ---

        ## 2. Error Prevention Rules

        Before responding:
        - Check whether previous attempts already failed.
        - Never repeat the same failing solution.
        - If the same error appears twice:
          - change strategy,
            - investigate root cause first.

            After 2 failed attempts:
            - summarize failure,
            - identify likely cause,
            - use alternative approach.

            ---

            ## 3. Smart Retry Policy

            Retry only for:
            - transient network errors,
            - temporary service failures,
            - dependency initialization delays.

            Do NOT retry:
            - syntax errors,
            - schema mismatch,
            - invalid API usage,
            - permission errors,
            - logical bugs.

            Maximum retries:
            - 2.

            ---

            ## 4. Memory Compression

            When context becomes large:
            retain only:
            - project goal,
            - active task,
            - current state,
            - failed attempts,
            - confirmed decisions.

            Discard:
            - verbose reasoning,
            - outdated logs,
            - irrelevant history.

            Preferred format:

            STATE:
            - Goal:
            - Current:
            - Failed:
            - Decisions:

            ---

            # CODING RULES

            ## 5. Coding Priorities

            Priority order:
            1. readability
            2. maintainability
            3. performance
            4. architecture elegance

            Avoid:
            - premature abstraction,
            - unnecessary microservices,
            - excessive dependencies,
            - overengineering.

            ---

            ## 6. File Editing Rules

            - Avoid rewriting entire files for small changes.
            - Use targeted patches.
            - Preserve:
              - existing coding style,
                - naming conventions,
                  - architecture patterns.

                  Rewrite full files only if:
                  - structural redesign is required.

                  ---

                  ## 7. Debugging Rules

                  When debugging:
                  1. identify root cause,
                  2. explain cause briefly,
                  3. apply minimal fix.

                  Do NOT:
                  - blindly rewrite logic,
                  - guess without evidence,
                  - stack random fixes.

                  ---

                  ## 8. Planning Rules

                  For large tasks:
                  use short execution plans.

                  Format:
                  1. inspect
                  2. patch
                  3. test
                  4. verify

                  Avoid long planning for simple fixes.

                  ---

                  # RESPONSE STYLE

                  ## 9. Communication Style

                  Use:
                  - concise wording,
                  - technical clarity,
                  - direct execution-oriented language.

                  Avoid:
                  - motivational filler,
                  - excessive politeness,
                  - repeated summaries.

                  Good:
                  - "Issue caused by stale state reference."
                  - "Chunk splitting required for editor module."

                  Bad:
                  - "I would be very happy to assist you..."

                  ---

                  ## 10. Output Rules

                  Default behavior:
                  - short output.

                  Only provide deep explanation if:
                  - user requests detail,
                  - architecture decisions matter,
                  - security/performance is involved.

                  Priority:
                  1. result
                  2. important changes
                  3. explanation

                  ---

                  # PERFORMANCE MODE

                  ## 11. Fast Mode

                  For simple tasks:
                  - execute immediately,
                  - minimize analysis,
                  - avoid over-planning.

                  Examples:
                  - typo fixes,
                  - imports,
                  - small refactors,
                  - styling fixes.

                  ---

                  ## 12. Deep Mode

                  Use deeper analysis only for:
                  - architecture redesign,
                  - concurrency,
                  - production bugs,
                  - security issues,
                  - performance bottlenecks.

                  ---

                  # TOOL USAGE

                  ## 13. Tool Discipline

                  Minimize unnecessary file access.

                  Avoid:
                  - scanning entire repositories,
                  - reopening same files repeatedly,
                  - unnecessary directory traversal.

                  Preferred workflow:
                  1. targeted read
                  2. targeted edit
                  3. targeted validation

                  ---

                  # CONTEXT MANAGEMENT

                  ## 14. Context Priority

                  Prioritize:
                  1. current task
                  2. active errors
                  3. relevant files
                  4. recent decisions

                  Ignore:
                  - unrelated old context.

                  ---

                  # SAFETY RULES

                  ## 15. Destructive Action Policy

                  Never:
                  - delete major files,
                  - overwrite configs,
                  - perform large migrations,
                  - remove database structures,

                  without explicit confirmation.

                  ---

                  # TESTING RULES

                  ## 16. Test Strategy

                  Minimum required validation:
                  - syntax check,
                  - import validation,
                  - runtime sanity check.

                  Avoid:
                  - full builds,
                  - full test suites,

                  unless changes are significant.

                  ---

                  # FINAL RESPONSE FORMAT

                  ## 17. Final Answer Structure

                  Preferred structure:

                  DONE:
                  - completed changes

                  CAUSE:
                  - root issue

                  CHANGED:
                  - modified files

                  OPTIONAL:
                  - possible future improvements

                  ---

                  # ANTI-LOOP RULES

                  ## 18. Loop Prevention

                  If repeated failures occur:
                  - stop retrying,
                  - summarize issue,
                  - switch strategy.

                  Loop indicators:
                  - identical output twice,
                  - same patch twice,
                  - same retry twice.

                  ---

                  # LATENCY OPTIMIZATION

                  ## 19. Speed Optimization

                  Prefer:
                  - local fixes,
                  - incremental edits,
                  - minimal patches.

                  Avoid:
                  - unnecessary rewrites,
                  - large rebuilds,
                  - regenerating stable code.

                  ---

                  # INTELLIGENCE HEURISTICS

                  ## 20. Decision Heuristics

                  Always prefer:
                  - simplest working solution,
                  - smallest effective change,
                  - backward-compatible fixes.

                  Rule:
                  "minimum change, maximum impact"

                  ---

                  # FRONTEND PERFORMANCE RULES

                  ## 21. React Performance

                  - Memoize expensive computations.
                  - Avoid unnecessary re-renders.
                  - Use route-level lazy loading.
                  - Use dynamic imports for:
                    - editors,
                      - charts,
                        - AI modules,
                          - dashboards,
                            - admin pages.

                            Preferred:
                            ```tsx id="k4c9n1"
                            const AdminPage = React.lazy(() => import("./AdminPage"));