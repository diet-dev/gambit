# 05: Экран «О программе»: уведомления GPL и предложение исходника

**What to build:** Пользователь может открыть экран «О программе»/credits, где указаны атрибуция движка Stockfish (GPL-3.0), доступ к тексту лицензии и предложение Corresponding Source. Закрывает требование GPL-3.0 об Appropriate Legal Notices для интерактивного интерфейса.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] В интерфейсе есть доступный пункт «О программе»/credits.
- [ ] Показаны название и версия движка, копирайт и лицензия GPL-3.0 (текст или ссылка на `Copying.txt`).
- [ ] Указано, где получить Corresponding Source движка.
- [ ] Есть тест рендера экрана; `npm test`, `npm run lint`, `npm run typecheck` зелёные.
