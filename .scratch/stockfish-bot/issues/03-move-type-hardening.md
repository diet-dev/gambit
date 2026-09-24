# 03: Типизация хода: union для promotion и общий тип ввода

**What to build:** Ввод хода типизирован строго. Превращение — union `'q' | 'r' | 'b' | 'n'`, а форма `{ from, to, promotion? }` вынесена в один общий экспортируемый тип вместо трёх inline-объявлений (хук игры, парсер UCI, хук соперника).

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] `promotion` типизирован как union, а не `string`.
- [ ] Единый общий тип используется хуком игры, парсером UCI и UI.
- [ ] Тесты покрывают превращения `r`/`b`/`n`, не только `q`.
- [ ] `npm test`, `npm run lint`, `npm run typecheck` зелёные.
