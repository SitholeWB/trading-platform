import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'pt' | 'ru' | 'zu';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeName: string;
  flag: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English (US)', flag: '🇺🇸', region: 'Global' },
  { code: 'es', label: 'Spanish', nativeName: 'Español', flag: '🇪🇸', region: 'España / LATAM' },
  { code: 'fr', label: 'French', nativeName: 'Français', flag: '🇫🇷', region: 'France / Europe' },
  { code: 'de', label: 'German', nativeName: 'Deutsch', flag: '🇩🇪', region: 'Deutschland / DACH' },
  { code: 'zh', label: 'Chinese', nativeName: '简体中文', flag: '🇨🇳', region: 'Asia / Global' },
  { code: 'ja', label: 'Japanese', nativeName: '日本語', flag: '🇯🇵', region: 'Japan' },
  { code: 'pt', label: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', region: 'Brasil / Portugal' },
  { code: 'ru', label: 'Russian', nativeName: 'Русский', flag: '🇷🇺', region: 'Eastern Europe / CIS' },
  { code: 'zu', label: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦', region: 'South Africa / SADC' },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Common
    'common.appTitle': 'Trading Platform',
    'common.autoTrading': 'Auto-Trading',
    'common.halted': 'Halted',
    'common.connected': 'Connected',
    'common.disconnected': 'Disconnected',
    'common.brokerBridge': 'Broker Bridge',
    'common.feed': 'Feed',
    'common.search': 'Search',
    'common.settings': 'Settings',
    'common.feedback': 'Feedback',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.language': 'Language',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.scanner': 'Market Scanner',
    'nav.strategies': 'Strategies',
    'nav.radar': 'Audit Radar',
    'nav.positions': 'Positions',
    'nav.simulator': 'Simulator',
    'nav.chart': 'Live Chart',
    'nav.docs': 'User Manual',
    'nav.feedSettings': 'Feed & Keys Settings',
    'nav.robot': 'Robot',

    // Header
    'header.equity': 'Equity',
    'header.balance': 'Balance',
    'header.dailyDrawdown': 'Daily DD',
    'header.killSwitch': 'KILL SWITCH',
    'header.aiCopilot': 'AI Copilot',
    'header.symbolSearchTooltip': 'Search or Browse Symbol / Pair (Shortcut: /)',
    'header.alertsTooltip': 'Strategy Alerts & Background Scanner',
    'header.changeLanguage': 'Change Language',

    // Feedback
    'feedback.title': 'Quick Client Feedback',
    'feedback.subtitle': 'Direct Discord dispatch • No login required',
    'feedback.nameLabel': 'Your Name / Trader ID',
    'feedback.namePlaceholder': 'e.g. Alex M. or Trader#42',
    'feedback.contactLabel': 'Email or Discord (Optional)',
    'feedback.contactPlaceholder': 'For reply: alex@domain.com or @alex',
    'feedback.categoryLabel': 'Category',
    'feedback.feature': '💡 Feature',
    'feedback.bug': '🐛 Bug',
    'feedback.strategy': '📈 Strategy',
    'feedback.general': '💬 General',
    'feedback.messageLabel': 'Message',
    'feedback.messagePlaceholder': 'Tell us what you like, what is broken, or what indicators / features you would like added to the platform...',
    'feedback.antiBotTitle': 'Confirm you are human',
    'feedback.antiBotDesc': 'Anti-Spam Verification',
    'feedback.sendButton': 'Send Quick Feedback',
    'feedback.sending': 'Sending to Discord...',
    'feedback.delivered': 'Feedback Delivered!',
    'feedback.deliveredDesc': 'Thank you! Your message has been posted directly into our developer Discord channel.',
    'feedback.sendAnother': 'Send Another Message',

    // Kill Switch
    'killSwitch.title': 'Emergency Stop & Kill Switch',
    'killSwitch.desc': 'Immediately liquidate open positions and halt automated trading algorithms.',
    'killSwitch.engagedTitle': 'TRADING HALTED',
    'killSwitch.disengage': 'Disengage & Resume Trading',
    'killSwitch.engage': 'ENGAGE KILL SWITCH',

    // Settings
    'settings.title': 'Platform Settings',
    'settings.brokerTab': 'Broker & Feed',
    'settings.aiTab': 'AI Copilot BYOK',
    'settings.timezoneTab': 'Timezone & Clock',
    'settings.languageTab': 'Language & Region',
  },

  es: {
    // Common
    'common.appTitle': 'Plataforma de Trading',
    'common.autoTrading': 'Auto-Trading Activo',
    'common.halted': 'Detenido',
    'common.connected': 'Conectado',
    'common.disconnected': 'Desconectado',
    'common.brokerBridge': 'Puente de Broker',
    'common.feed': 'Datos',
    'common.search': 'Buscar',
    'common.settings': 'Ajustes',
    'common.feedback': 'Comentarios',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.close': 'Cerrar',
    'common.loading': 'Cargando...',
    'common.language': 'Idioma',

    // Navigation
    'nav.dashboard': 'Panel de Control',
    'nav.scanner': 'Escáner de Mercado',
    'nav.strategies': 'Estrategias',
    'nav.radar': 'Radar de Auditoría',
    'nav.positions': 'Posiciones',
    'nav.simulator': 'Simulador',
    'nav.chart': 'Gráfico en Vivo',
    'nav.docs': 'Manual de Usuario',
    'nav.feedSettings': 'Ajustes de Datos y Claves',
    'nav.robot': 'Robot',

    // Header
    'header.equity': 'Capital',
    'header.balance': 'Balance',
    'header.dailyDrawdown': 'Drawdown Diario',
    'header.killSwitch': 'PARADA DE EMERGENCIA',
    'header.aiCopilot': 'Copiloto IA',
    'header.symbolSearchTooltip': 'Buscar o Explorar Símbolo (Acceso directo: /)',
    'header.alertsTooltip': 'Alertas de Estrategia y Escáner en Segundo Plano',
    'header.changeLanguage': 'Cambiar Idioma',

    // Feedback
    'feedback.title': 'Comentarios del Cliente',
    'feedback.subtitle': 'Envío directo a Discord • Sin registro ni inicio de sesión',
    'feedback.nameLabel': 'Su Nombre / Alias de Trader',
    'feedback.namePlaceholder': 'ej. Alex M. o Trader#42',
    'feedback.contactLabel': 'Correo o Discord (Opcional)',
    'feedback.contactPlaceholder': 'Para respuesta: alex@correo.com o @alex',
    'feedback.categoryLabel': 'Categoría',
    'feedback.feature': '💡 Función',
    'feedback.bug': '🐛 Error',
    'feedback.strategy': '📈 Estrategia',
    'feedback.general': '💬 General',
    'feedback.messageLabel': 'Mensaje',
    'feedback.messagePlaceholder': 'Díganos qué le gusta, qué falla o qué indicadores/funciones le gustaría ver en la plataforma...',
    'feedback.antiBotTitle': 'Confirme que es humano',
    'feedback.antiBotDesc': 'Verificación Antispam',
    'feedback.sendButton': 'Enviar Comentarios',
    'feedback.sending': 'Enviando a Discord...',
    'feedback.delivered': '¡Comentarios Enviados!',
    'feedback.deliveredDesc': '¡Muchas gracias! Su mensaje ha sido publicado directamente en nuestro canal de Discord.',
    'feedback.sendAnother': 'Enviar Otro Mensaje',

    // Kill Switch
    'killSwitch.title': 'Parada de Emergencia y Kill Switch',
    'killSwitch.desc': 'Liquidar inmediatamente las posiciones abiertas y pausar los algoritmos de trading.',
    'killSwitch.engagedTitle': 'TRADING DETENIDO',
    'killSwitch.disengage': 'Reanudar Operaciones',
    'killSwitch.engage': 'ACTIVAR PARADA DE EMERGENCIA',

    // Settings
    'settings.title': 'Ajustes de la Plataforma',
    'settings.brokerTab': 'Broker y Datos',
    'settings.aiTab': 'Copiloto IA BYOK',
    'settings.timezoneTab': 'Zona Horaria y Reloj',
    'settings.languageTab': 'Idioma y Región',
  },

  fr: {
    // Common
    'common.appTitle': 'Plateforme de Trading',
    'common.autoTrading': 'Auto-Trading Actif',
    'common.halted': 'Arrêté',
    'common.connected': 'Connecté',
    'common.disconnected': 'Déconnecté',
    'common.brokerBridge': 'Passerelle Broker',
    'common.feed': 'Flux',
    'common.search': 'Rechercher',
    'common.settings': 'Paramètres',
    'common.feedback': 'Avis & Retours',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.close': 'Fermer',
    'common.loading': 'Chargement...',
    'common.language': 'Langue',

    // Navigation
    'nav.dashboard': 'Tableau de Bord',
    'nav.scanner': 'Scanneur de Marché',
    'nav.strategies': 'Stratégies',
    'nav.radar': 'Radar d\'Audit',
    'nav.positions': 'Positions',
    'nav.simulator': 'Simulateur',
    'nav.chart': 'Graphique en Direct',
    'nav.docs': 'Manuel Utilisateur',
    'nav.feedSettings': 'Paramètres Flux & Clés',
    'nav.robot': 'Robot',

    // Header
    'header.equity': 'Capitaux Propres',
    'header.balance': 'Solde',
    'header.dailyDrawdown': 'Drawdown Quotidien',
    'header.killSwitch': 'ARRÊT D\'URGENCE',
    'header.aiCopilot': 'Copilote IA',
    'header.symbolSearchTooltip': 'Rechercher un Actif / Paire (Raccourci: /)',
    'header.alertsTooltip': 'Alertes de Stratégie & Scanneur d\'Arrière-Plan',
    'header.changeLanguage': 'Changer de Langue',

    // Feedback
    'feedback.title': 'Retours Client Rapides',
    'feedback.subtitle': 'Envoi direct sur Discord • Sans inscription requise',
    'feedback.nameLabel': 'Votre Nom / Pseudo Trader',
    'feedback.namePlaceholder': 'ex. Alex M. ou Trader#42',
    'feedback.contactLabel': 'Email ou Discord (Optionnel)',
    'feedback.contactPlaceholder': 'Pour vous répondre: alex@domaine.com ou @alex',
    'feedback.categoryLabel': 'Catégorie',
    'feedback.feature': '💡 Fonctionnalité',
    'feedback.bug': '🐛 Bogue',
    'feedback.strategy': '📈 Stratégie',
    'feedback.general': '💬 Général',
    'feedback.messageLabel': 'Message',
    'feedback.messagePlaceholder': 'Expliquez ce qui vous plaît, ce qui pose problème ou les indicateurs souhaités...',
    'feedback.antiBotTitle': 'Confirmez que vous êtes humain',
    'feedback.antiBotDesc': 'Vérification Anti-Spam',
    'feedback.sendButton': 'Envoyer le Retour',
    'feedback.sending': 'Envoi vers Discord...',
    'feedback.delivered': 'Message Transmis !',
    'feedback.deliveredDesc': 'Merci beaucoup ! Votre message a été posté directement sur notre canal Discord de développement.',
    'feedback.sendAnother': 'Envoyer un Autre Message',

    // Kill Switch
    'killSwitch.title': 'Arrêt d\'Urgence & Kill Switch',
    'killSwitch.desc': 'Clôturer immédiatement les positions ouvertes et suspendre les algorithmes.',
    'killSwitch.engagedTitle': 'TRADING SUSPENDU',
    'killSwitch.disengage': 'Reprendre le Trading',
    'killSwitch.engage': 'DÉCLENCHER L\'ARRÊT D\'URGENCE',

    // Settings
    'settings.title': 'Paramètres de la Plateforme',
    'settings.brokerTab': 'Broker & Flux',
    'settings.aiTab': 'Copilote IA BYOK',
    'settings.timezoneTab': 'Fuseau Horaire & Horloge',
    'settings.languageTab': 'Langue & Région',
  },

  de: {
    // Common
    'common.appTitle': 'Trading-Plattform',
    'common.autoTrading': 'Auto-Trading Aktiv',
    'common.halted': 'Angehalten',
    'common.connected': 'Verbunden',
    'common.disconnected': 'Getrennt',
    'common.brokerBridge': 'Broker-Verbindung',
    'common.feed': 'Kursfeed',
    'common.search': 'Suchen',
    'common.settings': 'Einstellungen',
    'common.feedback': 'Feedback',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.close': 'Schließen',
    'common.loading': 'Wird geladen...',
    'common.language': 'Sprache',

    // Navigation
    'nav.dashboard': 'Übersicht',
    'nav.scanner': 'Markt-Scanner',
    'nav.strategies': 'Strategien',
    'nav.radar': 'Audit-Radar',
    'nav.positions': 'Positionen',
    'nav.simulator': 'Simulator',
    'nav.chart': 'Live-Chart',
    'nav.docs': 'Benutzerhandbuch',
    'nav.feedSettings': 'Feed- & API-Einstellungen',
    'nav.robot': 'Roboter',

    // Header
    'header.equity': 'Eigenkapital',
    'header.balance': 'Kontostand',
    'header.dailyDrawdown': 'Täglicher Drawdown',
    'header.killSwitch': 'NOT-AUS-SCHALTER',
    'header.aiCopilot': 'KI-Copilot',
    'header.symbolSearchTooltip': 'Symbol suchen oder durchsuchen (Kürzel: /)',
    'header.alertsTooltip': 'Strategie-Warnungen & Hintergrund-Scanner',
    'header.changeLanguage': 'Sprache ändern',

    // Feedback
    'feedback.title': 'Kunden-Feedback',
    'feedback.subtitle': 'Direkter Discord-Versand • Keine Registrierung nötig',
    'feedback.nameLabel': 'Ihr Name / Trader-Kürzel',
    'feedback.namePlaceholder': 'z.B. Alex M. oder Trader#42',
    'feedback.contactLabel': 'E-Mail oder Discord (Optional)',
    'feedback.contactPlaceholder': 'Für Antwort: alex@domain.de oder @alex',
    'feedback.categoryLabel': 'Kategorie',
    'feedback.feature': '💡 Funktion',
    'feedback.bug': '🐛 Fehler',
    'feedback.strategy': '📈 Strategie',
    'feedback.general': '💬 Allgemein',
    'feedback.messageLabel': 'Nachricht',
    'feedback.messagePlaceholder': 'Teilen Sie uns mit, was Ihnen gefällt, was verbessert werden sollte oder welche Indikatoren Sie benötigen...',
    'feedback.antiBotTitle': 'Menschliche Bestätigung',
    'feedback.antiBotDesc': 'Spamschutz-Überprüfung',
    'feedback.sendButton': 'Feedback Absenden',
    'feedback.sending': 'Wird an Discord gesendet...',
    'feedback.delivered': 'Feedback Zugestellt!',
    'feedback.deliveredDesc': 'Vielen Dank! Ihre Nachricht wurde direkt an unseren Entwickler-Discord-Kanal übermittelt.',
    'feedback.sendAnother': 'Weitere Nachricht Senden',

    // Kill Switch
    'killSwitch.title': 'Not-Aus & Kill Switch',
    'killSwitch.desc': 'Sofortige Schließung aller Positionen und Stoppen aller automatisierten Bots.',
    'killSwitch.engagedTitle': 'HANDEL ANGEHALTEN',
    'killSwitch.disengage': 'Handel Fortsetzen',
    'killSwitch.engage': 'NOT-AUS AKTIVIEREN',

    // Settings
    'settings.title': 'Plattform-Einstellungen',
    'settings.brokerTab': 'Broker & Kursdaten',
    'settings.aiTab': 'KI-Copilot BYOK',
    'settings.timezoneTab': 'Zeitzone & Uhr',
    'settings.languageTab': 'Sprache & Region',
  },

  zh: {
    // Common
    'common.appTitle': '量化交易平台',
    'common.autoTrading': '自动交易中',
    'common.halted': '已暂停',
    'common.connected': '已连接',
    'common.disconnected': '已断开',
    'common.brokerBridge': '券商连接',
    'common.feed': '行情数据',
    'common.search': '搜索',
    'common.settings': '设置',
    'common.feedback': '反馈',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.close': '关闭',
    'common.loading': '加载中...',
    'common.language': '语言',

    // Navigation
    'nav.dashboard': '总览仪表盘',
    'nav.scanner': '行情扫描器',
    'nav.strategies': '策略中心',
    'nav.radar': '审计雷达',
    'nav.positions': '持仓管理',
    'nav.simulator': '仿真回测',
    'nav.chart': '实时图表',
    'nav.docs': '使用手册',
    'nav.feedSettings': '数据源与密钥设置',
    'nav.robot': '机器人',

    // Header
    'header.equity': '净值',
    'header.balance': '余额',
    'header.dailyDrawdown': '当日回撤',
    'header.killSwitch': '紧急熔断',
    'header.aiCopilot': 'AI 助理',
    'header.symbolSearchTooltip': '搜索或选择交易品种 (快捷键: /)',
    'header.alertsTooltip': '策略信号告警与后台监控',
    'header.changeLanguage': '切换语言',

    // Feedback
    'feedback.title': '用户快速反馈',
    'feedback.subtitle': '直连 Discord 频道 • 无需登录或注册',
    'feedback.nameLabel': '您的姓名 / 交易者代号',
    'feedback.namePlaceholder': '例如: Alex 或 Trader#42',
    'feedback.contactLabel': '邮箱或 Discord (选填)',
    'feedback.contactPlaceholder': '用于回复: alex@domain.com 或 @alex',
    'feedback.categoryLabel': '类型',
    'feedback.feature': '💡 功能建议',
    'feedback.bug': '🐛 缺陷反馈',
    'feedback.strategy': '📈 策略探讨',
    'feedback.general': '💬 综合意见',
    'feedback.messageLabel': '反馈内容',
    'feedback.messagePlaceholder': '请在此输入您的宝贵建议、使用问题或希望添加的指标与功能...',
    'feedback.antiBotTitle': '人机验证',
    'feedback.antiBotDesc': '防自动化脚本拦截',
    'feedback.sendButton': '立即提交反馈',
    'feedback.sending': '正在发送至 Discord...',
    'feedback.delivered': '反馈提交成功！',
    'feedback.deliveredDesc': '非常感谢！您的信息已实时同步至团队 Discord 开发频道。',
    'feedback.sendAnother': '发送另一条',

    // Kill Switch
    'killSwitch.title': '紧急熔断系统 (Kill Switch)',
    'killSwitch.desc': '立即市价平掉全部开仓头寸并暂停所有自动化量化策略。',
    'killSwitch.engagedTitle': '交易已全局停止',
    'killSwitch.disengage': '解除熔断并恢复交易',
    'killSwitch.engage': '启动紧急平仓熔断',

    // Settings
    'settings.title': '系统设置',
    'settings.brokerTab': '券商与行情源',
    'settings.aiTab': 'AI Copilot 模型',
    'settings.timezoneTab': '时区与交易时钟',
    'settings.languageTab': '语言与地区',
  },

  ja: {
    // Common
    'common.appTitle': 'トレーディング・プラットフォーム',
    'common.autoTrading': '自動売買中',
    'common.halted': '停止中',
    'common.connected': '接続完了',
    'common.disconnected': '未接続',
    'common.brokerBridge': 'ブローカー接続',
    'common.feed': '価格配信',
    'common.search': '検索',
    'common.settings': '設定',
    'common.feedback': 'フィードバック',
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.close': '閉じる',
    'common.loading': '読み込み中...',
    'common.language': '言語',

    // Navigation
    'nav.dashboard': 'ダッシュボード',
    'nav.scanner': '市場スキャナー',
    'nav.strategies': '戦略マネージャー',
    'nav.radar': '監査レーダー',
    'nav.positions': '保有ポジション',
    'nav.simulator': 'シミュレーター',
    'nav.chart': 'リアルタイムチャート',
    'nav.docs': 'ユーザーマニュアル',
    'nav.feedSettings': 'データ＆API設定',
    'nav.robot': 'ロボット',

    // Header
    'header.equity': '有効証拠金',
    'header.balance': '残高',
    'header.dailyDrawdown': '当日ドローダウン',
    'header.killSwitch': '緊急停止 (KILL SWITCH)',
    'header.aiCopilot': 'AI コパイロット',
    'header.symbolSearchTooltip': '銘柄・通貨ペア検索 (ショートカット: /)',
    'header.alertsTooltip': '戦略アラート＆バックグラウンド監視',
    'header.changeLanguage': '言語を変更',

    // Feedback
    'feedback.title': 'フィードバック送信',
    'feedback.subtitle': 'Discord直結 • ログイン不要',
    'feedback.nameLabel': 'お名前 / ハンドルネーム',
    'feedback.namePlaceholder': '例: Alex または Trader#42',
    'feedback.contactLabel': 'メールまたはDiscord (任意)',
    'feedback.contactPlaceholder': '返信用: alex@example.com または @alex',
    'feedback.categoryLabel': 'カテゴリ',
    'feedback.feature': '💡 機能要望',
    'feedback.bug': '🐛 不具合報告',
    'feedback.strategy': '📈 戦略について',
    'feedback.general': '💬 その他',
    'feedback.messageLabel': 'メッセージ',
    'feedback.messagePlaceholder': '改善要望や追加してほしいインジケーターなどをお書きください...',
    'feedback.antiBotTitle': '認証チェック',
    'feedback.antiBotDesc': 'スパム防止認証',
    'feedback.sendButton': '送信する',
    'feedback.sending': 'Discordへ送信中...',
    'feedback.delivered': '送信完了しました！',
    'feedback.deliveredDesc': 'ありがとうございます！メッセージは開発チームのDiscordへ即時送信されました。',
    'feedback.sendAnother': '別のメッセージを送る',

    // Kill Switch
    'killSwitch.title': '緊急停止＆キルスイッチ',
    'killSwitch.desc': 'すべての保有ポジションを即時決済し、自動売買を一時停止します。',
    'killSwitch.engagedTitle': '取引停止中',
    'killSwitch.disengage': '停止を解除して再開',
    'killSwitch.engage': 'キルスイッチを作動',

    // Settings
    'settings.title': 'プラットフォーム設定',
    'settings.brokerTab': 'ブローカー＆データ',
    'settings.aiTab': 'AI コパイロット設定',
    'settings.timezoneTab': 'タイムゾーン＆時計',
    'settings.languageTab': '言語＆地域',
  },

  pt: {
    // Common
    'common.appTitle': 'Plataforma de Trading',
    'common.autoTrading': 'Auto-Trading Ativo',
    'common.halted': 'Interrompido',
    'common.connected': 'Conectado',
    'common.disconnected': 'Desconectado',
    'common.brokerBridge': 'Ponte com a Corretora',
    'common.feed': 'Cotações',
    'common.search': 'Pesquisar',
    'common.settings': 'Configurações',
    'common.feedback': 'Feedback',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.close': 'Fechar',
    'common.loading': 'Carregando...',
    'common.language': 'Idioma',

    // Navigation
    'nav.dashboard': 'Painel Geral',
    'nav.scanner': 'Rastreador de Mercado',
    'nav.strategies': 'Estratégias',
    'nav.radar': 'Radar de Auditoria',
    'nav.positions': 'Posições',
    'nav.simulator': 'Simulador',
    'nav.chart': 'Gráfico em Tempo Real',
    'nav.docs': 'Manual do Usuário',
    'nav.feedSettings': 'Configurações de Feed e Chaves',
    'nav.robot': 'Robô',

    // Header
    'header.equity': 'Patrimônio',
    'header.balance': 'Saldo',
    'header.dailyDrawdown': 'Drawdown Diário',
    'header.killSwitch': 'PARADA DE EMERGÊNCIA',
    'header.aiCopilot': 'Copiloto IA',
    'header.symbolSearchTooltip': 'Buscar Ativo / Par (Atalho: /)',
    'header.alertsTooltip': 'Alertas de Estratégia e Scanner em Segundo Plano',
    'header.changeLanguage': 'Alterar Idioma',

    // Feedback
    'feedback.title': 'Feedback Rápido do Cliente',
    'feedback.subtitle': 'Envio direto para o Discord • Sem necessidade de login',
    'feedback.nameLabel': 'Seu Nome / Apelido de Trader',
    'feedback.namePlaceholder': 'ex: Alex M. ou Trader#42',
    'feedback.contactLabel': 'E-mail ou Discord (Opcional)',
    'feedback.contactPlaceholder': 'Para resposta: alex@dominio.com ou @alex',
    'feedback.categoryLabel': 'Categoria',
    'feedback.feature': '💡 Sugestão',
    'feedback.bug': '🐛 Problema',
    'feedback.strategy': '📈 Estratégia',
    'feedback.general': '💬 Geral',
    'feedback.messageLabel': 'Mensagem',
    'feedback.messagePlaceholder': 'Conte o que você gostou, o que deu erro ou os indicadores que deseja adicionar...',
    'feedback.antiBotTitle': 'Confirme que é humano',
    'feedback.antiBotDesc': 'Verificação Antispam',
    'feedback.sendButton': 'Enviar Feedback',
    'feedback.sending': 'Enviando para o Discord...',
    'feedback.delivered': 'Feedback Enviado!',
    'feedback.deliveredDesc': 'Muito obrigado! Sua mensagem foi enviada diretamente para o nosso canal no Discord.',
    'feedback.sendAnother': 'Enviar Outra Mensagem',

    // Kill Switch
    'killSwitch.title': 'Parada de Emergência & Kill Switch',
    'killSwitch.desc': 'Fechar imediatamente todas as posições abertas e pausar os robôs.',
    'killSwitch.engagedTitle': 'NEGOCIAÇÃO PARADA',
    'killSwitch.disengage': 'Retomar Negociações',
    'killSwitch.engage': 'ACIONAR PARADA DE EMERGÊNCIA',

    // Settings
    'settings.title': 'Configurações da Plataforma',
    'settings.brokerTab': 'Corretora & Cotações',
    'settings.aiTab': 'Copiloto IA BYOK',
    'settings.timezoneTab': 'Fuso Horário & Relógio',
    'settings.languageTab': 'Idioma & Região',
  },

  ru: {
    // Common
    'common.appTitle': 'Торговая Платформа',
    'common.autoTrading': 'Авто-Трейдинг',
    'common.halted': 'Остановлено',
    'common.connected': 'Подключено',
    'common.disconnected': 'Отключено',
    'common.brokerBridge': 'Мост Брокера',
    'common.feed': 'Котировки',
    'common.search': 'Поиск',
    'common.settings': 'Настройки',
    'common.feedback': 'Отзывы',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.close': 'Закрыть',
    'common.loading': 'Загрузка...',
    'common.language': 'Язык',

    // Navigation
    'nav.dashboard': 'Панель управления',
    'nav.scanner': 'Сканер Рынка',
    'nav.strategies': 'Стратегии',
    'nav.radar': 'Радар Аудита',
    'nav.positions': 'Позиции',
    'nav.simulator': 'Симулятор',
    'nav.chart': 'Живой График',
    'nav.docs': 'Руководство пользователя',
    'nav.feedSettings': 'Настройки данных и API',
    'nav.robot': 'Робот',

    // Header
    'header.equity': 'Капитал',
    'header.balance': 'Баланс',
    'header.dailyDrawdown': 'Дневная просадка',
    'header.killSwitch': 'АВАРИЙНЫЙ СТОП',
    'header.aiCopilot': 'ИИ-Копилот',
    'header.symbolSearchTooltip': 'Поиск или выбор символа (Горячая клавиша: /)',
    'header.alertsTooltip': 'Оповещения стратегий и фоновый сканер',
    'header.changeLanguage': 'Сменить язык',

    // Feedback
    'feedback.title': 'Быстрый отзыв клиента',
    'feedback.subtitle': 'Прямая отправка в Discord • Без входа в систему',
    'feedback.nameLabel': 'Ваше имя / Ник трейдера',
    'feedback.namePlaceholder': 'напр. Alex M. или Trader#42',
    'feedback.contactLabel': 'Email или Discord (Необязательно)',
    'feedback.contactPlaceholder': 'Для ответа: alex@domain.com или @alex',
    'feedback.categoryLabel': 'Категория',
    'feedback.feature': '💡 Функция',
    'feedback.bug': '🐛 Ошибка',
    'feedback.strategy': '📈 Стратегия',
    'feedback.general': '💬 Общее',
    'feedback.messageLabel': 'Сообщение',
    'feedback.messagePlaceholder': 'Напишите, что вам нравится, что не работает или какие индикаторы добавить...',
    'feedback.antiBotTitle': 'Подтвердите, что вы человек',
    'feedback.antiBotDesc': 'Антиспам-проверка',
    'feedback.sendButton': 'Отправить отзыв',
    'feedback.sending': 'Отправка в Discord...',
    'feedback.delivered': 'Отзыв отправлен!',
    'feedback.deliveredDesc': 'Большое спасибо! Ваше сообщение отправлено прямо в наш Discord-канал.',
    'feedback.sendAnother': 'Отправить еще одно сообщение',

    // Kill Switch
    'killSwitch.title': 'Аварийная остановка и Kill Switch',
    'killSwitch.desc': 'Немедленно ликвидировать открытые позиции и остановить торговые алгоритмы.',
    'killSwitch.engagedTitle': 'ТОРГОВЛЯ ОСТАНОВЛЕНА',
    'killSwitch.disengage': 'Снять блокировку и возобновить торговлю',
    'killSwitch.engage': 'ВКЛЮЧИТЬ АВАРИЙНЫЙ СТОП',

    // Settings
    'settings.title': 'Настройки платформы',
    'settings.brokerTab': 'Брокер и данные',
    'settings.aiTab': 'ИИ-Копилот BYOK',
    'settings.timezoneTab': 'Часовой пояс и часы',
    'settings.languageTab': 'Язык и регион',
  },

  zu: {
    // Common
    'common.appTitle': 'Inkundla Yokuhweba',
    'common.autoTrading': 'Ukuhweba Ngokuzenzakalelayo',
    'common.halted': 'Kumisiwe',
    'common.connected': 'Kuxhunyiwe',
    'common.disconnected': 'Kunganqanyuliwe',
    'common.brokerBridge': 'Ibhuloho Lomthengisi',
    'common.feed': 'Ukudla Kwamanani',
    'common.search': 'Sesha',
    'common.settings': 'Izilungiselelo',
    'common.feedback': 'Impendulo',
    'common.save': 'Londoloza',
    'common.cancel': 'Khansela',
    'common.close': 'Vala',
    'common.loading': 'Iyalayisha...',
    'common.language': 'Ulimi',

    // Navigation
    'nav.dashboard': 'Ideshibhodi',
    'nav.scanner': 'Isithwebuli Semakethe',
    'nav.strategies': 'Amasu Okuhweba',
    'nav.radar': 'Iradar Yokucwaninga',
    'nav.positions': 'Izikhundla Ezivuliwe',
    'nav.simulator': 'Isilingisi',
    'nav.chart': 'Ishadi Elibukhoma',
    'nav.docs': 'Incwadi Yomsebenzisi',
    'nav.feedSettings': 'Izilungiselelo Zokudla Nezikhiye',
    'nav.robot': 'Irobhothi',

    // Header
    'header.equity': 'Ukulingana (Equity)',
    'header.balance': 'Ibhalansi',
    'header.dailyDrawdown': 'Ukudonswa Kwansuku Zonke',
    'header.killSwitch': 'ISIVIMBO ESIPHUTHUMAYO',
    'header.aiCopilot': 'Umsizi We-AI',
    'header.symbolSearchTooltip': 'Sesha Noma Bheka Uphawu / Umbhangqwana (Isinqamuleli: /)',
    'header.alertsTooltip': 'Izexwayiso Zamalungiselelo Nesithwebuli Sangasemuva',
    'header.changeLanguage': 'Shintsha Ulimi',

    // Feedback
    'feedback.title': 'Impendulo Esheshayo Yekhasimende',
    'feedback.subtitle': 'Kuthunyelwa ngqo ku-Discord • Akukho ukungena okudingekayo',
    'feedback.nameLabel': 'Igama Lakho / Isibambo Somhwebi',
    'feedback.namePlaceholder': 'isib. Sipho M. noma Umhwebi#42',
    'feedback.contactLabel': 'I-imeyili noma i-Discord (Ongakukhetha)',
    'feedback.contactPlaceholder': 'Ukuze uphendulwe: sipho@domain.com noma @sipho',
    'feedback.categoryLabel': 'Umkhakha',
    'feedback.feature': '💡 Isici Esisha',
    'feedback.bug': '🐛 Iphutha',
    'feedback.strategy': '📈 Isu Lokuhweba',
    'feedback.general': '💬 Okujwayelekile',
    'feedback.messageLabel': 'Umyalezo',
    'feedback.messagePlaceholder': 'Sitshele okuthandayo, okonakele, noma izinkomba ofuna zengezwe...',
    'feedback.antiBotTitle': 'Qinisekisa ukuthi ungumuntu',
    'feedback.antiBotDesc': 'Ukuqinisekisa Ukulwa Nogaxekile',
    'feedback.sendButton': 'Thumela Impendulo Esheshayo',
    'feedback.sending': 'Ithunyelwa ku-Discord...',
    'feedback.delivered': 'Impendulo Ilethiwe!',
    'feedback.deliveredDesc': 'Siyabonga kakhulu! Umyalezo wakho uthunyelwe ngqo esiteshini sethu se-Discord.',
    'feedback.sendAnother': 'Thumela Omunye Umyalezo',

    // Kill Switch
    'killSwitch.title': 'Isinqamuli Esiphuthumayo Nesilawuli Sokumisa',
    'killSwitch.desc': 'Vala izikhundla ezivulekile ngokushesha futhi umise ama-algorithms okuhweba.',
    'killSwitch.engagedTitle': 'UKUHWEBA KUMISIWE',
    'killSwitch.disengage': 'Khulula Ukuze Uqhubeke Nokuhweba',
    'killSwitch.engage': 'QALA ISIVIMBO ESIPHUTHUMAYO',

    // Settings
    'settings.title': 'Izilungiselelo Zenkundla',
    'settings.brokerTab': 'Umthengisi Nokudla',
    'settings.aiTab': 'Umsizi We-AI BYOK',
    'settings.timezoneTab': 'Isikhathi Sewashi Nendawo',
    'settings.languageTab': 'Ulimi Nesifunda',
  },
};

const LOCAL_STORAGE_KEY_LANG = 'trading_platform_language';

function detectDefaultLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_LANG) as LanguageCode | null;
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }
    const browserLang = (navigator.language || '').toLowerCase();
    if (browserLang.startsWith('zh')) return 'zh';
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('fr')) return 'fr';
    if (browserLang.startsWith('de')) return 'de';
    if (browserLang.startsWith('ja')) return 'ja';
    if (browserLang.startsWith('pt')) return 'pt';
    if (browserLang.startsWith('ru')) return 'ru';
    if (browserLang.startsWith('zu')) return 'zu';
  } catch {
    // fallback
  }
  return 'en';
}

export interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  activeLanguageInfo: LanguageOption;
  supportedLanguages: LanguageOption[];
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => detectDefaultLanguage());

  const setLanguage = useCallback((newLang: LanguageCode) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_LANG, newLang);
      document.documentElement.lang = newLang;
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch {
      // ignore
    }
  }, [language]);

  const activeLanguageInfo = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === language) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [language]);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const currentDict = TRANSLATIONS[language];
      if (currentDict && currentDict[key]) {
        return currentDict[key];
      }
      // Fallback to English
      const enDict = TRANSLATIONS['en'];
      if (enDict && enDict[key]) {
        return enDict[key];
      }
      return fallback !== undefined ? fallback : key;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      activeLanguageInfo,
      supportedLanguages: SUPPORTED_LANGUAGES,
      t,
    }),
    [language, setLanguage, activeLanguageInfo, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

