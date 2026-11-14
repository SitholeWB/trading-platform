// Localized titles, categories, and Markdown guides for all 9 sections across
// the 9 non-English supported languages (es, fr, de, zh, ja, pt, ru, zu, af).

class LocalizedSectionText {
  final String title;
  final String categoryKey;
  final String markdown;

  const LocalizedSectionText({
    required this.title,
    required this.categoryKey,
    required this.markdown,
  });
}

const Map<String, Map<String, LocalizedSectionText>> kSectionDocsL10n = {
  'es': {
    'dashboard': LocalizedSectionText(
      title: 'Panel — Cuenta, Lista de Seguimiento y Ejecución Rápida',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### Qué hace el Panel
El **Panel** es tu centro de control para la salud de la cuenta demo/simulada, cotizaciones en vivo, posiciones abiertas y órdenes rápidas.

### Cómo usarlo
- **KPIs de Cuenta:** Supervisa **Balance**, **Equidad**, **P&L No Realizado** y **Drawdown Diario %** frente a tu límite de riesgo.
- **Lista de Seguimiento:** Haz clic en cualquier símbolo para cambiar el instrumento activo o ir directo al **Gráfico en Vivo**.
- **Ticket Rápido:** Coloca órdenes **Compra** o **Venta** al instante con tamaño de lote y Stop-Loss / Take-Profit opcionales.
''',
    ),
    'scanner': LocalizedSectionText(
      title: 'Escáner de Mercado — Radar Técnico Multi-Activo',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### Qué hace el Escáner de Mercado
Analiza Forex, Cripto, Índices, Materias Primas y Acciones localmente con **EMA 20/50**, **RSI(14)** y **ATR(14)** usando **0 tokens de IA**.

### Cómo usarlo
1. Elige el filtro de **Categoría** y el **Marco Temporal**.
2. Pulsa **Scan Market** para ordenar instrumentos por fuerza de señal (`Strong Buy`, `Buy`, `Neutral`, `Sell`, `Strong Sell`).
3. Pulsa **Chart** en cualquier fila para verlo en el gráfico o ejecuta **Quick Buy/Sell**.
''',
    ),
    'strategies': LocalizedSectionText(
      title: 'Estrategias — Reglas Anidadas, Compilador IA y Backtester',
      categoryKey: 'docs.catRuleStudio',
      markdown: '''
### Qué hace Estrategias (Rule Studio)
Crea, compila, haz backtesting y ejecuta estrategias algorítmicas localmente en Dart con **0 tokens**.

### Funciones clave
1. **Compilador IA en Texto Plano:** Describe tu estrategia (ej. *"Major FX H1 con filtro EMA 200 H4: ADX >= 20 AND (RSI < 35 OR Bullish Engulfing)"*).
2. **Árbol de Reglas AND/OR Anidado:** Combina filtros obligatorios en un grupo `AND` con múltiples disparadores en un grupo `OR` (`+ Nested Group`).
3. **Gestión de Riesgo:** Configura dirección (`LongOnly`, `Both`, `ShortOnly`), filtro HTF, Break-Even, Trailing ATR y barras máximas.
4. **Backtest y Universo (0 Tokens):** Prueba 100–5,000 velas históricas en 1 símbolo o en todo un **Universo**, y pide **AI 2nd Opinion** solo en señales activas.
''',
    ),
    'radar': LocalizedSectionText(
      title: 'Radar de Auditoría — Diagnóstico de Señales',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### Qué hace el Radar de Auditoría
Registra cada evaluación de estrategia (`Executed`, `NearMiss`, `Rejected`) con su puntuación exacta y desglose de reglas.

### Cómo usarlo
- Revisa entradas **NearMiss** para ver qué condición bloqueó una operación.
- Verifica por qué señales pausadas o bloqueadas por riesgo fueron **Rejected**.
''',
    ),
    'positions': LocalizedSectionText(
      title: 'Posiciones — Libro de Operaciones Abiertas y Cerradas',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### Qué hace Posiciones
Rastrea todas las operaciones simuladas abiertas y cerradas con P&L en tiempo real, edición de SL/TP y revisión post-trade.

### Cómo usarlo
- **Modifica SL/TP** o **Cierra** cualquier posición abierta en 1 clic.
- Añade **Etiqueta de Setup**, **Calificación (1–5 estrellas)** y **Nota** a cada operación.
''',
    ),
    'journal': LocalizedSectionText(
      title: 'Diario — Cuaderno de Trading en Markdown',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### Qué hace el Diario
Un cuaderno completo en **Markdown** para planes previos al mercado, revisiones, lecciones y análisis guardados del Copiloto IA.

### Cómo usarlo
- **Menú Izquierdo:** Busca por símbolo, título o palabra clave y filtra por **Etiqueta**.
- **Editor:** Usa los modos **Write**, **Split** (vista previa en vivo) y **Preview**.
- **Desde Copiloto IA:** Guarda cualquier respuesta o una **Sesión Completa** como nota nueva o anexada.
''',
    ),
    'sandbox': LocalizedSectionText(
      title: 'Simulador — Laboratorio Sintético de Mercado y Riesgo',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### Qué hace el Simulador
> **Nota:** Usa **DATOS SINTÉTICOS / FICTICIOS** (no precios reales). Sirve para probar cómo sobreviven tus estrategias y gestión de riesgo ante escenarios extremos.

### Dos Modos
1. **Stress-Test de Estrategia:** Elige cualquier estrategia, periodo **1M / 3M / 6M / 1Y** y régimen (Tendencia Alcista, Bajista, Rango o Flash Crash).
2. **Repetición de Choques en Vivo:** Inyecta **Breakout +1.5%**, **Flash Crash -2.5%** o **Mechas Stop-Hunt** para verificar SL/TP y alertas.
''',
    ),
    'chart': LocalizedSectionText(
      title: 'Gráfico en Vivo — Motores Duales y Precisión Dinámica',
      categoryKey: 'docs.catChartsPrecision',
      markdown: '''
### Qué hace Gráfico en Vivo
Alterna entre el **Gráfico Nativo GPU** y **TradingView Live** desde la barra superior.

### Cómo usarlo
- Activa `EMA`, `SMA`, `Bollinger`, `VWAP`, `Supertrend`, `Ichimoku`, `RSI` y `MACD`, o usa vista **Single / Split / Quad**.
- **Precisión Dinámica:** Muestra automáticamente 10+ decimales para tokens micro-cap y pips exactos para FX.
''',
    ),
    'docs': LocalizedSectionText(
      title: 'Copiloto IA, Sesiones y Atajos de Teclado',
      categoryKey: 'docs.catRuleStudio',
      markdown: '''
### Copiloto IA
- **Sesiones Persistentes:** Cada conversación se guarda automáticamente; las preguntas de secciones usan la sesión dedicada **Guía de Plataforma**.
- **Acciones en 1 Clic:** Ejecuta órdenes simuladas, alertas, estrategias o guarda notas directo desde el chat.
- **IA Local y Nube:** Compatible con **Gemini**, **OpenAI**, **Anthropic**, **Groq**, **OpenRouter**, **Ollama** y **Built-in Quant**.

### Atajos
- `Ctrl+K`: Buscar Símbolo · `Ctrl+J`: Nueva Nota · `Ctrl+B`: Copiloto IA · `F1`: Documentación
''',
    ),
  },
  'fr': {
    'dashboard': LocalizedSectionText(
      title: 'Tableau de bord — Compte, Watchlist & Exécution Rapide',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### Rôle du Tableau de bord
Le **Tableau de bord** centralise l'état de votre compte démo, la watchlist en direct, les positions ouvertes et le passage d'ordres rapide.

### Utilisation
- **Indicateurs de compte :** Suivez **Balance**, **Équité**, **P&L Latent** et **Drawdown Journalier %**.
- **Watchlist :** Cliquez sur un symbole pour changer l'instrument actif ou ouvrir le **Graphique en Direct**.
- **Ticket rapide :** Passez des ordres **Achat** ou **Vente** avec Stop-Loss / Take-Profit.
''',
    ),
    'scanner': LocalizedSectionText(
      title: 'Scanner de Marché — Radar Technique Multi-Actifs',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### Rôle du Scanner
Analyse Forex, Crypto, Indices, Matières Premières et Actions localement via **EMA 20/50**, **RSI(14)** et **ATR(14)** avec **0 token IA**.

### Utilisation
1. Sélectionnez la **Catégorie** et l'**Unité de temps**.
2. Cliquez sur **Scan Market** pour classer les actifs par force de signal.
3. Cliquez sur **Chart** pour inspecter le graphique ou passez un ordre rapide.
''',
    ),
    'strategies': LocalizedSectionText(
      title: 'Stratégies — Règles Imbriquées, Compilateur IA & Backtest',
      categoryKey: 'docs.catRuleStudio',
      markdown: '''
### Rôle de Stratégies (Rule Studio)
Créez, compilez, backtestez et exécutez des stratégies algorithmiques localement avec **0 token**.

### Points clés
1. **Compilateur IA en texte clair :** Décrivez votre stratégie pour générer automatiquement la logique `AND`/`OR` imbriquée.
2. **Arbre de règles AND/OR :** Combinez filtres obligatoires (`AND`) et déclencheurs alternatifs (`OR`).
3. **Gestion du risque :** Direction, filtre HTF, Break-Even, Trailing ATR et sortie max.
4. **Backtest & Univers :** Testez 100–5 000 bougies sur 1 actif ou tout un **Univers**.
''',
    ),
    'radar': LocalizedSectionText(
      title: "Radar d'Audit — Diagnostic des Signaux",
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### Rôle du Radar d'Audit
Enregistre chaque évaluation (`Executed`, `NearMiss`, `Rejected`) avec le score exact de correspondance.

### Utilisation
- Inspectez les **NearMiss** pour voir quelle règle a bloqué l'entrée.
- Vérifiez la raison des signaux **Rejected**.
''',
    ),
    'positions': LocalizedSectionText(
      title: 'Positions — Registre des Trades Ouverts et Fermés',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### Rôle de Positions
Suit toutes les positions papier ouvertes et fermées avec P&L temps réel et revue post-trade.

### Utilisation
- **Modifiez SL/TP** ou **Fermez** une position en 1 clic.
- Ajoutez un **Tag de Setup**, une **Note (1–5 étoiles)** et un **Commentaire**.
''',
    ),
    'journal': LocalizedSectionText(
      title: 'Journal — Carnet de Trading Markdown',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### Rôle du Journal
Un carnet **Markdown** pour vos plans de séance, revues de trades et analyses du Copilote IA.

### Utilisation
- **Menu gauche :** Recherchez par symbole ou mot-clé et filtrez par **Tag**.
- **Éditeur :** Modes **Write**, **Split** (aperçu en direct) et **Preview**.
''',
    ),
    'sandbox': LocalizedSectionText(
      title: 'Simulateur — Laboratoire Synthétique & Stress-Test',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### Rôle du Simulateur
> **Note :** Utilise des **DONNÉES SYNTHÉTIQUES** (non réelles) pour tester la résilience de vos stratégies et de votre gestion du risque.

### Deux Modes
1. **Stress-Test Stratégie :** Choisissez une stratégie, une durée (**1M / 3M / 6M / 1Y**) et un régime (Haussier, Baissier, Range, Krach).
2. **Chocs en Direct :** Injectez des mouvements brusques pour vérifier vos SL/TP et alertes.
''',
    ),
    'chart': LocalizedSectionText(
      title: 'Graphique en Direct — Double Moteur & Précision Dynamique',
      categoryKey: 'docs.catChartsPrecision',
      markdown: '''
### Rôle du Graphique en Direct
Basculez entre le **Graphique Natif GPU** et **TradingView Live** depuis la barre supérieure.

### Utilisation
- Activez `EMA`, `SMA`, `Bollinger`, `VWAP`, `Supertrend`, `Ichimoku`, `RSI`, `MACD` et les grilles **Single / Split / Quad**.
''',
    ),
    'docs': LocalizedSectionText(
      title: 'Copilote IA, Sessions & Raccourcis Clavier',
      categoryKey: 'docs.catRuleStudio',
      markdown: '''
### Copilote IA
- **Sessions persistantes :** Vos discussions sont sauvegardées automatiquement ; l'aide des sections utilise la session dédiée **Guide Plateforme**.
- **IA Locale & Cloud :** **Gemini**, **OpenAI**, **Anthropic**, **Groq**, **OpenRouter**, **Ollama** et **Built-in Quant**.

### Raccourcis
- `Ctrl+K` : Recherche · `Ctrl+J` : Nouvelle note · `Ctrl+B` : Copilote IA · `F1` : Documentation
''',
    ),
  },
  'de': {
    'dashboard': LocalizedSectionText(
      title: 'Dashboard — Konto, Watchlist & Schnelle Ausführung',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### Was das Dashboard macht
Deine Kommandozentrale für Demokonto-Kennzahlen, Live-Watchlist, offene Positionen und schnelle Orders.

### Bedienung
- **Konto-KPIs:** Überwache **Balance**, **Equity**, **Unrealisiertes P&L** und **Täglichen Drawdown %**.
- **Watchlist:** Klicke auf ein Symbol, um den Markt zu wechseln oder den **Live-Chart** zu öffnen.
''',
    ),
    'scanner': LocalizedSectionText(
      title: 'Markt-Scanner — Multi-Asset Technik-Radar',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### Was der Markt-Scanner macht
Scannt Forex, Krypto, Indizes, Rohstoffe und Aktien lokal mit **EMA 20/50**, **RSI(14)** und **ATR(14)** — mit **0 KI-Tokens**.
''',
    ),
    'strategies': LocalizedSectionText(
      title: 'Strategien — Verschachtelte Regeln, KI-Compiler & Backtester',
      categoryKey: 'docs.catRuleStudio',
      markdown: '''
### Was Strategien (Rule Studio) macht
Erstelle, kompiliere und teste algorithmische Strategien lokal mit **0 Tokens**.

### Funktionen
1. **KI-Klartext-Compiler:** Beschreibe deine Strategie in Alltagssprache für verschachtelte `AND`/`OR`-Regeln.
2. **Verschachtelter Regelbaum:** Kombiniere Pflichtfilter (`AND`) mit alternativen Triggern (`OR`).
3. **Backtest & Universum (0 Tokens):** Teste 100–5.000 Kerzen auf 1 Symbol oder einem ganzen **Universum**.
''',
    ),
    'radar': LocalizedSectionText(
      title: 'Audit-Radar — Signal- & Near-Miss-Diagnose',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### Was Audit-Radar macht
Protokolliert jede Auswertung (`Executed`, `NearMiss`, `Rejected`) mit Regel-Aufschlüsselung.
''',
    ),
    'positions': LocalizedSectionText(
      title: 'Positionen — Offene & Geschlossene Trades',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### Was Positionen macht
Verfolgt alle offenen und geschlossenen Paper-Trades mit Echtzeit-P&L, SL/TP-Bearbeitung und Trade-Review.
''',
    ),
    'journal': LocalizedSectionText(
      title: 'Tagebuch — Markdown Trading-Notizbuch',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### Was das Tagebuch macht
Ein **Markdown-Notizbuch** für Handelspläne, Trade-Reviews und gespeicherte KI-Copilot-Analysen.
''',
    ),
    'sandbox': LocalizedSectionText(
      title: 'Simulator — Synthetisches Markt- & Risiko-Labor',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### Was der Simulator macht
> **Hinweis:** Verwendet **SYNTHETISCHE DATEN** (keine echten Marktpreise), um Strategien und Risikomanagement unter Stress zu testen.
''',
    ),
    'chart': LocalizedSectionText(
      title: 'Live-Chart — Duale Chart-Engines & Dynamische Präzision',
      categoryKey: 'docs.catChartsPrecision',
      markdown: '''
### Was Live-Chart macht
Wechsle nahtlos zwischen dem **Nativen GPU Bot-Chart** und **TradingView Live** in der oberen Leiste.
''',
    ),
    'docs': LocalizedSectionText(
      title: 'KI-Copilot, Sitzungen & Tastenkürzel',
      categoryKey: 'docs.catRuleStudio',
      markdown: '''
### KI-Copilot
- **Persistente Sitzungen:** Bereichs-Hilfe nutzt automatisch die eigene Sitzung **Plattform-Hilfe**.
- **Kürzel:** `Ctrl+K` Suche · `Ctrl+J` Neue Notiz · `Ctrl+B` KI-Copilot · `F1` Dokumentation.
''',
    ),
  },
  'zh': {
    'dashboard': LocalizedSectionText(
      title: '仪表盘 — 账户、自选列表与快速下单',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### 仪表盘功能
**仪表盘**是查看模拟账户健康度、实时自选报价、持仓和快速下单的控制中心。

### 使用方法
- **账户指标：** 监控 **余额**、**净值**、**浮动盈亏** 和 **当日回撤 %**。
- **自选列表：** 点击任意品种切换当前标的或跳转至 **实时图表**。
- **快速下单：** 一键下达 **买入 / 卖出** 模拟单并设置止损止盈。
''',
    ),
    'scanner': LocalizedSectionText(
      title: '市场扫描器 — 多资产技术雷达',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### 市场扫描器功能
本地使用 **EMA 20/50**、**RSI(14)** 和 **ATR(14)** 扫描外汇、加密货币、指数、大宗商品和股票，**消耗 0 AI Token**。
''',
    ),
    'strategies': LocalizedSectionText(
      title: '策略工作室 — 嵌套规则、AI 编译器与零 Token 回测',
      categoryKey: 'docs.catRuleStudio',
      markdown: '''
### 策略工作室功能
在本地构建、编译、回测并运行算法策略，**执行消耗 0 Token**。

### 核心功能
1. **自然语言 AI 策略编译器：** 用普通语言描述策略，自动生成嵌套 `AND`/`OR` 规则树与风控参数。
2. **嵌套 AND/OR 规则树：** 将必需过滤条件放在 `AND` 组，将多个入场触发条件放在嵌套 `OR` 组。
3. **零 Token 回测与扫描：** 支持 100–5,000 根历史 K 线回测及全市场扫描。
''',
    ),
    'radar': LocalizedSectionText(
      title: '审计雷达 — 信号与临界未触发诊断',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### 审计雷达功能
记录每次策略评估（`Executed`、`NearMiss`、`Rejected`）及精确的规则匹配明细。
''',
    ),
    'positions': LocalizedSectionText(
      title: '持仓管理 — 开仓与平仓记录',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### 持仓管理功能
实时跟踪所有开仓与已平仓模拟交易，支持一键修改止损/止盈、平仓以及交易复盘评分。
''',
    ),
    'journal': LocalizedSectionText(
      title: '交易日志 — 分栏 Markdown 交易笔记',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### 交易日志功能
用于记录盘前计划、交易复盘和保存 AI 副驾驶分析的 **Markdown 笔记本**，支持 **编辑 / 分栏 / 预览** 模式。
''',
    ),
    'sandbox': LocalizedSectionText(
      title: '模拟器 — 合成行情与风控压力测试实验室',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### 模拟器功能
> **注意：** 使用 **合成/模拟数据**（非真实行情），专门用于测试策略与止损风控在极端行情下的表现。
''',
    ),
    'chart': LocalizedSectionText(
      title: '实时图表 — 双图表引擎与动态精度',
      categoryKey: 'docs.catChartsPrecision',
      markdown: '''
### 实时图表功能
可在顶部栏无缝切换 **原生 GPU 机器人图表** 与 **TradingView 实时图表**，自动支持 10+ 位小数精度。
''',
    ),
    'docs': LocalizedSectionText(
      title: 'AI 副驾驶、会话与快捷键',
      categoryKey: 'docs.catRuleStudio',
      markdown: '''
### AI 副驾驶
- **独立帮助会话：** 点击各模块“询问 AI”会自动进入 **平台指南** 会话，不干扰你的交易日志会话。
- **快捷键：** `Ctrl+K` 搜索品种 · `Ctrl+J` 新建日志 · `Ctrl+B` 开关副驾驶 · `F1` 文档。
''',
    ),
  },
  'ja': {
    'dashboard': LocalizedSectionText(
      title: 'ダッシュボード — 口座・監視リスト・クイック発注',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### ダッシュボードの概要
デモ口座の健全性、リアルタイム監視リスト、保有ポジション、高速発注をまとめたコマンドセンターです。
''',
    ),
    'scanner': LocalizedSectionText(
      title: 'マーケットスキャナー — マルチ資産テクニカルレーダー',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### スキャナーの概要
**EMA 20/50**、**RSI(14)**、**ATR(14)** を用いて FX・暗号資産・指数・商品・株式をローカルでスキャンします（**AIトークン消費 0**）。
''',
    ),
    'strategies': LocalizedSectionText(
      title: '戦略スタジオ — ネストルール・AIコンパイラ・0トークン検証',
      categoryKey: 'docs.catRuleStudio',
      markdown: '''
### 戦略スタジオの概要
自然言語から `AND`/`OR` のネストルールを生成し、**0トークン**でローカルバックテストを実行できます。
''',
    ),
    'radar': LocalizedSectionText(
      title: '監査レーダー — シグナル＆ニアミス診断',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### 監査レーダーの概要
すべての戦略評価（`Executed`、`NearMiss`、`Rejected`）をルール内訳とともに記録します。
''',
    ),
    'positions': LocalizedSectionText(
      title: 'ポジション — 保有・決済済み取引台帳',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### ポジション管理の概要
リアルタイム損益、SL/TP 変更、ワンクリック決済、トレードレビューを管理します。
''',
    ),
    'journal': LocalizedSectionText(
      title: '取引日誌 — Markdown トレーディングノート',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### 取引日誌の概要
トレード計画、振り返り、AIコパイロットの分析保存に使える **Markdown ノート**です。
''',
    ),
    'sandbox': LocalizedSectionText(
      title: 'シミュレーター — 合成相場・リスク負荷テスト',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### シミュレーターの概要
> **注意:** **合成（架空）データ**を使用して、極端な相場環境での戦略とリスク管理の耐久性を検証します。
''',
    ),
    'chart': LocalizedSectionText(
      title: 'ライブチャート — デュアルエンジン＆動的精度',
      categoryKey: 'docs.catChartsPrecision',
      markdown: '''
### ライブチャートの概要
上部バーから **ネイティブ GPU チャート** と **TradingView ライブ** を切り替えられます。
''',
    ),
    'docs': LocalizedSectionText(
      title: 'AIコパイロット・セッション・ショートカット',
      categoryKey: 'docs.catRuleStudio',
      markdown: '''
### AIコパイロット & ショートカット
- セクション解説は専用の **プラットフォームガイド** セッションに分離されます。
- `Ctrl+K` 銘柄検索 · `Ctrl+J` 新規日誌 · `Ctrl+B` コパイロット · `F1` ドキュメント
''',
    ),
  },
  'pt': {
    'dashboard': LocalizedSectionText(
      title: 'Painel — Conta, Watchlist e Execução Rápida',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### O que o Painel faz
O **Painel** é o centro de comando para saúde da conta demo, cotações ao vivo, posições abertas e ordens rápidas.
''',
    ),
    'scanner': LocalizedSectionText(
      title: 'Scanner de Mercado — Radar Técnico Multi-Ativos',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### O que o Scanner faz
Analisa Forex, Cripto, Índices, Commodities e Ações localmente com **EMA 20/50**, **RSI(14)** e **ATR(14)** usando **0 tokens de IA**.
''',
    ),
    'strategies': LocalizedSectionText(
      title: 'Estratégias — Regras Aninhadas, Compilador IA e Backtest',
      categoryKey: 'docs.catRuleStudio',
      markdown: '''
### O que Estratégias faz
Crie, compile e teste estratégias algorítmicas localmente com **0 tokens**, usando árvore aninhada `AND`/`OR` e compilação por IA.
''',
    ),
    'radar': LocalizedSectionText(
      title: 'Radar de Auditoria — Diagnóstico de Sinais',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### O que o Radar de Auditoria faz
Registra cada avaliação (`Executed`, `NearMiss`, `Rejected`) com pontuação e detalhamento das regras.
''',
    ),
    'positions': LocalizedSectionText(
      title: 'Posições — Livro de Trades Abertos e Fechados',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### O que Posições faz
Acompanha todos os trades simulados com P&L em tempo real, edição de SL/TP e avaliação pós-trade.
''',
    ),
    'journal': LocalizedSectionText(
      title: 'Diário — Caderno de Trading em Markdown',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### O que o Diário faz
Um caderno **Markdown** para planos de mercado, revisões de trades e análises salvas do Copiloto IA.
''',
    ),
    'sandbox': LocalizedSectionText(
      title: 'Simulador — Laboratório Sintético de Mercado e Risco',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### O que o Simulador faz
> **Nota:** Usa **DADOS SINTÉTICOS / FICTÍCIOS** para testar como suas estratégias e gestão de risco sobrevivem a cenários extremos.
''',
    ),
    'chart': LocalizedSectionText(
      title: 'Gráfico Ao Vivo — Motores Duplos e Precisão Dinâmica',
      categoryKey: 'docs.catChartsPrecision',
      markdown: '''
### O que Gráfico Ao Vivo faz
Alterne entre o **Gráfico Nativo GPU** e o **TradingView Ao Vivo** na barra superior.
''',
    ),
    'docs': LocalizedSectionText(
      title: 'Copiloto IA, Sessões e Atalhos de Teclado',
      categoryKey: 'docs.catRuleStudio',
      markdown: '''
### Copiloto IA & Atalhos
- A ajuda de seções abre na sessão dedicada **Guia da Plataforma**.
- `Ctrl+K` Buscar Ativo · `Ctrl+J` Nova Nota · `Ctrl+B` Copiloto IA · `F1` Documentação
''',
    ),
  },
  'ru': {
    'dashboard': LocalizedSectionText(
      title: 'Панель — Счёт, Список наблюдения и Быстрые сделки',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### Что делает Панель
Центр управления демо-счётом, котировками, открытыми позициями и быстрым вводом ордеров.
''',
    ),
    'scanner': LocalizedSectionText(
      title: 'Сканер рынка — Мульти-активный теханализ',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### Что делает Сканер
Локально сканирует Forex, Крипто, Индексы, Сырьё и Акции по **EMA 20/50**, **RSI(14)** и **ATR(14)** без затрат токенов ИИ.
''',
    ),
    'strategies': LocalizedSectionText(
      title: 'Стратегии — Вложенные правила, ИИ-компилятор и Бэктест',
      categoryKey: 'docs.catRuleStudio',
      markdown: '''
### Что делает Студия стратегий
Создавайте, компилируйте и тестируйте алгоритмические стратегии локально (**0 токенов**) с поддержкой вложенных групп `AND`/`OR`.
''',
    ),
    'radar': LocalizedSectionText(
      title: 'Радар аудита — Диагностика сигналов',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### Что делает Радар аудита
Фиксирует каждую оценку стратегии (`Executed`, `NearMiss`, `Rejected`) с разбором правил.
''',
    ),
    'positions': LocalizedSectionText(
      title: 'Позиции — Открытые и закрытые сделки',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### Что делает раздел Позиции
Отслеживает все сделки с P&L в реальном времени, изменением SL/TP и заметками по сделке.
''',
    ),
    'journal': LocalizedSectionText(
      title: 'Журнал — Торговый дневник в Markdown',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### Что делает Журнал
Полноценный **Markdown-блокнот** для торговых планов, разборов и сохранённых ответов ИИ-Копилота.
''',
    ),
    'sandbox': LocalizedSectionText(
      title: 'Симулятор — Синтетический стресс-тест рынка и рисков',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### Что делает Симулятор
> **Примечание:** Использует **СИНТЕТИЧЕСКИЕ ДАННЫЕ** для проверки устойчивости стратегий и риск-менеджмента.
''',
    ),
    'chart': LocalizedSectionText(
      title: 'Живой график — Два движка и динамическая точность',
      categoryKey: 'docs.catChartsPrecision',
      markdown: '''
### Что делает Живой график
Переключайтесь между **Нативным GPU-графиком** и **TradingView Live** в верхней панели.
''',
    ),
    'docs': LocalizedSectionText(
      title: 'ИИ-Копилот, сессии и горячие клавиши',
      categoryKey: 'docs.catRuleStudio',
      markdown: '''
### ИИ-Копилот и клавиши
- Справка по разделам открывается в отдельной сессии **Справочник платформы**.
- `Ctrl+K` Поиск · `Ctrl+J` Новая запись · `Ctrl+B` Копилот · `F1` Документация
''',
    ),
  },
  'zu': {
    'dashboard': LocalizedSectionText(
      title: 'Ideshibhodi — I-Akhawunti, Uhlu Lwamakethe Nokuhweba Okusheshayo',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### Okwenziwa yi-Ideshibhodi
**Ideshibhodi** iyisikhungo sokubuka isimo se-akhawunti yokulingisa, izintengo ezibukhoma, izikhundla ezivuliwe, nokufaka ama-oda ngokushesha.

### Indlela Yokuyisebenzisa
- **Izinkomba ze-Akhawunti:** Bheka **Ibhalansi**, **I-Equity**, **P&L**, kanye ne-**Drawdown %** yansuku zonke.
- **Uhlu Lokubhekwa:** Chofoza noma yiluphi uphawu ukushintsha imakethe noma uye eshadini elibukhoma.
''',
    ),
    'scanner': LocalizedSectionText(
      title: 'Umskeni Wemakethe — I-Radar Yezimpawu Zobuchwepheshe',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### Okwenziwa Ngumskeni Wemakethe
Uskena i-Forex, Crypto, Indices, Commodities, nama-Stocks endaweni yangakini usebenzisa **EMA 20/50**, **RSI(14)**, ne-**ATR(14)** nge-**0 AI tokens**.
''',
    ),
    'strategies': LocalizedSectionText(
      title: 'Amasu — Imithetho Ehlanganiswe, I-AI Compiler & Backtester',
      categoryKey: 'docs.catRuleStudio',
      markdown: '''
### Okwenziwa yi-Rule Studio
Yakha, hlanganisa, futhi uhlole amasu okuhweba nge-**0 tokens** usebenzisa imithetho ye-`AND`/`OR` ehlanganiswe noma i-AI Compiler.
''',
    ),
    'radar': LocalizedSectionText(
      title: 'I-Radar Yokuhlola — Ukuxilonga Izimpawu',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### Okwenziwa yi-Audit Radar
Ibala ukuhlolwa ngakunye kwesu (`Executed`, `NearMiss`, `Rejected`) ukuze ubone ukuthi yisiphi isimo esivimbele ukuhweba.
''',
    ),
    'positions': LocalizedSectionText(
      title: 'Izikhundla — Irejista Yokuhweba Okuvuliwe Nokuvaliwe',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### Okwenziwa yi-Positions
Ilandelela konke ukuhweba okuvuliwe nokuvaliwe nge-P&L ebukhoma, ukulungisa i-SL/TP, nokubhala amanothi okuhlola.
''',
    ),
    'journal': LocalizedSectionText(
      title: 'Ijenali — Incwadi Yokuhweba ye-Markdown',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### Okwenziwa yi-Ijenali
Incwadi ye-**Markdown** yezinhlelo zokuhweba, ukubuyekeza ukuhweba, nokulondoloza izimpendulo ze-AI Copilot.
''',
    ),
    'sandbox': LocalizedSectionText(
      title: 'Isifanisi — Ilebhu Yedatha Yokulingisa Nobungozi',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### Okwenziwa yi-Simulator
> **Qaphela:** Isebenzisa **IDATHA YOKULINGISA (EYENZIWE)**, hhayi izintengo zangempela, ukuhlola ukuthi amasu akho nokuphathwa kobungozi kusinda kanjani.
''',
    ),
    'chart': LocalizedSectionText(
      title: 'Ishadi Elibukhoma — Izinjini Ezimbili Nokunemba',
      categoryKey: 'docs.catChartsPrecision',
      markdown: '''
### Okwenziwa yi-Live Chart
Shintsha phakathi kwe-**Native GPU Bot Chart** ne-**TradingView Live** kubha ephezulu, ngokunemba kwamadijithi ayi-10+.
''',
    ),
    'docs': LocalizedSectionText(
      title: 'Umsizi we-AI, Amaseshini Nezinqamuleli',
      categoryKey: 'docs.catRuleStudio',
      markdown: '''
### Umsizi we-AI Nezinqamuleli
- Imibuzo yezigaba iya eseshinini ekhethekile ye-**Umhlahlandlela Wesikhulumi**.
- `Ctrl+K` Sesha Uphawu · `Ctrl+J` Inothi Elisha · `Ctrl+B` Vula/Vala i-AI · `F1` Incwadi
''',
    ),
  },
  'af': {
    'dashboard': LocalizedSectionText(
      title: 'Paneelbord — Rekening, Dophoulys & Vinnige Uitvoering',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### Wat die Paneelbord doen
Die **Paneelbord** is jou beheersentrum vir demo-rekeninggesondheid, lewendige kwotasies, oop posisies en vinnige orders.

### Hoe om dit te gebruik
- **Rekening-KPI's:** Monitor **Balans**, **Ekwiteit**, **Oop Wins/Verlies** en **Daaglikse Terugval %**.
- **Dophoulys:** Klik op enige simbool om die aktiewe instrument te wissel of na die **Lewendige Grafiek** te spring.
- **Vinnige Order:** Plaas kits **Koop**- of **Verkoop**-demo-orders met Stop-Loss / Take-Profit.
''',
    ),
    'scanner': LocalizedSectionText(
      title: 'Markskandeerder — Multi-Bate Tegniese Radar',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### Wat die Markskandeerder doen
Skandeer Forex, Kripto, Indekse, Kommoditeite en Aandele plaaslik met **EMA 20/50**, **RSI(14)** en **ATR(14)** — met **0 KI-tokens**.

### Hoe om dit te gebruik
1. Kies jou **Kategorie** en **Tydraamwerk**.
2. Klik **Scan Market** om instrumente volgens seinsterkte te rangskik.
3. Klik **Chart** om die opstelling op die grafiek te sien of gebruik **Quick Buy/Sell**.
''',
    ),
    'strategies': LocalizedSectionText(
      title: 'Strategieë — Geneste Reëls, KI-Samesteller & Backtester',
      categoryKey: 'docs.catRuleStudio',
      markdown: '''
### Wat Strategieë (Reël-atjee) doen
Bou, stel saam, backtoets en hardloop algoritmiese strategieë plaaslik in Dart met **0 tokens**.

### Sleutelfunksies
1. **KI-Tekssamesteller:** Beskryf jou strategie in gewone taal vir geneste `AND`/`OR`-logika.
2. **Geneste AND/OR Reëlboom:** Kombineer verpligte filters (`AND`) met alternatiewe snellers (`OR`).
3. **Risiko & Bestuur:** Stel rigting, HTF-filter, Break-Even, Trailing ATR en maksimum stawe.
4. **Backtoets & Heelal (0 Tokens):** Toets 100–5,000 historiese stawe op 1 simbool of 'n hele **Heelal**.
''',
    ),
    'radar': LocalizedSectionText(
      title: 'Ouditradar — Sein- & Byna-Mis Diagnostiek',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### Wat Ouditradar doen
Teken elke strategie-evaluering (`Executed`, `NearMiss`, `Rejected`) aan met presiese reëltellings.

### Hoe om dit te gebruik
- Inspekteer **NearMiss**-inskrywings om te sien watter voorwaarde 'n transaksie geblokkeer het.
- Bevestig hoekom gepouseerde of risiko-geblokkeerde seine **Rejected** is.
''',
    ),
    'positions': LocalizedSectionText(
      title: 'Posisies — Oop & Geslote Transaksieregister',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### Wat Posisies doen
Volg alle oop en geslote demo-transaksies met intydse wins/verlies, SL/TP-redigering en na-handel hersiening.

### Hoe om dit te gebruik
- **Wysig SL/TP** of **Sluit** enige oop posisie met 1 klik.
- Voeg 'n **Opstelling-etiket**, **Gradering (1–5 sterre)** en **Nota** by.
''',
    ),
    'journal': LocalizedSectionText(
      title: 'Joernaal — Verdeelde Markdown Handelsnotaboek',
      categoryKey: 'docs.catWorkspace',
      markdown: '''
### Wat die Joernaal doen
'n Volledige **Markdown-notaboek** vir voor-markplanne, handelshersienings en gestoorde KI-Medevlieënier-ontledings.

### Hoe om dit te gebruik
- **Sykieslys (Links):** Soek volgens simbool, titel of sleutelwoord en filtreer volgens **Etiket**.
- **Redigeerder (Regs):** Gebruik **Write**, **Split** (regstreekse voorskou) en **Preview**.
''',
    ),
    'sandbox': LocalizedSectionText(
      title: 'Simulator — Sintetiese Mark- & Risikotoetslaboratorium',
      categoryKey: 'docs.catScannerRisk',
      markdown: '''
### Wat die Simulator doen
> **Let wel:** Gebruik **SINTETIESE / FIKTIEWE DATA** (nie regte markpryse nie) om te toets hoe jou strategieë en risikobestuur uiterste toestande oorleef.

### Twee Modusse
1. **Strategie Strestoets:** Kies enige strategie, **1M / 3M / 6M / 1Y** en markregime (Bul, Beer, Sywaarts of Blitsongeluk).
2. **Regstreekse Skok-herhaling:** Spuit skielike bewegings in om SL/TP en pryswaarskuwings te verifieer.
''',
    ),
    'chart': LocalizedSectionText(
      title: 'Lewendige Grafiek — Dubbele Enjins & Dinamiese Presisie',
      categoryKey: 'docs.catChartsPrecision',
      markdown: '''
### Wat Lewendige Grafiek doen
Wissel naatloos tussen die **Inheemse GPU Bot-grafiek** en **TradingView Regstreeks** vanaf die boonste balk.

### Hoe om dit te gebruik
- Skakel `EMA`, `SMA`, `Bollinger`, `VWAP`, `Supertrend`, `Ichimoku`, `RSI` en `MACD` aan, of kies **Single / Split / Quad**.
''',
    ),
    'docs': LocalizedSectionText(
      title: 'KI Medevlieënier, Sessies & Sleutelbordkortpaaie',
      categoryKey: 'docs.catRuleStudio',
      markdown: '''
### KI Medevlieënier
- **Afsonderlike Hulpsessie:** Afdelingsvrae gebruik die toegewyde **Platformgids**-sessie sodat jou joernaalsessie skoon bly.
- **Plaaslike & Wolk-KI:** Ondersteun **Gemini**, **OpenAI**, **Anthropic**, **Groq**, **OpenRouter**, **Ollama** en **Built-in Quant**.

### Kortpaaie
- `Ctrl+K` Soek Simbool · `Ctrl+J` Nuwe Nota · `Ctrl+B` KI Medevlieënier · `F1` Dokumentasie
''',
    ),
  },
};
